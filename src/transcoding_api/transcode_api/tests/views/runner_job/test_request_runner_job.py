"""Tests for the Runner Job request API."""
from django.test import TestCase

from transcode_api.factories import RunnerFactory, RunnerJobFactory
from transcode_api.models import RunnerJobState

# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class RequestRunnerJobAPITest(TestCase):
    """Test for the Runner Job request API."""

    maxDiff = None
    
    def setUp(self):
        """Create 40 runners job (half in processing) and 1 related runner."""
        runner = RunnerFactory(name="New Runner", runnerToken="runnerToken")
        for i in range(20):
            # These jobs should not appear in the requested list
            RunnerJobFactory(
                runner=runner,
                type="vod-hls-transcoding",
                state=RunnerJobState.PROCESSING,
            )
            # These jobs should appear in the requested list
            RunnerJobFactory(
                runner=runner,
                state=RunnerJobState.PENDING,
                type="vod-hls-transcoding",
                uuid=f"02404b18-3c50-4929-af61-913f4df65e{i:02d}",
                processingJobToken=f"cc7b4136-f76d-4b6b-9e91-e8396c86e9{i:02d}",
                payload={"foo": "bar"},
                privatePayload={"foo": "bar"},
            )

    def _api_url(self):
        """Return the request API URL."""
        return "/api/v1/runners/jobs/request"

    def test_request_with_an_invalid_runner_token(self):
        """Should not be able to request the list."""
        response = self.client.post(
            self._api_url(),
            data={
                "runnerToken": "invalid_token",
            },
        )

        self.assertEqual(response.status_code, 404)

    def test_request_with_a_valid_runner_token(self):
        """Should be able to request the 10 first available jobs."""
        response = self.client.post(
            self._api_url(),
            data={
                "runnerToken": "runnerToken",
            },
        )
        self.assertEqual(response.status_code, 200)

        self.assertEqual(len(response.json()["availableJobs"]), 10)

        self.assertEqual(
            response.json()["availableJobs"],
            [
                {
                    "payload": {"foo": "bar"},
                    "type": "vod-hls-transcoding",
                    "uuid": "02404b18-3c50-4929-af61-913f4df65e00",
                },
                {
                    "payload": {"foo": "bar"},
                    "type": "vod-hls-transcoding",
                    "uuid": "02404b18-3c50-4929-af61-913f4df65e01",
                },
                {
                    "payload": {"foo": "bar"},
                    "type": "vod-hls-transcoding",
                    "uuid": "02404b18-3c50-4929-af61-913f4df65e02",
                },
                {
                    "payload": {"foo": "bar"},
                    "type": "vod-hls-transcoding",
                    "uuid": "02404b18-3c50-4929-af61-913f4df65e03",
                },
                {
                    "payload": {"foo": "bar"},
                    "type": "vod-hls-transcoding",
                    "uuid": "02404b18-3c50-4929-af61-913f4df65e04",
                },
                {
                    "payload": {"foo": "bar"},
                    "type": "vod-hls-transcoding",
                    "uuid": "02404b18-3c50-4929-af61-913f4df65e05",
                },
                {
                    "payload": {"foo": "bar"},
                    "type": "vod-hls-transcoding",
                    "uuid": "02404b18-3c50-4929-af61-913f4df65e06",
                },
                {
                    "payload": {"foo": "bar"},
                    "type": "vod-hls-transcoding",
                    "uuid": "02404b18-3c50-4929-af61-913f4df65e07",
                },
                {
                    "payload": {"foo": "bar"},
                    "type": "vod-hls-transcoding",
                    "uuid": "02404b18-3c50-4929-af61-913f4df65e08",
                },
                {
                    "payload": {"foo": "bar"},
                    "type": "vod-hls-transcoding",
                    "uuid": "02404b18-3c50-4929-af61-913f4df65e09",
                },
            ],
        )
