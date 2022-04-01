"""Send reminders mails with simulated data to test the actual rendering."""
from datetime import timedelta
import uuid

from django.conf import settings
from django.core.management import CommandError, call_command
from django.core.management.base import BaseCommand
from django.utils import timezone

from marsha.core.defaults import IDLE, RAW
from marsha.core.factories import LiveSessionFactory, VideoFactory


class Command(BaseCommand):
    """Send reminders for scheduled webinar."""

    help = "Send samples of reminder mails for scheduled webinar."

    def handle(self, *args, **options):
        """Execute management command."""

        if not settings.DEBUG:
            raise CommandError(
                "This command can only be executed when settings.DEBUG is True."
            )

        self.get_data_five_minutes_before()
        self.get_data_three_hours_before()
        self.get_data_three_days_before()
        call_command("send_reminders")
        self.stdout.write("Command was executed in DEBUG mode.")

    def get_data_five_minutes_before(self):
        """Data to simulate the reminder sent 5 minutes before the live starts."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(minutes=4),
        )

        # registration has been created 4 hours ago
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=4),
            email="sarah@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )

        # LTI registration with other reminders sent
        LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(hours=10),
            email="chantal@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            lti_id="Maths",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            reminders=[settings.REMINDER_2, settings.REMINDER_3],
            username="Mummy",
            video=video,
        )

    def get_data_three_hours_before(self):
        """Data to simulate the reminder sent 3 hours before the live starts."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(hours=2),
        )

        # registration has been created 26 hours ago (>1day)
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=26),
            email="sarah@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )

        # LTI registration with reminder 3 sent
        LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(hours=26),
            email="chantal@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            lti_id="Maths",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            reminders=[settings.REMINDER_3],
            username="Chantal",
            video=video,
        )

    def get_data_three_days_before(self):
        """Data to simulate the reminder sent 3 days before the live starts"""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=2),
        )

        # registration has been created 32 days agp (>30 days)
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(days=32),
            email="sarah@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )

        # LTI registration
        LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(days=32),
            email="chantal@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            lti_id="Maths",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            username="Super Chantal",
            video=video,
        )
