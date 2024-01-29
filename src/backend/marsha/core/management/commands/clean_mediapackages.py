"""Clean orphan mediapackages channel management command."""

from django.core.management.base import BaseCommand

from marsha.core.utils.medialive_utils import (
    delete_mediapackage_channel,
    list_indexed_medialive_channels,
    list_mediapackage_channel_harvest_jobs,
    list_mediapackage_channels,
)


class Command(BaseCommand):
    """Remove orphan mediapackage channels."""

    help = (
        "Check every mediapackage channels and remove them if no related medialive "
        "nor harvesting job exists."
    )

    def handle(self, *args, **options):
        """Execute management command."""
        mediapackage_channels = list_mediapackage_channels()
        indexed_medialive_channels = list_indexed_medialive_channels()

        for mediapackage_channel in mediapackage_channels:
            mediapackage_channel_id = mediapackage_channel.get("Id")
            self.stdout.write(
                f"Processing mediapackage channel {mediapackage_channel_id}"
            )

            if mediapackage_channel_id in indexed_medialive_channels.keys():
                continue

            mediapackage_channel_should_be_deleted = True
            mediapackage_channel_harvest_jobs = list_mediapackage_channel_harvest_jobs(
                mediapackage_channel_id
            )
            for harvest_job in mediapackage_channel_harvest_jobs:
                mediapackage_channel_should_be_deleted = (
                    mediapackage_channel_should_be_deleted
                    & (harvest_job.get("Status") in ("FAILED",))
                )

            if mediapackage_channel_should_be_deleted:
                deleted_endpoints = delete_mediapackage_channel(mediapackage_channel_id)
                for deleted_endpoint in deleted_endpoints:
                    self.stdout.write(
                        f"Mediapackage channel endpoint {deleted_endpoint} deleted"
                    )
                self.stdout.write(
                    f"Mediapackage channel {mediapackage_channel_id} deleted"
                )
