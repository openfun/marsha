"""Services for video recording."""

from django.conf import settings
from django.utils import timezone

from marsha.core.defaults import PENDING, RUNNING
from marsha.core.utils.time_utils import to_datetime, to_timestamp


class VideoRecordingError(Exception):
    """Exception for video recording errors."""


def start_recording(video):
    """Start recording the video."""
    if video.live_state != RUNNING:
        raise VideoRecordingError("Live is not running.")

    if not video.allow_recording:
        raise VideoRecordingError("Recording is not allowed for this video.")

    if video.is_recording:
        raise VideoRecordingError("Video recording is already started.")

    slices = video.recording_slices
    slices.append({"start": to_timestamp(timezone.now())})
    video.recording_slices = slices
    video.save()


def stop_recording(video):
    """Stop recording the video."""
    if not video.is_recording:
        raise VideoRecordingError("Video recording is not started.")

    slices = video.recording_slices
    now = timezone.now()
    diff = now - to_datetime(slices[-1].get("start"))
    if diff.total_seconds() < settings.LIVE_SEGMENT_DURATION_SECONDS:
        raise VideoRecordingError("Segment not long enough.")
    slices[-1].update({"stop": to_timestamp(now), "status": PENDING})
    video.recording_slices = slices
    video.save()
