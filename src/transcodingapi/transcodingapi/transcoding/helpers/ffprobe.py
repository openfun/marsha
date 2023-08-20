from __future__ import annotations

import logging
from typing import TYPE_CHECKING

import ffmpeg

if TYPE_CHECKING:
    from ..models import VideoResolution

logger = logging.getLogger(__name__)


def get_video_stream_duration(path: str, existingProbe=None):
    metadata = existingProbe or ffmpeg.probe(path)

    return round(float(metadata["format"]["duration"]))


def get_video_stream(probe):
    steams = probe["streams"]
    for stream in steams:
        if stream["codec_type"] == "video":
            return stream
    return None


def get_video_stream_dimensions_info(probe):
    videoStream = get_video_stream(probe)
    if not videoStream:
        return {
            "width": 0,
            "height": 0,
            "ratio": 0,
            "resolution": VideoResolution.H_NOVIDEO,
            "isPortraitMode": False,
        }

    return {
        "width": videoStream["width"],
        "height": videoStream["height"],
        "ratio": max(videoStream["height"], videoStream["width"])
        / min(videoStream["height"], videoStream["width"]),
        "resolution": min(videoStream["height"], videoStream["width"]),
        "isPortraitMode": videoStream["height"] > videoStream["width"],
    }


def get_video_stream_fps(probe):
    video_stream = get_video_stream(probe)
    if not video_stream:
        return 0

    for key in ["avg_frame_rate", "r_frame_rate"]:
        valuesText = video_stream.get(key)
        if not valuesText:
            continue

        frames, seconds = valuesText.split("/")
        if not frames or not seconds:
            continue

        result = int(frames, 10) / int(seconds, 10)
        if result > 0:
            return round(result)

    return 0


IMAGE_CODECS = set(
    [
        "ansi",
        "apng",
        "bintext",
        "bmp",
        "brender_pix",
        "dpx",
        "exr",
        "fits",
        "gem",
        "gif",
        "jpeg2000",
        "jpgls",
        "mjpeg",
        "mjpegb",
        "msp2",
        "pam",
        "pbm",
        "pcx",
        "pfm",
        "pgm",
        "pgmyuv",
        "pgx",
        "photocd",
        "pictor",
        "png",
        "ppm",
        "psd",
        "sgi",
        "sunrast",
        "svg",
        "targa",
        "tiff",
        "txd",
        "webp",
        "xbin",
        "xbm",
        "xface",
        "xpm",
        "xwd",
    ]
)


def is_audio_file(probe):
    video_stream = get_video_stream(probe)
    if not video_stream:
        return True

    if video_stream["codec_name"] in IMAGE_CODECS:
        return True

    return False


def has_audio_stream(probe) -> bool:
    audio_stream = get_audio_stream(probe)

    return bool(audio_stream.get("audio_stream", None))


def get_audio_stream(probe):
    if isinstance(probe.get("streams"), list):
        audio_stream = next(
            (
                stream
                for stream in probe["streams"]
                if stream.get("codec_type") == "audio"
            ),
            None,
        )

        if audio_stream:
            return {
                "absolute_path": probe["format"]["filename"],
                "audio_stream": audio_stream,
                "bitrate": int(audio_stream.get("bit_rate")),
            }

    return {"absolutePath": probe["format"]["filename"]}
