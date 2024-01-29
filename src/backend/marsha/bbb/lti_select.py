"""Module dedicated to lti select feature for BBB."""

from django.conf import settings

from marsha.bbb.defaults import LTI_ROUTE
from marsha.bbb.models import Classroom
from marsha.bbb.serializers import ClassroomSelectLTISerializer


def get_lti_select_config():
    """return bbb config for lti select when enabled."""
    if settings.BBB_ENABLED:
        return [
            {
                "name": "classroom",
                "serializer": ClassroomSelectLTISerializer,
                "model": Classroom,
                "route": LTI_ROUTE,
            }
        ]

    return None
