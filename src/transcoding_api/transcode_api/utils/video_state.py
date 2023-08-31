from __future__ import annotations

import logging

from transcode_api.models import Video, VideoState

logger = logging.getLogger(__name__)


def video_is_published(video: Video):
    # TODO: Inform the back the video is published
    return True


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


def move_to_next_state(
    video: Video,
    previous_video_state: VideoState | None = None,
    is_new_video: bool = True,
):
    # Maybe the video changed in database, refresh it
    video.refresh_from_db()

    # Video does not exist anymore
    if not video:
        return None

    # Already in its final state
    if video.state == VideoState.PUBLISHED:
        return video_is_published(video)

    new_state = build_next_video_state(video.state)

    if new_state == VideoState.PUBLISHED:
        return move_to_published_state(video, previous_video_state, is_new_video)


def move_to_failed_transcoding_state(video: Video):
    if video.state == VideoState.TRANSCODING_FAILED:
        return

    video.state = VideoState.TRANSCODING_FAILED
    video.save()


def move_to_published_state(
    video: Video,
    is_new_video: bool,
    previous_video_state: VideoState | None = None,
):
    logger.info(
        "Publishing video %s.",
        video.uuid,
    )

    video.state = VideoState.PUBLISHED
    video.save()
    video_is_published(video)
