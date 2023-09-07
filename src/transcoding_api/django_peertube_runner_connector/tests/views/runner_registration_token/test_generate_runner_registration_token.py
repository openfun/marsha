"""Tests for the Runner Registration Tokens generate API."""
from django.test import TestCase

from django_peertube_runner_connector.models import RunnerRegistrationToken

# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class RegisterRunnerRegistrationTokenAPITest(TestCase):
    """Test for the Runner Registration Tokens generate API."""

    maxDiff = None


    def _api_url(self):
        """Return the Runner Registration Tokens generate API URL."""
        return "/api/v1/runners/registration-tokens/generate"

    def test_generate_success(self):
        """Should be able to generate a runner registration token."""
        response = self.client.post(
            self._api_url(),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(RunnerRegistrationToken.objects.count(), 1)
