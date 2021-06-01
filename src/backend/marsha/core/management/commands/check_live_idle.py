"""Check live in idle state management command."""
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from marsha.core.defaults import DELETED, IDLE
from marsha.core.models import Video
from marsha.core.utils.medialive_utils import delete_aws_element_stack


def generate_expired_date():
    """Generate a datetime object NB_DAYS_KEEPING_LIVE_IDLE days in the past."""
    return timezone.now() - timedelta(days=settings.NB_DAYS_KEEPING_LIVE_IDLE)


class Command(BaseCommand):
    """Check every live streaming in idle state."""

    help = "Check all live in IDLE state and close them if there are with no activity"

    def handle(self, *args, **options):
        """Execute management command."""
        videos = Video.objects.filter(
            live_state=IDLE,
            updated_on__lte=generate_expired_date(),
        )

        for video in videos:
            """Stop and delete the video."""
            self.stdout.write(f"Deleting video {video.id}")
            delete_aws_element_stack(video)
            video.upload_state = DELETED
            video.live_state = None
            video.live_type = None
            video.save()
