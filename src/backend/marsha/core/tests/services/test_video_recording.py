"""Tests for the video_recording service in the ``core`` app of the Marsha project."""
from datetime import timedelta
import random
from unittest import mock

from django.test import TestCase, override_settings
from django.utils import timezone

from marsha.core.defaults import HARVESTING, JITSI, LIVE_CHOICES, PENDING, RUNNING
from marsha.core.factories import VideoFactory
from marsha.core.services.video_recording import (
    VideoRecordingError,
    start_recording,
    stop_recording,
)
from marsha.core.utils.time_utils import to_timestamp


class VideoRecordingServicesTestCase(TestCase):
    """Test our intentions about the Video model."""

    def test_services_video_recording_start_recording_non_live(self):
        """A video recording cannot be started if live is not running."""
        video = VideoFactory(
            allow_recording=True,
            live_state=random.choice([s[0] for s in LIVE_CHOICES if s[0] != "running"]),
            live_type=JITSI,
        )

        with self.assertRaises(VideoRecordingError) as context:
            start_recording(video)

        self.assertEqual(str(context.exception), "Live is not running.")
        self.assertEqual(video.recording_slices, [])

    def test_services_video_recording_start_recording_not_allowed(self):
        """A video recording cannot be started if not allowed."""
        video = VideoFactory(allow_recording=False, live_state=RUNNING, live_type=JITSI)

        with self.assertRaises(VideoRecordingError) as context:
            start_recording(video)

        self.assertEqual(
            str(context.exception), "Recording is not allowed for this video."
        )

        self.assertEqual(video.recording_slices, [])

    def test_services_video_recording_start_recording_allowed_never_started(self):
        """A video recording can be started if allowed and has never started."""
        video = VideoFactory(allow_recording=True, live_state=RUNNING, live_type=JITSI)
        now = timezone.now()

        with mock.patch.object(timezone, "now", return_value=now):
            start_recording(video)

        self.assertEqual(video.recording_slices, [{"start": to_timestamp(now)}])

    def test_services_video_recording_start_recording_allowed_not_already_started(self):
        """A video recording can be started if allowed and not already started."""
        now = timezone.now()
        start = now - timedelta(minutes=20)
        stop = start + timedelta(minutes=10)
        video = VideoFactory(
            allow_recording=True,
            live_state=RUNNING,
            live_type=JITSI,
            recording_slices=[
                {"start": to_timestamp(start), "stop": to_timestamp(stop)}
            ],
        )

        with mock.patch.object(timezone, "now", return_value=now):
            start_recording(video)

        self.assertEqual(
            video.recording_slices,
            [
                {"start": to_timestamp(start), "stop": to_timestamp(stop)},
                {"start": to_timestamp(now)},
            ],
        )

    def test_services_video_recording_start_recording_allowed_already_started(self):
        """A video recording cannot be started if allowed and already started."""
        now = timezone.now()
        video = VideoFactory(
            allow_recording=True,
            live_state=RUNNING,
            live_type=JITSI,
            recording_slices=[{"start": to_timestamp(now)}],
        )

        with self.assertRaises(VideoRecordingError) as context:
            start_recording(video)

        self.assertEqual(str(context.exception), "Video recording is already started.")

        self.assertEqual(video.recording_slices, [{"start": to_timestamp(now)}])

    def test_services_video_recording_stop_recording_never_started(self):
        """A video recording cannot be ended if never started."""
        video = VideoFactory()

        with self.assertRaises(VideoRecordingError) as context:
            stop_recording(video)

        self.assertEqual(str(context.exception), "Video recording is not started.")

    def test_services_video_recording_stop_recording_not_already_started(self):
        """A video recording cannot be ended if not already started."""
        start = timezone.now() - timedelta(minutes=20)
        stop = timezone.now() + timedelta(minutes=10)
        video = VideoFactory(
            recording_slices=[
                {"start": to_timestamp(start), "stop": to_timestamp(stop)}
            ],
        )

        with self.assertRaises(VideoRecordingError) as context:
            stop_recording(video)

        self.assertEqual(str(context.exception), "Video recording is not started.")

    def test_services_video_recording_stop_recording_already_started(self):
        """A video recording can be ended if already started."""
        start = timezone.now()
        stop = start + timedelta(minutes=10)
        video = VideoFactory(
            recording_slices=[{"start": to_timestamp(start)}],
        )

        with mock.patch.object(timezone, "now", return_value=stop):
            stop_recording(video)

        self.assertEqual(
            video.recording_slices,
            [
                {
                    "start": to_timestamp(start),
                    "stop": to_timestamp(stop),
                    "status": PENDING,
                }
            ],
        )

    def test_services_video_recording_stop_recording_already_started_existing_slices(
        self,
    ):
        """Ending a video recording should conserve existing slices."""
        existing_start = timezone.now() - timedelta(hours=1)
        existing_stop = existing_start + timedelta(minutes=10)
        start = timezone.now()
        stop = start + timedelta(minutes=10)
        video = VideoFactory(
            recording_slices=[
                {
                    "start": to_timestamp(existing_start),
                    "stop": to_timestamp(existing_stop),
                    "status": HARVESTING,
                },
                {"start": to_timestamp(start)},
            ],
        )

        with mock.patch.object(timezone, "now", return_value=stop):
            stop_recording(video)

        self.assertEqual(
            video.recording_slices,
            [
                {
                    "start": to_timestamp(existing_start),
                    "stop": to_timestamp(existing_stop),
                    "status": HARVESTING,
                },
                {
                    "start": to_timestamp(start),
                    "stop": to_timestamp(stop),
                    "status": PENDING,
                },
            ],
        )

    @override_settings(LIVE_SEGMENT_DURATION_SECONDS=10)
    def test_services_recording_stop_recording_segment_too_short(self):
        """When start slice is lower than LIVE_SEGMENT_DURATION_SECONDS stop_recording should
        fails."""
        start = timezone.now() - timedelta(seconds=1)
        video = VideoFactory(
            recording_slices=[
                {"start": to_timestamp(start)},
            ],
        )

        with self.assertRaises(VideoRecordingError) as context:
            stop_recording(video)

        self.assertEqual(str(context.exception), "Segment not long enough.")
