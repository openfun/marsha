"""Collect attendees from running classrooms and store them in the database."""
from django.core.management import BaseCommand

from marsha.bbb.utils.bbb_utils import collect_attendees


class Command(BaseCommand):
    """Collect attendees from running classrooms and store them in the database."""

    help = __doc__

    def handle(self, *args, **options):
        """Execute management command."""
        collect_attendees()
