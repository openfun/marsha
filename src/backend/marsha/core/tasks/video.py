"""Celery videos tasks for the core app."""

import logging

from django.conf import settings

from django_peertube_runner_connector.transcode import transcode_video
from django_peertube_runner_connector.transcript import transcript_video
from django_peertube_runner_connector.utils.ffprobe import (
    get_video_stream_dimensions_info,
)
import ffmpeg
from sentry_sdk import capture_exception

from marsha.celery_app import app
from marsha.core.defaults import (
    ERROR,
    MAX_RESOLUTION_EXCEDEED,
    READY,
    TMP_VIDEOS_STORAGE_BASE_DIRECTORY,
)
from marsha.core.models.video import Video
from marsha.core.serializers import VideoSerializer
from marsha.core.storage.storage_class import video_storage


logger = logging.getLogger(__name__)


class MaxResolutionError(Exception):
    """Raised when the resolution of a video is higher than the maximum enabled resolution."""


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
        probe = ffmpeg.probe(video_storage.url(source))
        dimensions_info = get_video_stream_dimensions_info(
            path=source, existing_probe=probe
        )
        resolution = dimensions_info["resolution"]
        max_enabled_resolution = settings.VIDEO_RESOLUTIONS[-1]
        if resolution > max_enabled_resolution:
            raise MaxResolutionError(
                f"Video resolution {resolution} is higher than the maximum enabled resolution "
                f"{max_enabled_resolution}. video {video.id} will not be transcoded."
            )

        video.duration = probe.get("format", {}).get("duration")
        video.size = probe.get("format", {}).get("size")
        video.save()

        prefix_destination = video.get_videos_storage_prefix(stamp)
        transcode_video(
            file_path=source,
            destination=prefix_destination,
            base_name=stamp,
            domain=domain,
        )
    except MaxResolutionError as exception:
        video.upload_error_reason = MAX_RESOLUTION_EXCEDEED
        video.update_upload_state(ERROR, None)
        logger.info(exception)
    except Exception as exception:  # pylint: disable=broad-except+
        capture_exception(exception)
        video.update_upload_state(ERROR, None)
        logger.exception(exception)


@app.task
def launch_video_transcript(
    video_pk: str, stamp: str, domain: str, video_url: str = None
):
    """Transcripts a video using video_storage.
    Args:
        video_pk (UUID): The video to transcript.
        stamp (str): The stamp at which the thumbnail was uploaded
        which will be used to find the key.
        domain (str): The domain name used to construct the download URL for peerTube runners.
        video_url (str): The video URL to transcript.
    """
    video = Video.objects.get(pk=video_pk)
    try:
        prefix_destination = video.get_videos_storage_prefix(stamp)
        transcript_args = {"destination": prefix_destination, "domain": domain}
        if video_url:
            transcript_args["video_url"] = video_url
        transcript_video(**transcript_args)
    except Exception as exception:  # pylint: disable=broad-except+
        capture_exception(exception)
        logger.exception(exception)


@app.task
def compute_video_information(video_pk: str):
    """
    Get probes from the video and update its size and duration
    """

    video = Video.objects.get(pk=video_pk)

    if video.upload_state != READY:
        return

    serializer = VideoSerializer(video)
    video_urls = serializer.data.get("urls").get("mp4")
    video_url = video_urls.get(max(video_urls.keys()))

    probe = ffmpeg.probe(video_url)

    video.duration = probe.get("format", {}).get("duration")
    video.size = probe.get("format", {}).get("size")
    video.save(update_fields=["duration", "size"])
