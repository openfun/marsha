from __future__ import annotations

import logging
import os
from typing import TYPE_CHECKING

import ffmpeg

from .ffprobe import (
    get_video_stream_dimensions_info,
    get_video_stream_fps,
    is_audio_file,
)
from .paths import (
    build_file_metadata,
    generate_hls_video_filename,
    generate_web_video_filename,
)

if TYPE_CHECKING:
    from ..models import Video, VideoFile, VideoResolution

logger = logging.getLogger(__name__)


def get_lower_case_extension(path: str) -> str:
    return os.path.splitext(path)[1].lower()


def build_new_file(video: Video, path, mode):
    probe = ffmpeg.probe(path)
    size = os.path.getsize(path)

    videoFile = VideoFile.objects.create(
        extname=get_lower_case_extension(path),
        size=size,
        metadata={build_file_metadata(probe=probe)},
        video=video,
    )

    if is_audio_file(probe):
        videoFile.resolution = VideoResolution.H_NOVIDEO
    else:
        videoFile.fps = get_video_stream_fps(probe)
        videoFile.resolution = get_video_stream_dimensions_info(probe).resolution

    videoFile.filename = (
        generate_web_video_filename(videoFile.resolution, videoFile.extname)
        if mode == "web-video"
        else generate_hls_video_filename(videoFile.resolution)
    )

    return videoFile
