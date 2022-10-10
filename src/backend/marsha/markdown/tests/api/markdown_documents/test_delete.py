"""Tests for the Markdown application delete API."""
from django.test import TestCase, override_settings

from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
)
from marsha.markdown.factories import MarkdownDocumentFactory


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(MARKDOWN_ENABLED=True)
class MarkdownDeleteAPITest(TestCase):
    """Test for the Markdown document delete API."""

    maxDiff = None

    def test_api_document_delete_anonymous(self):
        """An anonymous should not be able to delete a Markdown document."""
        markdown_document = MarkdownDocumentFactory()
        response = self.client.delete(
            f"/api/markdown-documents/{markdown_document.pk}/",
        )
        self.assertEqual(response.status_code, 401)

    def test_api_document_delete_student(self):
        """A student should not be able to delete a Markdown document."""
        markdown_document = MarkdownDocumentFactory()

        jwt_token = StudentLtiTokenFactory(
            resource=markdown_document,
            permissions__can_update=True,
        )

        response = self.client.delete(
            f"/api/markdown-documents/{markdown_document.pk}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_delete_instructor(self):
        """An instructor should not be able to create a Markdown document."""
        markdown_document = MarkdownDocumentFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=markdown_document)

        response = self.client.delete(
            f"/api/markdown-documents/{markdown_document.pk}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 405)
