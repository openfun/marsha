"""For each pending classroom, get their meeting infos:
 update learning analytics, and end it if needed."""

from django.core.management import BaseCommand

from marsha.bbb.models import Classroom
from marsha.bbb.utils.bbb_utils import get_meeting_infos


class Command(BaseCommand):
    """For each pending classroom, update learning analytics, and end it if needed."""

    help = __doc__

    def handle(self, *args, **options):
        """Execute management command."""
        classrooms = Classroom.objects.filter(started=True, ended=False)
        if not classrooms:
            self.stdout.write("No pending classroom found.")
            return
        for classroom in classrooms:
            try:
                self.stdout.write(f"Updating session for classroom {classroom.title}")
                get_meeting_infos(classroom)
                self.stdout.write(f"Session for classroom {classroom.title} updated.")
            except Exception as exception:
                self.stdout.write(
                    f"Failed to update pending classroom {classroom.title}: {exception}"
                )
                continue
