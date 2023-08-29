"""Clean medialive stack for development environment."""
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from marsha.core.utils.medialive_utils import (
    delete_medialive_stack,
    list_medialive_channels,
)
from marsha.core.utils.time_utils import to_datetime


class Command(BaseCommand):
    """Clean medialive stack for development environment."""

    help = (
        "Check every resources created on medialive and mediapackage and remove all resources"
        "belonging to a development environment created more than "
        f"{settings.NB_SECONDS_LIVING_DEV_STACK} minutes ago."
    )

    def handle(self, *args, **options):
        """Execute management command."""
        now = timezone.now()

        for medialive_channel in list_medialive_channels():
            tags = medialive_channel.get("Tags", {})
            # the channel must be a marsha one and the environment must start with dev-
            if tags.get("app") == "marsha" and tags.get("environment", "").startswith(
                "dev-"
            ):
                # the channel name contains the environment, the primary key and the created_at
                # stamp. Here we want to use the timestamp
                _environment, _pk, stamp = medialive_channel["Name"].split("_")
                created_at = to_datetime(stamp)

                if (
                    created_at + timedelta(seconds=settings.NB_SECONDS_LIVING_DEV_STACK)
                    <= now
                ):
                    delete_medialive_stack(medialive_channel, self.stdout)
