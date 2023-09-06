from __future__ import annotations

import logging
import os
import re

import ffmpeg
from django.core.files.uploadedfile import SimpleUploadedFile

from transcode_api.models import Video, VideoFile, VideoStreamingPlaylist
from transcode_api.storage import video_storage
from transcode_api.utils.ffprobe import (
    get_video_stream_dimensions_info,
    get_video_stream_duration,
    get_video_stream_fps,
)
from transcode_api.utils.files import (
    build_file_metadata,
    get_hls_resolution_playlist_filename,
    get_video_directory,
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

    video_file_url = video_storage.url(video_file.filename)
    video_file.streamingPlaylist = playlist
    probe = ffmpeg.probe(video_file_url)

    # Update video duration if it was not set (in case of a live for example)
    if not video.duration:
        video.duration = get_video_stream_duration(video_file_url, existing_probe=probe)

    video_file.size = int(probe["format"]["size"])
    video_file.fps = get_video_stream_fps(probe)
    video_file.metadata = build_file_metadata(probe)

    video_file.save()
    video.save()

    update_master_hls_playlist(video, playlist)


def update_master_hls_playlist(video: Video, playlist: VideoStreamingPlaylist):
    master_playlist_elements = ["#EXTM3U", "#EXT-X-VERSION:3"]
    playlist.refresh_from_db()

    if not playlist.videoFiles.all():
        logger.info(
            "Cannot update master playlist file of video %s: no video files.",
            video.uuid,
        )
        return

    for file in playlist.videoFiles.all():
        video_file_url = video_storage.url(file.filename)
        probe = ffmpeg.probe(video_file_url)
        playlist_filename = get_hls_resolution_playlist_filename(
            os.path.basename(file.filename)
        )

        size = get_video_stream_dimensions_info(
            path=file.filename, existing_probe=probe
        )

        bandwidth = "BANDWIDTH=" + str(video.get_bandwidth_bits(file))
        resolution = f"RESOLUTION={size['width'] or 0}x{size['height'] or 0}"

        line = f"#EXT-X-STREAM-INF:{bandwidth},{resolution}"
        if file.fps:
            line += f",FRAME-RATE={file.fps}"

        codecs = [
            get_video_stream_codec(file.filename, probe),
            get_audio_stream_codec(file.filename, probe),
        ]

        line += f',CODECS="{",".join(filter(None, codecs))}"'

        master_playlist_elements.append(line)
        master_playlist_elements.append(playlist_filename)

    master_playlist_path = get_video_directory(video, "master.m3u8")
    playlist.playlistFilename = master_playlist_path
    playlist.save()

    master_playlist_content = SimpleUploadedFile(
        "master.m3u8", b"", content_type="m3u8"
    )

    for playlist_element in master_playlist_elements:
        master_playlist_content.write(f"{playlist_element}\n".encode())

    if video_storage.exists(master_playlist_path):
        video_storage.delete(master_playlist_path)
    video_storage.save(master_playlist_path, master_playlist_content)
    logger.info(
        "Updating %s master playlist file of video %s",
        master_playlist_path,
        video.uuid,
    )
