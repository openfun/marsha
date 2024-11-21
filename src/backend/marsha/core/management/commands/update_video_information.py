"""Management command to update in batch video size and duration."""

from django.core.management import BaseCommand

from marsha.core import defaults
from marsha.core.models import Video
from marsha.core.tasks.video import compute_video_information


class Command(BaseCommand):
    """Update in batch video size and duration."""

    help = "Update in batch video size and duration"

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit",
            type=int,
            help="The number of videos to update",
        )

    def handle(self, *args, **options):
        """Update in batch video size and duration."""

        videos = Video.objects.filter(
            size__isnull=True, duration__isnull=True, upload_state=defaults.READY
        )
        if options["limit"]:
            videos = videos[: options["limit"]]

        for video in videos.iterator():
            compute_video_information.delay(str(video.id))
            self.stdout.write(f"Video {video.id} information will be updated")
