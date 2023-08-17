from __future__ import annotations

import logging

from ..models import Video, VideoState

logger = logging.getLogger(__name__)
OBJECT_STORAGE_ENABLED = True  # TODO: Settings


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

    if (
        current_state != VideoState.TO_MOVE_TO_EXTERNAL_STORAGE
        and OBJECT_STORAGE_ENABLED
    ):
        return VideoState.TO_MOVE_TO_EXTERNAL_STORAGE

    return VideoState.PUBLISHED


def move_to_next_state(
    video: Video,
    previous_video_state: VideoState | None = None,
    is_new_video: bool = True,
):
    # Maybe the video changed in database, refresh it
    video = video.refresh_from_db()

    # Video does not exist anymore
    if not video:
        return None

    # Already in its final state
    if video.state == VideoState.PUBLISHED:
        return video_is_published(video)

    new_state = build_next_video_state(video.state)

    if new_state == VideoState.PUBLISHED:
        return move_to_published_state(video, previous_video_state, is_new_video)

    if new_state == VideoState.TO_MOVE_TO_EXTERNAL_STORAGE:
        return move_to_external_storage_state(video, is_new_video)


async def move_to_external_storage_state(video: Video, is_new_video: bool, transaction):
    video_job_info = video.jobInfo
    pending_transcode = video_job_info.pendingTranscode or 0

    # We want to wait all transcoding jobs before moving the video on an external storage
    if pending_transcode != 0:
        return False

    # previous_video_state = video.state

    if video.state != VideoState.TO_MOVE_TO_EXTERNAL_STORAGE:
        await video.set_new_state(
            VideoState.TO_MOVE_TO_EXTERNAL_STORAGE, is_new_video, transaction
        )

    logger.info(
        "Creating external storage move job for video %s.",
        video.uuid,
        tags=[video.uuid],
    )

    try:
        # await build_move_to_object_storage_job(
        #     video, previous_video_state, is_new_video
        # )
        return True
    except Exception as err:
        logger.error("Cannot add move to object storage job", err=err)

        return False


def move_to_failed_transcoding_state(video: Video):
    if video.state == VideoState.TRANSCODING_FAILED:
        return

    return video.set_new_state(VideoState.TRANSCODING_FAILED, False, None)


def move_to_failed_move_to_object_storage_state(video: Video):
    if video.state == VideoState.TO_MOVE_TO_EXTERNAL_STORAGE_FAILED:
        return

    return video.set_new_state(
        VideoState.TO_MOVE_TO_EXTERNAL_STORAGE_FAILED, False, None
    )


async def move_to_published_state(
    video: Video,
    is_new_video: bool,
    previous_video_state: VideoState | None = None,
):
    previous_state = previous_video_state or video.state

    logger.info(
        "Publishing video %s.",
        video.uuid,
        isNewVideo=is_new_video,
        previousState=previous_state,
        tags=[video.uuid],
    )

    await video.set_new_state(VideoState.PUBLISHED, is_new_video)
    video_is_published(video)
    # if previous_state == VideoState.TO_EDIT:
    #     Notifier.Instance.notify_of_finished_video_studio_edition(video)
    #     return

    # if is_new_video:
    #     Notifier.Instance.notify_on_new_video_if_needed(video)

    #     if previous_state == VideoState.TO_TRANSCODE:
    #         Notifier.Instance.notify_on_video_published_after_transcoding(video)
