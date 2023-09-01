"""Tests for the Runner Job success API."""
import tempfile
from unittest.mock import patch

from django.core.files.storage import get_storage_class
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from transcode_api.factories import (
    RunnerFactory,
    RunnerJobFactory,
    VideoFactory,
    VideoFileFactory,
)
from transcode_api.models import RunnerJobState, RunnerJobType

# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class DownloadVideoRunnerJobAPITest(TestCase):
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
        return (
            "/api/v1/runners/jobs/02404b18-3c50-4929-af61-913f4df65e00/"
            "files/videos/02404b18-3c50-4929-af61-913f4df65e99/max-quality"
        )

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

    def test_download_video_with_a_valid_runner_token(self):
        """Should be able to download a video for a job."""
        self.create_processing_job(RunnerJobType.VOD_HLS_TRANSCODING)

        video_to_download = SimpleUploadedFile(
            "file.mp4", b"file_content", content_type="video/mp4"
        )

        with tempfile.TemporaryDirectory(prefix="video_temp_dir") as temp_dir:
            fake_storage = get_storage_class(
                "django.core.files.storage.FileSystemStorage"
            )(temp_dir)

            filename = fake_storage.save(
                "video_test.mp4",
                video_to_download,
            )

            VideoFileFactory(video=self.video, filename=filename)

            with patch("transcode_api.views.runner_job.video_storage", fake_storage):
                response = self.client.post(
                    self._api_url(),
                    data={
                        "runnerToken": "runnerToken",
                    },
                )

        self.assertEqual(response.status_code, 200)
