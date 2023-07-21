"""Tests for the Markdown image delete API."""
from django.test import TestCase

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
from marsha.markdown.models import MarkdownImage


class MarkdownImageDeleteApiTest(TestCase):
    """Test the delete API of the Markdown image object."""

    maxDiff = None

    def test_api_markdown_image_delete_anonymous(self):
        """Anonymous users should not be able to delete a Markdown image."""
        markdown_image = MarkdownImageFactory()

        response = self.client.delete(
            f"/api/markdown-documents/{markdown_image.markdown_document.id}"
            f"/markdown-images/{markdown_image.id}/"
        )
        self.assertEqual(response.status_code, 401)

    def test_api_markdown_image_delete_student(self):
        """Student users should not be able to delete a Markdown image."""
        markdown_image = MarkdownImageFactory()

        jwt_token = StudentLtiTokenFactory(
            resource=markdown_image.markdown_document.playlist
        )

        response = self.client.delete(
            f"/api/markdown-documents/{markdown_image.markdown_document.id}"
            f"/markdown-images/{markdown_image.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_markdown_image_delete_instructor(self):
        """Instructor should be able to delete a Markdown image for its Markdown document."""
        markdown_image = MarkdownImageFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=markdown_image.markdown_document.playlist,
        )

        self.assertEqual(MarkdownImage.objects.count(), 1)

        response = self.client.delete(
            f"/api/markdown-documents/{markdown_image.markdown_document.id}"
            f"/markdown-images/{markdown_image.id}/",
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
            f"/api/markdown-documents/{markdown_image.markdown_document.id}/markdown-images/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 201)

    def test_api_markdown_image_delete_instructor_in_read_only(self):
        """Instructor should not be able to delete Markdown images in a read_only mode."""
        markdown_image = MarkdownImageFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=markdown_image.markdown_document.playlist,
            permissions__can_update=False,
        )

        response = self.client.delete(
            f"/api/markdown-documents/{markdown_image.markdown_document.id}"
            f"/markdown-images/{markdown_image.id}/",
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

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=markdown_document_token.playlist
        )

        response = self.client.delete(
            f"/api/markdown-documents/{markdown_image.markdown_document.id}"
            f"/markdown-images/{markdown_image.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_markdown_image_delete_user_access_token(self):
        """A user with UserAccessToken should not be able to delete a Markdown image."""
        organization_access = OrganizationAccessFactory()
        playlist = PlaylistFactory(organization=organization_access.organization)
        markdown_image = MarkdownImageFactory(markdown_document__playlist=playlist)

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.delete(
            f"/api/markdown-documents/{markdown_image.markdown_document.id}"
            f"/markdown-images/{markdown_image.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_markdown_image_delete_user_access_token_organization_admin(self):
        """
        An organization administrator should be able to delete a Markdown image
        for its Markdown document.
        """
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        markdown_image = MarkdownImageFactory(markdown_document__playlist=playlist)

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        self.assertEqual(MarkdownImage.objects.count(), 1)

        response = self.client.delete(
            f"/api/markdown-documents/{markdown_image.markdown_document.id}"
            f"/markdown-images/{markdown_image.id}/",
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
            f"/api/markdown-documents/{markdown_image.markdown_document.id}/markdown-images/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            data={"markdown_document": str(markdown_image.markdown_document.id)},
        )

        self.assertEqual(response.status_code, 201)

    def test_api_markdown_image_delete_user_access_token_playlist_admin(self):
        """
        A playlist administrator should be able to delete a Markdown image
        for its Markdown document.
        """
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        markdown_image = MarkdownImageFactory(
            markdown_document__playlist=playlist_access.playlist
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        self.assertEqual(MarkdownImage.objects.count(), 1)

        response = self.client.delete(
            f"/api/markdown-documents/{markdown_image.markdown_document.id}"
            f"/markdown-images/{markdown_image.id}/",
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
            f"/api/markdown-documents/{markdown_image.markdown_document.id}/markdown-images/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            data={"markdown_document": str(markdown_image.markdown_document.id)},
        )

        self.assertEqual(response.status_code, 201)
