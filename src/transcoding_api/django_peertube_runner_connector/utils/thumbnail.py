import tempfile

import ffmpeg

from django_peertube_runner_connector.models import Video, VideoFile
from django_peertube_runner_connector.storage import video_storage

from .ffprobe import get_video_stream_dimensions_info
from .files import get_video_directory


def build_video_thumbnails(video=Video, video_file=VideoFile, existing_probe=None):
    video_url = video_storage.url(video_file.filename)
    thumbnail_filename = get_video_directory(video, "thumbnail.jpg")

    duration = video.duration
    get_video_stream_dimensions_info(path=video_url, existing_probe=existing_probe)

    with tempfile.NamedTemporaryFile(suffix=".jpg") as f:
        output_path = f.name

        input_stream = ffmpeg.input(video_url)

        output_stream = ffmpeg.filter(
            input_stream,
            "select",
            f"gte(n,{duration / 2})",
        ).output(output_path, vframes=1)

        ffmpeg.run(output_stream, overwrite_output=True, quiet=True)
        thumbnail_filename = video_storage.save(
            thumbnail_filename, open(output_path, "rb")
        )

        return thumbnail_filename
