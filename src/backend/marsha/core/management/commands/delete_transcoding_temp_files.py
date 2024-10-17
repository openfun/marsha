"""Management command to delete transcoding temp files."""

import logging

from django.core.management import BaseCommand

from marsha.core.utils.transcode import delete_transcoding_temp_files


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """Delete transcoding temp files."""

    help = "Delete transcoding temp files"

    def handle(self, *args, **options):
        """Delete all transcoding temp files."""
        delete_transcoding_temp_files()
