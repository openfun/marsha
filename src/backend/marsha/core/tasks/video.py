"""Celery videos tasks for the core app."""

import logging

from django_peertube_runner_connector.transcode import transcode_video
from django_peertube_runner_connector.transcript import transcript_video
from sentry_sdk import capture_exception

from marsha.celery_app import app
from marsha.core.defaults import ERROR, TMP_VIDEOS_STORAGE_BASE_DIRECTORY
from marsha.core.models.video import Video


logger = logging.getLogger(__name__)


@app.task
def launch_video_transcoding(video_pk: str, stamp: str, domain: str):
    """Transcodes a video using video_storage.
    Args:
        video_pk (UUID): The video to transcode.
        stamp (str): The stamp at which the thumbnail was uploaded
        which will be used to find the key.
        domain (str): The domain name used to construct the download URL for peerTube runners.
    """
    video = Video.objects.get(pk=video_pk)
    try:
        source = video.get_videos_storage_prefix(
            stamp, TMP_VIDEOS_STORAGE_BASE_DIRECTORY
        )
        prefix_destination = video.get_videos_storage_prefix(stamp)
        transcode_video(
            file_path=source,
            destination=prefix_destination,
            base_name=stamp,
            domain=domain,
        )
    except Exception as exception:  # pylint: disable=broad-except+
        capture_exception(exception)
        video.update_upload_state(ERROR, None)
        logger.exception(exception)


@app.task
def launch_video_transcript(video_pk: str, stamp: str, domain: str):
    """Transcripts a video using video_storage.
    Args:
        video_pk (UUID): The video to transcript.
        stamp (str): The stamp at which the thumbnail was uploaded
        which will be used to find the key.
        domain (str): The domain name used to construct the download URL for peerTube runners.
    """
    video = Video.objects.get(pk=video_pk)
    try:
        prefix_destination = video.get_videos_storage_prefix(stamp)
        transcript_video(destination=prefix_destination, domain=domain)
    except Exception as exception:  # pylint: disable=broad-except+
        capture_exception(exception)
        logger.exception(exception)
