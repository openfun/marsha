import logging
import os
import re
from uuid import uuid4

import ffmpeg

from transcode_api.models import Video, VideoFile, VideoResolution
from transcode_api.storage import video_storage

from .ffprobe import (
    build_file_metadata,
    get_video_stream_dimensions_info,
    get_video_stream_fps,
    is_audio_file,
)

logger = logging.getLogger(__name__)


def get_video_directory(video: Video, suffix: str = ""):
    return f"video-{video.uuid}/{suffix}"


def get_lower_case_extension(path: str) -> str:
    return os.path.splitext(path)[1].lower()


def generate_web_video_filename(resolution: int, extname: str):
    return str(uuid4()) + "-" + str(resolution) + extname


def generate_hls_video_filename(resolution: int):
    return f"{str(uuid4())}-{str(resolution)}-fragmented.mp4"


def get_hls_resolution_playlist_filename(video_filename: str):
    return (
        re.sub(r"-fragmented\.mp4$", "", video_filename, flags=re.IGNORECASE) + ".m3u8"
    )


def generate_hls_master_playlist_filename(is_live: bool = False):
    if is_live:
        return "master.m3u8"

    return str(uuid4()) + "-master.m3u8"


def build_new_file(video: Video, filename: str, mode, existing_probe=None):
    if not existing_probe:
        path = video_storage.path(filename)
        probe = ffmpeg.probe(path)
    else:
        path = ""
        probe = existing_probe

    size = int(probe["format"]["size"])

    if is_audio_file(probe):
        fps = -1
        resolution = VideoResolution.H_NOVIDEO
    else:
        fps = get_video_stream_fps(probe)
        resolution = get_video_stream_dimensions_info(path, probe)["resolution"]

    video_file = VideoFile.objects.create(
        extname=get_lower_case_extension(path),
        size=size,
        metadata=build_file_metadata(probe=probe),
        resolution=resolution,
        filename=filename,
        fps=fps,
        video=video,
    )

    return video_file
