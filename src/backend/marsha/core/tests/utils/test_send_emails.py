"""Test the send_emails functions."""
from django.core import mail
from django.test import TestCase, override_settings
from django.utils import timezone
from django.utils.datetime_safe import datetime

from marsha.core.factories import VideoFactory
from marsha.core.utils.send_emails import (
    send_convert_reminder_notification,
    send_ready_to_convert_notification,
    send_vod_ready_notification,
)


@override_settings(FRONTEND_HOME_URL="https://marsha.education")
class TestSendEmails(TestCase):
    """Test the send_emails function."""

    maxDiff = None

    def test_send_ready_to_convert_notification(self):
        """Test send_ready_to_convert_notification."""
        video = VideoFactory(
            starting_at=datetime(2020, 1, 1, 9, 30, tzinfo=timezone.utc),
            live_info={
                "live_stopped_with_email": "user@example.com",
            },
            last_lti_url="https://example.com/course/machin",
        )

        send_ready_to_convert_notification(video)

        email = video.live_info.get("live_stopped_with_email")
        self.assertEqual(mail.outbox[0].to[0], email)
        self.assertEqual(
            mail.outbox[0].subject,
            f"Live Stream is ready to convert - {video.title}",
        )
        self.assertListEqual(
            mail.outbox[0].body.splitlines(),
            f"""
Live Stream is ready to convert

{video.title}

Hello,

The live stream you recorded for &quot;{video.title}&quot; is ready to be converted to VOD.

The live stream recording will be available until 15/01/2020.


Access the live stream from Marsha [https://marsha.education/my-contents/videos/{video.id}]


Or

Access the live stream from your LMS [{video.last_lti_url}]





This mail has been sent to {email} by Marsha""".splitlines(),
        )

    def test_send_ready_to_convert_notification_no_last_lti_url(self):
        """Test send_ready_to_convert_notification."""
        video = VideoFactory(
            starting_at=datetime(2020, 1, 1, 9, 30, tzinfo=timezone.utc),
            live_info={
                "live_stopped_with_email": "user@example.com",
            },
        )

        send_ready_to_convert_notification(video)

        email = video.live_info.get("live_stopped_with_email")
        self.assertEqual(mail.outbox[0].to[0], email)
        self.assertEqual(
            mail.outbox[0].subject,
            f"Live Stream is ready to convert - {video.title}",
        )
        self.assertListEqual(
            mail.outbox[0].body.splitlines(),
            f"""
Live Stream is ready to convert

{video.title}

Hello,

The live stream you recorded for &quot;{video.title}&quot; is ready to be converted to VOD.

The live stream recording will be available until 15/01/2020.


Access the live stream from Marsha [https://marsha.education/my-contents/videos/{video.id}]





This mail has been sent to {email} by Marsha""".splitlines(),
        )

    def test_send_vod_ready_notification(self):
        """Test send_vod_ready_notification."""
        video = VideoFactory(
            starting_at=datetime(2020, 1, 1, 9, 30, tzinfo=timezone.utc),
            live_info={
                "live_stopped_with_email": "user@example.com",
            },
            last_lti_url="https://example.com/course/machin",
        )

        send_vod_ready_notification(video)

        email = video.live_info.get("live_stopped_with_email")
        self.assertEqual(mail.outbox[0].to[0], email)
        self.assertEqual(
            mail.outbox[0].subject,
            f"Live Stream is converted to VOD - {video.title}",
        )
        self.assertListEqual(
            mail.outbox[0].body.splitlines(),
            f"""
Live Stream is converted to VOD

{video.title}

Hello,
The live stream you recorded for "{video.title}" is converted to VOD.

Access the VOD from Marsha [https://marsha.education/my-contents/videos/{video.id}]


Or

Access the VOD through the live stream from your LMS [{video.last_lti_url}]





This mail has been sent to {email} by Marsha""".splitlines(),
        )

    def test_send_convert_reminder_notification(self):
        """Test send_convert_reminder_notification."""
        video = VideoFactory(
            starting_at=datetime(2020, 1, 1, 9, 30, tzinfo=timezone.utc),
            live_info={
                "live_stopped_with_email": "user@example.com",
            },
            last_lti_url="https://example.com/course/machin",
        )

        send_convert_reminder_notification(video)

        email = video.live_info.get("live_stopped_with_email")
        self.assertEqual(mail.outbox[0].to[0], email)
        self.assertEqual(
            mail.outbox[0].subject,
            f"Live Stream will be deleted soon - {video.title}",
        )
        self.assertListEqual(
            mail.outbox[0].body.splitlines(),
            f"""
Live Stream will be deleted soon

{video.title}

Hello,
The live stream you recorded for "{video.title}" is ready to be converted to VOD.
The live stream recording will be available until Jan. 15, 2020, 9:30 a.m..

Access the live stream from Marsha [https://marsha.education/my-contents/videos/{video.id}]


Or

Access the live stream from your LMS [{video.last_lti_url}]





This mail has been sent to {email} by Marsha""".splitlines(),
        )
