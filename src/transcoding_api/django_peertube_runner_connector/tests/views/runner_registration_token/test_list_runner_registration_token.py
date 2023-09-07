"""Tests for the Runner Registration Tokens list API."""
from django.test import TestCase

from django_peertube_runner_connector.factories import RunnerRegistrationTokenFactory

# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class ListRunnerRegistrationTokenAPITest(TestCase):
    """Test for the Runner Registration Tokens list API."""

    maxDiff = None

    def setUp(self):
        """Create 20 registration tokens."""
        for i in range(20):
            RunnerRegistrationTokenFactory(registrationToken=f"token{i}")

    def _api_url(self, count=None, start=None):
        """Return the Runner Registration Tokens list API URL."""
        api_url = "/api/v1/runners/registration-tokens?"

        if count:
            api_url += f"count={count}&"

        if start:
            api_url += f"start={start}"

        return api_url

    def test_fetch_list_registration_tokens(self):
        """Should be able to fetch runner registration list."""
        response = self.client.get(self._api_url())

        self.assertEqual(response.status_code, 200)

        self.assertEqual(response.json()["total"], 20)
        self.assertEqual(len(response.json()["data"]), 15)

        self.assertEqual(
            response.json()["data"],
            [
                {"id": 20, "registrationToken": "token19"},
                {"id": 19, "registrationToken": "token18"},
                {"id": 18, "registrationToken": "token17"},
                {"id": 17, "registrationToken": "token16"},
                {"id": 16, "registrationToken": "token15"},
                {"id": 15, "registrationToken": "token14"},
                {"id": 14, "registrationToken": "token13"},
                {"id": 13, "registrationToken": "token12"},
                {"id": 12, "registrationToken": "token11"},
                {"id": 11, "registrationToken": "token10"},
                {"id": 10, "registrationToken": "token9"},
                {"id": 9, "registrationToken": "token8"},
                {"id": 8, "registrationToken": "token7"},
                {"id": 7, "registrationToken": "token6"},
                {"id": 6, "registrationToken": "token5"},
            ],
        )

    def test_fetch_list_registration_tokens_with_count(self):
        """Should be able to fetch runner registration list with the right count."""
        response = self.client.get(self._api_url(count=5))

        self.assertEqual(response.status_code, 200)

        self.assertEqual(response.json()["total"], 20)
        self.assertEqual(len(response.json()["data"]), 5)

        self.assertEqual(
            response.json()["data"],
            [
                {"id": 20, "registrationToken": "token19"},
                {"id": 19, "registrationToken": "token18"},
                {"id": 18, "registrationToken": "token17"},
                {"id": 17, "registrationToken": "token16"},
                {"id": 16, "registrationToken": "token15"},
            ],
        )

    def test_fetch_list_registration_tokens_with_start(self):
        """Should be able to fetch runner registration list at the next page."""
        response = self.client.get(self._api_url(count=5, start=1))

        self.assertEqual(response.status_code, 200)

        self.assertEqual(response.json()["total"], 20)
        self.assertEqual(len(response.json()["data"]), 5)

        self.assertEqual(
            response.json()["data"],
            [
                {"id": 15, "registrationToken": "token14"},
                {"id": 14, "registrationToken": "token13"},
                {"id": 13, "registrationToken": "token12"},
                {"id": 12, "registrationToken": "token11"},
                {"id": 11, "registrationToken": "token10"},
            ],
        )
