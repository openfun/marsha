"""Tests for the Markdown image API."""
from datetime import datetime
import json
from unittest import mock

from django.test import TestCase, override_settings

from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
)
from marsha.markdown.factories import MarkdownDocumentFactory, MarkdownImageFactory
from marsha.markdown.models import MarkdownImage

from ..api import timezone


class MarkdownImageApiTest(TestCase):
    """Test the API of the Markdown image object."""

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

    def test_api_markdown_image_create_anonymous(self):
        """Anonymous users should not be able to create a Markdown image."""
        response = self.client.post("/api/markdown-images/")
        self.assertEqual(response.status_code, 401)

    def test_api_markdown_image_create_student(self):
        """Student users should not be able to create a Markdown image."""
        markdown_document = MarkdownDocumentFactory()

        jwt_token = StudentLtiTokenFactory(resource=markdown_document)

        response = self.client.post(
            "/api/markdown-images/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )

        self.assertEqual(response.status_code, 403)

    def test_api_markdown_image_create_instructor(self):
        """Student users should not be able to create a Markdown image."""
        markdown_document = MarkdownDocumentFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=markdown_document)

        response = self.client.post(
            "/api/markdown-images/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )

        self.assertEqual(response.status_code, 201)
        content = json.loads(response.content)
        created_markdown_image = MarkdownImage.objects.last()

        self.assertEqual(
            content,
            {
                "id": str(created_markdown_image.id),
                "filename": None,
                "active_stamp": None,
                "is_ready_to_show": False,
                "upload_state": "pending",
                "url": None,
                "markdown_document": str(markdown_document.id),
            },
        )

    def test_api_markdown_image_create_already_existing_instructor(self):
        """
        Creating a Markdown image should not fail when a Markdown image already exists
        for the Markdown document.
        """
        markdown_document = MarkdownDocumentFactory()
        MarkdownImageFactory(markdown_document=markdown_document)

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=markdown_document)

        response = self.client.post(
            "/api/markdown-images/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )

        self.assertEqual(response.status_code, 201)
        content = json.loads(response.content)

        self.assertIsNotNone(content.pop("id"))  # we don't test the generated ID here

        self.assertEqual(
            content,
            {
                "active_stamp": None,
                "filename": None,
                "is_ready_to_show": False,
                "markdown_document": str(markdown_document.id),
                "upload_state": "pending",
                "url": None,
            },
        )

    def test_api_markdown_image_instructor_create_in_read_only(self):
        """Instructor should not be able to create Markdown images in a read_only mode."""
        markdown_image = MarkdownImageFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=markdown_image.markdown_document,
            permissions__can_update=False,
        )

        response = self.client.post(
            "/api/markdown-images/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )

        self.assertEqual(response.status_code, 403)

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

    def test_api_markdown_image_initiate_upload_anonymous(self):
        """Anonymous users are not allowed to initiate an upload."""
        markdown_image = MarkdownImageFactory()

        response = self.client.post(
            f"/api/markdown-images/{markdown_image.id}/initiate-upload/"
        )
        self.assertEqual(response.status_code, 401)

    def test_api_markdown_image_initiate_upload_student(self):
        """Student users should not be allowed to initiate an upload."""
        markdown_image = MarkdownImageFactory()
        jwt_token = StudentLtiTokenFactory(resource=markdown_image.markdown_document)

        response = self.client.post(
            f"/api/markdown-images/{markdown_image.id}/initiate-upload/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_markdown_image_initiate_upload_instructor(self):
        """Instructor users should not be allowed to initiate an upload."""
        markdown_document = MarkdownDocumentFactory(
            id="c10b79b6-9ecc-4aba-bf9d-5aab4765fd40",
        )
        markdown_image = MarkdownImageFactory(
            id="4ab8079e-ff4d-4d06-9922-4929e4f7a6eb",
            markdown_document=markdown_document,
            upload_state="ready",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=markdown_document)

        # Get the upload policy for this Markdown image
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/markdown-images/{markdown_image.id}/initiate-upload/",
                data={"filename": "not_used.png", "mimetype": "image/png"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content),
            {
                "url": "https://test-marsha-source.s3.amazonaws.com/",
                "fields": {
                    "acl": "private",
                    "key": (
                        "c10b79b6-9ecc-4aba-bf9d-5aab4765fd40/markdown-image/"
                        "4ab8079e-ff4d-4d06-9922-4929e4f7a6eb/1533686400.png"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "aws-access-key-id/20180808/eu-west-1/s3/aws4_request",
                    "x-amz-date": "20180808T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMTgtMDgtMDlUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiB"
                        "beyJhY2wiOiAicHJpdmF0ZSJ9LCBbInN0YXJ0cy13aXRoIiwgIiRDb250ZW50LVR5cGUiLC"
                        "AiaW1hZ2UvIl0sIFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLCAwLCAxMDQ4NTc2MF0sIHsiY"
                        "nVja2V0IjogInRlc3QtbWFyc2hhLXNvdXJjZSJ9LCB7ImtleSI6ICJjMTBiNzliNi05ZWNj"
                        "LTRhYmEtYmY5ZC01YWFiNDc2NWZkNDAvbWFya2Rvd24taW1hZ2UvNGFiODA3OWUtZmY0ZC0"
                        "0ZDA2LTk5MjItNDkyOWU0ZjdhNmViLzE1MzM2ODY0MDAucG5nIn0sIHsieC1hbXotYWxnb3"
                        "JpdGhtIjogIkFXUzQtSE1BQy1TSEEyNTYifSwgeyJ4LWFtei1jcmVkZW50aWFsIjogImF3c"
                        "y1hY2Nlc3Mta2V5LWlkLzIwMTgwODA4L2V1LXdlc3QtMS9zMy9hd3M0X3JlcXVlc3QifSwg"
                        "eyJ4LWFtei1kYXRlIjogIjIwMTgwODA4VDAwMDAwMFoifV19"
                    ),
                    "x-amz-signature": (
                        "8fbe534d175f3761e883795fe4c9626e3f69d259cfd03f240caca1ef8e968ada"
                    ),
                },
            },
        )

        # The upload_state of the Markdown image should have been reset
        markdown_image.refresh_from_db()
        self.assertEqual(markdown_image.upload_state, "pending")
        self.assertEqual(markdown_image.extension, ".png")

    def test_api_markdown_image_initiate_upload_instructor_read_only(self):
        """Instructor should not be able to initiate Markdown images upload in a read_only mode."""
        markdown_image = MarkdownImageFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=markdown_image.markdown_document,
            permissions__can_update=False,
        )

        response = self.client.post(
            f"/api/markdown-images/{markdown_image.id}/initiate-upload/",
            data={"filename": "not_used.gif", "mimetype": "image/gif"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
