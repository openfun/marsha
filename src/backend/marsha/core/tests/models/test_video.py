"""Tests for the models in the ``core`` app of the Marsha project."""
from datetime import datetime, timedelta
import random
from unittest import mock

from django.core.cache import cache
from django.db.utils import IntegrityError
from django.test import TestCase, override_settings
from django.utils import timezone

from marsha.core.defaults import (
    DELETED,
    ENDED,
    HARVESTED,
    IDLE,
    LIVE_CHOICES,
    LIVE_TYPE_CHOICES,
    PENDING,
    PROCESSING,
    RAW,
    RUNNING,
    STATE_CHOICES,
    STOPPING,
)
from marsha.core.factories import VideoFactory
from marsha.core.utils.time_utils import to_timestamp


# pylint: disable=too-many-public-methods


class VideoModelsTestCase(TestCase):
    """Test our intentions about the Video model."""

    def setUp(self):
        """
        Reset the cache so that no cache key will be actve
        """
        cache.clear()

    def test_models_video_str(self):
        """The str method should display the title of the video and its eventual soft deletion."""
        video = VideoFactory(title="j'espère")
        self.assertEqual(str(video), "j'espère")

        video.delete()
        self.assertEqual(str(video), "j'espère [deleted]")

    def test_models_video_live_state_set_without_live_type(self):
        """A video live_state should not be set without a live_type."""
        with self.assertRaises(IntegrityError):
            VideoFactory(
                live_state=random.choice([choice[0] for choice in LIVE_CHOICES])
            )

    def test_models_video_fields_lti_id_non_unique(self):
        """it should be possible to create 2 videos sharing the samme playlists and lti_id."""
        video = VideoFactory()

        # A video with a different lti_id and the same playlist can still be created
        VideoFactory(playlist=video.playlist)

        # A video for a different playlist and the same lti_id can still be created
        VideoFactory(lti_id=video.lti_id)

        # A video with an already existing lti_id and playlist_id can still be created
        VideoFactory(lti_id=video.lti_id, playlist=video.playlist)

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

    def test_models_video_is_live(self):
        """All combination where a video is a live one."""
        for live_choice in LIVE_CHOICES:
            video = VideoFactory(live_state=live_choice[0], live_type=RAW)

            self.assertEqual(video.is_live, live_choice[0] not in [ENDED])

        # a video without live_state can't be a live_state
        video = VideoFactory(
            live_state=None,
        )

        self.assertFalse(video.is_live)

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

    def test_model_video_duration_and_live_ended_at_still_running(self):
        """
        When  a live is still running or is stopping, the live_ended_at
        property corresponds to the current timestamp and the duration
        varies with the time.
        """
        video = VideoFactory(
            id="a1a21411-bf2f-4926-b97f-3c48a124d528",
            live_state=random.choice([RUNNING, STOPPING]),
            live_info={
                "medialive": {
                    "input": {
                        "id": "medialive_input_1",
                        "endpoints": [
                            "https://live_endpoint1",
                            "https://live_endpoint2",
                        ],
                    },
                    "channel": {"id": "medialive_channel_1"},
                    "request_ids": ["7954d4d1-9dd3-47f4-9542-e7fd5f937fe6"],
                },
                "mediapackage": {
                    "id": "mediapackage_channel_1",
                    "endpoints": {
                        "hls": {
                            "id": "endpoint1",
                            "url": "https://channel_endpoint1/live.m3u8",
                        },
                    },
                },
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
                "started_at": "1533686400",
            },
            live_type=RAW,
        )
        now = int(to_timestamp(timezone.now()))
        duration = now - 1533686400
        self.assertEqual(video.live_ended_at, now)
        self.assertEqual(video.live_duration, duration)

        elapsed = 10
        date_now = datetime.fromtimestamp(now + elapsed)
        # live_duration and live_ended_at varies with time
        with mock.patch.object(timezone, "now", return_value=date_now):
            self.assertEqual(video.live_duration, duration + elapsed)
            self.assertEqual(video.live_ended_at, now + elapsed)

    def test_model_video_duration_and_live_ended_at_finished_running(self):
        """
        When a live has ended, the live_ended_at property corresponds
        to the current timestamp and the duration doesn't varie with
        the time.
        """
        started = 1533686400
        ended = 1535686400
        video = VideoFactory(
            id="a1a21411-bf2f-4926-b97f-3c48a124d528",
            live_state=ENDED,
            live_info={
                "medialive": {
                    "input": {
                        "id": "medialive_input_1",
                        "endpoints": [
                            "https://live_endpoint1",
                            "https://live_endpoint2",
                        ],
                    },
                    "channel": {"id": "medialive_channel_1"},
                    "request_ids": ["7954d4d1-9dd3-47f4-9542-e7fd5f937fe6"],
                },
                "mediapackage": {
                    "id": "mediapackage_channel_1",
                    "endpoints": {
                        "hls": {
                            "id": "endpoint1",
                            "url": "https://channel_endpoint1/live.m3u8",
                        },
                    },
                },
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
                "started_at": started,
                "stopped_at": ended,
            },
            live_type=RAW,
        )
        now = int(to_timestamp(timezone.now()))
        duration = ended - started
        self.assertEqual(video.live_ended_at, ended)
        self.assertEqual(video.live_duration, duration)

        elapsed = 10
        date_now = datetime.fromtimestamp(now + elapsed)
        # duration and live_ended_at property don't change
        with mock.patch.object(timezone, "now", return_value=date_now):
            self.assertEqual(video.live_duration, duration)
            self.assertEqual(video.live_ended_at, ended)

    def test_model_video_duration_and_live_ended_at_not_running_no_end(self):
        """
        When a live is not running anymore and has no stopped_at, the live_ended_at
        property returns None. Live has no live_duration as well.
        """
        started = 1533686400
        video = VideoFactory(
            id="a1a21411-bf2f-4926-b97f-3c48a124d528",
            live_state=ENDED,
            live_info={
                "medialive": {
                    "input": {
                        "id": "medialive_input_1",
                        "endpoints": [
                            "https://live_endpoint1",
                            "https://live_endpoint2",
                        ],
                    },
                    "channel": {"id": "medialive_channel_1"},
                    "request_ids": ["7954d4d1-9dd3-47f4-9542-e7fd5f937fe6"],
                },
                "mediapackage": {
                    "id": "mediapackage_channel_1",
                    "endpoints": {
                        "hls": {
                            "id": "endpoint1",
                            "url": "https://channel_endpoint1/live.m3u8",
                        },
                    },
                },
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
                "started_at": started,
            },
            live_type=RAW,
        )
        self.assertEqual(video.live_ended_at, None)
        self.assertEqual(video.live_duration, 0)
        self.assertEqual(video.get_list_timestamps_attendences(), {})

    def test_model_video_duration_and_live_ended_at_not_running_no_started_at(self):
        """
        When  a live is not running anymore and has a property stopped_at but no
        started_at, the live_duration is 0
        """
        ended = 1535686400
        video = VideoFactory(
            id="a1a21411-bf2f-4926-b97f-3c48a124d528",
            live_state=ENDED,
            live_info={
                "medialive": {
                    "input": {
                        "id": "medialive_input_1",
                        "endpoints": [
                            "https://live_endpoint1",
                            "https://live_endpoint2",
                        ],
                    },
                    "channel": {"id": "medialive_channel_1"},
                    "request_ids": ["7954d4d1-9dd3-47f4-9542-e7fd5f937fe6"],
                },
                "mediapackage": {
                    "id": "mediapackage_channel_1",
                    "endpoints": {
                        "hls": {
                            "id": "endpoint1",
                            "url": "https://channel_endpoint1/live.m3u8",
                        },
                    },
                },
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
                "stopped_at": ended,
            },
            live_type=RAW,
        )
        self.assertEqual(video.live_ended_at, ended)
        # no property started_at so live_duration is 0
        self.assertEqual(video.live_duration, 0)
        self.assertEqual(video.get_list_timestamps_attendences(), {})

    def test_model_video_duration_and_live_ended_at_not_running_no_live_info(self):
        """
        When  a live has no live_info, we control the live_duration, the_live_ended_at
        properties and the get_list_timestamps_attendences method retun the expected
        default values
        """
        video = VideoFactory()
        self.assertEqual(video.live_ended_at, None)
        # no property started_at so live_duration is 0
        self.assertEqual(video.live_duration, 0)
        self.assertEqual(video.get_list_timestamps_attendences(), {})

    @override_settings(ATTENDANCE_POINTS=4)
    def test_model_video_get_list_timestamps_attendences(self):
        """
        Check get_list_timestamps_attendences builds an array of timestamp
        depending of the duration of the video
        """
        # video end one hour later
        started = 1600000000
        one_hour = 3600
        ended = started + one_hour

        video = VideoFactory(
            id="a1a21411-bf2f-4926-b97f-3c48a124d528",
            live_state=ENDED,
            live_info={
                "medialive": {
                    "input": {
                        "id": "medialive_input_1",
                        "endpoints": [
                            "https://live_endpoint1",
                            "https://live_endpoint2",
                        ],
                    },
                    "channel": {"id": "medialive_channel_1"},
                    "request_ids": ["7954d4d1-9dd3-47f4-9542-e7fd5f937fe6"],
                },
                "mediapackage": {
                    "id": "mediapackage_channel_1",
                    "endpoints": {
                        "hls": {
                            "id": "endpoint1",
                            "url": "https://channel_endpoint1/live.m3u8",
                        },
                    },
                },
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
                "started_at": started,
                "stopped_at": ended,
            },
            live_type=RAW,
        )
        now = int(to_timestamp(timezone.now()))
        expected_list_timestamp = {
            "1600000000": {},
            "1600001200": {},
            "1600002400": {},
            "1600003600": {},
        }
        self.assertEqual(video.live_ended_at, ended)
        self.assertEqual(video.live_duration, one_hour)
        self.assertEqual(
            video.get_list_timestamps_attendences(),
            expected_list_timestamp,
        )

        elapsed = 10
        date_now = datetime.fromtimestamp(now + elapsed)
        # duration and live_ended_at property don't change as live is ended
        with mock.patch.object(timezone, "now", return_value=date_now):
            self.assertEqual(video.live_duration, one_hour)
            self.assertEqual(video.live_ended_at, ended)
            self.assertEqual(
                video.get_list_timestamps_attendences(), expected_list_timestamp
            )

    @override_settings(ATTENDANCE_POINTS=4)
    def test_model_video_get_list_timestamps_attendences_still_running(
        self,
    ):
        """
        Check get_list_timestamps_attendences builds an array of timestamp
        depending of the duration of the video.
        """
        # video ends one hour later
        started = 1600000000
        one_hour = 3600

        video = VideoFactory(
            id="a1a21411-bf2f-4926-b97f-3c48a124d528",
            live_state=RUNNING,
            live_info={
                "medialive": {
                    "input": {
                        "id": "medialive_input_1",
                        "endpoints": [
                            "https://live_endpoint1",
                            "https://live_endpoint2",
                        ],
                    },
                    "channel": {"id": "medialive_channel_1"},
                    "request_ids": ["7954d4d1-9dd3-47f4-9542-e7fd5f937fe6"],
                },
                "mediapackage": {
                    "id": "mediapackage_channel_1",
                    "endpoints": {
                        "hls": {
                            "id": "endpoint1",
                            "url": "https://channel_endpoint1/live.m3u8",
                        },
                    },
                },
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
                "started_at": started,
            },
            live_type=RAW,
        )

        date_now = datetime.fromtimestamp(started + one_hour)
        with mock.patch.object(timezone, "now", return_value=date_now):
            list_timestamp_ori = {
                "1600000000": {},
                "1600001200": {},
                "1600002400": {},
                "1600003600": {},
            }
            self.assertEqual(video.live_duration, one_hour)
            self.assertEqual(video.live_ended_at, started + one_hour)
            self.assertEqual(
                video.get_list_timestamps_attendences(), list_timestamp_ori
            )

        # duration and live_ended_at property change as live is still running,
        # get_list_timestamps_attendences as well
        date_now = datetime.fromtimestamp(started + one_hour + 10)
        with mock.patch.object(timezone, "now", return_value=date_now):
            self.assertEqual(video.live_duration, one_hour + 10)
            self.assertEqual(video.live_ended_at, started + one_hour + 10)
            self.assertNotEqual(
                video.get_list_timestamps_attendences(), list_timestamp_ori
            )

    @override_settings(ATTENDANCE_POINTS=100)
    def test_model_video_get_list_timestamps_attendences_less_seconds_than_number_of_points(
        self,
    ):
        """
        We control that when the video is not as long as the number of points required,
        it doesn't return a list of timestamp for the video
        """

        started = 1600000000

        video = VideoFactory(
            id="a1a21411-bf2f-4926-b97f-3c48a124d528",
            live_state=RUNNING,
            live_info={
                "medialive": {
                    "input": {
                        "id": "medialive_input_1",
                        "endpoints": [
                            "https://live_endpoint1",
                            "https://live_endpoint2",
                        ],
                    },
                    "channel": {"id": "medialive_channel_1"},
                    "request_ids": ["7954d4d1-9dd3-47f4-9542-e7fd5f937fe6"],
                },
                "mediapackage": {
                    "id": "mediapackage_channel_1",
                    "endpoints": {
                        "hls": {
                            "id": "endpoint1",
                            "url": "https://channel_endpoint1/live.m3u8",
                        },
                    },
                },
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
                "started_at": started,
            },
            live_type=RAW,
        )
        # ATTENDANCE_POINTS=100, 99 is less than the number of points
        date_now = datetime.fromtimestamp(started + 99)
        with mock.patch.object(timezone, "now", return_value=date_now):
            self.assertEqual(video.live_duration, 99)
            self.assertEqual(video.live_ended_at, started + 99)
            self.assertEqual(video.get_list_timestamps_attendences(), {})
