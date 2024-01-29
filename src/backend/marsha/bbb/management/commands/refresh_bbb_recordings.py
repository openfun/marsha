"""Test update recording management command."""

from datetime import timezone
import logging

from django.core.management.base import BaseCommand

from dateutil.parser import parse

from marsha.bbb.models import Classroom, ClassroomRecording
from marsha.bbb.utils.bbb_utils import get_recordings, process_recordings


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """Updates recording from BBB server."""

    help = "Retrieve and stores BBB recordings."

    def add_arguments(self, parser):
        """Add arguments to the command."""
        parser.add_argument(
            "-c", "--classroom_id", type=str, help="Classroom id to update."
        )
        parser.add_argument(
            "-r", "--recording_id", type=str, help="Classroom recording id to update."
        )
        parser.add_argument(
            "-b", "--before", type=str, help="Update recordings before this date."
        )
        parser.add_argument(
            "-a", "--after", type=str, help="Update recordings after this date."
        )

    def handle(self, *args, **options):
        """Execute management command."""

        classroom_id = options["classroom_id"]
        recording_id = options["recording_id"]
        before = options["before"]
        after = options["after"]

        if recording_id:
            try:
                classroom_recording = ClassroomRecording.objects.get(id=recording_id)
            except ClassroomRecording.DoesNotExist:
                logger.error("Recording %s does not exist.", recording_id)
                return

            api_response = get_recordings(record_id=classroom_recording.record_id)
            process_recordings(
                classroom_recording.classroom,
                api_response,
                record_id=classroom_recording.record_id,
            )
            return

        classrooms = Classroom.objects.all()
        if classroom_id:
            classrooms = classrooms.filter(id=classroom_id)

        if not classrooms:
            logger.info("No classroom found.")
            return

        for classroom in classrooms:
            logger.info("Classroom %s found.", classroom.id)
            # cleanup existing recordings
            classroom_recordings = classroom.recordings.all()
            if before:
                classroom_recordings = classroom_recordings.filter(
                    started_at__lt=parse(before).replace(tzinfo=timezone.utc)
                )
            if after:
                classroom_recordings = classroom_recordings.filter(
                    started_at__gt=parse(after).replace(tzinfo=timezone.utc)
                )
            known_recording_ids = classroom_recordings.values_list(
                "record_id", flat=True
            )
            for recording_id in known_recording_ids:
                api_response = get_recordings(classroom.meeting_id, recording_id)
                process_recordings(classroom, api_response, recording_id)

            # get new recordings
            api_response = get_recordings(classroom.meeting_id)
            process_recordings(
                classroom,
                api_response,
                record_ids_to_skip=known_recording_ids,
                before=before,
                after=after,
            )
