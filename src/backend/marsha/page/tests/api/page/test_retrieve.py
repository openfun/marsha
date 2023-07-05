"""Tests for the page application retrieve API."""
from django.test import TestCase, override_settings

from marsha.core.factories import SiteFactory
from marsha.page.factories import PageFactory


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class PageRetrieveAPITest(TestCase):
    """Test for the Page retrieve API."""

    maxDiff = None

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.page1 = PageFactory(name="Page1", slug="Slug1", content="Content1")
        cls.page2 = PageFactory(is_published=False)
        site2 = SiteFactory(domain="othertestserver")
        cls.page3 = PageFactory(
            name="Page3", slug="Slug3", content="Content3", site=site2
        )

    def _api_url(self, page):
        return f"/api/pages/{page.slug}/"

    @override_settings(FRONTEND_HOME_URL="testserver")
    def test_api_page_retrieve_anonymous_for_default_frontend_host(self):
        """Should be able to fetch published page for default frontend."""
        response = self.client.get(self._api_url(self.page1))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "name": "Page1",
                "slug": "Slug1",
                "content": "Content1",
            },
        )

    @override_settings(ALLOWED_HOSTS=["othertestserver"])
    def test_api_page_retrieve_anonymous_for_othertestserver_host(self):
        """Should be able to fetch published page for othertestserver."""
        response = self.client.get(
            self._api_url(self.page3), HTTP_HOST="othertestserver"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "name": "Page3",
                "slug": "Slug3",
                "content": "Content3",
            },
        )

    @override_settings(ALLOWED_HOSTS=["othertestserver"])
    def test_api_page_retrieve_default_page_for_othertestserver_host(self):
        """Should not be able to fetch default published page for othertestserver."""
        response = self.client.get(
            self._api_url(self.page1), HTTP_HOST="othertestserver"
        )
        self.assertEqual(response.status_code, 404)

    def test_api_not_published_page_retrieve_anonymous(self):
        """Should not be able to fetch a not published page."""
        response = self.client.get(self._api_url(self.page2))
        self.assertEqual(response.status_code, 404)
