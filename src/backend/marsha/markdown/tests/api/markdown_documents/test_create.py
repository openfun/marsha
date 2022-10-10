"""Tests for the Markdown application create API."""
from django.test import TestCase, override_settings

from marsha.core import factories as core_factories
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    PlaylistLtiTokenFactory,
    StudentLtiTokenFactory,
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
        """An instrustor should not be able to create a Markdown document."""
        markdown_document = MarkdownDocumentFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=markdown_document)

        response = self.client.get(
            "/api/markdown-documents/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
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
