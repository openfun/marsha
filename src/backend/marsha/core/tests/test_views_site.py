"""Test the public marsha Site."""
from html import unescape
import json
import re

from django.test import Client, TestCase, override_settings

from rest_framework_simplejwt.tokens import AccessToken
from waffle.testutils import override_switch

from .. import factories


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument,too-many-lines


class SiteViewTestCase(TestCase):
    """Test the Site view."""

    @override_switch("site", active=True)
    @override_switch("sentry", active=True)
    @override_settings(SENTRY_DSN="https://sentry.dsn")
    @override_settings(RELEASE="1.2.3")
    def test_site_publicly_accessible(self):
        """Test site view publicly accessible with a connected user."""
        user = factories.UserFactory(
            first_name="Jane", last_name="Doe", email="jane.doe@example.com"
        )
        client = Client()
        client.force_login(user)
        response = client.get("/")
        self.assertEqual(response.status_code, 200)
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = AccessToken(context.get("jwt"))
        self.assertEqual(jwt_token.payload["resource_id"], str(user.id))
        jwt_token.payload["user"] = {
            "id": str(user.id),
        }

        self.assertEqual(context.get("sentry_dsn"), "https://sentry.dsn")
        self.assertEqual(context.get("environment"), "test")
        self.assertEqual(context.get("frontend"), "Site")
        self.assertEqual(context.get("release"), "1.2.3")
        self.assertEqual(context.get("flags"), {"sentry": True})
        self.assertEqual(
            context.get("static"),
            {"svg": {"icons": "/static/svg/icons.svg", "plyr": "/static/svg/plyr.svg"}},
        )

    @override_switch("site", active=False)
    def test_site_not_accessible(self):
        """Test site view not existing when site switch is disabled."""
        user = factories.UserFactory(
            first_name="Jane", last_name="Doe", email="jane.doe@example.com"
        )
        client = Client()
        client.force_login(user)
        response = client.get("/")
        self.assertEqual(response.status_code, 404)
