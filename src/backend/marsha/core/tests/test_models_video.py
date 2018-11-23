"""Tests for the models in the ``core`` app of the Marsha project."""
from django.test import TestCase

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
