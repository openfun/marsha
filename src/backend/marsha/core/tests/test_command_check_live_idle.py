"""Tests for check_live_idle command."""
from datetime import timedelta
from io import StringIO
from unittest import mock

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from ..defaults import DELETED, IDLE, RAW
from ..factories import VideoFactory


class CheckLiveIdleTest(TestCase):
    """Test check_live_idle command."""

    def test_check_live_idle_no_video_to_process(self):
        """Command should do nothing when there is no video to process."""
        out = StringIO()
        with mock.patch(
            "marsha.core.management.commands.check_live_idle.delete_aws_element_stack"
        ) as mock_delete_aws_element_stack:
            call_command("check_live_idle", stdout=out)
            mock_delete_aws_element_stack.assert_not_called()

        self.assertEqual("", out.getvalue())
        out.close()

    def test_check_live_idle_video_to_delete(self):
        """Command should delete a video in idle state too long."""
        video = VideoFactory(
            id="36b82a5e-f2a6-4c11-bdf4-aa435a5dffc2", live_state=IDLE, live_type=RAW
        )
        out = StringIO()
        with mock.patch(
            "marsha.core.management.commands.check_live_idle.delete_aws_element_stack"
        ) as mock_delete_aws_element_stack, mock.patch(
            "marsha.core.management.commands.check_live_idle.generate_expired_date"
        ) as generate_expired_date_mock:
            generate_expired_date_mock.return_value = timezone.now() + timedelta(days=1)
            call_command("check_live_idle", stdout=out)
            mock_delete_aws_element_stack.assert_called_once()

        video.refresh_from_db()
        self.assertEqual(video.upload_state, DELETED)
        self.assertIn(
            "Deleting video 36b82a5e-f2a6-4c11-bdf4-aa435a5dffc2", out.getvalue()
        )
        out.close()
