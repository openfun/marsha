from __future__ import annotations

import logging
from os.path import dirname, join
from shutil import move
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ...models import RunnerJob, Video, VideoJobInfo

from ..files import build_new_file
from ..transcoding.web_transcoding import on_web_video_file_transcoding
from ..video_state import move_to_next_state

logger = logging.getLogger(__name__)


WEBSERVER_URL = "http://localhost:8080"  # TODO: use settings


# TODO: Implement theses apis ?
def generate_runner_transcoding_video_input_file_url(job_uuid, video_uuid):
    return (
        WEBSERVER_URL
        + f"/api/v1/runners/jobs/{job_uuid}/files/videos/{video_uuid}/max-quality"
    )


def get_local_video_activity_pub_url(video: Video) -> str:
    return WEBSERVER_URL + "/videos/watch/" + video.uuid


def generate_runner_transcoding_video_preview_file_url(job_uuid, video_uuid):
    return (
        WEBSERVER_URL
        + f"/api/v1/runners/jobs/{job_uuid}/files/videos/{video_uuid}/previews/max-quality"
    )


def generate_runner_edition_transcoding_video_input_file_url(
    job_uuid, video_uuid, filename
):
    return (
        WEBSERVER_URL
        + f"/api/v1/runners/jobs/{job_uuid}/files/videos/{video_uuid}/studio/task-files/{filename}"
    )


async def on_transcoding_ended(
    video: Video, is_new_video: bool, move_video_to_next_state: bool
):
    await VideoJobInfo.decrease(video.uuid, "pendingTranscode")

    if move_video_to_next_state:
        move_to_next_state(
            video=video,
            previous_video_state=is_new_video,
        )


async def load_transcoding_runner_video(runnerJob: RunnerJob):
    videoUUID = runnerJob.privatePayload.videoUUID

    try:
        video = Video.objects.get(uuid=videoUUID)
    except Video.DoesNotExist:
        logger.info(
            "Video %s does not exist anymore after transcoding runner job.", videoUUID
        )
        return None

    return video


async def on_vod_web_video_or_audio_merge_transcoding_job(
    video: Video, video_file_path, private_payload
):
    videoFile = await build_new_file(
        video=video, video_file_path=video_file_path, mode="web-video"
    )

    video_output_path = join(dirname(video_file_path), videoFile.filename)
    await move(video_file_path, video_output_path)

    await on_web_video_file_transcoding(
        video=video, videoFile=videoFile, video_output_path=video_output_path
    )

    await on_transcoding_ended(
        is_new_video=private_payload.isNewVideo,
        move_video_to_next_state=True,
        video=video,
    )

    logger.info(
        "VOD web video or audio merge transcoding job completed for video %s.",
        video.uuid,
    )
