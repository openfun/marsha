from __future__ import annotations

import logging
from typing import TYPE_CHECKING

import ffmpeg

if TYPE_CHECKING:
    from ..models import VideoResolution

logger = logging.getLogger(__name__)


async def get_video_stream_duration(path: str, existingProbe):
    metadata = existingProbe or await ffmpeg.probe(path)

    return round(metadata.format.duration)


async def get_video_stream(probe):
    return next((s for s in probe["streams"] if s["codec_type"] == "video"), None)


async def get_video_stream_dimensions_info(probe):
    videoStream = await get_video_stream(probe)
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


async def get_video_stream_fps(probe):
    videoStream = get_video_stream(probe)
    if not videoStream:
        return 0

    for key in ["avg_frame_rate", "r_frame_rate"]:
        valuesText = videoStream.get(key)
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


async def is_audio_file(probe):
    video_stream = await get_video_stream(probe)
    if not video_stream:
        return True

    if video_stream["codec_name"] in IMAGE_CODECS:
        return True

    return False


async def has_audio_stream(probe) -> bool:
    audio_stream = await get_audio_stream(probe)

    return bool(audio_stream.get("audio_stream", None))


async def get_audio_stream(probe):
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
