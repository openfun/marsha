import tempfile

import ffmpeg

from transcode_api.models import Video, VideoFile
from transcode_api.storage import video_storage

from .ffprobe import get_video_stream_dimensions_info
from .files import get_video_directory


def build_video_thumbnails(video=Video, video_file=VideoFile, existing_probe=None):
    video_path = video_storage.path(video_file.filename)
    thumbnail_filename = get_video_directory(video, "thumbnail.jpg")

    duration = video.duration
    get_video_stream_dimensions_info(path=video_path, existing_probe=existing_probe)

    with tempfile.NamedTemporaryFile(suffix=".jpg") as f:
        output_path = f.name

        input_stream = ffmpeg.input(video_path)

        output_stream = ffmpeg.filter(
            input_stream,
            "select",
            f"gte(n,{duration / 2})",
        ).output(output_path, vframes=1)

        ffmpeg.run(output_stream, overwrite_output=True, quiet=True)
        video_storage.save(thumbnail_filename, open(output_path, "rb"))

    return thumbnail_filename
