"""Tests for the `core.utils.transcode` module."""

from unittest import mock

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
            state=VideoState.TO_TRANSCODE,
            directory=f"scw/{self.video.pk}/video/1698941501",
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
        """The marsha video should correctly be updated and dispatched."""
        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video"
        ) as mock_dispatch_video:
            transcoding_ended_callback(self.transcoded_video)

        self.video.refresh_from_db()

        self.assertEqual(self.video.uploaded_on, to_datetime("1698941501"))

        self.assertEqual(self.video.resolutions, [720, 1080])

        self.assertEqual(self.video.upload_state, defaults.READY)
        self.assertEqual(self.video.transcode_pipeline, defaults.PEERTUBE_PIPELINE)
        mock_dispatch_video.assert_called_once_with(self.video, to_admin=True)
