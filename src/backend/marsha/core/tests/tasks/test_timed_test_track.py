"""Test for timed text track celery tasks"""

from io import BytesIO
from unittest import mock

from django.core.files.base import ContentFile
from django.test import TestCase

from marsha.core.defaults import (
    CELERY_PIPELINE,
    ERROR,
    READY,
    TMP_VIDEOS_STORAGE_BASE_DIRECTORY,
)
from marsha.core.factories import TimedTextTrackFactory
from marsha.core.storage.storage_class import video_storage
from marsha.core.tasks.timed_text_track import convert_timed_text_track


SRT_EXAMPLE = b"""1
00:00:01,000 --> 00:00:04,000
Hello, this is the first subtitle.

2
00:00:05,000 --> 00:00:08,000
This is the second subtitle.

3
00:00:09,000 --> 00:00:12,000
And this is the third subtitle.
"""

SRT_EXAMPLE_WITH_HTML = b"""1
00:00:01,000 --> 00:00:04,000
<b>Hello</b>, this is the <i>first</i> subtitle.

2
00:00:05,000 --> 00:00:08,000
This is the <u>second</u> subtitle.

3
00:00:09,000 --> 00:00:12,000
And this is the <font color="red">third</font> subtitle.
"""


class TestTimedTextTrackTask(TestCase):
    """
    Test for timed text track celery tasks
    """

    def test_timed_text_track_with_caption(self):
        """
        Test the the convert_timed_text_track function. It should create
        a new VTT file based on a french srt caption.
        """
        timed_text_track = TimedTextTrackFactory(
            language="fr",
            mode="cc",
        )

        stamp = "1640995200"

        # Create SRT file
        with BytesIO() as buffer:
            buffer.write(SRT_EXAMPLE)
            content_file = ContentFile(buffer.getvalue())
            video_storage.save(
                timed_text_track.get_videos_storage_prefix(
                    stamp, TMP_VIDEOS_STORAGE_BASE_DIRECTORY
                ),
                content_file,
            )

        self.assertFalse(
            video_storage.exists(
                f"{timed_text_track.get_videos_storage_prefix(stamp)}/{stamp}_fr.vtt"
            )
        )

        convert_timed_text_track(str(timed_text_track.pk), stamp)

        timed_text_track.refresh_from_db()
        self.assertEqual(timed_text_track.upload_state, READY)
        self.assertEqual(timed_text_track.process_pipeline, CELERY_PIPELINE)
        new_vtt_file = (
            f"{timed_text_track.get_videos_storage_prefix(stamp)}/{stamp}.vtt"
        )
        self.assertTrue(video_storage.exists(new_vtt_file))
        with video_storage.open(new_vtt_file, "rt") as new_vtt_file:
            content = new_vtt_file.read()
            self.assertEqual(
                content,
                (
                    "WEBVTT\n\n"
                    "00:01.000 --> 00:04.000\n"
                    "Hello, this is the first subtitle.\n\n"
                    "00:05.000 --> 00:08.000\n"
                    "This is the second subtitle.\n\n"
                    "00:09.000 --> 00:12.000\n"
                    "And this is the third subtitle.\n"
                ),
            )
        new_source_file = (
            f"{timed_text_track.get_videos_storage_prefix(stamp)}/source.srt"
        )
        self.assertTrue(video_storage.exists(new_source_file))

    def test_timed_text_track_with_transcript(self):
        """
        Test the the convert_timed_text_track function. It should create
        a new VTT file without html based on a french srt transcript with html.
        """
        timed_text_track = TimedTextTrackFactory(
            language="fr",
            mode="ts",
        )

        stamp = "1640995201"

        # Create SRT file
        with BytesIO() as buffer:
            buffer.write(SRT_EXAMPLE_WITH_HTML)
            content_file = ContentFile(buffer.getvalue())
            video_storage.save(
                timed_text_track.get_videos_storage_prefix(
                    stamp, TMP_VIDEOS_STORAGE_BASE_DIRECTORY
                ),
                content_file,
            )

        self.assertFalse(
            video_storage.exists(
                f"{timed_text_track.get_videos_storage_prefix(stamp)}/{stamp}_fr.vtt"
            )
        )

        convert_timed_text_track(str(timed_text_track.pk), stamp)

        timed_text_track.refresh_from_db()
        self.assertEqual(timed_text_track.upload_state, READY)
        self.assertEqual(timed_text_track.process_pipeline, CELERY_PIPELINE)
        new_vtt_file = (
            f"{timed_text_track.get_videos_storage_prefix(stamp)}/{stamp}.vtt"
        )
        self.assertTrue(video_storage.exists(new_vtt_file))
        with video_storage.open(new_vtt_file, "rt") as new_vtt_file:
            content = new_vtt_file.read()
            self.assertEqual(
                content,
                (
                    "WEBVTT\n\n"
                    "00:01.000 --> 00:04.000\n"
                    "&lt;b>Hello&lt;/b>, this is the &lt;i>first&lt;/i> subtitle.\n\n"
                    "00:05.000 --> 00:08.000\n"
                    "This is the &lt;u>second&lt;/u> subtitle.\n\n"
                    "00:09.000 --> 00:12.000\n"
                    'And this is the &lt;font color="red">third'
                    "&lt;/font> subtitle.\n"
                ),
            )
        new_source_file = (
            f"{timed_text_track.get_videos_storage_prefix(stamp)}/source.srt"
        )
        self.assertTrue(video_storage.exists(new_source_file))

    def test_timed_text_track_with_invalid_transcript(self):
        """
        Test the the convert_timed_text_track function. It should fail and update
        the upload_state to ERROR.
        """
        timed_text_track = TimedTextTrackFactory(
            language="fr",
            mode="ts",
        )

        stamp = "1640995202"

        # Create SRT file
        with BytesIO() as buffer:
            buffer.write(b"INVALID SRT FILE")
            content_file = ContentFile(buffer.getvalue())
            video_storage.save(
                timed_text_track.get_videos_storage_prefix(
                    stamp, TMP_VIDEOS_STORAGE_BASE_DIRECTORY
                ),
                content_file,
            )

        self.assertFalse(
            video_storage.exists(
                f"{timed_text_track.get_videos_storage_prefix(stamp)}/{stamp}.vtt"
            )
        )

        with mock.patch(
            "marsha.core.tasks.timed_text_track.capture_exception"
        ) as mock_capture_exception:
            convert_timed_text_track(str(timed_text_track.pk), stamp)
            mock_capture_exception.assert_called_once()

        timed_text_track.refresh_from_db()
        self.assertEqual(timed_text_track.upload_state, ERROR)

        new_vtt_file = (
            f"{timed_text_track.get_videos_storage_prefix(stamp)}/{stamp}.vtt"
        )
        self.assertFalse(video_storage.exists(new_vtt_file))
