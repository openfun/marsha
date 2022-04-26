"""Views of the ``markdown`` app of the Marsha project."""

from marsha.core.views import BaseLTIView

from .models import MarkdownDocument
from .serializers import MarkdownDocumentSerializer


class MarkdownDocumentView(BaseLTIView):
    """MarkdownDocument view."""

    model = MarkdownDocument
    serializer_class = MarkdownDocumentSerializer
