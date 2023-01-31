"""Clean medialive stack for developement environment."""
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from marsha.core.utils.medialive_utils import (
    delete_mediapackage_channel,
    list_medialive_channels,
    medialive_client,
    mediapackage_client,
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
                    self.stdout.write(
                        f"Cleaning stack with name {medialive_channel['Name']}"
                    )

                    if medialive_channel["State"] == "RUNNING":
                        self.stdout.write(
                            "Medialive channel is running, we must stop it first."
                        )
                        channel_waiter = medialive_client.get_waiter("channel_stopped")
                        medialive_client.stop_channel(ChannelId=medialive_channel["Id"])
                        channel_waiter.wait(ChannelId=medialive_channel["Id"])

                    medialive_client.delete_channel(ChannelId=medialive_channel["Id"])
                    input_waiter = medialive_client.get_waiter("input_detached")
                    for medialive_input in medialive_channel["InputAttachments"]:
                        input_waiter.wait(InputId=medialive_input["InputId"])
                        medialive_client.delete_input(
                            InputId=medialive_input["InputId"]
                        )

                    try:
                        # the mediapackage channel can already be deleted when the dev stack
                        # have ngrok up and running.
                        delete_mediapackage_channel(medialive_channel["Name"])
                    except mediapackage_client.exceptions.NotFoundException:
                        pass

                    self.stdout.write(
                        f"Stack with name {medialive_channel['Name']} deleted"
                    )
