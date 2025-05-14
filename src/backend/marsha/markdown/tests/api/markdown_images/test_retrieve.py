"""Tests for the Markdown image retrieve API."""

from datetime import datetime, timezone
import json

from django.test import TestCase, override_settings

from marsha.core.defaults import AWS_S3, SCW_S3
from marsha.core.factories import (
    OrganizationAccessFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
)
from marsha.core.models import ADMINISTRATOR
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)
from marsha.markdown.factories import MarkdownDocumentFactory, MarkdownImageFactory


class MarkdownImageRetrieveApiTest(TestCase):
    """Test the retrieve API of the Markdown image object."""

    maxDiff = None

    def test_api_markdown_image_read_detail_anonymous(self):
        """Anonymous users should not be allowed to retrieve a Markdown image."""
        markdown_image = MarkdownImageFactory()
        response = self.client.get(
            f"/api/markdown-documents/{markdown_image.markdown_document.id}"
            f"/markdown-images/{markdown_image.id}/"
        )
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_markdown_image_read_detail_student(self):
        """Students users should not be allowed to read a Markdown image detail."""
        markdown_image = MarkdownImageFactory()

        jwt_token = StudentLtiTokenFactory(
            playlist=markdown_image.markdown_document.playlist
        )

        response = self.client.get(
            f"/api/markdown-documents/{markdown_image.markdown_document.id}"
            f"/markdown-images/{markdown_image.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_markdown_image_instructor_read_detail_in_read_only(self):
        """Instructor should not be able to read Markdown images in a read_only mode."""
        markdown_image = MarkdownImageFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=markdown_image.markdown_document.playlist,
            permissions__can_update=False,
        )

        response = self.client.get(
            f"/api/markdown-documents/{markdown_image.markdown_document.id}"
            f"/markdown-images/{markdown_image.id}/",
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

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=markdown_document.playlist
        )

        response = self.client.get(
            f"/api/markdown-documents/{markdown_image.markdown_document.id}"
            f"/markdown-images/{markdown_image.id}/",
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
            playlist=markdown_image.markdown_document.playlist,
            permissions__can_update=False,
        )

        response = self.client.get(
            f"/api/markdown-documents/{markdown_image.markdown_document.id}"
            f"/markdown-images/{markdown_image.id}/",
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
            playlist=markdown_document.playlist,
            roles=["administrator"],
        )

        response = self.client.get(
            f"/api/markdown-documents/{markdown_image.markdown_document.id}"
            f"/markdown-images/{markdown_image.id}/",
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

    @override_settings(
        MEDIA_URL="https://abc.svc.edge.scw.cloud/",
    )
    def test_api_markdown_image_read_ready_markdown_image(self):
        """A ready Markdown image on SCW should have computed urls."""
        markdown_document = MarkdownDocumentFactory(
            pk="78338c1c-356e-4156-bd95-5bed71ffb655",
        )
        markdown_image = MarkdownImageFactory(
            pk="9ddf9c1f-ec88-4a3a-bfa0-423c4fe89b15",
            markdown_document=markdown_document,
            uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc),
            upload_state="ready",
            extension="gif",
            storage_location=SCW_S3,
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=markdown_document.playlist
        )

        response = self.client.get(
            f"/api/markdown-documents/{markdown_image.markdown_document.id}"
            f"/markdown-images/{markdown_image.id}/",
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
                    "https://abc.svc.edge.scw.cloud/"
                    "markdowndocument/78338c1c-356e-4156-bd95-5bed71ffb655/"
                    "markdownimage/9ddf9c1f-ec88-4a3a-bfa0-423c4fe89b15/1533686400"
                ),
                "markdown_document": str(markdown_document.id),
            },
        )

    def test_api_markdown_image_read_ready_markdown_image_aws(self):
        """A ready Markdown image on AWS should have computed urls."""
        markdown_document = MarkdownDocumentFactory(
            pk="78338c1c-356e-4156-bd95-5bed71ffb655",
        )
        markdown_image = MarkdownImageFactory(
            pk="9ddf9c1f-ec88-4a3a-bfa0-423c4fe89b15",
            markdown_document=markdown_document,
            uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc),
            upload_state="ready",
            extension="gif",
            storage_location=AWS_S3,
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=markdown_document.playlist
        )

        response = self.client.get(
            f"/api/markdown-documents/{markdown_image.markdown_document.id}"
            f"/markdown-images/{markdown_image.id}/",
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

    def test_api_markdown_image_read_detail_user_access_token(self):
        """A user with UserAccessToken should not be allowed to read a Markdown image detail."""
        organization_access = OrganizationAccessFactory()
        playlist = PlaylistFactory(organization=organization_access.organization)
        markdown_image = MarkdownImageFactory(markdown_document__playlist=playlist)

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.get(
            f"/api/markdown-documents/{markdown_image.markdown_document.id}"
            f"/markdown-images/{markdown_image.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_markdown_image_read_detail_user_access_token_organization_admin(self):
        """
        An organization administrator should be able to read details of Markdown image
        associated to their Markdown documents.
        """
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        markdown_image = MarkdownImageFactory(markdown_document__playlist=playlist)

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.get(
            f"/api/markdown-documents/{markdown_image.markdown_document.id}"
            f"/markdown-images/{markdown_image.id}/",
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
                "markdown_document": str(markdown_image.markdown_document.id),
            },
        )

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_markdown_image_read_detail_user_access_token_playlist_admin(self):
        """
        A playlist administrator should be able to read details of Markdown image
        associated to their Markdown documents.
        """
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        markdown_image = MarkdownImageFactory(
            markdown_document__playlist=playlist_access.playlist
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        response = self.client.get(
            f"/api/markdown-documents/{markdown_image.markdown_document.id}"
            f"/markdown-images/{markdown_image.id}/",
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
                "markdown_document": str(markdown_image.markdown_document.id),
            },
        )
