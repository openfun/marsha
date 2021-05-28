"""Tests for the models in the ``core`` app of the Marsha project."""
from datetime import datetime

from django.db import transaction
from django.db.utils import IntegrityError
from django.test import TestCase

import pytz
from safedelete.models import SOFT_DELETE_CASCADE

from ..defaults import DELETED, HARVESTED, LIVE_CHOICES, RUNNING, STATE_CHOICES
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

        # Only when live is running, the video is ready to show
        for live_choice in LIVE_CHOICES:
            video = VideoFactory(live_state=live_choice[0])

            self.assertEqual(video.is_ready_to_show, live_choice[0] == RUNNING)
