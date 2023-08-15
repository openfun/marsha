from __future__ import annotations

import re
from os import makedirs, open, path, stat
from shutil import move
from typing import TYPE_CHECKING

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
    from ...models import Video, VideoFile

uuid_regex = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"


async def rename_video_file_in_playlist(
    playlist_path: str, new_video_filename: str
) -> None:
    with open(playlist_path) as f:
        content = f.read()

    new_content = re.sub(
        f"{uuid_regex}-\\d+-fragmented.mp4", new_video_filename, content
    )

    with open(playlist_path, "w") as f:
        f.write(new_content)


async def on_hls_video_file_transcoding(
    video: Video, video_file: VideoFile, m3u8_output_path, video_output_path
):
    # Create or update the playlist
    playlist = VideoStreamingPlaylist.load_or_generate(video)

    await video.reload()

    video_file_path = get_fs_video_file_output_path(video_file)
    await makedirs(get_fs_hls_output_path(video), exist_ok=True)

    # Move playlist file
    resolution_playlist_path = get_fs_hls_output_path(
        video, path.basename(m3u8_output_path)
    )
    await move(m3u8_output_path, resolution_playlist_path, overwrite=True)
    # Move video file
    await move(video_output_path, video_file_path, overwrite=True)

    # Update video duration if it was not set (in case of a live for example)
    if not video.duration:
        video.duration = await get_video_stream_duration(video_file_path)
        await video.save()

    stats = await stat(video_file_path)

    video_file.size = stats.st_size
    video_file.fps = await get_video_stream_fps(video_file_path)
    video_file.metadata = await build_file_metadata(video_file_path)

    # await create_torrent_and_set_info_hash(playlist, video_file)

    old_file = await VideoFile.load_hls_file(
        playlist_id=playlist.id,
        fps=video_file.fps,
        resolution=video_file.resolution,
    )

    if old_file:
        await video.remove_streaming_playlist_video_file(
            playlist, old_file
        )  # implement model
        await old_file.delete()

    saved_video_file = await VideoFile.custom_upsert(
        video_file, "streaming-playlist", None
    )

    # await update_playlist_after_file_change(video, playlist) # TODO: playlist ?

    return {
        "resolutionPlaylistPath": resolution_playlist_path,
        "videoFile": saved_video_file,
    }
