"""Tests for the Markdown application render-latex API."""
import json

from django.test import TestCase, override_settings

from marsha.core.simple_jwt.factories import InstructorOrAdminLtiTokenFactory
from marsha.markdown.factories import MarkdownDocumentFactory


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(MARKDOWN_ENABLED=True)
class MarkdownRenderLatexAPITest(TestCase):
    """Test for the Markdown document render-latex API."""

    maxDiff = None

    def test_api_document_render_latex_instructor(self):
        """An instructor should be able to render LaTeX content content."""
        markdown_document = MarkdownDocumentFactory(is_draft=True)

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=markdown_document)

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
