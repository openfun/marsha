"""Celery shared live media tasks for the core app."""

from django.core.files.base import ContentFile

import fitz  # PyMuPDF
from sentry_sdk import capture_exception

from marsha.celery_app import app
from marsha.core.defaults import (
    CELERY_PIPELINE,
    ERROR,
    READY,
    TMP_VIDEOS_STORAGE_BASE_DIRECTORY,
)
from marsha.core.models import SharedLiveMedia
from marsha.core.storage.storage_class import video_storage
from marsha.core.utils.time_utils import to_datetime


@app.task
def convert_shared_live_media(shared_live_media_pk, stamp: str):
    """Convert a shared live media using fitz (PyMuPDF) and video_storage.

    Args:
        shared_live_media_pk (UUID): The shared live media to convert.
        stamp (str): The stamp at which the shared live media was uploaded
        which will be used to find the key.
    """
    shared_live_media = SharedLiveMedia.objects.get(pk=shared_live_media_pk)
    try:
        shared_live_media.update_upload_state(READY, None)
        source = shared_live_media.get_videos_storage_prefix(
            stamp, TMP_VIDEOS_STORAGE_BASE_DIRECTORY
        )
        prefix_destination = shared_live_media.get_videos_storage_prefix(stamp)

        with video_storage.open(source, "rb") as pdf_file:
            pdf_bytes = pdf_file.read()
            pdf = fitz.open(stream=pdf_bytes, filetype="pdf")
            nb_pages = len(pdf)

            for page in range(nb_pages):
                svg_string = pdf[page].get_svg_image()
                svg_bytes = svg_string.encode("utf-8")
                content_file = ContentFile(svg_bytes)

                video_storage.save(
                    f"{prefix_destination}/{stamp}_{page+1}.svg", content_file
                )

            video_storage.save(f"{prefix_destination}/{stamp}.pdf", pdf_file)

        shared_live_media.process_pipeline = CELERY_PIPELINE
        shared_live_media.save(update_fields=["process_pipeline"])
        shared_live_media.update_upload_state(
            READY, to_datetime(stamp), **{"nbPages": nb_pages, "extension": "pdf"}
        )
    except Exception as exception:  # pylint: disable=broad-except+
        capture_exception(exception)
        shared_live_media.update_upload_state(ERROR, None)
