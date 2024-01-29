"""Check every existing medialive channel and check if the related video is still usable."""

from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from marsha.core.defaults import HARVESTED
from marsha.core.models import Video
from marsha.core.utils.medialive_utils import list_medialive_channels
from marsha.core.utils.send_emails import send_convert_reminder_notification
from marsha.core.utils.time_utils import to_datetime


def generate_expiration_reminder_date():
    """Generate a datetime object NB_DAYS_BEFORE_DELETING_AWS_ELEMENTAL_STACK +
    NB_DAYS_BEFORE_DELETING_AWS_ELEMENTAL_STACK_REMINDER days in the past."""
    return timezone.now() - timedelta(
        days=settings.NB_DAYS_BEFORE_DELETING_AWS_ELEMENTAL_STACK
        - settings.NB_DAYS_BEFORE_DELETING_AWS_ELEMENTAL_STACK_REMINDER
    )


class Command(BaseCommand):
    """
    Once a live started, it will be deleted in NB_DAYS_BEFORE_DELETING_AWS_ELEMENTAL_STACK.
    We want to send a reminder to the user to convert the live stream to VOD.
    """

    help = __doc__

    def handle(self, *args, **options):
        """Execute management command."""
        expiration_reminder_date = generate_expiration_reminder_date()
        for medialive_channel in list_medialive_channels():
            # Don't work with stack not belonging to the current environment
            if (
                medialive_channel.get("Tags", {}).get("environment")
                != settings.AWS_BASE_NAME
            ):
                continue

            # If the live is not idle, skip it
            if medialive_channel.get("State") != "IDLE":
                continue
            # the channel name contains the environment, the primary key and the created_at
            # stamp. Here we want to use the primary key
            _environment, live_pk, _stamp = medialive_channel["Name"].split("_")
            try:
                live = Video.objects.get(pk=live_pk)
                self.stdout.write(f"Checking video {live.id}")

                if not live.recording_slices or live.live_state == HARVESTED:
                    # Live has no recordings or is already harvested, we can skip it.
                    continue

                if live.starting_at:
                    # Live was scheduled, we can use this schedule date.
                    if live.starting_at < expiration_reminder_date:
                        send_convert_reminder_notification(live)
                elif started_at := live.live_info.get("started_at"):
                    # Live has started_at info, we can use it.
                    started_at = to_datetime(started_at)
                    if started_at < expiration_reminder_date:
                        send_convert_reminder_notification(live)
            except Video.DoesNotExist:
                # Channel exists in AWS but no live in our DB.
                # Let clean_aws_elemental_stack handle it.
                pass
