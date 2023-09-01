"""Tests for the Video transcode API."""
import tempfile
from unittest.mock import patch

import ffmpeg
from django.core.files.storage import get_storage_class
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from transcode_api.factories import (
    RunnerFactory,
)
from transcode_api.models import RunnerJob, RunnerJobState, RunnerJobType, Video
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

    def test_transcode_video(self):
        """Should be able to upload a video a create corresponding job."""
        uploaded_video = SimpleUploadedFile(
            "file.mp4", b"file_content", content_type="video/mp4"
        )

        with tempfile.TemporaryDirectory(prefix="video_temp_dir") as temp_dir:
            fake_storage = get_storage_class(
                "django.core.files.storage.FileSystemStorage"
            )(temp_dir)

            filename = fake_storage.save("video_test.mp4", uploaded_video)

            with patch.object(
                ffmpeg, "probe", return_value=probe_response
            ), patch.object(ffmpeg, "run"), patch(
                "transcode_api.views.video.video_storage", fake_storage
            ), patch(
                "transcode_api.utils.thumbnail.video_storage", fake_storage
            ), patch(
                "transcode_api.utils.job_handlers.abstract_job_handler.send_available_jobs_ping_to_runners",
            ) as ping_mock:
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

                list_dir, _ = fake_storage.listdir("")
                # only thumbnail (video already uploaded)
                self.assertEqual(len(list_dir), 1)

                _, video_files = fake_storage.listdir(list_dir[0])
                self.assertEqual(len(video_files), 1)
                self.assertEqual(Video.objects.count(), 1)

                created_video = Video.objects.first()
                self.assertTrue(fake_storage.exists(created_video.thumbnailFilename))
                self.assertEqual(created_video.files.count(), 1)
                self.assertTrue(
                    fake_storage.exists(created_video.files.first().filename)
                )

                ping_mock.assert_called_once()
