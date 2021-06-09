"""Declare development API endpoints."""

import logging

from django.conf import settings
from django.http import HttpRequest

from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..core.models import Video
from ..core.utils import time_utils


logger = logging.getLogger(__name__)


@api_view(["POST"])
def local_upload(request: HttpRequest, uuid=None):
    """Endpoint to mock s3 video upload."""
    try:
        object_instance = Video.objects.get(id=uuid)
    except Video.DoesNotExist:
        return Response({"success": False}, status=404)

    object_instance.update_upload_state(
        upload_state="ready",
        uploaded_on=time_utils.to_datetime(1533686400),
        resolutions=settings.VIDEO_RESOLUTIONS,
    )

    return Response({"success": True})
