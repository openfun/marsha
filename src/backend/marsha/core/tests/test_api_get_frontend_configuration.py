"""Tests for the get_frontend_configuration API."""
from django.test import TestCase, override_settings

from waffle.testutils import override_switch

from marsha.core.defaults import SENTRY


@override_settings(
    SENTRY_DSN="https://sentry.dsn",
    ENVIRONMENT="development",
    RELEASE="1.2.3",
)
class TestGetFrontendConfiguration(TestCase):
    """Test the get_frontend_configuration API."""

    maxDiff = None

    @override_switch(SENTRY, active=True)
    def test_api_get_frontend_configuration_sentry_active(self):
        """
        Anonymous users should be able to access the API.

        With sentry active, the response should contain the sentry configuration.
        """
        response = self.client.get("/api/config/")

        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            response.json(),
            {
                "environment": "development",
                "release": "1.2.3",
                "sentry_dsn": "https://sentry.dsn",
            },
        )

    @override_switch(SENTRY, active=False)
    def test_api_get_frontend_configuration_sentry_inactive(self):
        """
        Anonymous users should be able to access the API.

        With sentry inactive, the response should not contain the sentry configuration.
        """
        response = self.client.get("/api/config/")

        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            response.json(),
            {
                "environment": "development",
                "release": "1.2.3",
                "sentry_dsn": None,
            },
        )
