"""Tests for the `core.utils.transcode` module."""

from django.test import TestCase

from django_peertube_runner_connector.models import (
    Video as TranscodedVideo,
    VideoFile,
    VideoState,
    VideoStreamingPlaylist,
)

from marsha.core import defaults
from marsha.core.factories import VideoFactory
from marsha.core.utils.time_utils import to_datetime
from marsha.core.utils.transcode import transcoding_ended_callback


class TranscodeTestCase(TestCase):
    """Test the `transcode` functions."""

    def setUp(self):
        # Create a test video
        self.video = VideoFactory(
            uploaded_on=None,
            upload_state=defaults.PROCESSING,
            resolutions=[],
        )

        # Create a test transcoded video
        self.transcoded_video = TranscodedVideo.objects.create(
            state=VideoState.PUBLISHED,
            directory=f"vod/{self.video.pk}/video/1698941501",
        )
        self.video_playlist = VideoStreamingPlaylist.objects.create(
            video=self.transcoded_video
        )
        self.video_file1 = VideoFile.objects.create(
            video=self.transcoded_video,
            streamingPlaylist=self.video_playlist,
            resolution=720,
            size=123456,
            extname="mp4",
        )

        self.video_file2 = VideoFile.objects.create(
            video=self.transcoded_video,
            streamingPlaylist=self.video_playlist,
            resolution=1080,
            size=123456,
            extname="mp4",
        )

    def test_transcoding_ended_callback(self):
        """The marsha video should correctly be updated."""
        transcoding_ended_callback(self.transcoded_video)

        self.video.refresh_from_db()

        self.assertEqual(self.video.uploaded_on, to_datetime("1698941501"))

        self.assertEqual(self.video.resolutions, [720, 1080])

        self.assertEqual(self.video.upload_state, defaults.READY)
        self.assertEqual(self.video.transcode_pipeline, defaults.PEERTUBE_PIPELINE)

    def test_transcoding_ended_callback_with_error(self):
        """The marsha video should be set with state on error and nothing else should be done."""
        self.transcoded_video.state = VideoState.TRANSCODING_FAILED

        transcoding_ended_callback(self.transcoded_video)

        self.video.refresh_from_db()

        self.assertEqual(self.video.upload_state, defaults.ERROR)

        self.assertEqual(self.video.uploaded_on, None)

        self.assertEqual(self.video.resolutions, [])

        self.assertEqual(self.video.transcode_pipeline, None)
