from __future__ import annotations

import logging

from transcode_api.models import RunnerJob, Video
from transcode_api.utils.video_state import move_to_next_state

logger = logging.getLogger(__name__)


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


def on_transcoding_ended(video: Video, move_video_to_next_state: bool):
    video.decrease_job_info("pendingTranscode")

    if move_video_to_next_state:
        move_to_next_state(video=video)


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


# def on_web_video_file_transcoding(
#     video: Video, video_file: VideoFile, video_output_path, was_audio_file=False
# ):
#     video.refresh_from_db()

#     output_path = "get_fs_video_file_output_path(video_file)"

#     probe = ffmpeg.probe(video_output_path)

#     stats = os.stat(video_output_path)

#     fps = get_video_stream_fps(probe)
#     metadata = build_file_metadata(probe=probe)

#     move(video_output_path, output_path)

#     video_file.size = stats.st_size
#     video_file.fps = fps
#     video_file.metadata = metadata

#     old_file = VideoFile.objects.filter(
#         video=video, fps=video_file.fps, resolution=video_file.resolution
#     ).first()
#     if old_file:
#         old_file.remove_web_video_file()

#     video_file.save()

#     return {"video": video, "videoFile": video_file}
