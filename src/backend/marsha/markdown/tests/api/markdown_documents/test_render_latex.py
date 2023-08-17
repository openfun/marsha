"""Tests for the Markdown application render-latex API."""
import json

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
class MarkdownRenderLatexAPITest(TestCase):
    """Test for the Markdown document render-latex API."""

    maxDiff = None

    def test_api_document_render_latex_student(self):
        """A student user should not be able to render LaTeX content."""
        markdown_document = MarkdownDocumentFactory()

        jwt_token = StudentLtiTokenFactory(
            playlist=markdown_document.playlist,
            permissions__can_update=True,
        )

        response = self.client.post(
            f"/api/markdown-documents/{markdown_document.pk}/latex-rendering/",
            {"text": r"I = \int \rho R^{2} dV"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_render_latex_instructor(self):
        """An instructor should be able to render LaTeX content."""
        markdown_document = MarkdownDocumentFactory(is_draft=True)

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=markdown_document.playlist
        )

        response = self.client.post(
            f"/api/markdown-documents/{markdown_document.pk}/latex-rendering/",
            {"text": r"I = \int \rho R^{2} dV"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        # Content is already tested elsewhere
        self.assertIn(
            "<svg version='1.1' xmlns='http://www.w3.org/2000/svg'",
            content["latex_image"],
        )

    def test_api_document_render_latex_user_access_token(self):
        """A user with UserAccessToken should not be able to render LaTeX content."""
        organization_access = OrganizationAccessFactory()
        playlist = PlaylistFactory(organization=organization_access.organization)
        markdown_document = MarkdownDocumentFactory(playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.post(
            f"/api/markdown-documents/{markdown_document.pk}/latex-rendering/",
            {"text": r"I = \int \rho R^{2} dV"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_render_latex_user_access_token_organization_admin(self):
        """An organization administrator should be able to render LaTeX content."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        markdown_document = MarkdownDocumentFactory(playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.post(
            f"/api/markdown-documents/{markdown_document.pk}/latex-rendering/",
            {"text": r"I = \int \rho R^{2} dV"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        content = response.json()
        # Content is already tested elsewhere
        self.assertIn(
            "<svg version='1.1' xmlns='http://www.w3.org/2000/svg'",
            content["latex_image"],
        )

    def test_api_document_render_latex_user_access_token_playlist_admin(self):
        """A playlist administrator should be able to render LaTeX content."""
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        markdown_document = MarkdownDocumentFactory(playlist=playlist_access.playlist)
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        response = self.client.post(
            f"/api/markdown-documents/{markdown_document.pk}/latex-rendering/",
            {"text": r"I = \int \rho R^{2} dV"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        content = response.json()
        # Content is already tested elsewhere
        self.assertIn(
            "<svg version='1.1' xmlns='http://www.w3.org/2000/svg'",
            content["latex_image"],
        )
