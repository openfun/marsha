import logging

import ffmpeg
from django.conf import settings

from api.transcoding.storage import video_storage

from ...models import Video, VideoFile, VideoResolution
from ..ffprobe import (
    get_video_stream_dimensions_info,
    get_video_stream_fps,
    has_audio_stream,
    is_audio_file,
)
from ..job_handlers.vod_hls_transcoding_job_handler import (
    VODHLSTranscodingJobHandler,
)
from ..resolutions import (
    compute_resolutions_to_transcode,
)

logger = logging.getLogger(__name__)

# This file should reproduce:
# https://github.com/Chocobozzz/PeerTube/blob/develop/server/server/lib/transcoding/shared/job-builders/transcoding-runner-job-builder.ts

VIDEO_TRANSCODING_FPS = {
    "MIN": settings.TRANSCODING_FPS_MIN,
    "STANDARD": settings.TRANSCODING_FPS_STANDARD,
    "HD_STANDARD": settings.TRANSCODING_FPS_HD_STANDARD,
    "AUDIO_MERGE": settings.TRANSCODING_FPS_AUDIO_MERGE,
    "AVERAGE": settings.TRANSCODING_FPS_AVERAGE,
    "MAX": settings.TRANSCODING_FPS_MAX,
    # We keep the original FPS on high resolutions (720 minimum)
    "KEEP_ORIGIN_FPS_RESOLUTION_MIN": settings.TRANSCODING_FPS_KEEP_ORIGIN_FPS_RESOLUTION_MIN,
}

DEFAULT_AUDIO_RESOLUTION = VideoResolution.H_480P


def compute_output_fps(resolution, fps):
    if (
        resolution is not None
        and resolution < VIDEO_TRANSCODING_FPS["KEEP_ORIGIN_FPS_RESOLUTION_MIN"]
        and fps > VIDEO_TRANSCODING_FPS["AVERAGE"]
    ):
        fps = get_closest_framerate_standard(fps, "STANDARD")

    if fps > VIDEO_TRANSCODING_FPS["MAX"]:
        fps = get_closest_framerate_standard(fps, "HD_STANDARD")

    if fps < VIDEO_TRANSCODING_FPS["MIN"]:
        raise ValueError(
            f"Cannot compute FPS because {fps} is "
            f"lower than our minimum value {VIDEO_TRANSCODING_FPS['MIN']}"
        )

    return fps


def get_closest_framerate_standard(fps, type):
    return sorted(VIDEO_TRANSCODING_FPS[type], key=lambda x: fps % x)[0]


def build_lower_resolution_job_payloads(
    video: Video, input_video_resolution, input_video_fps, has_audio, main_runner_job
):
    resolutions_enabled = compute_resolutions_to_transcode(
        input_resolution=input_video_resolution,
        type="vod",
        include_input=False,
        strict_lower=True,
        has_audio=has_audio,
    )
    logger.debug(
        "Lower resolutions build for %s.",
        video.uuid,
    )

    for resolution in resolutions_enabled:
        fps = compute_output_fps(fps=input_video_fps, resolution=resolution)

        VODHLSTranscodingJobHandler().create(
            video=video,
            resolution=resolution,
            fps=fps,
            depends_on_runner_job=main_runner_job,
            priority=0,
        )


def create_transcoding_jobs(video: Video, video_file: VideoFile, existing_probe=None):
    video_file_path = video_storage.path(video_file.filename)
    if not existing_probe:
        probe = ffmpeg.probe(video_file_path)
    else:
        probe = existing_probe

    dimensions_info = get_video_stream_dimensions_info(
        path=video_file_path, existing_probe=probe
    )
    resolution = dimensions_info["resolution"]
    has_audio = has_audio_stream(probe)
    input_fps = (
        VIDEO_TRANSCODING_FPS.AUDIO_MERGE
        if video_file.is_audio()
        else get_video_stream_fps(probe)
    )

    max_resolution = DEFAULT_AUDIO_RESOLUTION if is_audio_file(probe) else resolution

    fps = compute_output_fps(input_fps, max_resolution)
    priority = 0

    mainRunnerJob = VODHLSTranscodingJobHandler().create(
        video=video,
        resolution=max_resolution,
        fps=fps,
        depends_on_runner_job=None,
        priority=priority,
    )

    build_lower_resolution_job_payloads(
        video=video,
        input_video_resolution=max_resolution,
        input_video_fps=input_fps,
        has_audio=has_audio,
        main_runner_job=mainRunnerJob,
    )
