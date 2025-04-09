"""Test for recording celery tasks"""

# pylint: disable=unexpected-keyword-arg,no-value-for-parameter

from pathlib import Path

from django.test import TestCase

import responses

from marsha.core import defaults
from marsha.core.factories import VideoFactory
from marsha.core.storage.storage_class import file_storage
from marsha.core.tasks.recording import copy_video_recording


TEST_FILES_DIR = Path(__file__).parent.parent / "test_files"
TEST_HTML_PATH = TEST_FILES_DIR / "bbb-video-template.html"
TEST_VIDEO_PATH = TEST_FILES_DIR / "big_buck_bunny_1080p.mp4"


class TestRecordingTask(TestCase):
    """
    Test for recording celery tasks
    """

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.html_content = TEST_HTML_PATH.read_text()
        cls.video_content = TEST_VIDEO_PATH.read_bytes()

    @responses.activate(assert_all_requests_are_fired=True)
    def test_copy_video_recording(self):
        """
        Test the copy_video_recording task.
        """
        # Prepare URLs
        record_url = "https://example.com/recording/1234/video?token=456"
        playback_url = "https://example.com/playback/video/1234"
        html_video_url = "https://example.com/video/1234"
        video_file_url = f"{html_video_url}/video-0.m4v"

        # First redirect from record URL
        responses.add(
            responses.GET,
            record_url,
            status=302,
            headers={
                "Location": playback_url,
                "Content-Type": "text/html",
                "Set-Cookie": "recording_video_1234=xxxxx",
            },
        )

        # Second redirect to HTML video page
        responses.add(
            responses.GET,
            playback_url,
            status=302,
            headers={"Location": html_video_url, "Content-Type": "text/html"},
        )

        # HTML video page response
        responses.add(
            responses.GET,
            html_video_url,
            status=200,
            body=self.html_content,
            headers={"Content-Type": "text/html"},
        )

        # Video file response
        responses.add(
            responses.GET,
            video_file_url,
            status=200,
            body=self.video_content,
            headers={"Content-Type": "video/mp4"},
        )

        video = VideoFactory()
        stamp = "1640995200"

        copy_video_recording(record_url, video.pk, stamp)

        video.refresh_from_db()
        self.assertEqual(video.upload_state, defaults.PROCESSING)

        expected_key = f"tmp/{str(video.pk)}/video/{stamp}"
        self.assertTrue(file_storage.exists(expected_key))
        with file_storage.open(expected_key, "rb") as video_file:
            self.assertEqual(
                video_file.read(),
                self.video_content,
            )

    @responses.activate(assert_all_requests_are_fired=True)
    def test_copy_video_recording_no_redirection(self):
        """
        Test the copy_video_recording task with no redirection to the playback HTML.
        """
        record_url = "https://example.com/recording/1234/video?token=456"

        responses.add(
            responses.GET,
            record_url,
            status=200,
            headers={
                "Content-Type": "video/mp4",
            },
        )

        video = VideoFactory()
        stamp = "1640995200"

        copy_video_recording(record_url, video.pk, stamp)

        video.refresh_from_db()
        self.assertEqual(video.upload_state, defaults.ERROR)
        self.assertEqual(video.upload_error_reason, defaults.RECORDING_SOURCE_ERROR)

    @responses.activate(assert_all_requests_are_fired=True)
    def test_copy_video_recording_no_recording(self):
        """
        Test the copy_video_recording task with no recording found.
        """
        record_url = "https://example.com/recording/1234/video?token=456"

        responses.add(
            responses.GET,
            record_url,
            status=404,
        )

        video = VideoFactory()
        stamp = "1640995200"

        copy_video_recording(record_url, video.pk, stamp)

        video.refresh_from_db()
        self.assertEqual(video.upload_state, defaults.ERROR)

    @responses.activate(assert_all_requests_are_fired=True)
    def test_copy_video_recording_no_video_in_playback(self):
        """
        Test the copy_video_recording task with no video in the playback HTML.
        """
        record_url = "https://example.com/recording/1234/video?token=456"

        playback_html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>test recordings</title>
        </head>
        <body>
          <main>
          </main>
        </body>
        </html>"""

        # Prepare URLs
        record_url = "https://example.com/recording/1234/video?token=456"
        playback_url = "https://example.com/playback/video/1234"
        html_video_url = "https://example.com/video/1234"

        # First redirect from record URL
        responses.add(
            responses.GET,
            record_url,
            status=302,
            headers={
                "Location": playback_url,
                "Content-Type": "text/html",
                "Set-Cookie": "recording_video_1234=xxxxx",
            },
        )

        # Second redirect to HTML video page
        responses.add(
            responses.GET,
            playback_url,
            status=302,
            headers={"Location": html_video_url, "Content-Type": "text/html"},
        )

        # HTML video page response
        responses.add(
            responses.GET,
            html_video_url,
            status=200,
            body=playback_html,
            headers={"Content-Type": "text/html"},
        )

        video = VideoFactory()
        stamp = "1640995200"

        copy_video_recording(record_url, video.pk, stamp)

        video.refresh_from_db()
        self.assertEqual(video.upload_state, defaults.ERROR)
        self.assertEqual(video.upload_error_reason, defaults.RECORDING_SOURCE_ERROR)

    @responses.activate(assert_all_requests_are_fired=True)
    def test_copy_video_recording_stream_error(self):
        """
        Test the copy_video_recording task with an error when streaming video from
        Scalelite to video storage.
        """
        # Prepare URLs
        record_url = "https://example.com/recording/1234/video?token=456"
        playback_url = "https://example.com/playback/video/1234"
        html_video_url = "https://example.com/video/1234"
        video_file_url = f"{html_video_url}/video-0.m4v"

        # First redirect from record URL
        responses.add(
            responses.GET,
            record_url,
            status=302,
            headers={
                "Location": playback_url,
                "Content-Type": "text/html",
                "Set-Cookie": "recording_video_1234=xxxxx",
            },
        )

        # Second redirect to HTML video page
        responses.add(
            responses.GET,
            playback_url,
            status=302,
            headers={"Location": html_video_url, "Content-Type": "text/html"},
        )

        # HTML video page response
        responses.add(
            responses.GET,
            html_video_url,
            status=200,
            body=self.html_content,
            headers={"Content-Type": "text/html"},
        )

        # Video file response
        responses.add(
            responses.GET,
            video_file_url,
            status=200,
            headers={"Content-Type": "video/mp4"},
            body=Exception("Streaming Error!"),
        )

        video = VideoFactory()
        stamp = "1640995200"

        copy_video_recording(record_url, video.pk, stamp)

        video.refresh_from_db()
        self.assertEqual(video.upload_state, defaults.ERROR)
