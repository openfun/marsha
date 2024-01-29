"""Views of the ``bbb`` app of the Marsha project."""

from django.templatetags.static import static

from marsha.bbb.models import Classroom
from marsha.bbb.serializers import ClassroomSerializer
from marsha.core.views import BaseLTIView


class ClassroomLTIView(BaseLTIView):
    """Video view."""

    model = Classroom
    serializer_class = ClassroomSerializer

    def _get_base_app_data(self):
        """Adds app data only for BBB classroom."""
        app_data = super()._get_base_app_data()
        app_data["static"]["img"].update(
            {
                "bbbBackground": static("img/bbbBackground.png"),
                "bbbLogo": static("img/bbbLogo.png"),
            }
        )
        return app_data
