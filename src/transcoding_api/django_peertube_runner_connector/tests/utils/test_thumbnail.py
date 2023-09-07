from unittest.mock import patch

import ffmpeg
from django.test import TestCase

from django_peertube_runner_connector.factories import VideoFactory, VideoFileFactory
from django_peertube_runner_connector.storage import video_storage
from django_peertube_runner_connector.utils.thumbnail import build_video_thumbnails


class ThumbnailTestCase(TestCase):
    """Test the thumbnail utils file."""

    def setUp(self):
        """Create a video, video file and a video url."""
        self.video = VideoFactory(name="Test Video")
        self.video_file = VideoFileFactory(video=self.video, filename="test.mp4")
        self.video_url = video_storage.url(self.video_file.filename)
        self.thumbnail_filename = f"video-{self.video.uuid}/thumbnail.jpg"

    def tearDown(self):
        """Delete the created thumbnail file."""
        video_storage.delete(self.thumbnail_filename)

    @patch("django_peertube_runner_connector.utils.thumbnail.get_video_stream_dimensions_info")
    @patch.object(ffmpeg, "run")
    def test_build_video_thumbnails(
        self, mock_run, mock_get_video_stream_dimensions_info
    ):
        """Should create a thumbnail file."""
        mock_get_video_stream_dimensions_info.return_value = {
            "width": 1920,
            "height": 1080,
        }

        thumbnail_filename = build_video_thumbnails(
            video=self.video,
            video_file=self.video_file,
            existing_probe=None,
        )

        self.assertEqual(thumbnail_filename, self.thumbnail_filename)
        self.assertTrue(video_storage.exists(thumbnail_filename))

        mock_get_video_stream_dimensions_info.assert_called_once_with(
            path=self.video_url, existing_probe=None
        )
