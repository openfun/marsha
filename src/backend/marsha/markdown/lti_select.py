"""Module dedicated to lti select feature for Markdown."""

from django.conf import settings

from marsha.markdown.defaults import LTI_ROUTE
from marsha.markdown.models import MarkdownDocument
from marsha.markdown.serializers import MarkdownDocumentSelectLTISerializer


def get_lti_select_config():
    """return markdown config for lti select when enabled."""
    if settings.MARKDOWN_ENABLED:
        return [
            {
                "name": "markdown",
                "serializer": MarkdownDocumentSelectLTISerializer,
                "model": MarkdownDocument,
                "route": LTI_ROUTE,
            }
        ]

    return None
