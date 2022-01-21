"""Tests for the models in the ``core`` app of the Marsha project."""
from datetime import datetime, timedelta
import random
from unittest import mock

from django.db import transaction
from django.db.utils import IntegrityError
from django.test import TestCase
from django.utils import timezone

from safedelete.models import SOFT_DELETE_CASCADE

from ..defaults import (
    DELETED,
    HARVESTED,
    HARVESTING,
    IDLE,
    LIVE_CHOICES,
    LIVE_TYPE_CHOICES,
    PENDING,
    PROCESSING,
    RAW,
    STATE_CHOICES,
)
from ..factories import VideoFactory
from ..models import VideoRecordingError
from ..utils.time_utils import to_timestamp


# pylint: disable=too-many-public-methods


class VideoModelsTestCase(TestCase):
    """Test our intentions about the Video model."""

    def test_models_video_str(self):
        """The str method should display the title of the video and its eventual soft deletion."""
        video = VideoFactory(title="j'espère")
        self.assertEqual(str(video), "j'espère")

        video.delete()
        self.assertEqual(str(video), "j'espère [deleted]")

    def test_models_video_fields_lti_id_unique(self):
        """Videos should be unique for a given duo lti_id/playlist (see LTI specification)."""
        video = VideoFactory()

        # A video with a different lti_id and the same playlist can still be created
        VideoFactory(playlist=video.playlist)

        # A video for a different playlist and the same lti_id can still be created
        VideoFactory(lti_id=video.lti_id)

        # Trying to create a video with the same duo lti_id/playlist should raise a
        # database error
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                VideoFactory(lti_id=video.lti_id, playlist=video.playlist)

        # Soft deleted videos should not count for unicity
        video.delete(force_policy=SOFT_DELETE_CASCADE)
        VideoFactory(lti_id=video.lti_id, playlist=video.playlist)

    def test_models_video_live_state_set_without_live_type(self):
        """A video live_state should not be set without a live_type."""
        with self.assertRaises(IntegrityError):
            VideoFactory(
                live_state=random.choice([choice[0] for choice in LIVE_CHOICES])
            )

    def test_models_video_live_type_set_without_live_state(self):
        """A video live_type should not be set without a live_state."""
        with self.assertRaises(IntegrityError):
            VideoFactory(
                live_type=random.choice([choice[0] for choice in LIVE_TYPE_CHOICES])
            )

    def test_models_video_is_ready_to_show(self):
        """All combination where a video is ready or not to be shown."""
        # Test all state choices allowing to be ready to show
        for state_choice in STATE_CHOICES:
            video = VideoFactory(
                upload_state=state_choice[0],
                uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc),
            )

            self.assertEqual(
                video.is_ready_to_show,
                state_choice[0] not in [DELETED, HARVESTED],
            )

        # when uploaded_on is null, the video can not be ready
        for state_choice in STATE_CHOICES:
            video = VideoFactory(
                upload_state=state_choice[0],
                uploaded_on=None,
            )

            self.assertEqual(video.is_ready_to_show, False)

        # The video is ready to show when live_state is not null
        for live_choice in LIVE_CHOICES:
            video = VideoFactory(live_state=live_choice[0], live_type=RAW)

            self.assertEqual(video.is_ready_to_show, True)

    def test_models_video_is_scheduled_none(self):
        """Checks that with a starting_at set to None video is not in the scheduled mode."""
        video = VideoFactory(starting_at=None)
        self.assertFalse(video.is_scheduled)
        self.assertEqual(video.live_state, None)

    def test_models_video_is_scheduled_with_state(self):
        """The property is_scheduled is set according to starting_at and live_state."""
        starting_at = timezone.now() + timedelta(hours=11)
        video = VideoFactory(starting_at=starting_at)
        # Video is not in the scheduled mode
        self.assertFalse(video.is_scheduled)
        self.assertEqual(video.live_state, None)

        # change state so video is now scheduled
        video.live_state = IDLE
        video.live_type = RAW
        video.save()

        self.assertTrue(video.is_scheduled)
        self.assertEqual(video.live_state, IDLE)

        # With any live_state other than None, is_scheduled is False
        for live_choice in LIVE_CHOICES:
            if live_choice[0] != IDLE:
                video = VideoFactory(
                    live_state=live_choice[0],
                    live_type=RAW,
                    starting_at=starting_at,
                )

                self.assertFalse(video.is_scheduled)

    def test_models_video_is_scheduled_with_date_constraint(self):
        """
        Testing the switch of is_scheduled with time over now.

        The property is_scheduled is set according to starting_at. It gets automaticaly
        updated to not scheduled if date is over.
        """
        # Set to now plus 1 second
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(seconds=1),
        )
        # Video is scheduled
        self.assertTrue(video.is_scheduled)
        self.assertEqual(video.live_state, IDLE)

        # Mock now to the future to check video gets set to not scheduled
        future = timezone.now() + timedelta(hours=1)
        with mock.patch.object(timezone, "now", return_value=future):
            self.assertFalse(video.is_scheduled)

    def test_models_modify_video_object_with_starting_at_in_the_past(self):
        """Testing we can still update a video after starting_at is over."""
        # Set to now plus 1 second
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(seconds=1),
        )
        # Video is scheduled
        self.assertTrue(video.is_scheduled)
        self.assertEqual(video.live_state, IDLE)

        # Mock now to the future to check video gets set to not scheduled
        future = timezone.now() + timedelta(hours=1)
        with mock.patch.object(timezone, "now", return_value=future):
            self.assertFalse(video.is_scheduled)
            video.description = "modify something else than starting_at"
            video.save()

    def test_models_video_start_recording_not_allowed(self):
        """A video recording cannot be started if not allowed."""
        video = VideoFactory(allow_recording=False)
        with self.assertRaises(
            VideoRecordingError, msg="Video recording is not allowed"
        ):
            video.start_recording()

        self.assertEqual(video.recording_slices, [])

    def test_models_video_start_recording_allowed_never_started(self):
        """A video recording can be started if allowed and has never started."""
        video = VideoFactory(allow_recording=True)
        now = timezone.now()
        with mock.patch.object(timezone, "now", return_value=now):
            video.start_recording()

        self.assertEqual(video.recording_slices, [{"start": to_timestamp(now)}])

    def test_models_video_start_recording_allowed_not_already_started(self):
        """A video recording can be started if allowed and not already started."""
        now = timezone.now()
        start = now - timedelta(minutes=20)
        stop = now + timedelta(minutes=10)
        video = VideoFactory(
            allow_recording=True,
            recording_slices=[
                {"start": to_timestamp(start), "stop": to_timestamp(stop)}
            ],
        )
        with mock.patch.object(timezone, "now", return_value=now):
            video.start_recording()

        self.assertEqual(
            video.recording_slices,
            [
                {"start": to_timestamp(start), "stop": to_timestamp(stop)},
                {"start": to_timestamp(now)},
            ],
        )

    def test_models_video_start_recording_allowed_already_started(self):
        """A video recording cannot be started if allowed and already started."""
        now = timezone.now()
        video = VideoFactory(
            allow_recording=True,
            recording_slices=[{"start": to_timestamp(now)}],
        )
        with self.assertRaises(
            VideoRecordingError, msg="Video recording is already started"
        ):
            video.start_recording()

        self.assertEqual(video.recording_slices, [{"start": to_timestamp(now)}])

    def test_models_video_stop_recording_never_started(self):
        """A video recording cannot be ended if never started."""
        video = VideoFactory()
        with self.assertRaises(
            VideoRecordingError, msg="Video recording is not started."
        ):
            video.stop_recording()

    def test_models_video_stop_recording_not_already_started(self):
        """A video recording cannot be ended if not already started."""
        start = timezone.now() - timedelta(minutes=20)
        stop = timezone.now() + timedelta(minutes=10)
        video = VideoFactory(
            recording_slices=[
                {"start": to_timestamp(start), "stop": to_timestamp(stop)}
            ],
        )

        with self.assertRaises(
            VideoRecordingError, msg="Video recording is not started."
        ):
            video.stop_recording()

    def test_models_video_stop_recording_already_started(self):
        """A video recording can be ended if already started."""
        start = timezone.now()
        stop = start + timedelta(minutes=10)
        video = VideoFactory(
            recording_slices=[{"start": to_timestamp(start)}],
        )

        with mock.patch.object(timezone, "now", return_value=stop):
            video.stop_recording()

        self.assertEqual(
            video.recording_slices,
            [
                {
                    "start": to_timestamp(start),
                    "stop": to_timestamp(stop),
                    "status": PENDING,
                }
            ],
        )

    def test_models_video_stop_recording_already_started_existing_slices(self):
        """Ending a video recording should conserve existing slices."""
        existing_start = timezone.now() - timedelta(hours=1)
        existing_stop = existing_start + timedelta(minutes=10)
        start = timezone.now()
        stop = start + timedelta(minutes=10)
        video = VideoFactory(
            recording_slices=[
                {
                    "start": to_timestamp(existing_start),
                    "stop": to_timestamp(existing_stop),
                    "status": HARVESTING,
                },
                {"start": to_timestamp(start)},
            ],
        )

        with mock.patch.object(timezone, "now", return_value=stop):
            video.stop_recording()

        self.assertEqual(
            video.recording_slices,
            [
                {
                    "start": to_timestamp(existing_start),
                    "stop": to_timestamp(existing_stop),
                    "status": HARVESTING,
                },
                {
                    "start": to_timestamp(start),
                    "stop": to_timestamp(stop),
                    "status": PENDING,
                },
            ],
        )

    def test_models_video_recording_time_is_not_recording(self):
        """It should return the total duration of all recording slices in seconds."""
        start_1 = timezone.now() - timedelta(hours=1)
        stop_1 = start_1 + timedelta(seconds=10)
        start_2 = timezone.now()
        stop_2 = start_2 + timedelta(seconds=10)
        video = VideoFactory(
            recording_slices=[
                {
                    "start": to_timestamp(start_1),
                    "stop": to_timestamp(stop_1),
                },
                {
                    "start": to_timestamp(start_2),
                    "stop": to_timestamp(stop_2),
                },
            ],
        )

        self.assertEqual(video.recording_time, 20)

    def test_models_video_recording_time_is_recording(self):
        """It should add pending recording time to sliced ones."""
        start_1 = timezone.now() - timedelta(hours=1)
        stop_1 = start_1 + timedelta(seconds=10)
        start_2 = timezone.now()
        now = start_2 + timedelta(seconds=10)
        video = VideoFactory(
            recording_slices=[
                {
                    "start": to_timestamp(start_1),
                    "stop": to_timestamp(stop_1),
                    "status": PENDING,
                },
                {"start": to_timestamp(start_2)},
            ],
        )

        with mock.patch.object(timezone, "now", return_value=now):
            self.assertEqual(video.recording_time, 20)

    def test_models_video_get_recording_slices_state_all_pending(self):
        """Main status should be pending if all slices are pending."""
        video = VideoFactory(
            recording_slices=[
                {"status": PENDING},
                {"status": PENDING},
                {"status": PENDING},
            ],
        )
        self.assertEqual(
            video.get_recording_slices_state(),
            {
                "status": PENDING,
                "recording_slices": [
                    {"status": PENDING},
                    {"status": PENDING},
                    {"status": PENDING},
                ],
            },
        )

    def test_models_video_get_recording_slices_state_one_pending(self):
        """Main status should be pending if one slice is pending."""
        video = VideoFactory(
            recording_slices=[
                {"status": HARVESTED},
                {"status": PENDING},
                {"status": HARVESTED},
            ],
        )
        self.assertEqual(
            video.get_recording_slices_state(),
            {
                "status": PENDING,
                "recording_slices": [
                    {"status": HARVESTED},
                    {"status": PENDING},
                    {"status": HARVESTED},
                ],
            },
        )

    def test_models_video_get_recording_slices_state_one_processing(self):
        """Main status should be pending if one slice is processing."""
        video = VideoFactory(
            recording_slices=[
                {"status": HARVESTED},
                {"status": PROCESSING},
                {"status": HARVESTED},
            ],
        )
        self.assertEqual(
            video.get_recording_slices_state(),
            {
                "status": PENDING,
                "recording_slices": [
                    {"status": HARVESTED},
                    {"status": PROCESSING},
                    {"status": HARVESTED},
                ],
            },
        )

    def test_models_video_get_recording_slices_state_all_harvested(self):
        """Main status should be harvested if all slices are harvested."""
        video = VideoFactory(
            recording_slices=[
                {"status": HARVESTED},
                {"status": HARVESTED},
                {"status": HARVESTED},
            ],
        )
        self.assertEqual(
            video.get_recording_slices_state(),
            {
                "status": HARVESTED,
                "recording_slices": [
                    {"status": HARVESTED},
                    {"status": HARVESTED},
                    {"status": HARVESTED},
                ],
            },
        )

    def test_model_video_set_recording_slice_manifest_key(self):
        """It should set the manifest key of a recording slice.

        Also, status should be set to harvested.
        """
        video = VideoFactory(
            recording_slices=[
                {
                    "status": HARVESTED,
                    "harvest_job_id": "harvest_job_id_1",
                    "manifest_key": "manifest_key_1.m3u8",
                },
                {
                    "status": PENDING,
                    "harvest_job_id": "harvest_job_id_2",
                },
                {
                    "status": PENDING,
                    "harvest_job_id": "harvest_job_id_3",
                },
            ],
        )
        video.set_recording_slice_manifest_key(
            "harvest_job_id_3", "manifest_key_3.m3u8"
        )
        video.refresh_from_db()
        self.assertEqual(
            video.recording_slices,
            [
                {
                    "status": HARVESTED,
                    "harvest_job_id": "harvest_job_id_1",
                    "manifest_key": "manifest_key_1.m3u8",
                },
                {
                    "status": PENDING,
                    "harvest_job_id": "harvest_job_id_2",
                },
                {
                    "status": HARVESTED,
                    "harvest_job_id": "harvest_job_id_3",
                    "manifest_key": "manifest_key_3.m3u8",
                },
            ],
        )
