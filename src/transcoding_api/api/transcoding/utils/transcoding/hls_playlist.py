from __future__ import annotations

import logging
import os
import re

import ffmpeg

from api.transcoding.storage import video_storage

from ...models import Video, VideoFile, VideoStreamingPlaylist
from ..ffprobe import (
    get_video_stream_dimensions_info,
    get_video_stream_duration,
    get_video_stream_fps,
)
from ..files import (
    build_file_metadata,
    get_hls_resolution_playlist_filename,
)
from .codecs import get_audio_stream_codec, get_video_stream_codec

logger = logging.getLogger(__name__)

uuid_regex = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"


def rename_video_file_in_playlist(playlist_path: str, new_video_filename: str) -> None:
    with video_storage.open(playlist_path, "r") as f:
        content = f.read()

    new_content = re.sub(
        f"{uuid_regex}-\\d+-fragmented.mp4", new_video_filename, str(content)
    )

    with video_storage.open(playlist_path, "w") as f:
        f.write(new_content)


def on_hls_video_file_transcoding(video: Video, video_file: VideoFile):
    try:
        playlist = VideoStreamingPlaylist.objects.get(video=video)
    except VideoStreamingPlaylist.DoesNotExist:
        playlist = VideoStreamingPlaylist.objects.create(
            video=video,
        )

    video_file_path = video_storage.path(video_file.filename)
    video_file.streamingPlaylist = playlist
    probe = ffmpeg.probe(video_file_path)

    # Update video duration if it was not set (in case of a live for example)
    if not video.duration:
        video.duration = get_video_stream_duration(
            video_file_path, existing_probe=probe
        )

    video_file.size = int(probe["format"]["size"])
    video_file.fps = get_video_stream_fps(probe)
    video_file.metadata = build_file_metadata(probe)

    video_file.save()
    video.save()
    update_master_hls_playlist(video, playlist)


def update_master_hls_playlist(video: Video, playlist: VideoStreamingPlaylist):
    master_playlists = ["#EXTM3U", "#EXT-X-VERSION:3"]
    playlist.refresh_from_db()

    if not playlist.videoFiles.all():
        logger.info(
            "Cannot update master playlist file of video %s: no video files.",
            video.uuid,
        )
        return

    for file in playlist.videoFiles.all():
        video_file_path = video_storage.path(file.filename)
        playlist_filename = get_hls_resolution_playlist_filename(
            os.path.basename(file.filename)
        )

        size = get_video_stream_dimensions_info(path=video_file_path)

        bandwidth = "BANDWIDTH=" + str(video.get_bandwidth_bits(file))
        resolution = f"RESOLUTION={size['width'] or 0}x{size['height'] or 0}"

        line = f"#EXT-X-STREAM-INF:{bandwidth},{resolution}"
        if file.fps:
            line += f",FRAME-RATE={file.fps}"

        codecs = [
            get_video_stream_codec(video_file_path),
            get_audio_stream_codec(video_file_path),
        ]

        line += f',CODECS="{",".join(filter(None, codecs))}"'

        master_playlists.append(line)
        master_playlists.append(playlist_filename)

    master_playlist_path = f"video-{video.uuid}/master.m3u8"
    playlist.playlistFilename = master_playlist_path
    playlist.save()

    with video_storage.open(master_playlist_path, "w") as f:
        for playlist_element in master_playlists:
            f.write(playlist_element + "\n")

    logger.info(
        "Updating %s master playlist file of video %s",
        master_playlist_path,
        video.uuid,
    )
