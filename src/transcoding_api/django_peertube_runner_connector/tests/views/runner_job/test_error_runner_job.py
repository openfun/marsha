"""Tests for the Runner Job Error API."""
import logging
from datetime import datetime
from unittest.mock import patch

from django.test import TestCase, override_settings
from django.utils import timezone

from django_peertube_runner_connector.factories import RunnerFactory, RunnerJobFactory, VideoFactory
from django_peertube_runner_connector.models import RunnerJob, RunnerJobState, RunnerJobType, VideoState

# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class ErrorRunnerJobAPITest(TestCase):
    """Test for the Runner Job Error API."""

    maxDiff = None

    def setUp(self):
        """Create a runner and a video"""
        self.runner = RunnerFactory(name="New Runner", runnerToken="runnerToken")
        self.video = VideoFactory(
            name="Test video", uuid="02404b18-3c50-4929-af61-913f4df65e99"
        )
        logging.disable(logging.CRITICAL)

    def tearDown(self):
        logging.disable(logging.NOTSET)

    def create_processing_job(
        self,
        type: RunnerJobType,
        parent: RunnerJob = None,
        uuid: str = "02404b18-3c50-4929-af61-913f4df65e00",
    ):
        return RunnerJobFactory(
            runner=self.runner,
            type=type,
            uuid=uuid,
            payload={"foo": "bar"},
            privatePayload={"videoUUID": "02404b18-3c50-4929-af61-913f4df65e99"},
            state=RunnerJobState.PROCESSING,
            dependsOnRunnerJob=parent,
        )

    def _api_url(self):
        return "/api/v1/runners/jobs/02404b18-3c50-4929-af61-913f4df65e00/error"

    def test_error_with_an_invalid_job_uuid(self):
        """Should not be able to error with an invalid job uuid."""
        self.create_processing_job(RunnerJobType.VOD_HLS_TRANSCODING)
        response = self.client.post(
            "/api/v1/runners/jobs/02404b18-3c50-4929-af61-913f4df65e01/error",
            data={
                "runnerToken": "runnerToken",
            },
        )

        self.assertEqual(response.status_code, 404)

    def test_error_with_an_invalid_runner_token(self):
        """Should not be able to error with an invalid runner token."""
        self.create_processing_job(RunnerJobType.VOD_HLS_TRANSCODING)
        response = self.client.post(
            self._api_url(),
            data={
                "runnerToken": "invalid_token",
            },
        )

        self.assertEqual(response.status_code, 404)

    def test_error_hls_job_no_limit_reached(self):
        """
        Should be able to error the processing HLS job.
        Until failure limit is reached it just reset the job.
        """
        runner_job = self.create_processing_job(RunnerJobType.VOD_HLS_TRANSCODING)

        now = datetime(2018, 8, 8, tzinfo=timezone.utc)

        with patch.object(timezone, "now", return_value=now):
            response = self.client.post(
                self._api_url(),
                data={
                    "runnerToken": "runnerToken",
                },
            )

        self.assertEqual(response.status_code, 204)
        runner_job.refresh_from_db()

        self.assertEqual(runner_job.state, 1)  # back to pending
        self.assertEqual(runner_job.failures, 1)  # has been increased by 1
        self.assertEqual(runner_job.finishedAt, None)
        self.assertEqual(runner_job.startedAt, None)
        self.assertEqual(runner_job.processingJobToken, None)
        self.assertEqual(runner_job.progress, None)

    @override_settings(TRANSCODING_RUNNER_MAX_FAILURE=0)
    def test_error_hls_job_limit_reached(self):
        """
        Should be able to error the processing HLS job.
        Until failure limit is reached it just reset the job.
        """
        runner_job = self.create_processing_job(RunnerJobType.VOD_HLS_TRANSCODING)
        child_job = self.create_processing_job(
            RunnerJobType.VOD_HLS_TRANSCODING,
            parent=runner_job,
            uuid="02404b18-3c50-4929-af61-913f4df65e01",
        )

        now = datetime(2018, 8, 8, tzinfo=timezone.utc)

        with patch.object(timezone, "now", return_value=now):
            response = self.client.post(
                self._api_url(),
                data={"runnerToken": "runnerToken", "message": "Error message"},
            )

        self.assertEqual(response.status_code, 204)

        runner_job.refresh_from_db()
        self.video.refresh_from_db()
        child_job.refresh_from_db()

        self.assertEqual(runner_job.state, 4)  # Errored
        self.assertEqual(runner_job.failures, 1)  # has been increased by 1
        self.assertEqual(runner_job.finishedAt, now)
        self.assertEqual(runner_job.processingJobToken, None)
        self.assertEqual(runner_job.error, "Error message")

        self.assertEqual(self.video.state, VideoState.TRANSCODING_FAILED)

        self.assertEqual(child_job.state, 7)  # Parent errored
        self.assertEqual(child_job.failures, 0)
        self.assertEqual(child_job.finishedAt, now)
        self.assertEqual(child_job.processingJobToken, None)
        self.assertEqual(child_job.error, "Parent error")
