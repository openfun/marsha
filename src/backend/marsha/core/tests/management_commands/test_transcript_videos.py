"""Test transcript_video command."""

from io import StringIO
from unittest.mock import call, patch
from uuid import uuid4

from django.core.management import CommandError, call_command
from django.test import TestCase

from marsha.core import defaults
from marsha.core.factories import TimedTextTrackFactory, VideoFactory
from marsha.core.management.commands import transcript_videos
from marsha.core.models import TimedTextTrack, Video


@patch.object(transcript_videos, "transcript")
class TranscriptVideosTestCase(TestCase):
    """
    Test case for the transcript_videos command.
    """

    maxDiff = None

    def setUp(self):
        """
        Set up the test case with videos.
        """
        self.stdout = StringIO()

    def test_transcript_videos_no_videos(self, mock_transcript):
        """
        Should not call the transcript function if there is no video to transcript.
        """
        with self.assertLogs("marsha.core", "INFO") as logs:
            call_command("transcript_videos", stdout=self.stdout)

        self.assertListEqual(
            logs.output,
            [
                "INFO:marsha.core.management.commands.transcript_videos:"
                "No video to transcript"
            ],
        )
        mock_transcript.assert_not_called()

    def test_transcript_videos(self, mock_transcript):
        """
        Should call the transcript function with the ten first videos to transcript.
        """
        VideoFactory.create_batch(20, upload_state=defaults.READY)
        processed_videos = Video.objects.all().order_by("-created_on")[
            : transcript_videos.DEFAULT_VIDEO_LIMIT
        ]

        with self.assertLogs("marsha.core", "INFO") as logs:
            call_command("transcript_videos", stdout=self.stdout)

        expected_output = []
        for video in processed_videos:
            expected_output.append(
                "INFO:marsha.core.management.commands.transcript_videos:"
                f"Try to transcript video {video.id}"
            )
            expected_output.append(
                "INFO:marsha.core.management.commands.transcript_videos:"
                f"Transcription job started for video {video.id}"
            )
        self.assertListEqual(logs.output, expected_output)
        mock_transcript.assert_has_calls(
            [call(video) for video in processed_videos], any_order=True
        )

    def test_transcript_videos_not_ready(self, mock_transcript):
        """
        Should not call the transcript function if the video is not ready.
        """
        VideoFactory(upload_state=defaults.PENDING)

        with self.assertLogs("marsha.core", "INFO") as logs:
            call_command("transcript_videos", stdout=self.stdout)

        self.assertListEqual(
            logs.output,
            [
                "INFO:marsha.core.management.commands.transcript_videos:"
                "No video to transcript"
            ],
        )
        mock_transcript.assert_not_called()

    def test_transcript_videos_already_transcript(self, mock_transcript):
        """
        Should not call the transcript function if the video already has a transcript.
        """
        TimedTextTrackFactory(
            video=VideoFactory(upload_state=defaults.READY),
            mode=TimedTextTrack.TRANSCRIPT,
        )

        with self.assertLogs("marsha.core", "INFO") as logs:
            call_command("transcript_videos", stdout=self.stdout)

        self.assertListEqual(
            logs.output,
            [
                "INFO:marsha.core.management.commands.transcript_videos:"
                "No video to transcript"
            ],
        )
        mock_transcript.assert_not_called()

    def test_transcript_videos_deleted_transcript(self, mock_transcript):
        """
        Should call the transcript function if the video has a deleted transcript.
        """
        timed_text_track = TimedTextTrackFactory(
            video=VideoFactory(upload_state=defaults.READY),
            mode=TimedTextTrack.TRANSCRIPT,
        )
        timed_text_track.delete()
        self.assertEqual(TimedTextTrack.objects.all(force_visibility=True).count(), 1)

        with self.assertLogs("marsha.core", "INFO") as logs:
            call_command("transcript_videos", stdout=self.stdout)

        self.assertListEqual(
            logs.output,
            [
                "INFO:marsha.core.management.commands.transcript_videos:"
                f"Try to transcript video {timed_text_track.video.id}",
                "INFO:marsha.core.management.commands.transcript_videos:"
                f"Transcription job started for video {timed_text_track.video.id}",
            ],
        )
        mock_transcript.assert_called_once_with(timed_text_track.video)

    def test_transcript_videos_unknown_argument(self, mock_transcript):
        """
        Should not call the transcript function if there is no video to transcript.
        """
        video_id = uuid4()

        with self.assertLogs("marsha.core", "INFO") as logs:
            call_command(
                "transcript_videos", f"--video-id={video_id}", stdout=self.stdout
            )

        self.assertListEqual(
            logs.output,
            [
                "ERROR:marsha.core.management.commands.transcript_videos:"
                f"No video found with id {video_id}"
            ],
        )
        mock_transcript.assert_not_called()

    def test_transcript_videos_argument_type(self, mock_transcript):
        """
        Should raise a CommandError if the video id is not a UUID.
        """
        with self.assertRaises(CommandError) as context, self.assertLogs(
            "marsha.core", "INFO"
        ) as logs:
            call_command("transcript_videos", "--video-id=1", stdout=self.stdout)

        self.assertEqual(
            str(context.exception),
            "Error: argument --video-id: invalid UUID value: '1'",
        )
        self.assertListEqual(
            logs.output,
            [],
        )

        mock_transcript.assert_not_called()

    def test_transcript_videos_argument(self, mock_transcript):
        """
        Should call the transcript function with the video to transcript.
        """
        VideoFactory(upload_state=defaults.READY)
        video = VideoFactory(upload_state=defaults.READY)
        VideoFactory(upload_state=defaults.READY)

        with self.assertLogs("marsha.core", "INFO") as logs:
            call_command(
                "transcript_videos", f"--video-id={video.id}", stdout=self.stdout
            )

        self.assertListEqual(
            logs.output,
            [
                "INFO:marsha.core.management.commands.transcript_videos:"
                f"Try to transcript video {video.id}",
                "INFO:marsha.core.management.commands.transcript_videos:"
                f"Transcription job started for video {video.id}",
            ],
        )
        mock_transcript.assert_called_once_with(video)

    def test_transcript_videos_argument_not_ready(self, mock_transcript):
        """
        Should not call the transcript function if the video is not ready.
        """
        video = VideoFactory(upload_state=defaults.PENDING)

        with self.assertLogs("marsha.core", "INFO") as logs:
            call_command(
                "transcript_videos", f"--video-id={video.id}", stdout=self.stdout
            )

        self.assertListEqual(
            logs.output,
            [
                "ERROR:marsha.core.management.commands.transcript_videos:"
                f"Video {video.id} is not ready"
            ],
        )
        mock_transcript.assert_not_called()

    def test_transcript_videos_argument_already_transcript(self, mock_transcript):
        """
        Should not call the transcript function if the video already has a transcript.
        """
        timed_text_track = TimedTextTrackFactory(
            video=VideoFactory(upload_state=defaults.READY),
            mode=TimedTextTrack.TRANSCRIPT,
        )

        with self.assertLogs("marsha.core", "INFO") as logs:
            call_command(
                "transcript_videos",
                video_id=timed_text_track.video.id,
                stdout=self.stdout,
            )

        self.assertListEqual(
            logs.output,
            [
                "ERROR:marsha.core.management.commands.transcript_videos:"
                f"Transcript already exists for video {timed_text_track.video.id}"
            ],
        )
        mock_transcript.assert_not_called()

    def test_transcript_videos_argument_deleted_transcript(self, mock_transcript):
        """
        Should call the transcript function if the video has a deleted transcript.
        """
        timed_text_track = TimedTextTrackFactory(
            video=VideoFactory(upload_state=defaults.READY),
            mode=TimedTextTrack.TRANSCRIPT,
        )
        timed_text_track.delete()
        self.assertEqual(TimedTextTrack.objects.all(force_visibility=True).count(), 1)

        with self.assertLogs("marsha.core", "INFO") as logs:
            call_command(
                "transcript_videos",
                video_id=timed_text_track.video.id,
                stdout=self.stdout,
            )

        self.assertListEqual(
            logs.output,
            [
                "INFO:marsha.core.management.commands.transcript_videos:"
                f"Try to transcript video {timed_text_track.video.id}",
                "INFO:marsha.core.management.commands.transcript_videos:"
                f"Transcription job started for video {timed_text_track.video.id}",
            ],
        )
        mock_transcript.assert_called_once_with(timed_text_track.video)

    def test_transcript_videos_argument_limit(self, mock_transcript):
        """
        Should call the transcript function with the limit argument.
        """
        limit = 5
        VideoFactory.create_batch(20, upload_state=defaults.READY)
        processed_videos = Video.objects.all().order_by("-created_on")[:limit]

        with self.assertLogs("marsha.core", "INFO") as logs:
            call_command("transcript_videos", limit=limit, stdout=self.stdout)

        expected_output = []
        for video in processed_videos:
            expected_output.append(
                "INFO:marsha.core.management.commands.transcript_videos:"
                f"Try to transcript video {video.id}"
            )
            expected_output.append(
                "INFO:marsha.core.management.commands.transcript_videos:"
                f"Transcription job started for video {video.id}"
            )
        self.assertListEqual(logs.output, expected_output)
        mock_transcript.assert_has_calls(
            [call(video) for video in processed_videos], any_order=True
        )

    def test_transcript_videos_argument_all(self, mock_transcript):
        """
        Should call the transcript function with the all argument.
        """

        VideoFactory.create_batch(20, upload_state=defaults.READY)
        processed_videos = Video.objects.all().order_by("-created_on")

        with self.assertLogs("marsha.core", "INFO") as logs:
            # call_command("transcript_videos", "--all", stdout=self.stdout)
            call_command("transcript_videos", all=True, stdout=self.stdout)

        expected_output = []
        for video in processed_videos:
            expected_output.append(
                "INFO:marsha.core.management.commands.transcript_videos:"
                f"Try to transcript video {video.id}"
            )
            expected_output.append(
                "INFO:marsha.core.management.commands.transcript_videos:"
                f"Transcription job started for video {video.id}"
            )
        self.assertListEqual(logs.output, expected_output)
        mock_transcript.assert_has_calls(
            [call(video) for video in processed_videos], any_order=True
        )

    def test_transcript_videos_argument_limit_and_all(self, mock_transcript):
        """
        Should raise a CommandError if the limit and all arguments are provided.
        """
        with self.assertRaises(CommandError) as context, self.assertLogs(
            "marsha.core", "INFO"
        ) as logs:
            call_command("transcript_videos", limit=5, all=True, stdout=self.stdout)

        self.assertEqual(
            str(context.exception),
            "Error: argument --limit: not allowed with argument --all",
        )
        self.assertListEqual(
            logs.output,
            [],
        )

        mock_transcript.assert_not_called()
