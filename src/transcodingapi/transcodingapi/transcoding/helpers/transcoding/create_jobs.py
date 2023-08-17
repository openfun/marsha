from __future__ import annotations

import logging

import ffmpeg

from ...models import Video, VideoFile, VideoResolution
from ..ffprobe import (
    get_video_stream_dimensions_info,
    get_video_stream_fps,
    has_audio_stream,
    is_audio_file,
)
from ..job_handlers.vod_audio_merge_transcoding_job_handler import (
    VODAudioMergeTranscodingJobHandler,
)
from ..job_handlers.vod_hls_transcoding_job_handler import (
    VODHLSTranscodingJobHandler,
)
from ..job_handlers.vod_web_video_transcoding_job_handler import (
    VODWebVideoTranscodingJobHandler,
)
from ..paths import get_fs_video_file_output_path
from ..resolutions import (
    compute_resolutions_to_transcode,
)

logger = logging.getLogger(__name__)

# This file should reproduce:
# https://github.com/Chocobozzz/PeerTube/blob/develop/server/lib/transcoding/shared/job-builders/transcoding-runner-job-builder.ts

VIDEO_TRANSCODING_FPS = {
    "MIN": 1,
    "STANDARD": [24, 25, 30],
    "HD_STANDARD": [50, 60],
    "AUDIO_MERGE": 25,
    "AVERAGE": 30,
    "MAX": 60,
    # We keep the original FPS on high resolutions (720 minimum)
    "KEEP_ORIGIN_FPS_RESOLUTION_MIN": 720,
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
        print(resolution)
        fps = compute_output_fps(fps=input_video_fps, resolution=resolution)

        VODWebVideoTranscodingJobHandler().create(
            video=video,
            resolution=resolution,
            fps=fps,
            depends_on_runner_job=main_runner_job,
            priority=0,
        )

        VODHLSTranscodingJobHandler().create(
            video=video,
            resolution=resolution,
            fps=fps,
            depends_on_runner_job=main_runner_job,
            priority=0,
        )


def create_optimize_or_merge_audio_jobs(video: Video, video_file: VideoFile):
    video_file_path = get_fs_video_file_output_path(video_file)
    probe = ffmpeg.probe(video_file_path)
    dimensionsInfo = get_video_stream_dimensions_info(probe)
    resolution = dimensionsInfo["resolution"]
    hasAudio = has_audio_stream(probe)
    inputFPS = (
        VIDEO_TRANSCODING_FPS.AUDIO_MERGE
        if video_file.is_audio()
        else get_video_stream_fps(probe)
    )

    maxResolution = DEFAULT_AUDIO_RESOLUTION if is_audio_file(probe) else resolution

    fps = compute_output_fps(inputFPS, maxResolution)
    priority = 0

    if video_file.is_audio():
        mainRunnerJob = VODAudioMergeTranscodingJobHandler().create(
            video=video,
            resolution=maxResolution,
            depends_on_runner_job=None,
            fps=fps,
            priority=priority,
        )
    else:
        mainRunnerJob = VODWebVideoTranscodingJobHandler().create(
            video=video,
            resolution=maxResolution,
            depends_on_runner_job=None,
            fps=fps,
            priority=priority,
        )

    VODHLSTranscodingJobHandler().create(
        video=video,
        resolution=maxResolution,
        fps=fps,
        depends_on_runner_job=mainRunnerJob,
        priority=priority,
    )

    build_lower_resolution_job_payloads(
        video=video,
        input_video_resolution=maxResolution,
        input_video_fps=inputFPS,
        has_audio=hasAudio,
        main_runner_job=mainRunnerJob,
    )
