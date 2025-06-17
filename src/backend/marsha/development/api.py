"""Declare development API endpoints."""

import logging

from django.apps import apps
from django.conf import settings
from django.http import HttpRequest

from rest_framework.decorators import api_view
from rest_framework.response import Response

from marsha.bbb.models import ClassroomDocument
from marsha.core.defaults import TMP_STORAGE_BASE_DIRECTORY
from marsha.core.models import Document, Video
from marsha.core.serializers.file import DocumentSerializer
from marsha.core.storage.storage_class import file_storage
from marsha.core.utils import time_utils
from marsha.deposit.models import DepositedFile
from marsha.markdown.models import MarkdownImage


logger = logging.getLogger(__name__)


@api_view(["POST"])
def dummy_video_upload(request: HttpRequest, uuid=None):
    """Dummy endpoint to mock s3 video upload."""
    try:
        video = Video.objects.get(id=uuid)
    except Video.DoesNotExist:
        return Response({"success": False}, status=404)

    video.update_upload_state(
        upload_state="ready",
        uploaded_on=time_utils.to_datetime(1533686400),
        resolutions=settings.VIDEO_RESOLUTIONS,
    )

    return Response({"success": True}, status=204)


@api_view(["POST"])
def local_videos_storage_upload(
    request: HttpRequest, uuid=None, stamp=None, model=None
):
    """Endpoint to mock s3 video upload in dev environment."""
    uploaded_video_file = request.FILES["file"]

    object_model = apps.get_model("core", model)
    object_instance = object_model.objects.get(id=uuid)

    destination = object_instance.get_storage_prefix(
        stamp=stamp, base_dir=TMP_STORAGE_BASE_DIRECTORY
    )

    file_storage.save(destination, uploaded_video_file)
    return Response(status=204)


@api_view(["POST"])
def dummy_document_upload(request: HttpRequest, uuid=None):
    """Dummy endpoint to mock s3 document upload."""
    try:
        document = Document.objects.get(id=uuid)
    except Document.DoesNotExist:
        return Response({"success": False}, status=404)

    document.update_upload_state(
        upload_state="ready",
        uploaded_on=time_utils.to_datetime(1533686400),
    )

    return Response({"success": True}, status=204)


@api_view(["POST"])
def local_document_upload(request: HttpRequest, uuid=None):
    """Endpoint to mock s3 document upload."""
    uploaded_document = request.FILES["file"]

    try:
        document = Document.objects.get(id=uuid)
    except Document.DoesNotExist:
        return Response({"success": False}, status=404)

    filename = DocumentSerializer().get_filename(document)
    destination = document.get_storage_key(filename=filename)

    file_storage.save(destination, uploaded_document)
    return Response(status=204)


@api_view(["POST"])
def local_classroom_document_upload(request: HttpRequest, uuid=None):
    """Endpoint to mock s3 classroom document upload."""
    uploaded_classroom_document = request.FILES["file"]

    try:
        classroom_document = ClassroomDocument.objects.get(id=uuid)
    except ClassroomDocument.DoesNotExist:
        return Response({"success": False}, status=404)

    destination = classroom_document.get_storage_key(
        filename=classroom_document.filename
    )

    file_storage.save(destination, uploaded_classroom_document)
    return Response(status=204)


@api_view(["POST"])
def local_deposited_file_upload(request: HttpRequest, uuid=None):
    """Endpoint to mock s3 deposited file upload."""
    uploaded_deposited_file = request.FILES["file"]

    try:
        deposited_file = DepositedFile.objects.get(id=uuid)
    except DepositedFile.DoesNotExist:
        return Response({"success": False}, status=404)

    destination = deposited_file.get_storage_key(filename=deposited_file.filename)

    file_storage.save(destination, uploaded_deposited_file)
    return Response(status=204)


@api_view(["POST"])
def local_markdown_image_upload(request: HttpRequest, uuid=None):
    """Endpoint to mock s3 markdown image upload."""
    uploaded_markdown_image = request.FILES["file"]

    try:
        markdown_image = MarkdownImage.objects.get(id=uuid)
    except MarkdownImage.DoesNotExist:
        return Response({"success": False}, status=404)

    destination = markdown_image.get_storage_key(filename=markdown_image.filename)

    file_storage.save(destination, uploaded_markdown_image)
    return Response(status=204)
