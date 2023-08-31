"""Tests for the Runner Job success API."""
import tempfile
from datetime import datetime
from unittest.mock import patch

import ffmpeg
from django.core.files import storage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone

from transcode_api.factories import RunnerFactory, RunnerJobFactory, VideoFactory
from transcode_api.models import RunnerJobState, RunnerJobType

# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


probe_response = {
    "streams": [
        {
            "index": 0,
            "codec_name": "h264",
            "codec_long_name": "H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10",
            "profile": "Constrained Baseline",
            "codec_type": "video",
            "codec_tag_string": "avc1",
            "codec_tag": "0x31637661",
            "width": 960,
            "height": 540,
            "coded_width": 960,
            "coded_height": 540,
            "closed_captions": 0,
            "has_b_frames": 0,
            "sample_aspect_ratio": "1:1",
            "display_aspect_ratio": "16:9",
            "pix_fmt": "yuv420p",
            "level": 31,
            "color_range": "tv",
            "color_space": "bt709",
            "color_transfer": "bt709",
            "color_primaries": "bt709",
            "chroma_location": "left",
            "refs": 1,
            "is_avc": "true",
            "nal_length_size": "4",
            "r_frame_rate": "30000/1001",
            "avg_frame_rate": "30000/1001",
            "time_base": "1/30000",
            "start_pts": 0,
            "start_time": "0.000000",
            "duration_ts": 666666,
            "duration": "22.222200",
            "bit_rate": "1066073",
            "bits_per_raw_sample": "8",
            "nb_frames": "666",
            "disposition": {
                "default": 1,
                "dub": 0,
                "original": 0,
                "comment": 0,
                "lyrics": 0,
                "karaoke": 0,
                "forced": 0,
                "hearing_impaired": 0,
                "visual_impaired": 0,
                "clean_effects": 0,
                "attached_pic": 0,
                "timed_thumbnails": 0,
            },
            "tags": {
                "creation_time": "2020-07-22T10:18:45.000000Z",
                "language": "und",
                "vendor_id": "[0][0][0][0]",
            },
        }
    ],
    "format": {
        "filename": "/videos/video-213a81c8-bdfe-4870-b2bc-d71d3c30f3a4/base_video.mp4",
        "nb_streams": 1,
        "nb_programs": 0,
        "format_name": "mov,mp4,m4a,3gp,3g2,mj2",
        "format_long_name": "QuickTime / MOV",
        "start_time": "0.000000",
        "duration": "22.222200",
        "size": "2964950",
        "bit_rate": "1067383",
        "probe_score": 100,
        "tags": {
            "major_brand": "isom",
            "minor_version": "1",
            "compatible_brands": "isomavc1mp42",
            "creation_time": "2020-07-22T10:18:53.000000Z",
        },
    },
}


@override_settings(STORAGE_VIDEO_LOCATION="/tmp")
class SuccessRunnerJobAPITest(TestCase):
    """Test for the Runner Job success API."""

    maxDiff = None

    def setUp(self):
        self.runner = RunnerFactory(name="New Runner", runnerToken="runnerToken")
        self.video = VideoFactory(
            name="Test video", uuid="02404b18-3c50-4929-af61-913f4df65e99"
        )

    def create_processing_job(self, type: RunnerJobType):
        return RunnerJobFactory(
            runner=self.runner,
            type=type,
            uuid="02404b18-3c50-4929-af61-913f4df65e00",
            payload={"output": {"resolution": "1080"}},
            privatePayload={
                "videoUUID": "02404b18-3c50-4929-af61-913f4df65e99",
                "isNewVideo": True,
            },
            state=RunnerJobState.PROCESSING,
        )

    def _api_url(self):
        return "/api/v1/runners/jobs/02404b18-3c50-4929-af61-913f4df65e00/success"

    def test_request_with_an_invalid_runner_token(self):
        """Should not be able to request the list."""
        self.create_processing_job(RunnerJobType.VOD_HLS_TRANSCODING)
        response = self.client.post(
            self._api_url(),
            data={
                "runnerToken": "invalid_token",
            },
        )

        self.assertEqual(response.status_code, 404)

    @override_settings(TEST_SETTINGS="/tmp")
    def test_success_hls_job_with_a_valid_runner_token(self):
        """Should be able to abort and reset the processing HLS job."""
        runner_job = self.create_processing_job(RunnerJobType.VOD_HLS_TRANSCODING)

        uploaded_video = SimpleUploadedFile(
            "file.mp4", b"file_content", content_type="video/mp4"
        )
        SimpleUploadedFile("file.m3u8", b"file_content", content_type="video/mp4")

        now = datetime(2018, 8, 8, tzinfo=timezone.utc)

        with tempfile.TemporaryDirectory(prefix="video_temp_dir") as temp_dir:
            fake_storage = storage.get_storage_class(
                "django.core.files.storage.FileSystemStorage"
            )(temp_dir)

            with patch.object(timezone, "now", return_value=now), patch.object(
                ffmpeg, "probe", return_value=probe_response
            ), patch("transcode_api.storage.get_storage_class") as mock_video_storage:
                mock_video_storage.return_value = fake_storage

                response = self.client.post(
                    self._api_url(),
                    data={
                        "runnerToken": "runnerToken",
                        "payload[videoFile]": uploaded_video,
                        "payload[resolutionPlaylistFile]": uploaded_video,
                    },
                )

        self.assertEqual(response.status_code, 204)

        runner_job.refresh_from_db()
        self.video.refresh_from_db()

        self.assertEqual(runner_job.state, 3)  # COMPLETED
        self.assertEqual(runner_job.failures, 0)  # should have been OK

        self.assertIsNotNone(
            self.video.streamingPlaylist
        )  # playlist should have been created

        self.assertEqual(self.video.state, 1)  # VideoState.PUBLISHED
