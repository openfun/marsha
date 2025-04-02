"""Celery thumbnail tasks for the core app."""

from io import BytesIO

from django.core.files.base import ContentFile

from PIL import Image
from sentry_sdk import capture_exception

from marsha.celery_app import app
from marsha.core.defaults import (
    CELERY_PIPELINE,
    ERROR,
    READY,
    TMP_STORAGE_BASE_DIRECTORY,
)
from marsha.core.models import Thumbnail
from marsha.core.storage.storage_class import file_storage
from marsha.core.utils.time_utils import to_datetime


@app.task
def resize_thumbnails(thumbnail_pk, stamp: str):
    """Resize a thumbnail using file_storage.

    Args:
        thumbnail_pk (UUID): The thumbnail to resize.
        stamp (str): The stamp at which the thumbnail was uploaded
        which will be used to find the key.
    """
    thumbnail = Thumbnail.objects.get(pk=thumbnail_pk)
    try:
        source = thumbnail.get_storage_prefix(stamp, TMP_STORAGE_BASE_DIRECTORY)
        prefix_destination = thumbnail.get_storage_prefix(stamp)
        sizes = [1080, 720, 480, 240, 144]

        with file_storage.open(source, "rb") as img_file:
            for size in sizes:
                with Image.open(img_file) as img:
                    # Remove transparency to be save as JPEG
                    img = img.convert("RGB")

                    # Resize the image
                    img.thumbnail((size, size))

                    # Save the resized image back to storage
                    with BytesIO() as buffer:
                        img.save(buffer, "JPEG")
                        content_file = ContentFile(buffer.getvalue())
                        file_storage.save(
                            f"{prefix_destination}/{size}.jpg", content_file
                        )

        thumbnail.process_pipeline = CELERY_PIPELINE
        thumbnail.save(update_fields=["process_pipeline"])
        thumbnail.update_upload_state(READY, to_datetime(stamp))
    except Exception as exception:  # pylint: disable=broad-except+
        capture_exception(exception)
        thumbnail.update_upload_state(ERROR, None)
