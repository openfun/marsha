"""Services for video recording."""
from django.utils import timezone

from ..defaults import PENDING, RUNNING
from ..utils.time_utils import to_timestamp


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
    slices[-1].update({"stop": to_timestamp(timezone.now()), "status": PENDING})
    video.recording_slices = slices
    video.save()
