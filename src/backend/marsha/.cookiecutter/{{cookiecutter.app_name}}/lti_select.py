"""Module dedicated to lti select feature for BBB."""
from django.conf import settings

from .defaults import LTI_ROUTE
from .models import {{cookiecutter.model}}
from .serializers import {{cookiecutter.model}}SelectLTISerializer


def get_lti_select_config():
    """return {{cookiecutter.app_name}} config for lti select when enabled."""
    if settings.{{cookiecutter.setting_name}}:
        return [
            {
                "name": "{{cookiecutter.app_name}}",
                "serializer": {{cookiecutter.model}}SelectLTISerializer,
                "model": {cookiecutter.model},
                "route": LTI_ROUTE,
            }
        ]

    return None
