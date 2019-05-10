"""Tests for the models in the ``core`` app of the Marsha project."""
from django.db import transaction
from django.db.utils import IntegrityError
from django.test import TestCase

from safedelete.models import SOFT_DELETE_CASCADE

from ..factories import VideoFactory


# We don't enforce arguments documentation in tests
# pylint: disable=missing-param-doc,missing-type-doc,unused-argument


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
