"""Tests for the Markdown application update-translations API."""
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
class MarkdownUpdateTranslationsAPITest(TestCase):
    """Test for the Markdown document update-translations API."""

    maxDiff = None

    def test_api_document_translation_update_student(self):
        """A student user should not be able to update a Markdown document translated content."""
        markdown_document = MarkdownDocumentFactory()

        jwt_token = StudentLtiTokenFactory(
            resource=markdown_document.playlist,
            permissions__can_update=True,
        )

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
        self.assertEqual(response.status_code, 403)

    def test_api_document_translation_update_instructor(self):
        """An instructor should be able to update a Markdown document translated content."""
        markdown_document = MarkdownDocumentFactory(is_draft=True)

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=markdown_document.playlist
        )

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

    def test_api_document_translation_update_user_access_token(self):
        """
        A user with UserAccessToken should not be able to update
        a Markdown document translated content.
        """
        organization_access = OrganizationAccessFactory()
        playlist = PlaylistFactory(organization=organization_access.organization)
        markdown_document = MarkdownDocumentFactory(playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

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
        self.assertEqual(response.status_code, 403)

    def test_api_document_translation_update_user_access_token_organization_admin(self):
        """
        An organization administrator should be able to update
        a Markdown document translated content.
        """
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        markdown_document = MarkdownDocumentFactory(playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

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

    def test_api_document_translation_update_user_access_token_playlist_admin(self):
        """
        A playlist administrator should be able to update
        a Markdown document translated content.
        """
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        markdown_document = MarkdownDocumentFactory(playlist=playlist_access.playlist)
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

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
