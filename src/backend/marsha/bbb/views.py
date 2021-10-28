"""Views of the ``bbb`` app of the Marsha project."""

from marsha.core.views import BaseLTIView

from .models import Meeting
from .serializers import MeetingSerializer


class MeetingView(BaseLTIView):
    """Video view."""

    model = Meeting
    serializer_class = MeetingSerializer
