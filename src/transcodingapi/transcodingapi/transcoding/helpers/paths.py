from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ..models import Video, VideoFile

import re
from os.path import basename, dirname, isabs, join, realpath
from uuid import uuid4

root_path = "/home/henri/Git/marsha/src/transcodingapi/"


def root() -> str:
    global root_path

    if root_path:
        return root_path

    root_path = dirname(realpath(__file__))

    if basename(root_path) == "tools":
        root_path = join(root_path, "..")
    if basename(root_path) == "scripts":
        root_path = join(root_path, "..")
    if basename(root_path) == "common":
        root_path = join(root_path, "..")
    if basename(root_path) == "core-utils":
        root_path = join(root_path, "..")
    if basename(root_path) == "shared":
        root_path = join(root_path, "..")
    if basename(root_path) == "server":
        root_path = join(root_path, "..")
    if basename(root_path) == "dist":
        root_path = join(root_path, "..")

    return root_path


def build_path(path: str) -> str:
    if isabs(path):
        return path

    return join(root(), path)


CONFIG_STORAGE_TORRENTS_DIR = build_path("storage/torrents/")  # TODO: use settings
VIDEO_LIVE_REPLAY_DIRECTORY = ""
DIRECTORIES_HLS_STREAMING_PLAYLIST_PUBLIC = build_path("storage/streaming-playlists")
DIRECTORIES_HLS_REDUNDANCY = build_path("storage/redundancy/")
DIRECTORIES_VIDEO_PUBLIC = build_path("storage/web-videos/")


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
    return (
        re.sub(r"-fragmented\.mp4$", "", video_filename, flags=re.IGNORECASE) + ".m3u8"
    )


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
        "chapter": probe.get("chapter", ""),
        "format": probe.get("format", ""),
        "streams": probe.get("streams", ""),
    }


def get_fs_hls_output_path(video: Video, filename: str = None) -> str:
    base = get_hls_directory(video)
    if not filename:
        return base

    return join(base, filename)
