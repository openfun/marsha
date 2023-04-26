"""Tests for the Page application list API."""
from django.test import TestCase

from marsha.page.factories import PageFactory


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class PageListAPITest(TestCase):
    """Test for the Page list API."""

    maxDiff = None

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.page1 = PageFactory(name="Page1", slug="Slug1")
        cls.page2 = PageFactory(name="Page2", slug="Slug2")
        cls.page3 = PageFactory(name="Page3", slug="Slug3")
        cls.page4 = PageFactory(is_published=False, slug="Slug4")

    def _api_url(self):
        return "/api/pages/"

    def test_api_page_fetch_list_anonymous(self):
        """Should be able to fetch a list of published."""
        response = self.client.get(self._api_url())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 3)
        self.assertEqual(
            response.json()["results"],
            [
                {
                    "name": "Page1",
                    "slug": "Slug1",
                },
                {
                    "name": "Page2",
                    "slug": "Slug2",
                },
                {
                    "name": "Page3",
                    "slug": "Slug3",
                },
            ],
        )
