"""Views of the ``{{cookiecutter.app_name}}`` app of the Marsha project."""
from marsha.core.views import BaseLTIView

from .models import {{cookiecutter.model}}
from .serializers import {{cookiecutter.model}}Serializer


class {{cookiecutter.model}}LTIView(BaseLTIView):
    """{{cookiecutter.model}} LTI view."""

    model = {{cookiecutter.model}}
    serializer_class = {{cookiecutter.model}}Serializer
