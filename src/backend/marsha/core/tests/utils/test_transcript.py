"""Tests for the `core.utils.transcript` module."""

from unittest import mock

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from django_peertube_runner_connector.models import (
    Video as TranscriptedVideo,
    VideoState,
)

from marsha.core import defaults
from marsha.core.factories import UploadedVideoFactory
from marsha.core.models import TimedTextTrack
from marsha.core.storage.storage_class import video_storage
from marsha.core.utils.time_utils import to_timestamp
from marsha.core.utils.transcript import transcription_ended_callback
from marsha.websocket.utils import channel_layers_utils


class TranscriptTestCase(TestCase):
    """Test the `transcript` functions."""

    def test_transcription_ended_callback(self):
        """The marsha video should correctly be updated."""
        video = UploadedVideoFactory()
        video_timestamp = to_timestamp(video.uploaded_on)
        video_path = f"vod/{video.pk}/video/{video_timestamp}"

        transcripted_video = TranscriptedVideo.objects.create(
            state=VideoState.PUBLISHED,
            directory=video_path,
        )
        language = "en"
        vtt_file = SimpleUploadedFile(
            "file.vtt", b"file_content", content_type="text/vtt"
        )
        vtt_path = video_storage.save(
            f"{video_path}/{video_timestamp}-{language}.vtt", vtt_file
        )

        with mock.patch.object(
            channel_layers_utils, "dispatch_timed_text_track"
        ) as mock_dispatch_timed_text_track:
            transcription_ended_callback(transcripted_video, language, vtt_path)

        timed_text_track = video.timedtexttracks.get()
        self.assertEqual(timed_text_track.language, language)
        self.assertEqual(timed_text_track.mode, TimedTextTrack.TRANSCRIPT)
        self.assertEqual(timed_text_track.upload_state, defaults.READY)
        self.assertEqual(timed_text_track.extension, "vtt")

        ttt_path = timed_text_track.get_videos_storage_prefix()
        self.assertTrue(
            video_storage.exists(f"{ttt_path}/source.{timed_text_track.extension}")
        )
        self.assertTrue(
            video_storage.exists(
                f"{ttt_path}/{video_timestamp}.{timed_text_track.extension}"
            )
        )

        mock_dispatch_timed_text_track.assert_called_once_with(timed_text_track)
