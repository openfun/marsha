"""Views of the ``deposit`` app of the Marsha project."""

from marsha.core.views import BaseLTIView
from marsha.deposit.models import FileDepository
from marsha.deposit.serializers import FileDepositorySerializer


class FileDepositoryLTIView(BaseLTIView):
    """FileDepository LTI view."""

    model = FileDepository
    serializer_class = FileDepositorySerializer
