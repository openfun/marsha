"""Tests for the Markdown application retrieve API."""
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
class MarkdownRetrieveAPITest(TestCase):
    """Test for the Markdown document retrieve API."""

    maxDiff = None

    def test_api_document_fetch_anonymous(self):
        """Anonymous users should not be able to fetch a Markdown document."""
        markdown_document = MarkdownDocumentFactory()

        response = self.client.get(f"/api/markdown-documents/{markdown_document.pk}/")
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_document_fetch_student(self):
        """A student should not be allowed to fetch a Markdown document."""
        markdown_document = MarkdownDocumentFactory()

        jwt_token = StudentLtiTokenFactory(
            resource=markdown_document.playlist,
            permissions__can_update=True,
        )

        response = self.client.get(
            f"/api/markdown-documents/{markdown_document.pk}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_document_fetch_instructor(self):
        """An instructor should be able to fetch a Markdown document."""
        markdown_document = MarkdownDocumentFactory(
            pk="4c51f469-f91e-4998-b438-e31ee3bd3ea6",
            playlist__pk="6a716ff3-1bfb-4870-906e-fda50293f0ac",
            playlist__title="foo",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            translations__title="Amazing title",
            translations__content="# Heading1\nSome content",
            translations__rendered_content="<h1>Heading1</h1>\n<p>Some content</p>",
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=markdown_document.playlist
        )

        response = self.client.get(
            f"/api/markdown-documents/{markdown_document.pk}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "id": "4c51f469-f91e-4998-b438-e31ee3bd3ea6",
                "images": [],
                "is_draft": True,
                "rendering_options": {},
                "translations": [
                    {
                        "language_code": "en",
                        "title": "Amazing title",
                        "content": "# Heading1\nSome content",
                        "rendered_content": "<h1>Heading1</h1>\n<p>Some content</p>",
                    }
                ],
                "playlist": {
                    "id": "6a716ff3-1bfb-4870-906e-fda50293f0ac",
                    "title": "foo",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "position": 0,
            },
        )

    def test_api_document_fetch_from_other_document(self):
        """
        An instructor should not be able to fetch a Markdown document with a resource
        token from an other markdown document.
        """
        markdown_document = MarkdownDocumentFactory(
            pk="4c51f469-f91e-4998-b438-e31ee3bd3ea6",
            playlist__pk="6a716ff3-1bfb-4870-906e-fda50293f0ac",
            playlist__title="foo",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            translations__title="Amazing title",
            translations__content="# Heading1\nSome content",
            translations__rendered_content="<h1>Heading1</h1>\n<p>Some content</p>",
        )
        other_markdown_document = MarkdownDocumentFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=other_markdown_document.playlist
        )

        response = self.client.get(
            f"/api/markdown-documents/{markdown_document.pk}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_fetch_instructor_read_only(self):
        """An instructor should not be able to fetch a Markdown document in read_only."""
        markdown_document = MarkdownDocumentFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=markdown_document.playlist,
            permissions__can_update=False,
        )

        response = self.client.get(
            f"/api/markdown-documents/{markdown_document.pk}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_document_fetch_user_access_token(self):
        """A user with UserAccessToken should not be able to fetch a Markdown document."""
        organization_access = OrganizationAccessFactory()
        playlist = PlaylistFactory(organization=organization_access.organization)
        markdown_document = MarkdownDocumentFactory(playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.get(
            f"/api/markdown-documents/{markdown_document.pk}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_document_fetch_user_access_token_organization_admin(self):
        """An organization administrator should be able to fetch a Markdown document."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        markdown_document = MarkdownDocumentFactory(playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.get(
            f"/api/markdown-documents/{markdown_document.pk}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        first_translation = markdown_document.translations.first()
        self.assertEqual(
            response.json(),
            {
                "id": str(markdown_document.id),
                "playlist": {
                    "id": str(playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "images": [],
                "is_draft": True,
                "rendering_options": {},
                "translations": [
                    {
                        "language_code": first_translation.language_code,
                        "title": first_translation.title,
                        "content": first_translation.content,
                        "rendered_content": first_translation.rendered_content,
                    }
                ],
                "position": 0,
            },
        )

    def test_api_document_fetch_user_access_token_playlist_admin(self):
        """A playlist administrator should be able to fetch a Markdown document."""
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        markdown_document = MarkdownDocumentFactory(playlist=playlist_access.playlist)
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        response = self.client.get(
            f"/api/markdown-documents/{markdown_document.pk}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        first_translation = markdown_document.translations.first()
        self.assertEqual(
            response.json(),
            {
                "id": str(markdown_document.id),
                "playlist": {
                    "id": str(playlist_access.playlist.id),
                    "lti_id": playlist_access.playlist.lti_id,
                    "title": playlist_access.playlist.title,
                },
                "images": [],
                "is_draft": True,
                "rendering_options": {},
                "translations": [
                    {
                        "language_code": first_translation.language_code,
                        "title": first_translation.title,
                        "content": first_translation.content,
                        "rendered_content": first_translation.rendered_content,
                    }
                ],
                "position": 0,
            },
        )
