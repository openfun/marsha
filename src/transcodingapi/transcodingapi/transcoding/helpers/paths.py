from __future__ import annotations

import re
from os.path import join
from uuid import uuid4

CONFIG_STORAGE_TORRENTS_DIR = ""  # TODO: use settings
VIDEO_LIVE_REPLAY_DIRECTORY = ""
DIRECTORIES_HLS_STREAMING_PLAYLIST_PUBLIC = ""
DIRECTORIES_HLS_REDUNDANCY = ""
DIRECTORIES_VIDEO_PUBLIC = ""


def generate_web_video_filename(resolution: int, extname: str):
    return str(uuid4()) + "-" + str(resolution) + extname


def generate_hls_video_filename(resolution: int):
    return f"{str(uuid4())}-{str(resolution)}-fragmented.mp4"


def get_live_directory(video: Video):
    return get_hls_directory(video)


def get_live_replay_base_directory(video: Video):
    return join(get_live_directory(video), VIDEO_LIVE_REPLAY_DIRECTORY)


def get_hls_directory(video: Video):
    return join(DIRECTORIES_HLS_STREAMING_PLAYLIST_PUBLIC, str(video.uuid))


def get_hls_redundancy_directory(video: Video):
    return join(DIRECTORIES_HLS_REDUNDANCY, str(video.uuid))


def get_hls_resolution_playlist_filename(video_filename: str):
    return re.sub(r"-fragmented\.mp4$", "", video_filename, flags=re.IGNORECASE)


def generate_hls_master_playlist_filename(is_live: bool = False):
    if is_live:
        return "master.m3u8"

    return str(uuid4()) + "-master.m3u8"


def generate_hls_sha256_segments_filename(is_live: bool = False):
    if is_live:
        return "segments-sha256.json"

    return str(uuid4()) + "-segments-sha256.json"


def generate_torrent_file_name(video_or_playlist, resolution: int):
    extension = ".torrent"
    uuid = str(uuid4())

    if video_or_playlist.get("videoId", None) is not None:
        return (
            f"{uuid}-{str(resolution)}-{video_or_playlist.get_string_type()}{extension}"
        )

    return uuid + "-" + str(resolution) + extension


def get_fs_torrent_file_path(video_file: VideoFile):
    return join(CONFIG_STORAGE_TORRENTS_DIR, video_file.torrent_filename)


def get_fs_video_file_output_path(video_file: VideoFile) -> str:
    return join(DIRECTORIES_VIDEO_PUBLIC, video_file.filename)


def build_file_metadata(probe):
    return {
        "chapter": probe["chapter"],
        "format": probe["format"],
        "streams": probe["streams"],
    }


def get_fs_hls_output_path(video: Video, filename: str = None) -> str:
    base = get_hls_directory(video)
    if not filename:
        return base

    return join(base, filename)
