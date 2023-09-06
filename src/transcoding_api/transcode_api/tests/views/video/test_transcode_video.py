"""Tests for the Video transcode API."""
from unittest.mock import patch

import ffmpeg
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from transcode_api.factories import (
    RunnerFactory,
)
from transcode_api.models import RunnerJob, RunnerJobState, RunnerJobType, Video
from transcode_api.storage import video_storage
from transcode_api.tests.probe_response import probe_response

# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class TranscodeVideoAPITest(TestCase):
    """Test for the Runner Job success API."""

    maxDiff = None

    def setUp(self):
        self.runner = RunnerFactory(name="New Runner", runnerToken="runnerToken")

    def _api_url(self):
        return "/api/v1/videos/transcode"

    def test_transcode_video_with_invalid_path(self):
        """Should not be able to transcode a video with an invalid path."""

        response = self.client.post(
            self._api_url(),
            data={"name": "New_Video", "path": "invalid/path"},
        )

        self.assertEqual(response.status_code, 404)

    def test_transcode_video_with_invalid_path(self):
        """Should not be able to transcode a video with an invalid path."""

        response = self.client.post(
            self._api_url(),
            data={"name": "New_Video", "path": "invalid/path"},
        )

        self.assertEqual(response.status_code, 404)
        
    def test_transcode_video(self):
        """Should be able to transcode a video a create corresponding job."""
        uploaded_video = SimpleUploadedFile(
            "file.mp4", b"file_content", content_type="video/mp4"
        )

        filename = video_storage.save("video_test.mp4", uploaded_video)

        with patch.object(ffmpeg, "probe", return_value=probe_response), patch.object(
            ffmpeg, "run"
        ), patch(
            "transcode_api.utils.job_handlers.abstract_job_handler.send_available_jobs_ping_to_runners",
        ) as ping_mock:
            list_dir, _ = video_storage.listdir("")
            dir_num = len(list_dir)

            response = self.client.post(
                self._api_url(),
                data={"name": "New_Video", "path": filename},
            )

            self.assertEqual(response.status_code, 200)

            self.assertEqual(RunnerJob.objects.count(), 3)
            self.assertEqual(
                RunnerJob.objects.filter(
                    type=RunnerJobType.VOD_HLS_TRANSCODING
                ).count(),
                3,
            )
            self.assertEqual(
                RunnerJob.objects.filter(state=RunnerJobState.PENDING).count(), 1
            )
            self.assertEqual(
                RunnerJob.objects.filter(
                    state=RunnerJobState.WAITING_FOR_PARENT_JOB
                ).count(),
                2,
            )

            list_dir, _ = video_storage.listdir("")
            self.assertEqual(len(list_dir), dir_num + 1)

            created_video = Video.objects.first()

            _, video_files = video_storage.listdir(f"video-{created_video.uuid}")
            # only thumbnail (video already uploaded)
            self.assertEqual(len(video_files), 1)
            self.assertEqual(Video.objects.count(), 1)

            self.assertTrue(video_storage.exists(created_video.thumbnailFilename))
            self.assertEqual(created_video.files.count(), 1)
            self.assertTrue(video_storage.exists(created_video.files.first().filename))
            self.assertEqual(created_video.files.count(), 1)

            ping_mock.assert_called_once()

            runner_job = RunnerJob.objects.first()
            self.assertEqual(
                runner_job.payload["input"]["videoFileUrl"],
                "http://testserver/api/v1/runners/jobs/"
                f"{runner_job.uuid}/files/videos/"
                f"{created_video.uuid}/max-quality",
            )
