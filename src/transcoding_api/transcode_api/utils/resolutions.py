from django.conf import settings

from transcode_api.models import VideoResolution

CONFIG_TRANSCODING_RESOLUTIONS = {
    "144p": settings.TRANSCODING_RESOLUTIONS_144P,
    "240p": settings.TRANSCODING_RESOLUTIONS_240P,
    "360p": settings.TRANSCODING_RESOLUTIONS_360P,
    "480p": settings.TRANSCODING_RESOLUTIONS_480P,
    "720p": settings.TRANSCODING_RESOLUTIONS_720P,
    "1080p": settings.TRANSCODING_RESOLUTIONS_1080P,
    "1440p": settings.TRANSCODING_RESOLUTIONS_1440P,
    "2160p": settings.TRANSCODING_RESOLUTIONS_2160P,
}

CONFIG_TRANSCODING_ALWAYS_TRANSCODE_ORIGINAL_RESOLUTION = (
    settings.TRANSCODING_ALWAYS_TRANSCODE_ORIGINAL_RESOLUTION
)


def to_even(num: int) -> int:
    if is_odd(num):
        return num + 1

    return num


def is_odd(num: int) -> bool:
    return num % 2 != 0


def build_original_file_resolution(input_resolution: int) -> int:
    if CONFIG_TRANSCODING_ALWAYS_TRANSCODE_ORIGINAL_RESOLUTION:
        return to_even(input_resolution)

    resolutions = compute_resolutions_to_transcode(
        {
            "input": input_resolution,
            "type": "vod",
            "includeInput": False,
            "strictLower": False,
            "hasAudio": True,
        }
    )

    if not resolutions:
        return to_even(input_resolution)

    return max(resolutions)


def compute_resolutions_to_transcode(
    input_resolution: int,
    type: str,
    include_input: bool,
    strict_lower: bool,
    has_audio: bool,
) -> list[int]:
    config_resolutions = CONFIG_TRANSCODING_RESOLUTIONS

    resolutions_enabled = set()

    available_resolutions = [
        VideoResolution.H_NOVIDEO,
        VideoResolution.H_144P,
        VideoResolution.H_240P,
        VideoResolution.H_360P,
        VideoResolution.H_480P,
        VideoResolution.H_720P,
        VideoResolution.H_1080P,
        VideoResolution.H_1440P,
        VideoResolution.H_4K,
    ]

    for resolution in available_resolutions:
        if not config_resolutions.get(f"{resolution.value}p", None):
            continue
        if input_resolution < resolution.value:
            continue
        if strict_lower and input_resolution == resolution.value:
            continue
        if resolution == VideoResolution.H_NOVIDEO and not has_audio:
            continue

        resolutions_enabled.add(resolution.value)

    if include_input:
        resolutions_enabled.add(to_even(input_resolution))

    return sorted(resolutions_enabled)
