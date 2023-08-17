"""Tests for the Markdown application lti-select API."""
from django.test import TestCase, override_settings

from marsha.core.factories import PlaylistFactory
from marsha.core.simple_jwt.factories import InstructorOrAdminLtiTokenFactory
from marsha.markdown.factories import MarkdownDocumentFactory


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(MARKDOWN_ENABLED=True)
class MarkdownLtiSelectAPITest(TestCase):
    """Test for the Markdown document lti-select API."""

    maxDiff = None

    def test_api_select_instructor_no_document(self):
        """An instructor should be able to fetch a Markdown document lti select."""
        playlist = PlaylistFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=playlist)

        response = self.client.get(
            "/api/markdown-documents/lti-select/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            {
                "new_url": "http://testserver/lti/markdown-documents/",
                "markdown_documents": [],
            },
            response.json(),
        )

    def test_api_select_instructor(self):
        """An instructor should be able to fetch a Markdown document lti select."""
        markdown_document = MarkdownDocumentFactory(
            translations__title="Amazing title",
            translations__content="# Heading1\nSome content",
            translations__rendered_content="<h1>Heading1</h1>\n<p>Some content</p>",
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=markdown_document.playlist
        )

        response = self.client.get(
            "/api/markdown-documents/lti-select/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            {
                "new_url": "http://testserver/lti/markdown-documents/",
                "markdown_documents": [
                    {
                        "id": str(markdown_document.id),
                        "images": [],
                        "is_draft": markdown_document.is_draft,
                        "lti_id": str(markdown_document.lti_id),
                        "lti_url": (
                            f"http://testserver/lti/markdown-documents/{str(markdown_document.id)}"
                        ),
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
                            "id": str(markdown_document.playlist_id),
                            "title": markdown_document.playlist.title,
                            "lti_id": markdown_document.playlist.lti_id,
                        },
                        "position": markdown_document.position,
                    },
                ],
            },
            response.json(),
        )
