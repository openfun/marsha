"""Celery recordings tasks for the core app."""

import logging

from lxml import html  # nosec
import requests
from sentry_sdk import capture_exception

from marsha.celery_app import app
from marsha.core.defaults import (
    ERROR,
    PROCESSING,
    RECORDING_SOURCE_ERROR,
    TMP_STORAGE_BASE_DIRECTORY,
)
from marsha.core.models.video import Video
from marsha.core.storage.storage_class import file_storage


class RecordingSourceError(Exception):
    """Error raised when an error occurs during the copy process"""


logger = logging.getLogger(__name__)


@app.task
def copy_video_recording(record_url: str, video_pk: str, stamp: str):
    """Fetch a video recording from BigBlueButton and upload it to the Video S3.

    Args:
        record_url (str): The BBB recording URL.
        video_pk (UUID): The video id.
        stamp (str): The stamp at which the video was uploaded
    """
    video = Video.objects.get(pk=video_pk)

    try:
        response = requests.get(record_url, timeout=10)
        response.raise_for_status()

        if not response.history:
            raise RecordingSourceError("No redirection have been followed.")

        raw_cookie = response.history[0].headers.get("set-cookie")
        cookie = raw_cookie.split(";")[0]

        base_url = response.url.rstrip("/")
        tree = html.fromstring(response.content)
        sources = tree.xpath("//source/@src")

        if not sources:
            raise RecordingSourceError("No video source found on the page.")

        video_url = f"{base_url}/{sources[0]}"

        with requests.get(
            video_url,
            headers={"Cookie": cookie},
            stream=True,
            timeout=10,
        ) as video_response:
            video_response.raise_for_status()
            source = video.get_storage_prefix(stamp, TMP_STORAGE_BASE_DIRECTORY)
            file_storage.save(source, video_response.raw)

        video.update_upload_state(PROCESSING, None)

    except RecordingSourceError as exception:
        video.upload_error_reason = RECORDING_SOURCE_ERROR
        video.update_upload_state(ERROR, None)
        logger.exception(exception)
    except Exception as exception:  # pylint: disable=broad-except
        capture_exception(exception)
        video.update_upload_state(ERROR, None)
        logger.exception(exception)
