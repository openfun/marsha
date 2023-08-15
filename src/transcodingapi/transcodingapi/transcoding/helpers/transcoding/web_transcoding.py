from __future__ import annotations

import os
from shutil import move
from typing import TYPE_CHECKING

import ffmpeg

if TYPE_CHECKING:
    from ...models import Video, VideoFile
from ..ffprobe import get_video_stream_fps
from ..paths import build_file_metadata, get_fs_video_file_output_path


async def on_web_video_file_transcoding(
    video: Video, video_file: VideoFile, video_output_path, was_audio_file=False
):
    await video.refresh_from_db()

    output_path = get_fs_video_file_output_path(video_file)

    stats = await os.stat(video_output_path)

    probe = await ffmpeg.probe(video_output_path)
    fps = await get_video_stream_fps(video_output_path, probe)
    metadata = await build_file_metadata(probe=probe)

    await move(video_output_path, output_path, overwrite=True)

    video_file.size = stats.st_size
    video_file.fps = fps
    video_file.metadata = metadata

    # await create_torrent_and_set_info_hash(video, video_file)

    old_file = await VideoFile.load_web_video_file(
        video_id=video.id, fps=video_file.fps, resolution=video_file.resolution
    )  # TODO: implement models
    if old_file:
        await old_file.remove_web_video_file()  # TODO: implement models

    await VideoFile.custom_upsert(video_file, "video", None)  # TODO: implement models

    # if was_audio_file:
    #     await JobQueue.Instance.create_job(
    #         type="generate-video-storyboard",
    #         payload={"videoUUID": video.uuid, "federate": False},
    #     )

    return {"video": video, "videoFile": video_file}
