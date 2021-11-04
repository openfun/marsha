"""Tests for the models in the ``core`` app of the Marsha project."""
from datetime import datetime, timedelta
import random
from unittest import mock

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.utils import IntegrityError
from django.test import TestCase
from django.utils import timezone

import pytz
from safedelete.models import SOFT_DELETE_CASCADE

from ..defaults import (
    DELETED,
    HARVESTED,
    IDLE,
    LIVE_CHOICES,
    LIVE_TYPE_CHOICES,
    RAW,
    STATE_CHOICES,
)
from ..factories import VideoFactory


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
                uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc),
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
        starting_at = timezone.now() - timedelta(hours=1)
        # Can't set with a date in the past
        with self.assertRaises(ValidationError) as error:
            VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)

        self.assertEqual(
            error.exception.messages,
            [f"{starting_at} is not a valid date, date should be planned after!"],
        )
        # Set to now plus 1 second and wait
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
