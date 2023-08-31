"""Tests for the Runner register API."""
from django.test import TestCase

from transcode_api.factories import RunnerRegistrationTokenFactory
from transcode_api.models import Runner

# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class RegisterRunnerAPITest(TestCase):
    """Test for the Runner register API."""

    maxDiff = None

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        RunnerRegistrationTokenFactory(registrationToken="registrationToken")

    def _api_url(self):
        return "/api/v1/runners/register"

    def test_register_fail_no_name_and_no_token(self):
        """Should fail because of missing name and registration token."""
        response = self.client.post(self._api_url())

        self.assertEqual(response.status_code, 400)

    def test_register_fail_token_not_found(self):
        """Should fail because of incorrect registration token."""
        response = self.client.post(
            self._api_url(),
            data={
                "name": "New Runner",
                "registrationToken": "unknown_registrationToken",
            },
        )

        self.assertEqual(response.status_code, 404)
        self.assertIn(response.json()["message"], "Registration token is invalid")

    def test_register_success(self):
        """Should be able to register a runner."""
        response = self.client.post(
            self._api_url(),
            data={
                "name": "New Runner",
                "registrationToken": "registrationToken",
            },
        )

        self.assertEqual(response.status_code, 200)
        created_runner = Runner.objects.get(name="New Runner")
        self.assertEqual(
            response.json(),
            {
                "id": 1,
                "name": "New Runner",
                "runnerToken": created_runner.runnerToken,
            },
        )
