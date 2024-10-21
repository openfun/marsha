"""Tests for the `core.utils.transcript` module."""

from unittest.mock import patch

from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings

from django_peertube_runner_connector.models import (
    Video as TranscriptedVideo,
    VideoState,
)

from marsha.core import defaults
from marsha.core.factories import (
    TimedTextTrackFactory,
    UploadedVideoFactory,
    VideoFactory,
)
from marsha.core.models import TimedTextTrack
from marsha.core.storage.storage_class import video_storage
from marsha.core.utils import transcript_utils
from marsha.core.utils.time_utils import to_timestamp
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

        with patch.object(
            channel_layers_utils, "dispatch_timed_text_track"
        ) as mock_dispatch_timed_text_track, patch.object(
            channel_layers_utils, "dispatch_video"
        ) as mock_dispatch_video:
            transcript_utils.transcription_ended_callback(
                transcripted_video, language, vtt_path
            )

        timed_text_track = video.timedtexttracks.get()
        self.assertEqual(timed_text_track.language, language)
        self.assertEqual(timed_text_track.mode, TimedTextTrack.SUBTITLE)
        self.assertEqual(timed_text_track.upload_state, defaults.READY)
        self.assertEqual(timed_text_track.extension, "vtt")

        video.refresh_from_db()
        self.assertTrue(video.should_use_subtitle_as_transcript)

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
        mock_dispatch_video.assert_called_once_with(video)

    def test_transcription_error_callback(self):
        """The marsha video should correctly be updated."""
        video = UploadedVideoFactory()
        TimedTextTrackFactory(
            video=video,
            mode=TimedTextTrack.TRANSCRIPT,
            upload_state=defaults.PROCESSING,
        )
        video_timestamp = to_timestamp(video.uploaded_on)
        video_path = f"vod/{video.pk}/video/{video_timestamp}"

        transcripted_video = TranscriptedVideo.objects.create(
            state=VideoState.PUBLISHED,
            directory=video_path,
        )

        with patch.object(
            channel_layers_utils, "dispatch_video"
        ) as mock_dispatch_video:
            transcript_utils.transcription_error_callback(transcripted_video)

        video.refresh_from_db()
        self.assertFalse(
            video.timedtexttracks.filter(mode=TimedTextTrack.TRANSCRIPT).exists()
        )
        mock_dispatch_video.assert_called_once_with(video)

    @patch.object(transcript_utils, "launch_video_transcript")
    def test_transcript_video_no_video(self, mock_launch_video_transcript):
        """
        Should not call the launch_video_transcript function
        if there is no video to transcript.
        """

        with self.assertRaises(transcript_utils.TranscriptError) as context:
            transcript_utils.transcript(None)

        self.assertEqual(str(context.exception), "No video to transcript")
        mock_launch_video_transcript.delay.assert_not_called()

    @patch.object(transcript_utils, "launch_video_transcript")
    def test_transcript_video_already_subtitle(self, mock_launch_video_transcript):
        """
        Should not call the launch_video_transcript function
        if the video already has a subtitle.
        """
        timed_text_track = TimedTextTrackFactory(
            video=VideoFactory(upload_state=defaults.READY),
            language=settings.LANGUAGES[0][0],
            mode=TimedTextTrack.SUBTITLE,
        )

        with self.assertRaises(transcript_utils.TranscriptError) as context:
            transcript_utils.transcript(timed_text_track.video)

        self.assertEqual(
            str(context.exception),
            f"A subtitle already exists for video {timed_text_track.video.id}",
        )
        mock_launch_video_transcript.delay.assert_not_called()

    @patch.object(transcript_utils, "launch_video_transcript")
    def test_transcript_video_already_transcript(self, mock_launch_video_transcript):
        """
        Should call the launch_video_transcript function
        if the video has a transcript.
        """
        timed_text_track = TimedTextTrackFactory(
            video=VideoFactory(
                upload_state=defaults.READY,
                transcode_pipeline=defaults.PEERTUBE_PIPELINE,
            ),
            language=settings.LANGUAGES[0][0],
            mode=TimedTextTrack.TRANSCRIPT,
        )

        transcript_utils.transcript(timed_text_track.video)

        mock_launch_video_transcript.delay.assert_called_once_with(
            video_pk=timed_text_track.video.id,
            stamp=timed_text_track.video.uploaded_on_stamp(),
            domain="https://example.com",
        )
        self.assertEqual(timed_text_track.video.timedtexttracks.count(), 2)
        self.assertTrue(
            timed_text_track.video.timedtexttracks.filter(
                mode=TimedTextTrack.SUBTITLE
            ).exists()
        )

    @patch.object(transcript_utils, "launch_video_transcript")
    def test_transcript_video_already_closed_caption(
        self, mock_launch_video_transcript
    ):
        """
        Should call the launch_video_transcript function
        if the video has a closed caption.
        """
        timed_text_track = TimedTextTrackFactory(
            video=VideoFactory(
                upload_state=defaults.READY,
                transcode_pipeline=defaults.PEERTUBE_PIPELINE,
            ),
            language=settings.LANGUAGES[0][0],
            mode=TimedTextTrack.CLOSED_CAPTIONING,
        )

        transcript_utils.transcript(timed_text_track.video)

        mock_launch_video_transcript.delay.assert_called_once_with(
            video_pk=timed_text_track.video.id,
            stamp=timed_text_track.video.uploaded_on_stamp(),
            domain="https://example.com",
        )
        self.assertEqual(timed_text_track.video.timedtexttracks.count(), 2)
        self.assertTrue(
            timed_text_track.video.timedtexttracks.filter(
                mode=TimedTextTrack.SUBTITLE
            ).exists()
        )

    @patch.object(transcript_utils, "launch_video_transcript")
    def test_transcript_video_peertube_pipeline(self, mock_launch_video_transcript):
        """
        Should call the launch_video_transcript function
        if the video pipeline is peertube.
        """
        video = VideoFactory(transcode_pipeline=defaults.PEERTUBE_PIPELINE)

        transcript_utils.transcript(video)

        mock_launch_video_transcript.delay.assert_called_once_with(
            video_pk=video.id,
            stamp=video.uploaded_on_stamp(),
            domain="https://example.com",
        )
        self.assertEqual(video.timedtexttracks.count(), 1)

    @patch.object(transcript_utils, "launch_video_transcript")
    def test_transcript_video_not_peertube_pipeline(self, mock_launch_video_transcript):
        """
        Should call the launch_video_transcript function
        if the video pipeline is not peertube.
        """
        video = VideoFactory(transcode_pipeline=defaults.AWS_PIPELINE)

        transcript_utils.transcript(video)

        mock_launch_video_transcript.delay.assert_called_once_with(
            video_pk=video.id,
            stamp=video.uploaded_on_stamp(),
            domain="https://example.com",
            video_url=f"https://example.com/api/videos/{video.id}/transcript-source/",
        )
        self.assertEqual(video.timedtexttracks.count(), 1)

    @patch.object(transcript_utils, "launch_video_transcript")
    @override_settings(TRANSCODING_CALLBACK_DOMAIN="https://callback.com")
    def test_transcript_video_callback_domain_setting(
        self, mock_launch_video_transcript
    ):
        """
        Should call the launch_video_transcript function
        with the callback domain setting.
        """
        video = VideoFactory(transcode_pipeline=defaults.PEERTUBE_PIPELINE)

        transcript_utils.transcript(video)

        mock_launch_video_transcript.delay.assert_called_once_with(
            video_pk=video.id,
            stamp=video.uploaded_on_stamp(),
            domain="https://callback.com",
        )
        self.assertEqual(video.timedtexttracks.count(), 1)
