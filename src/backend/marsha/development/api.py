"""Declare development API endpoints."""

import logging

from django.conf import settings
from django.http import HttpRequest

from rest_framework.decorators import api_view
from rest_framework.response import Response

from marsha.core.models import Document, Video
from marsha.core.storage.storage_class import video_storage
from marsha.core.utils import time_utils


logger = logging.getLogger(__name__)


@api_view(["POST"])
def dummy_video_upload(request: HttpRequest, uuid=None):
    """Dummy endpoint to mock s3 video upload."""
    try:
        object_instance = Video.objects.get(id=uuid)
    except Video.DoesNotExist:
        return Response({"success": False}, status=404)

    object_instance.update_upload_state(
        upload_state="ready",
        uploaded_on=time_utils.to_datetime(1533686400),
        resolutions=settings.VIDEO_RESOLUTIONS,
    )

    return Response({"success": True}, status=204)


@api_view(["POST"])
def local_video_upload(request: HttpRequest, uuid=None, stamp=None):
    """Endpoint to mock s3 video upload in dev environment."""
    uploaded_video_file = request.FILES["file"]

    video_storage.save(
        f"tmp/{uuid}/video/{stamp}",
        uploaded_video_file,
    )
    return Response(status=204)


@api_view(["POST"])
def local_document_upload(request: HttpRequest, uuid=None):
    """Endpoint to mock s3 document upload."""
    try:
        object_instance = Document.objects.get(id=uuid)
    except Document.DoesNotExist:
        return Response({"success": False}, status=404)

    object_instance.update_upload_state(
        upload_state="ready",
        uploaded_on=time_utils.to_datetime(1533686400),
    )

    return Response({"success": True}, status=204)
