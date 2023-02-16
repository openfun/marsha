"""Test the public marsha Site."""
import os

from django.core.cache import cache
from django.test import TestCase, override_settings

from waffle.testutils import override_switch


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument,too-many-lines

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class SiteViewTestCase(TestCase):
    """Test the Site view."""

    def setUp(self):
        """
        Reset the cache to always reach the site route.
        """
        cache.clear()

    @override_switch("site", active=True)
    @override_settings(BASE_STATIC_DIR=os.path.join(BASE_DIR, "stubs"))
    def test_site_publicly_accessible(self):
        """Test site view publicly accessible"""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '<html lang="en">')
        self.assertContains(
            response, '<meta name="public-path" value="/static/js/build/site/" />'
        )
        self.assertContains(
            response, '<link rel="icon" href="/static/js/build/site/favicon.ico" />'
        )
        self.assertContains(
            response,
            (
                '<script defer="defer" src="/static/js/build/site/static/js/main.4b7d1848.js">'
                "</script>"
            ),
        )
        self.assertContains(
            response,
            '<link href="/static/js/build/site/static/css/main.18b5b4a5.css" rel="stylesheet">',
        )

    @override_switch("site", active=True)
    def test_site_site_template_missing(self):
        """Test site with missing index file should return a 501."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 501)

    @override_switch("site", active=False)
    def test_site_not_accessible(self):
        """Test site view not existing when site switch is disabled."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 404)
