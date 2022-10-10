"""Tests for the Markdown application update-translations API."""
from django.test import TestCase, override_settings

from marsha.core.simple_jwt.factories import InstructorOrAdminLtiTokenFactory
from marsha.markdown.factories import MarkdownDocumentFactory


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(MARKDOWN_ENABLED=True)
class MarkdownUpdateTranslationsAPITest(TestCase):
    """Test for the Markdown document update-translations API."""

    maxDiff = None

    def test_api_document_translation_update_instructor(self):
        """An instructor should be able to update a Markdown document translated content."""
        markdown_document = MarkdownDocumentFactory(is_draft=True)

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=markdown_document)

        data = {
            "language_code": "en",
            "title": "A very specific title",
            "content": "Some interesting content for sure",
            "rendered_content": "<p>Some interesting content for sure</p>",
        }

        response = self.client.patch(
            f"/api/markdown-documents/{markdown_document.pk}/save-translations/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

        markdown_document.refresh_from_db()
        markdown_document.set_current_language("en")

        self.assertEqual(markdown_document.title, "A very specific title")
        self.assertEqual(markdown_document.content, "Some interesting content for sure")
        self.assertEqual(
            markdown_document.rendered_content,
            "<p>Some interesting content for sure</p>",
        )
