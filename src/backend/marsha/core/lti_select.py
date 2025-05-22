"""Module dedicated to lti select feature for core."""

from django.conf import settings
from django.db.models import Q

from marsha.core.defaults import ENDED, LTI_DOCUMENT_ROUTE, LTI_VIDEO_ROUTE
from marsha.core.models import Document, Video
from marsha.core.serializers import (
    DocumentSelectLTISerializer,
    VideoSelectLTISerializer,
)


def get_lti_select_config():
    """return config for lti select."""
    lti_config = []

    if settings.DOCUMENT_ENABLED:
        lti_config.append(
            {
                "name": "document",
                "serializer": DocumentSelectLTISerializer,
                "model": Document,
                "route": LTI_DOCUMENT_ROUTE,
            }
        )
    if settings.VIDEO_ENABLED:
        lti_config.append(
            {
                "name": "video",
                "serializer": VideoSelectLTISerializer,
                "model": Video,
                "route": LTI_VIDEO_ROUTE,
                "extra_filter": lambda queryset: queryset.filter(
                    Q(live_type__isnull=True) | Q(live_state=ENDED)
                ),
            }
        )
    if settings.WEBINAR_ENABLED:
        lti_config.append(
            {
                "name": "webinar",
                "serializer": VideoSelectLTISerializer,
                "model": Video,
                "route": LTI_VIDEO_ROUTE,
                "extra_filter": lambda queryset: queryset.filter(
                    live_type__isnull=False
                ).exclude(live_state=ENDED),
            }
        )

    return lti_config
