"""For development purpose only, send test emails."""

from django.conf import settings
from django.core.management import BaseCommand
from django.utils import timezone

from marsha.core.factories import VideoFactory
from marsha.core.utils.send_emails import (
    send_convert_reminder_notification,
    send_ready_to_convert_notification,
    send_vod_ready_notification,
)


class Command(BaseCommand):
    """Send test emails."""

    help = __doc__

    def handle(self, *args, **options):
        self.stdout.write(f"Sending test emails to {settings.EMAIL_HOST}…")

        self.stdout.write()
        self.stdout.write("Ready to convert notification")
        video = VideoFactory(
            starting_at=timezone.now() - timezone.timedelta(days=1),
            live_info={
                "live_stopped_with_email": "user@example.com",
            },
            last_lti_url="https://example.com/course/machin",
        )
        if send_ready_to_convert_notification(video):
            self.stdout.write("Ready to convert notification email sent")
        else:
            self.stderr.write("Ready to convert notification email not sent")

        self.stdout.write()
        self.stdout.write("Convert to vod ready")
        if send_vod_ready_notification(video):
            self.stdout.write("Convert to vod ready notification email sent")
        else:
            self.stderr.write("Convert to vod ready notification email not sent")

        self.stdout.write()
        self.stdout.write("Convert to vod reminder")
        if send_convert_reminder_notification(video):
            self.stdout.write("Convert to vod reminder notification email sent")
        else:
            self.stderr.write("Convert to vod reminder notification email not sent")

        self.stdout.write()
        self.stdout.write("Ready to convert notification (no LTI URL)")
        video = VideoFactory(
            starting_at=timezone.now() - timezone.timedelta(days=1),
            live_info={
                "live_stopped_with_email": "user@example.com",
            },
        )
        if send_ready_to_convert_notification(video):
            self.stdout.write("Ready to convert notification (no LTI URL) email sent")
        else:
            self.stderr.write(
                "Ready to convert notification (no LTI URL) email not sent"
            )
