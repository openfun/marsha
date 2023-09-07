import logging

from django_peertube_runner_connector.utils.ffprobe import get_audio_stream, get_video_stream

logger = logging.getLogger(__name__)


def get_video_stream_codec(path: str, existing_probe=None):
    video_stream = get_video_stream(path, existing_probe=existing_probe)
    if not video_stream:
        return ""

    video_codec = video_stream["codec_tag_string"]

    if video_codec == "vp09":
        return "vp09.00.50.08"
    if video_codec == "hev1":
        return "hev1.1.6.L93.B0"

    base_profile_matrix = {
        "avc1": {"High": "6400", "Main": "4D40", "Baseline": "42E0"},
        "av01": {"High": "1", "Main": "0", "Professional": "2"},
    }

    if video_codec not in base_profile_matrix:
        logger.warn("Cannot get video codec of %s.", path)
        return ""

    base_profile = base_profile_matrix[video_codec].get(video_stream["profile"], None)
    if not base_profile:
        logger.warn(
            "Cannot get video profile codec of %s.",
            path,
        )
        base_profile = base_profile_matrix[video_codec]["High"]  # Fallback

    if video_codec == "av01":
        level = str(video_stream.get("level"))
        if len(level) == 1:
            level = "0" + level

        # Guess the tier indicator and bit depth
        return f"{video_codec}.{base_profile}.{level}M.08"

    level = hex(int(video_stream["level"]))[2:]
    if len(level) == 1:
        level = "0" + level

    # Default, h264 codec
    return f"{video_codec}.{base_profile}{level}"


def get_audio_stream_codec(path: str, existing_probe=None):
    audio_stream = get_audio_stream(path, existing_probe=existing_probe).get(
        "audio_stream", None
    )

    if not audio_stream:
        return ""

    audio_codec_name = audio_stream["codec_name"]

    if audio_codec_name == "opus":
        return "opus"
    if audio_codec_name == "vorbis":
        return "vorbis"
    if audio_codec_name == "aac":
        return "mp4a.40.2"
    if audio_codec_name == "mp3":
        return "mp4a.40.34"

    logger.warn("Cannot get audio codec of %s.", path)

    return "mp4a.40.2"  # Fallback
