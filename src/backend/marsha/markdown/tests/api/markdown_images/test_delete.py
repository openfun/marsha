"""Tests for the Markdown image delete API."""
from django.test import TestCase

from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
)
from marsha.markdown.factories import MarkdownDocumentFactory, MarkdownImageFactory
from marsha.markdown.models import MarkdownImage


class MarkdownImageDeleteApiTest(TestCase):
    """Test the delete API of the Markdown image object."""

    maxDiff = None

    def test_api_markdown_image_delete_anonymous(self):
        """Anonymous users should not be able to delete a Markdown image."""
        markdown_image = MarkdownImageFactory()

        response = self.client.delete(f"/api/markdown-images/{markdown_image.id}/")
        self.assertEqual(response.status_code, 401)

    def test_api_markdown_image_delete_student(self):
        """Student users should not be able to delete a Markdown image."""
        markdown_image = MarkdownImageFactory()

        jwt_token = StudentLtiTokenFactory(resource=markdown_image.markdown_document)

        response = self.client.delete(
            f"/api/markdown-images/{markdown_image.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_markdown_image_delete_instructor(self):
        """Instructor should be able to delete a Markdown image for its Markdown document."""
        markdown_image = MarkdownImageFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=markdown_image.markdown_document,
        )

        self.assertEqual(MarkdownImage.objects.count(), 1)

        response = self.client.delete(
            f"/api/markdown-images/{markdown_image.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 204)
        self.assertFalse(MarkdownImage.objects.filter(id=markdown_image.id).exists())
        self.assertEqual(MarkdownImage.objects.count(), 0)

        response = self.client.get(
            f"/api/markdown-documents/{markdown_image.markdown_document_id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        content = response.json()
        self.assertEqual(content["images"], [])

        # Creating a new Markdown image should be allowed.
        response = self.client.post(
            "/api/markdown-images/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )

        self.assertEqual(response.status_code, 201)

    def test_api_markdown_image_delete_instructor_in_read_only(self):
        """Instructor should not be able to delete Markdown images in a read_only mode."""
        markdown_image = MarkdownImageFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=markdown_image.markdown_document,
            permissions__can_update=False,
        )

        response = self.client.delete(
            f"/api/markdown-images/{markdown_image.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_markdown_image_delete_instructor_other_markdown_document(self):
        """
        Instructor users should not be able to delete a Markdown image
        on another Markdown document.
        """
        markdown_document_token = MarkdownDocumentFactory()
        markdown_document_other = MarkdownDocumentFactory()
        markdown_image = MarkdownImageFactory(markdown_document=markdown_document_other)

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=markdown_document_token)

        response = self.client.delete(
            f"/api/markdown-images/{markdown_image.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
