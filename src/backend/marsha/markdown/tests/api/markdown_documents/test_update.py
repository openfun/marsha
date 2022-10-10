"""Tests for the Markdown application update API."""
from django.test import TestCase, override_settings

from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
)
from marsha.markdown.factories import MarkdownDocumentFactory


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(MARKDOWN_ENABLED=True)
class MarkdownUpdateAPITest(TestCase):
    """Test for the Markdown document update API."""

    maxDiff = None

    def test_api_document_update_anonymous(self):
        """An anonymous should not be able to update a Markdown document."""
        markdown_document = MarkdownDocumentFactory()
        response = self.client.put(f"/api/markdown-documents/{markdown_document.pk}/")
        self.assertEqual(response.status_code, 401)

        response = self.client.patch(
            f"/api/markdown-documents/{markdown_document.pk}/save-translations/",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)

        response = self.client.post(
            f"/api/markdown-documents/{markdown_document.pk}/latex-rendering/",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)

    def test_api_document_update_student(self):
        """A student user should not be able to update a Markdown document."""
        markdown_document = MarkdownDocumentFactory()

        jwt_token = StudentLtiTokenFactory(
            resource=markdown_document,
            permissions__can_update=True,
        )
        data = {"title": "new title"}

        response = self.client.put(
            f"/api/markdown-documents/{markdown_document.pk}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

        response = self.client.patch(
            f"/api/markdown-documents/{markdown_document.pk}/save-translations/",
            data,  # Not important here, wrong data raises 400
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

        response = self.client.post(
            f"/api/markdown-documents/{markdown_document.pk}/latex-rendering/",
            data,  # Not important here, wrong data raises 400
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_update_instructor_read_only(self):
        """An instructor should not be able to update a Markdown document in read_only."""
        markdown_document = MarkdownDocumentFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=markdown_document,
            permissions__can_update=False,
        )
        data = {"title": "new title"}

        response = self.client.put(
            f"/api/markdown-documents/{markdown_document.pk}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

        response = self.client.patch(
            f"/api/markdown-documents/{markdown_document.pk}/save-translations/",
            data,  # Not important here, wrong data raises 400
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

        response = self.client.post(
            f"/api/markdown-documents/{markdown_document.pk}/latex-rendering/",
            data,  # Not important here, wrong data raises 400
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_update_instructor(self):
        """An instructor should be able to update a Markdown document."""
        markdown_document = MarkdownDocumentFactory(is_draft=True)

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=markdown_document)

        data = {"is_draft": False}

        response = self.client.put(
            f"/api/markdown-documents/{markdown_document.pk}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

        markdown_document.refresh_from_db()
        self.assertEqual(markdown_document.is_draft, False)
