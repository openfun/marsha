from __future__ import annotations

import logging

from django.conf import settings
from django.utils.module_loading import import_string

from django_peertube_runner_connector.models import Video, VideoState

logger = logging.getLogger(__name__)


def video_is_published(video: Video):
    try:
        callback_path = settings.TRANSCODING_VIDEO_IS_PUBLISHED_CALLBACK_PATH
        if not callback_path:
            return

        callback = import_string(callback_path)
        callback(video)
    except Exception:
        logger.error("Error in video_is_published callback")


def build_next_video_state(current_state: VideoState = None) -> VideoState:
    if current_state == VideoState.PUBLISHED:
        raise ValueError("Video is already in its final state")

    if current_state not in [
        VideoState.TO_EDIT,
        VideoState.TO_TRANSCODE,
        VideoState.TO_MOVE_TO_EXTERNAL_STORAGE,
    ]:
        return VideoState.TO_TRANSCODE

    return VideoState.PUBLISHED


def move_to_next_state(video: Video):
    # Maybe the video changed in database, refresh it
    video.refresh_from_db()

    # Already in its final state
    if video.state == VideoState.PUBLISHED:
        return video_is_published(video)

    new_state = build_next_video_state(video.state)

    if new_state == VideoState.PUBLISHED:
        return move_to_published_state(video)


def move_to_failed_transcoding_state(video: Video):
    if video.state == VideoState.TRANSCODING_FAILED:
        return

    video.state = VideoState.TRANSCODING_FAILED
    video.save()


def move_to_published_state(video: Video):
    logger.info(
        "Publishing video %s.",
        video.uuid,
    )

    video.state = VideoState.PUBLISHED
    video.save()
    video_is_published(video)
