"""Tests for the Markdown application retrieve API."""
import json

from django.test import TestCase, override_settings

from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
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
            resource=markdown_document,
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

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=markdown_document)

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

    def test_api_document_fetch_instructor_read_only(self):
        """An instructor should not be able to fetch a Markdown document in read_only."""
        markdown_document = MarkdownDocumentFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=markdown_document,
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
