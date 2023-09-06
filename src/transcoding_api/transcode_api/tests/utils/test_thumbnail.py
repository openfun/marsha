from unittest.mock import patch

import ffmpeg
from django.test import TestCase

from transcode_api.factories import VideoFactory, VideoFileFactory
from transcode_api.storage import video_storage
from transcode_api.utils.thumbnail import build_video_thumbnails


class ThumbnailTestCase(TestCase):
    def setUp(self):
        self.video = VideoFactory(name="Test Video")
        self.video_file = VideoFileFactory(video=self.video, filename="test.mp4")
        self.video_path = video_storage.url(self.video_file.filename)
        self.thumbnail_filename = f"video-{self.video.uuid}/thumbnail.jpg"

    def tearDown(self):
        video_storage.delete(self.thumbnail_filename)

    @patch("transcode_api.utils.thumbnail.get_video_stream_dimensions_info")
    @patch.object(ffmpeg, "run")
    def test_build_video_thumbnails(
        self, mock_run, mock_get_video_stream_dimensions_info
    ):
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
            path=self.video_path, existing_probe=None
        )
