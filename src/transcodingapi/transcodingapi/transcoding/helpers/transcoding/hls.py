from __future__ import annotations

import re
from os import makedirs, path, stat
from shutil import move
from typing import TYPE_CHECKING

import ffmpeg

from ...models import Video, VideoFile
from ..ffprobe import (
    get_video_stream_duration,
    get_video_stream_fps,
)
from ..paths import (
    build_file_metadata,
    get_fs_hls_output_path,
    get_fs_video_file_output_path,
)

if TYPE_CHECKING:
    pass

uuid_regex = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"


def rename_video_file_in_playlist(playlist_path: str, new_video_filename: str) -> None:
    with open(playlist_path) as f:
        content = f.read()

    new_content = re.sub(
        f"{uuid_regex}-\\d+-fragmented.mp4", new_video_filename, content
    )

    with open(playlist_path, "w") as f:
        f.write(new_content)


def on_hls_video_file_transcoding(
    video: Video, video_file: VideoFile, m3u8_output_path, video_output_path
):
    # Create or update the playlist
    # playlist = VideoStreamingPlaylist.load_or_generate(video)

    video.refresh_from_db()

    video_file_path = get_fs_video_file_output_path(video_file)
    makedirs(get_fs_hls_output_path(video), exist_ok=True)

    # Move playlist file
    resolution_playlist_path = get_fs_hls_output_path(
        video, path.basename(m3u8_output_path)
    )
    move(m3u8_output_path, resolution_playlist_path)
    # Move video file
    move(video_output_path, video_file_path)

    # Update video duration if it was not set (in case of a live for example)
    if not video.duration:
        video.duration = get_video_stream_duration(video_file_path)
        video.save()

    stats = stat(video_file_path)

    video_file.size = stats.st_size
    probe = ffmpeg.probe(video_file_path)
    video_file.fps = get_video_stream_fps(probe)
    video_file.metadata = build_file_metadata(probe)

    # create_torrent_and_set_info_hash(playlist, video_file)

    # old_file = VideoFile.load_hls_file(
    #     playlist_id=playlist.id,
    #     fps=video_file.fps,
    #     resolution=video_file.resolution,
    # )

    # if old_file:
    #     video.remove_streaming_playlist_video_file(
    #         playlist, old_file
    #     )  # TODO: implement model
    #     old_file.delete()

    video_file.save()

    # await update_playlist_after_file_change(video, playlist) # TODO: playlist ?

    return {
        "resolution_playlist_path": resolution_playlist_path,
        "video_file": video_file,
    }
