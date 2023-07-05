"""Tests for the Page application list API."""
from django.test import TestCase, override_settings

from marsha.core.factories import SiteFactory
from marsha.page.factories import PageFactory


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class PageListAPITest(TestCase):
    """Test for the Page list API."""

    maxDiff = None

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        site1 = SiteFactory(domain="testserver")
        site2 = SiteFactory(domain="othertestserver")
        PageFactory(name="Page1", slug="Slug1", site=site1)
        PageFactory(name="Page2", slug="Slug2", site=site2)
        PageFactory(name="Page3", slug="Slug3", site=site1)
        PageFactory(is_published=False, slug="Slug4", site=site1)
        PageFactory(name="Page5", slug="Slug5")
        PageFactory(name="Page6", slug="Slug6")
        PageFactory(name="Page7", slug="Slug7")

    def _api_url(self):
        return "/api/pages/"

    def test_api_page_fetch_list_anonymous_for_testserver_host(self):
        """Should be able to fetch a list of published pages for default testserver."""
        response = self.client.get(self._api_url())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(
            response.json()["results"],
            [
                {
                    "name": "Page1",
                    "slug": "Slug1",
                },
                {
                    "name": "Page3",
                    "slug": "Slug3",
                },
            ],
        )

    @override_settings(ALLOWED_HOSTS=["othertestserver"])
    def test_api_page_fetch_list_anonymous_for_othertestserver_host(self):
        """Should be able to fetch a list of published pages for othertestserver."""
        response = self.client.get(self._api_url(), HTTP_HOST="othertestserver")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(
            response.json()["results"],
            [
                {
                    "name": "Page2",
                    "slug": "Slug2",
                },
            ],
        )

    @override_settings(
        FRONTEND_HOME_URL="http://localhost:3000/",
        ALLOWED_HOSTS=["localhost"],
    )
    def test_api_page_fetch_list_anonymous_for_default_frontend_host(self):
        """Should be able to fetch a list of published pages for default frontend."""
        response = self.client.get(self._api_url(), HTTP_HOST="localhost:3000")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 3)
        self.assertEqual(
            response.json()["results"],
            [
                {
                    "name": "Page5",
                    "slug": "Slug5",
                },
                {
                    "name": "Page6",
                    "slug": "Slug6",
                },
                {
                    "name": "Page7",
                    "slug": "Slug7",
                },
            ],
        )
