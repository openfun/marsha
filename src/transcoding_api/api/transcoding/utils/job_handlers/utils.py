from __future__ import annotations

import logging

from ...models import RunnerJob, Video
from ..video_state import move_to_next_state

logger = logging.getLogger(__name__)

WEBSERVER_URL = "http://127.0.0.1:8000"  # TODO: use settings


def generate_runner_transcoding_video_input_file_url(job_uuid, video_uuid):
    return (
        WEBSERVER_URL
        + f"/api/v1/runners/jobs/{job_uuid}/files/videos/{video_uuid}/max-quality"
    )


def load_transcoding_runner_video(runnerJob: RunnerJob):
    video_uuid = runnerJob.privatePayload["videoUUID"]

    try:
        video = Video.objects.get(uuid=video_uuid)
    except Video.DoesNotExist:
        logger.info(
            "Video %s does not exist anymore after transcoding runner job.", video_uuid
        )
        return None

    return video


def on_transcoding_ended(
    video: Video, is_new_video: bool, move_video_to_next_state: bool
):
    video.decrease_job_info("pendingTranscode")

    if move_video_to_next_state:
        move_to_next_state(
            video=video,
            is_new_video=is_new_video,
        )


# def on_vod_web_video_or_audio_merge_transcoding_job(
#     video: Video, video_file_path, private_payload
# ):
#     video_file = build_new_file(video=video, path=video_file_path, mode="web-video")

#     video_output_path = join(dirname(video_file_path), video_file.filename)
#     move(video_file_path, video_output_path)

#     on_web_video_file_transcoding(
#         video=video, video_file=video_file, video_output_path=video_output_path
#     )

#     on_transcoding_ended(
#         is_new_video=private_payload["isNewVideo"],
#         move_video_to_next_state=True,
#         video=video,
#     )

#     logger.info(
#         "VOD web video or audio merge transcoding job completed for video %s.",
#         video.uuid,
#     )
