"""Tests for the Markdown image retrieve API."""
from datetime import datetime
import json

from django.test import TestCase, override_settings

from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
)
from marsha.markdown.api import timezone
from marsha.markdown.factories import MarkdownDocumentFactory, MarkdownImageFactory


class MarkdownImageRetrieveApiTest(TestCase):
    """Test the retrieve API of the Markdown image object."""

    maxDiff = None

    def test_api_markdown_image_read_detail_anonymous(self):
        """Anonymous users should not be allowed to retrieve a Markdown image."""
        markdown_image = MarkdownImageFactory()
        response = self.client.get(f"/api/markdown-images/{markdown_image.id}/")
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_markdown_image_read_detail_student(self):
        """Students users should not be allowed to read a Markdown image detail."""
        markdown_image = MarkdownImageFactory()

        jwt_token = StudentLtiTokenFactory(resource=markdown_image.markdown_document)

        response = self.client.get(
            f"/api/markdown-images/{markdown_image.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_markdown_image_instructor_read_detail_in_read_only(self):
        """Instructor should not be able to read Markdown images in a read_only mode."""
        markdown_image = MarkdownImageFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=markdown_image.markdown_document,
            permissions__can_update=False,
        )

        response = self.client.get(
            f"/api/markdown-images/{markdown_image.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_markdown_image_read_detail_token_user(self):
        """
        Instructors should be able to read details of Markdown image
        associated to their Markdown documents.
        """
        markdown_document = MarkdownDocumentFactory()
        markdown_image = MarkdownImageFactory(
            markdown_document=markdown_document,
            upload_state="pending",
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=markdown_document)

        response = self.client.get(
            f"/api/markdown-images/{markdown_image.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "id": str(markdown_image.id),
                "filename": None,
                "active_stamp": None,
                "is_ready_to_show": False,
                "upload_state": "pending",
                "url": None,
                "markdown_document": str(markdown_document.id),
            },
        )

    def test_api_markdown_image_administrator_read_detail_in_read_only(self):
        """Admin should not be able to read Markdown images in a read_only mode."""
        markdown_image = MarkdownImageFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=markdown_image.markdown_document,
            permissions__can_update=False,
        )

        response = self.client.get(
            f"/api/markdown-images/{markdown_image.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_markdown_image_read_detail_admin_user(self):
        """
        Admin should be able to read details of Markdown image associated
        to their Markdown document.
        """
        markdown_document = MarkdownDocumentFactory()
        markdown_image = MarkdownImageFactory(
            markdown_document=markdown_document,
            upload_state="pending",
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=markdown_document,
            roles=["administrator"],
        )

        response = self.client.get(
            f"/api/markdown-images/{markdown_image.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "id": str(markdown_image.id),
                "filename": None,
                "active_stamp": None,
                "is_ready_to_show": False,
                "upload_state": "pending",
                "url": None,
                "markdown_document": str(markdown_document.id),
            },
        )

    def test_api_markdown_image_read_ready_markdown_image(self):
        """A ready Markdown image should have computed urls."""
        markdown_document = MarkdownDocumentFactory(
            pk="78338c1c-356e-4156-bd95-5bed71ffb655",
        )
        markdown_image = MarkdownImageFactory(
            pk="9ddf9c1f-ec88-4a3a-bfa0-423c4fe89b15",
            markdown_document=markdown_document,
            uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc),
            upload_state="ready",
            extension="gif",
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=markdown_document)

        response = self.client.get(
            f"/api/markdown-images/{markdown_image.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "id": str(markdown_image.id),
                "filename": "9ddf9c1f-ec88-4a3a-bfa0-423c4fe89b15.gif",
                "active_stamp": "1533686400",
                "is_ready_to_show": True,
                "upload_state": "ready",
                "url": (
                    "https://abc.cloudfront.net/"
                    "78338c1c-356e-4156-bd95-5bed71ffb655/markdown-image/"
                    "9ddf9c1f-ec88-4a3a-bfa0-423c4fe89b15/1533686400.gif"
                ),
                "markdown_document": str(markdown_document.id),
            },
        )
