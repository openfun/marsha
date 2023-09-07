"""Tests for the Runner Job Accept API."""
from datetime import datetime
from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone

from transcode_api.factories import RunnerFactory, RunnerJobFactory
from transcode_api.models import RunnerJobState

# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class AcceptRunnerJobAPITest(TestCase):
    """Test for the Runner Job Accept API."""

    maxDiff = None

    def setUp(self):
        """Create a runner and a related runner job."""
        runner = RunnerFactory(name="New Runner", runnerToken="runnerToken")
        self.runner_job = RunnerJobFactory(
            runner=runner,
            type="vod-hls-transcoding",
            uuid="02404b18-3c50-4929-af61-913f4df65e00",
            payload={"foo": "bar"},
            privatePayload={"foo": "bar"},
        )

    def _api_url(self):
        """Return the accept API URL."""
        return "/api/v1/runners/jobs/02404b18-3c50-4929-af61-913f4df65e00/accept"

    def test_accept_with_an_invalid_job_uuid(self):
        """Should not be able to accept with an invalid job uuid."""
        response = self.client.post(
            "/api/v1/runners/jobs/02404b18-3c50-4929-af61-913f4df65e01/accept",
            data={
                "runnerToken": "runnerToken",
            },
        )

        self.assertEqual(response.status_code, 404)

    def test_accept_with_an_invalid_runner_token(self):
        """Should not be able to accept with an invalid runner token."""
        response = self.client.post(
            self._api_url(),
            data={
                "runnerToken": "invalid_token",
            },
        )

        self.assertEqual(response.status_code, 404)

    def test_accept_with_a_valid_runner_token(self):
        """Should be able to accept a job."""
        now = datetime(2018, 8, 8, tzinfo=timezone.utc)

        with patch.object(timezone, "now", return_value=now):
            response = self.client.post(
                self._api_url(),
                data={
                    "runnerToken": "runnerToken",
                },
            )

        self.assertEqual(response.status_code, 200)
        self.runner_job.refresh_from_db()

        self.assertEqual(
            response.json()["job"],
            {
                "error": None,
                "failures": 0,
                "finishedAt": None,
                "jobToken": self.runner_job.processingJobToken,
                "parent": None,
                "payload": {"foo": "bar"},
                "priority": 1,
                "progress": 0.0,
                "runner": {
                    "id": 1,
                    "name": "New Runner",
                    "runnerToken": "runnerToken",
                },
                "startedAt": "2018-08-08T00:00:00Z",
                "state": {"id": 2, "label": "Processing"},
                "type": "vod-hls-transcoding",
                "uuid": "02404b18-3c50-4929-af61-913f4df65e00",
            },
        )

    def test_accept_an_already_processing_job(self):
        """Should not be able to accept an already processing job."""
        self.runner_job.state = RunnerJobState.PROCESSING
        self.runner_job.save()

        response = self.client.post(
            self._api_url(),
            data={
                "runnerToken": "runnerToken",
            },
        )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.data, "This job is not in pending state anymore")
