"""Test delete_outdated_videos command."""

from datetime import date, datetime, timezone as baseTimezone
from unittest.mock import patch

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from marsha.core.factories import VideoFactory
from marsha.core.models import Video


class DeleteOutdatedVideosTestCase(TestCase):
    """
    Test case for the delete_outdated_videos command.
    """

    def setUp(self):
        """
        Set up the test case with  videos.
        """

        self.video_1 = VideoFactory(
            retention_date=date(2022, 1, 1),
        )
        self.video_2 = VideoFactory(
            retention_date=date(2021, 1, 1),
        )
        self.video_3 = VideoFactory(
            retention_date=date(2023, 1, 1),
        )
        self.video_4 = VideoFactory()

    def test_delete_outdated_videos(self):
        """
        Test the delete_outdated_videos command.
        """
        with patch.object(
            timezone, "now", return_value=datetime(2022, 1, 2, tzinfo=baseTimezone.utc)
        ):
            call_command("delete_outdated_videos")
            self.assertEqual(Video.objects.count(), 2)

            self.video_1.refresh_from_db()
            self.assertIsNotNone(self.video_1.deleted)

            self.video_2.refresh_from_db()
            self.assertIsNotNone(self.video_2.deleted)

            self.video_3.refresh_from_db()
            self.assertIsNone(self.video_3.deleted)

            self.video_4.refresh_from_db()
            self.assertIsNone(self.video_4.deleted)
