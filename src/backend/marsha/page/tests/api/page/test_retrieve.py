"""Tests for the page application retrieve API."""
from django.test import TestCase

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

    def _api_url(self, page):
        return f"/api/pages/{page.slug}/"

    def test_api_page_retrieve_anonymous(self):
        """Should be able to fetch published page."""
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

    def test_api_not_published_page_retrieve_anonymous(self):
        """Should not be able to fetch a not published page."""
        response = self.client.get(self._api_url(self.page2))
        self.assertEqual(response.status_code, 404)
