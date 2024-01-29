"""Test some marsha URLs integration."""

from django.core.cache import cache
from django.test import TestCase, override_settings

from waffle.testutils import override_switch

from marsha.core.tests.testing_utils import reload_urlconf


@override_settings(DEBUG=False)
class MarshBaseURLTestCase(TestCase):
    """
    Test case for some of marsha's URLs which requires precaution.

    For example, the static URLs.
    """

    def setUp(self):
        """Pre-flight resets"""
        super().setUp()

        # Reset the cache to always reach the site route.
        cache.clear()

        # Force URLs reload to take DEBUG into account
        reload_urlconf()

    @override_switch("site", active=True)
    def test_missing_statics_returns_404(self):
        """Test that missing static files return a 404."""
        response = self.client.get("/static/oups_im_not_here.png")

        self.assertEqual(response.status_code, 404)
