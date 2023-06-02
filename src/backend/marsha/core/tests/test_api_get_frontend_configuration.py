"""Tests for the get_frontend_configuration API."""
from django.test import TestCase, override_settings

from waffle.testutils import override_switch

from marsha.core.defaults import SENTRY
from marsha.core.factories import SiteConfigFactory


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
                "inactive_resources": [],
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
                "inactive_resources": [],
            },
        )

    @override_switch(SENTRY, active=True)
    @override_settings(ALLOWED_HOSTS=["not.existing"])
    def test_api_get_frontend_configuration_domain_param_site_not_existing(self):
        """
        Check the response when the domain param is set and the site does not exist.
        """
        response = self.client.get("/api/config/", HTTP_HOST="not.existing")

        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            response.json(),
            {
                "environment": "development",
                "release": "1.2.3",
                "sentry_dsn": "https://sentry.dsn",
                "inactive_resources": [],
            },
        )

    @override_switch(SENTRY, active=True)
    @override_settings(ALLOWED_HOSTS=["marsha.education"])
    def test_api_get_frontend_configuration_domain_param_site_existing(self):
        """
        Check the response when the domain param is set and the site does not exist.
        """
        SiteConfigFactory(inactive_resources=["video"], site__domain="marsha.education")
        response = self.client.get("/api/config/", HTTP_HOST="marsha.education")

        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            response.json(),
            {
                "environment": "development",
                "release": "1.2.3",
                "sentry_dsn": "https://sentry.dsn",
                "inactive_resources": ["video"],
            },
        )
