"""Tests for the `core.utils.transcode` module."""

from unittest.mock import patch

from django.test import TestCase

from django_peertube_runner_connector.factories import (
    VideoFactory as TranscodedVideoFactory,
    VideoJobInfoFactory,
)
from django_peertube_runner_connector.models import (
    Video as TranscodedVideo,
    VideoFile,
    VideoState,
    VideoStreamingPlaylist,
)

from marsha.core import defaults
from marsha.core.factories import VideoFactory
from marsha.core.utils.time_utils import to_datetime
from marsha.core.utils.transcode import (
    delete_transcoding_temp_files,
    transcoding_ended_callback,
)


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

    @patch("marsha.core.utils.transcode.delete_temp_file")
    def test_transcoding_ended_callback(self, mock_delete_temp_file):
        """The marsha video should correctly be updated."""
        transcoding_ended_callback(self.transcoded_video)

        self.video.refresh_from_db()
        self.assertEqual(self.video.uploaded_on, to_datetime("1698941501"))
        self.assertEqual(self.video.resolutions, [720, 1080])
        self.assertEqual(self.video.upload_state, defaults.READY)
        self.assertEqual(self.video.transcode_pipeline, defaults.PEERTUBE_PIPELINE)
        mock_delete_temp_file.assert_called_once_with(
            self.transcoded_video, f"tmp/{self.video.pk}/video/1698941501"
        )

    @patch("marsha.core.utils.transcode.delete_temp_file")
    def test_transcoding_ended_callback_with_error(self, mock_delete_temp_file):
        """The marsha video should be set with state on error and nothing else should be done."""
        self.transcoded_video.state = VideoState.TRANSCODING_FAILED

        transcoding_ended_callback(self.transcoded_video)

        self.video.refresh_from_db()
        self.assertEqual(self.video.upload_state, defaults.ERROR)
        self.assertEqual(self.video.uploaded_on, None)
        self.assertEqual(self.video.resolutions, [])
        self.assertEqual(self.video.transcode_pipeline, None)
        mock_delete_temp_file.assert_called_once_with(
            self.transcoded_video, f"tmp/{self.video.pk}/video/1698941501"
        )

    @patch("marsha.core.utils.transcode.delete_temp_file")
    def test_transcoding_delete_transcoding_temp_files(self, mock_delete_temp_file):
        """The temp files should be deleted."""
        VideoJobInfoFactory(pendingTranscode=0, video=self.transcoded_video)
        temp_video_file = TranscodedVideoFactory(
            directory=self.transcoded_video.directory.replace(
                defaults.VOD_VIDEOS_STORAGE_BASE_DIRECTORY,
                defaults.TMP_VIDEOS_STORAGE_BASE_DIRECTORY,
            )
        )

        delete_transcoding_temp_files()

        mock_delete_temp_file.assert_called_once_with(
            self.transcoded_video, temp_video_file.directory
        )

    @patch("marsha.core.utils.transcode.delete_temp_file")
    def test_transcoding_delete_transcoding_temp_files_pending_transcode(
        self, mock_delete_temp_file
    ):
        """The temp files should not be deleted if there is a pending transcode."""
        VideoJobInfoFactory(pendingTranscode=1, video=self.transcoded_video)
        TranscodedVideoFactory(
            directory=self.transcoded_video.directory.replace(
                defaults.VOD_VIDEOS_STORAGE_BASE_DIRECTORY,
                defaults.TMP_VIDEOS_STORAGE_BASE_DIRECTORY,
            )
        )

        delete_transcoding_temp_files()

        mock_delete_temp_file.assert_not_called()

    @patch("marsha.core.utils.transcode.delete_temp_file")
    def test_transcoding_delete_transcoding_temp_files_not_published(
        self, mock_delete_temp_file
    ):
        """The temp files should be deleted."""
        self.transcoded_video.state = VideoState.TO_TRANSCODE
        self.transcoded_video.save()
        VideoJobInfoFactory(pendingTranscode=0, video=self.transcoded_video)
        TranscodedVideoFactory(
            directory=self.transcoded_video.directory.replace(
                defaults.VOD_VIDEOS_STORAGE_BASE_DIRECTORY,
                defaults.TMP_VIDEOS_STORAGE_BASE_DIRECTORY,
            )
        )

        delete_transcoding_temp_files()

        mock_delete_temp_file.assert_not_called()
