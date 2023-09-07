"""Tests for the Runner Job list API."""
from django.test import TestCase

from transcode_api.factories import RunnerFactory, RunnerJobFactory

# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class ListRunnerAPITest(TestCase):
    """Test for the Runner Job list API."""

    maxDiff = None

    def setUp(self):
        """Create 20 jobs and a related runner."""
        runner = RunnerFactory(name="New Runner", runnerToken="runnerToken")
        for i in range(20):
            RunnerJobFactory(
                runner=runner,
                type="vod-hls-transcoding",
                uuid=f"02404b18-3c50-4929-af61-913f4df65e{i:02d}",
                processingJobToken=f"cc7b4136-f76d-4b6b-9e91-e8396c86e9{i:02d}",
                payload={"foo": "bar"},
                privatePayload={"foo": "bar"},
            )

    def _api_url(self, count=None, start=None):
        """Return the Runner Job list API URL."""
        api_url = "/api/v1/runners/jobs?"

        if count:
            api_url += f"count={count}&"

        if start:
            api_url += f"start={start}"

        return api_url

    def test_fetch_list_runners_with_start_and_count(self):
        """Should be able to fetch a runner list at the next page."""
        response = self.client.get(self._api_url(count=2, start=1))

        self.assertEqual(response.status_code, 200)

        self.assertEqual(response.json()["total"], 20)
        self.assertEqual(len(response.json()["data"]), 2)

        self.assertEqual(
            response.json()["data"],
            [
                {
                    "error": None,
                    "failures": 0,
                    "finishedAt": None,
                    "jobToken": "cc7b4136-f76d-4b6b-9e91-e8396c86e917",
                    "parent": None,
                    "payload": {"foo": "bar"},
                    "priority": 1,
                    "progress": 0.0,
                    "runner": {
                        "id": 1,
                        "name": "New Runner",
                        "runnerToken": "runnerToken",
                    },
                    "startedAt": None,
                    "state": {"id": 1, "label": "Pending"},
                    "type": "vod-hls-transcoding",
                    "uuid": "02404b18-3c50-4929-af61-913f4df65e17",
                },
                {
                    "error": None,
                    "failures": 0,
                    "finishedAt": None,
                    "jobToken": "cc7b4136-f76d-4b6b-9e91-e8396c86e916",
                    "parent": None,
                    "payload": {"foo": "bar"},
                    "priority": 1,
                    "progress": 0.0,
                    "runner": {
                        "id": 1,
                        "name": "New Runner",
                        "runnerToken": "runnerToken",
                    },
                    "startedAt": None,
                    "state": {"id": 1, "label": "Pending"},
                    "type": "vod-hls-transcoding",
                    "uuid": "02404b18-3c50-4929-af61-913f4df65e16",
                },
            ],
        )
