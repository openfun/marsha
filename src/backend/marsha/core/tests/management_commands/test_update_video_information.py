"""Test update_video_information management command."""

from io import StringIO
from unittest import mock

from django.core.management import call_command
from django.test import TestCase

from marsha.core import defaults
from marsha.core.factories import VideoFactory
from marsha.core.management.commands.update_video_information import (
    compute_video_information,
)


class UpdateVideoInformationTestCase(TestCase):
    """Test update_video_information management command."""

    def test_update_video_information(self):
        """Test update_video_information management command."""

        # VideoFactory.create_btach can't be used because first argument name of this function
        # is size.
        videos = [
            VideoFactory(size=None, duration=None, upload_state=defaults.READY)
            for _ in range(3)
        ]

        VideoFactory(
            size=123456,
            duration=123,
            upload_state=defaults.READY,
        )
        out = StringIO()
        with mock.patch.object(
            compute_video_information, "delay"
        ) as mock_compute_video_information:
            call_command("update_video_information", stdout=out)
            self.assertEqual(mock_compute_video_information.call_count, 3)

        for video in videos:
            self.assertIn(
                f"Video {video.id} information will be updated", out.getvalue()
            )

    def test_update_video_information_using_limit(self):
        """Test update_video_information management command with limit option."""

        # VideoFactory.create_btach can't be used because first argument name of this function
        # is size.
        for _ in range(10):
            VideoFactory(size=None, duration=None, upload_state=defaults.READY)

        VideoFactory(
            size=123456,
            duration=123,
            upload_state=defaults.READY,
        )
        out = StringIO()
        with mock.patch.object(
            compute_video_information, "delay"
        ) as mock_compute_video_information:
            call_command("update_video_information", stdout=out, limit=5)
            self.assertEqual(mock_compute_video_information.call_count, 5)
