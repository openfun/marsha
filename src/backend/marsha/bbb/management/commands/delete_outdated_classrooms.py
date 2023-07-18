"""Delete outdated classrooms that have reached their retention date."""
from django.core.management.base import BaseCommand

from marsha.bbb.models import Classroom
from marsha.core.management.commands.delete_outdated_videos import (
    delete_outdated_models,
)


class Command(BaseCommand):
    """Delete outdated classrooms that have reached their retention date."""

    help = "Deletes outdated Classroom once they reached their retention date."

    def handle(self, *args, **options):
        """
        call delete_outdated_models to delete Video object.
        """
        delete_outdated_models(self.stdout, Classroom)
