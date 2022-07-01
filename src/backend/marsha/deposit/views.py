"""Views of the ``deposit`` app of the Marsha project."""
from marsha.core.views import BaseLTIView

from .models import FileDepository
from .serializers import FileDepositorySerializer


class FileDepositoryLTIView(BaseLTIView):
    """FileDepository LTI view."""

    model = FileDepository
    serializer_class = FileDepositorySerializer
