from __future__ import annotations

import logging
import os

import ffmpeg

from ..models import Video, VideoFile, VideoResolution
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

logger = logging.getLogger(__name__)


def get_lower_case_extension(path: str) -> str:
    return os.path.splitext(path)[1].lower()


def build_new_file(video: Video, path, mode):
    probe = ffmpeg.probe(path)
    size = os.path.getsize(path)

    if is_audio_file(probe):
        fps = -1
        resolution = VideoResolution.H_NOVIDEO
    else:
        fps = get_video_stream_fps(probe)
        resolution = get_video_stream_dimensions_info(probe)["resolution"]

    video_file = VideoFile.objects.create(
        extname=get_lower_case_extension(path),
        size=size,
        metadata=build_file_metadata(probe=probe),
        resolution=resolution,
        fps=fps,
        video=video,
    )

    video_file.filename = (
        generate_web_video_filename(video_file.resolution, video_file.extname)
        if mode == "web-video"
        else generate_hls_video_filename(video_file.resolution)
    )

    video_file.save()

    return video_file
