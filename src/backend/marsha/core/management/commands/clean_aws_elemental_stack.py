"""Check every existing medialive channel and check if the related video is still usable."""

from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from marsha.core.defaults import DELETED, ENDED
from marsha.core.models import Video
from marsha.core.utils.medialive_utils import (
    delete_medialive_stack,
    list_medialive_channels,
)
from marsha.core.utils.time_utils import to_datetime


def generate_expired_date():
    """Generate a datetime object NB_DAYS_BEFORE_DELETING_AWS_ELEMENTAL_STACK days in the past."""
    return timezone.now() - timedelta(
        days=settings.NB_DAYS_BEFORE_DELETING_AWS_ELEMENTAL_STACK
    )


class Command(BaseCommand):
    """
    Once a live started, all AWS elemental stack are created. Once stopped, the
    instructor must do an action. Restart it and/or convert it in VOD. If
    nothing is done, the AWS element resources are leaved unused and use the quota
    we have on our AWS account.
    These unused resources must be removed after several days of inactivity and the video
    move in a DELETED state.
    """

    help = __doc__

    def handle(self, *args, **options):
        """Execute management command."""
        expired_date = generate_expired_date()
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

                if live.get_medialive_channel().get("id") != medialive_channel["Id"]:
                    # Live is attached to another channel, delete this channel.
                    self.stdout.write(
                        f"The video {live.id} is not attached to the "
                        f"channel {medialive_channel['Name']}"
                    )
                    delete_medialive_stack(medialive_channel, self.stdout)
                    continue

                if live.starting_at:
                    # Live was scheduled, we can use this schedule date.
                    if live.starting_at < expired_date:
                        self._delete_live(live, medialive_channel)
                elif started_at := live.live_info.get("started_at"):
                    # Live has started_at info, we can use it.
                    started_at = to_datetime(started_at)
                    if started_at < expired_date:
                        self._delete_live(live, medialive_channel)
            except Video.DoesNotExist:
                # Channel exists in AWS but no live in our DB. Delete it.
                self.stdout.write(
                    f"""Channel {medialive_channel["Name"]} is """
                    f"""attached to a video {live_pk} that does not exist"""
                )
                delete_medialive_stack(medialive_channel, self.stdout)

    def _delete_live(self, live, medialive_channel):
        """
        Set the live_state to ENDED, the upload_state to DELETED and delete
        all AWS resources
        """
        self.stdout.write(f"deleting AWS resources for video {live.id}")

        delete_medialive_stack(medialive_channel, self.stdout)

        self.stdout.write(f"Set video state to deleted for video {live.id}")
        live.live_state = ENDED
        live.upload_state = DELETED
        live.live_info.pop("medialive")
        live.live_info.pop("mediapackage")
        if live.live_info.get("live_stopped_with_email"):
            live.live_info.pop("live_stopped_with_email")
        live.save(
            update_fields=(
                "live_state",
                "upload_state",
                "live_info",
            )
        )
