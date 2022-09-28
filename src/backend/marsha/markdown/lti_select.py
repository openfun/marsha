"""Module dedicated to lti select feature for Markdown."""
from django.conf import settings

from .defaults import LTI_ROUTE
from .models import MarkdownDocument
from .serializers import MarkdownDocumentSelectLTISerializer


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
