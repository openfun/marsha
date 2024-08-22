"""Test for video celery tasks"""

# pylint: disable=protected-access
from unittest import mock

from django.test import TestCase

from marsha.core.defaults import ERROR
from marsha.core.factories import VideoFactory
from marsha.core.tasks.video import launch_video_transcoding, launch_video_transcript


class TestVideoTask(TestCase):
    """
    Test for video celery tasks
    """

    def test_launch_video_transcode(self):
        """
        Test the the launch_video_transcoding task. It should simply call
        the launch_video_transcoding function.
        """
        video = VideoFactory()
        stamp = "1640995200"
        with mock.patch(
            "marsha.core.tasks.video.transcode_video"
        ) as mock_transcode_video:
            launch_video_transcoding(str(video.pk), stamp, "http://127.0.0.1:8000")
            mock_transcode_video.assert_called_once_with(
                file_path=f"tmp/{video.pk}/video/{stamp}",
                destination=f"vod/{video.pk}/video/{stamp}",
                base_name=stamp,
                domain="http://127.0.0.1:8000",
            )

    def test_launch_video_transcode_fail(self):
        """
        Test the the launch_video_transcoding task. The transcode_video
        function should raise an exception and video state should be ERROR.
        """
        video = VideoFactory()
        stamp = "1640995200"
        with mock.patch(
            "marsha.core.tasks.video.transcode_video"
        ) as mock_transcode_video:
            mock_transcode_video.side_effect = Exception("Test exception")
            launch_video_transcoding(str(video.pk), stamp, "http://127.0.0.1:8000")
            mock_transcode_video.assert_called_once_with(
                file_path=f"tmp/{video.pk}/video/{stamp}",
                destination=f"vod/{video.pk}/video/{stamp}",
                base_name=stamp,
                domain="http://127.0.0.1:8000",
            )
            video.refresh_from_db()
            self.assertEqual(video.upload_state, ERROR)

    def test_launch_video_transcript(self):
        """
        Test the launch_video_transcoding task. It should simply call
        the launch_video_transcoding function.
        """
        video = VideoFactory()
        stamp = "1640995200"
        with mock.patch(
            "marsha.core.tasks.video.transcript_video"
        ) as mock_transcript_video:
            launch_video_transcript(str(video.pk), stamp, "http://127.0.0.1:8000")
            mock_transcript_video.assert_called_once_with(
                destination=f"vod/{video.pk}/video/{stamp}",
                domain="http://127.0.0.1:8000",
            )
