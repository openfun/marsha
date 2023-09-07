"""Tests for the Runner list API."""
from django.test import TestCase

from transcode_api.factories import RunnerFactory

# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class ListRunnerAPITest(TestCase):
    """Test for the Runner list API."""

    maxDiff = None

    def setUp(self):
        """Create 20 runners."""
        for i in range(20):
            RunnerFactory(name=f"Runner{i}", runnerToken=f"token{i}")

    def _api_url(self, count=None, start=None):
        """Return the Runner list API URL."""
        api_url = "/api/v1/runners?"

        if count:
            api_url += f"count={count}&"

        if start:
            api_url += f"start={start}"

        return api_url

    def test_fetch_list_runners(self):
        """Should be able to fetch a runner list."""
        response = self.client.get(self._api_url())

        self.assertEqual(response.status_code, 200)

        self.assertEqual(response.json()["total"], 20)
        self.assertEqual(len(response.json()["data"]), 15)

        self.assertEqual(
            response.json()["data"],
            [
                {"id": 20, "name": "Runner19", "runnerToken": "token19"},
                {"id": 19, "name": "Runner18", "runnerToken": "token18"},
                {"id": 18, "name": "Runner17", "runnerToken": "token17"},
                {"id": 17, "name": "Runner16", "runnerToken": "token16"},
                {"id": 16, "name": "Runner15", "runnerToken": "token15"},
                {"id": 15, "name": "Runner14", "runnerToken": "token14"},
                {"id": 14, "name": "Runner13", "runnerToken": "token13"},
                {"id": 13, "name": "Runner12", "runnerToken": "token12"},
                {"id": 12, "name": "Runner11", "runnerToken": "token11"},
                {"id": 11, "name": "Runner10", "runnerToken": "token10"},
                {"id": 10, "name": "Runner9", "runnerToken": "token9"},
                {"id": 9, "name": "Runner8", "runnerToken": "token8"},
                {"id": 8, "name": "Runner7", "runnerToken": "token7"},
                {"id": 7, "name": "Runner6", "runnerToken": "token6"},
                {"id": 6, "name": "Runner5", "runnerToken": "token5"},
            ],
        )

    def test_fetch_list_runners_with_count(self):
        """Should be able to fetch a runner list with the right count."""
        response = self.client.get(self._api_url(count=5))

        self.assertEqual(response.status_code, 200)

        self.assertEqual(response.json()["total"], 20)
        self.assertEqual(len(response.json()["data"]), 5)

        self.assertEqual(
            response.json()["data"],
            [
                {"id": 20, "name": "Runner19", "runnerToken": "token19"},
                {"id": 19, "name": "Runner18", "runnerToken": "token18"},
                {"id": 18, "name": "Runner17", "runnerToken": "token17"},
                {"id": 17, "name": "Runner16", "runnerToken": "token16"},
                {"id": 16, "name": "Runner15", "runnerToken": "token15"},
            ],
        )

    def test_fetch_list_runners_with_start(self):
        """Should be able to fetch a runner list at the next page."""
        response = self.client.get(self._api_url(count=5, start=1))

        self.assertEqual(response.status_code, 200)

        self.assertEqual(response.json()["total"], 20)
        self.assertEqual(len(response.json()["data"]), 5)

        self.assertEqual(
            response.json()["data"],
            [
                {"id": 15, "name": "Runner14", "runnerToken": "token14"},
                {"id": 14, "name": "Runner13", "runnerToken": "token13"},
                {"id": 13, "name": "Runner12", "runnerToken": "token12"},
                {"id": 12, "name": "Runner11", "runnerToken": "token11"},
                {"id": 11, "name": "Runner10", "runnerToken": "token10"},
            ],
        )
