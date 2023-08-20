from __future__ import annotations

import os
from shutil import move

import ffmpeg

from ...models import Video, VideoFile
from ..ffprobe import get_video_stream_fps
from ..paths import build_file_metadata, get_fs_video_file_output_path


def on_web_video_file_transcoding(
    video: Video, video_file: VideoFile, video_output_path, was_audio_file=False
):
    video.refresh_from_db()

    output_path = get_fs_video_file_output_path(video_file)

    stats = os.stat(video_output_path)

    probe = ffmpeg.probe(video_output_path)
    fps = get_video_stream_fps(probe)
    metadata = build_file_metadata(probe=probe)

    move(video_output_path, output_path)

    video_file.size = stats.st_size
    video_file.fps = fps
    video_file.metadata = metadata

    # await create_torrent_and_set_info_hash(video, video_file)

    old_file = VideoFile.objects.filter(
        video=video, fps=video_file.fps, resolution=video_file.resolution
    ).first()
    if old_file:
        old_file.remove_web_video_file()

    video_file.save()

    # if was_audio_file:
    #     await JobQueue.Instance.create_job(
    #         type="generate-video-storyboard",
    #         payload={"videoUUID": video.uuid, "federate": False},
    #     )

    return {"video": video, "videoFile": video_file}
