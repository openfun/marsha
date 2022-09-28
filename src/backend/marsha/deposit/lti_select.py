"""Module dedicated to lti select feature for deposit."""
from django.conf import settings

from .defaults import LTI_ROUTE
from .models import FileDepository
from .serializers import FileDepositorySelectLTISerializer


def get_lti_select_config():
    """return deposit config for lti select when enabled."""
    if settings.DEPOSIT_ENABLED:
        return [
            {
                "name": "deposit",
                "serializer": FileDepositorySelectLTISerializer,
                "model": FileDepository,
                "route": LTI_ROUTE,
            }
        ]

    return None
