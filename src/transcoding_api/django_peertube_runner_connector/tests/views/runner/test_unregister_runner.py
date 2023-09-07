"""Tests for the Runner unregister API."""
from django.test import TestCase

from django_peertube_runner_connector.factories import RunnerFactory, RunnerRegistrationTokenFactory

# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class UnregisterRunnerAPITest(TestCase):
    """Test for the Unregister Runner API."""

    maxDiff = None

    def setUp(self):
        """Create a runner and a registration token."""
        runner_registration_token = RunnerRegistrationTokenFactory(
            registrationToken="registrationToken"
        )
        RunnerFactory(
            name="New Runner",
            runnerToken="runnerToken",
            runnerRegistrationToken=runner_registration_token,
        )

    def _api_url(self):
        """Return the unregister API URL."""
        return "/api/v1/runners/unregister"

    def test_unregister_fail_no_token(self):
        """Should fail because of missing registration token."""
        response = self.client.post(self._api_url())

        self.assertEqual(response.status_code, 404)
        self.assertIn(response.json()["message"], "Registration token is invalid")

    def test_unregister_fail_token_not_found(self):
        """Should fail because of incorrect registration token."""
        response = self.client.post(
            self._api_url(),
            data={
                "runnerToken": "unknown_registrationToken",
            },
        )

        self.assertEqual(response.status_code, 404)
        self.assertIn(response.json()["message"], "Registration token is invalid")

    def test_register_success(self):
        """Should be able to delete a runner."""
        response = self.client.post(
            self._api_url(),
            data={
                "runnerToken": "runnerToken",
            },
        )

        self.assertEqual(response.status_code, 204)
