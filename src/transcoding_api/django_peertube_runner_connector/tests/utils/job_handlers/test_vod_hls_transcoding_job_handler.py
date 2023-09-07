from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from django_peertube_runner_connector.factories import (
    RunnerJobFactory,
    VideoFactory,
    VideoFileFactory,
    VideoJobInfoFactory,
)
from django_peertube_runner_connector.models import RunnerJobType
from django_peertube_runner_connector.utils.job_handlers.vod_hls_transcoding_job_handler import (
    VODHLSTranscodingJobHandler,
)

uuid_regex = "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}"


class TestVODHLSTranscodingJobHandler(TestCase):
    """Test the VOD_HLS_TRANSCODING job handler."""
    
    def setUp(self):
        """Create a video, a video file and a video job."""
        self.video = VideoFactory(
            uuid="123e4567-e89b-12d3-a456-426655440002",
            name="Test Video",
        )
        self.video_file = VideoFileFactory(
            video=self.video,
            filename="test_filename",
        )
        self.video_job_info = VideoJobInfoFactory(video=self.video, pendingTranscode=1)

    def test_create(self):
        """Should be able to create a VOD_HLS_TRANSCODING runner job."""
        handler = VODHLSTranscodingJobHandler()
        runner_job = handler.create(
            self.video, "720", 30, None, lambda x, y: "test_url"
        )

        self.video.refresh_from_db()
        self.assertEqual(runner_job.type, RunnerJobType.VOD_HLS_TRANSCODING)
        self.assertEqual(
            runner_job.payload,
            {
                "input": {
                    "videoFileUrl": "test_url",
                },
                "output": {
                    "resolution": "720",
                    "fps": 30,
                },
            },
        )

        self.assertEqual(
            runner_job.privatePayload,
            {
                "isNewVideo": False,
                "deleteWebVideoFiles": False,
                "videoUUID": str(self.video.uuid),
            },
        )
        self.assertEqual(self.video.jobInfo.pendingTranscode, 2)

    @patch(
        "django_peertube_runner_connector.utils.job_handlers.vod_hls_transcoding_job_handler.on_hls_video_file_transcoding"
    )
    @patch(
        "django_peertube_runner_connector.utils.job_handlers.vod_hls_transcoding_job_handler.on_transcoding_ended"
    )
    @patch(
        "django_peertube_runner_connector.utils.job_handlers.vod_hls_transcoding_job_handler.rename_video_file_in_playlist"
    )
    @patch(
        "django_peertube_runner_connector.utils.job_handlers.vod_hls_transcoding_job_handler.build_new_file",
    )
    @patch(
        "django_peertube_runner_connector.utils.job_handlers.vod_hls_transcoding_job_handler.generate_hls_video_filename",
    )
    def test_specific_complete(
        self,
        mock_generate_hls_video_filename,
        mock_build_new_file,
        mock_rename_video_file_in_playlist,
        mock_on_transcoding_ended,
        mock_on_hls_video_file_transcoding,
    ):
        """Should be able to complete a VOD_HLS_TRANSCODING runner job."""
        mock_build_new_file.return_value = self.video_file
        mock_generate_hls_video_filename.return_value = (
            "4b3bbd37-4e87-48a9-8f26-c04c0b9fdbb5-720-fragmented.mp4"
        )
        runner_job = RunnerJobFactory(
            payload={
                "input": {
                    "videoFileUrl": "test_url",
                },
                "output": {
                    "resolution": "720",
                    "fps": 30,
                },
            },
            privatePayload={
                "isNewVideo": False,
                "deleteWebVideoFiles": False,
                "videoUUID": str(self.video.uuid),
            },
        )

        uploaded_video_file = SimpleUploadedFile(
            "file.mp4", b"file_content", content_type="video/mp4"
        )
        uploaded_playlist_file = SimpleUploadedFile(
            "file.m3u8", b"file_content", content_type="video/mp4"
        )

        result_payload = {
            "video_file": uploaded_video_file,
            "resolution_playlist_file": uploaded_playlist_file,
        }
        handler = VODHLSTranscodingJobHandler()
        handler.specific_complete(runner_job, result_payload=result_payload)

        mock_generate_hls_video_filename.assert_called_once_with("720")

        mock_build_new_file.assert_called_once_with(
            video=self.video,
            filename="video-123e4567-e89b-12d3-a456-426655440002"
            "/4b3bbd37-4e87-48a9-8f26-c04c0b9fdbb5-720-fragmented.mp4",
        )

        mock_rename_video_file_in_playlist.assert_called_once_with(
            "test_filename.m3u8",
            "test_filename",
        )

        mock_on_hls_video_file_transcoding.assert_called_once_with(
            video=self.video, video_file=self.video_file
        )

        mock_on_transcoding_ended.assert_called_once_with(
            move_video_to_next_state=True,
            video=self.video,
        )
