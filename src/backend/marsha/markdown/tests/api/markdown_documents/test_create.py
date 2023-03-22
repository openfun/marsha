"""Tests for the Markdown application create API."""
from django.test import TestCase, override_settings

from marsha.core import factories as core_factories
from marsha.core.factories import (
    OrganizationAccessFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
)
from marsha.core.models import ADMINISTRATOR
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    PlaylistLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)
from marsha.markdown.factories import MarkdownDocumentFactory
from marsha.markdown.models import MarkdownDocument


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(MARKDOWN_ENABLED=True)
class MarkdownCreateAPITest(TestCase):
    """Test for the Markdown document create API."""

    maxDiff = None

    def test_api_document_create_anonymous(self):
        """An anonymous should not be able to create a Markdown document."""
        response = self.client.post("/api/markdown-documents/")
        self.assertEqual(response.status_code, 401)

    def test_api_document_create_student(self):
        """A student should not be able to create a Markdown document."""
        markdown_document = MarkdownDocumentFactory()

        jwt_token = StudentLtiTokenFactory(
            resource=markdown_document,
            permissions__can_update=True,
        )

        response = self.client.post(
            "/api/markdown-documents/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_create_student_with_playlist_token(self):
        """A student with a playlist token should not be able to create a Markdown document."""
        jwt_token = PlaylistLtiTokenFactory(roles=["student"])

        response = self.client.post(
            "/api/markdown-documents/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_create_instructor(self):
        """An instructor should not be able to create a Markdown document."""
        markdown_document = MarkdownDocumentFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=markdown_document)

        response = self.client.post(
            "/api/markdown-documents/",
            {
                "lti_id": "document_one",
                "playlist": str(markdown_document.playlist.id),
                "title": "Some document",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_create_instructor_with_playlist_token(self):
        """
        Create document with playlist token.

        Used in the context of a lti select request (deep linking).
        """
        playlist = core_factories.PlaylistFactory()

        jwt_token = PlaylistLtiTokenFactory(playlist=playlist)

        self.assertEqual(MarkdownDocument.objects.count(), 0)

        response = self.client.post(
            "/api/markdown-documents/",
            {
                "lti_id": "document_one",
                "playlist": str(playlist.id),
                "title": "Some document",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(MarkdownDocument.objects.count(), 1)
        self.assertEqual(response.status_code, 201)
        document = MarkdownDocument.objects.first()
        self.assertEqual(
            response.json(),
            {
                "id": str(document.id),
                "images": [],
                "is_draft": True,
                "playlist": {
                    "id": str(playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "position": 0,
                "rendering_options": {},
                "translations": [
                    {
                        "content": "",
                        "language_code": "en",
                        "rendered_content": "",
                        "title": "Some document",
                    }
                ],
            },
        )

    def test_api_document_create_instructor_with_playlist_token_no_title(self):
        """
        Create document with playlist token.

        Used in the context of a lti select request (deep linking) without title.
        """
        playlist = core_factories.PlaylistFactory()

        jwt_token = PlaylistLtiTokenFactory(playlist=playlist)

        self.assertEqual(MarkdownDocument.objects.count(), 0)

        response = self.client.post(
            "/api/markdown-documents/",
            {
                "lti_id": "document_one",
                "playlist": str(playlist.id),
                "title": "",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(MarkdownDocument.objects.count(), 1)
        self.assertEqual(response.status_code, 201)
        document = MarkdownDocument.objects.first()
        self.assertEqual(
            response.json(),
            {
                "id": str(document.id),
                "images": [],
                "is_draft": True,
                "playlist": {
                    "id": str(playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "position": 0,
                "rendering_options": {},
                "translations": [
                    {
                        "content": "",
                        "language_code": "en",
                        "rendered_content": "",
                        "title": "",
                    }
                ],
            },
        )

    def test_api_document_create_user_access_token(self):
        """A user with UserAccessToken should not be able to create a Markdown document."""
        organization_access = OrganizationAccessFactory()
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.post(
            "/api/markdown-documents/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_create_user_access_token_organization_admin(self):
        """An organization administrator should be able to create a Markdown document."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        self.assertEqual(MarkdownDocument.objects.count(), 0)

        response = self.client.post(
            "/api/markdown-documents/",
            {
                "lti_id": "document_one",
                "playlist": str(playlist.id),
                "title": "Some document",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(MarkdownDocument.objects.count(), 1)
        self.assertEqual(response.status_code, 201)
        document = MarkdownDocument.objects.first()
        self.assertEqual(
            response.json(),
            {
                "id": str(document.id),
                "images": [],
                "is_draft": True,
                "playlist": {
                    "id": str(playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "position": 0,
                "rendering_options": {},
                "translations": [
                    {
                        "content": "",
                        "language_code": "en",
                        "rendered_content": "",
                        "title": "Some document",
                    }
                ],
            },
        )

        response2 = self.client.post(
            "/api/markdown-documents/",
            {
                "lti_id": "document_two",
                "playlist": str(playlist.id),
                "title": "Document two",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(MarkdownDocument.objects.count(), 2)
        self.assertEqual(response2.status_code, 201)
        document2 = MarkdownDocument.objects.latest("created_on")
        self.assertEqual(
            response2.json(),
            {
                "id": str(document2.id),
                "images": [],
                "is_draft": True,
                "playlist": {
                    "id": str(playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "position": 0,
                "rendering_options": {},
                "translations": [
                    {
                        "content": "",
                        "language_code": "en",
                        "rendered_content": "",
                        "title": "Document two",
                    }
                ],
            },
        )

    def test_api_document_create_user_access_token_playlist_admin(self):
        """A playlist administrator should be able to create a Markdown document."""
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        self.assertEqual(MarkdownDocument.objects.count(), 0)

        response = self.client.post(
            "/api/markdown-documents/",
            {
                "lti_id": "document_one",
                "playlist": str(playlist_access.playlist.id),
                "title": "Some document",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(MarkdownDocument.objects.count(), 1)
        self.assertEqual(response.status_code, 201)
        document = MarkdownDocument.objects.first()
        self.assertEqual(
            response.json(),
            {
                "id": str(document.id),
                "images": [],
                "is_draft": True,
                "playlist": {
                    "id": str(playlist_access.playlist.id),
                    "lti_id": playlist_access.playlist.lti_id,
                    "title": playlist_access.playlist.title,
                },
                "position": 0,
                "rendering_options": {},
                "translations": [
                    {
                        "content": "",
                        "language_code": "en",
                        "rendered_content": "",
                        "title": "Some document",
                    }
                ],
            },
        )

        response2 = self.client.post(
            "/api/markdown-documents/",
            {
                "lti_id": "document_two",
                "playlist": str(playlist_access.playlist.id),
                "title": "Document two",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(MarkdownDocument.objects.count(), 2)
        self.assertEqual(response2.status_code, 201)
        document2 = MarkdownDocument.objects.latest("created_on")
        self.assertEqual(
            response2.json(),
            {
                "id": str(document2.id),
                "images": [],
                "is_draft": True,
                "playlist": {
                    "id": str(playlist_access.playlist.id),
                    "lti_id": playlist_access.playlist.lti_id,
                    "title": playlist_access.playlist.title,
                },
                "position": 0,
                "rendering_options": {},
                "translations": [
                    {
                        "content": "",
                        "language_code": "en",
                        "rendered_content": "",
                        "title": "Document two",
                    }
                ],
            },
        )
