"""Tests for the Markdown application delete API."""

from django.test import TestCase, override_settings

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
            playlist=markdown_document.playlist,
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

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=markdown_document.playlist
        )

        response = self.client.delete(
            f"/api/markdown-documents/{markdown_document.pk}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 204)

    def test_api_document_delete_user_access_token(self):
        """A user with UserAccessToken should not be able to delete a Markdown document."""
        organization_access = OrganizationAccessFactory()
        playlist = PlaylistFactory(organization=organization_access.organization)
        markdown_document = MarkdownDocumentFactory(playlist=playlist)

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.delete(
            f"/api/markdown-documents/{markdown_document.pk}/",
            {
                "playlist": str(playlist.id),
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_delete_user_access_token_organization_admin(self):
        """An organization administrator should be able to delete a Markdown document."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        markdown_document = MarkdownDocumentFactory(playlist=playlist)

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.delete(
            f"/api/markdown-documents/{markdown_document.pk}/",
            {
                "playlist": str(playlist.id),
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 204)

    def test_api_document_delete_user_access_token_playlist_admin(self):
        """An playlist administrator should be able to delete a Markdown document."""
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        markdown_document = MarkdownDocumentFactory(playlist=playlist_access.playlist)

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        response = self.client.delete(
            f"/api/markdown-documents/{markdown_document.pk}/",
            {
                "playlist": str(markdown_document.playlist.id),
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 204)
