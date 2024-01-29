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
        self.get_data_video_date_updated()
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
            email="sarah5@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )

        # LTI registration with other reminders sent
        LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(hours=10),
            email="chantal5@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            lti_id="Maths",
            lti_user_id="56255f3807599c377bf0e5bf07235955",
            reminders=[settings.REMINDER_2, settings.REMINDER_3],
            username="Mummy5",
            video=video,
        )

        # french
        LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(hours=10),
            email="french5@test-fun-mooc.fr",
            is_registered=True,
            language="fr",
            lti_id="Maths",
            lti_user_id="26255f3807599c377bf0e5bf07235555",
            reminders=[settings.REMINDER_2, settings.REMINDER_3],
            should_send_reminders=True,
            username="French Mummy5",
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
            email="sarah3h@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )

        # LTI registration with reminder 3 sent
        LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(hours=26),
            email="chantal3h@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            lti_id="Maths",
            lti_user_id="56255f3807599c377bf0e5bf0723593h",
            reminders=[settings.REMINDER_3],
            username="Chantal3h",
            video=video,
        )

        # french
        LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(hours=26),
            email="french@test-fun-mooc.fr",
            is_registered=True,
            language="fr",
            lti_id="Maths",
            lti_user_id="26255f3807599c377bf0e5bf0723593h",
            reminders=[settings.REMINDER_3],
            should_send_reminders=True,
            username="Caroline3h",
            video=video,
        )

    def get_data_three_days_before(self):
        """Data to simulate the reminder sent 3 days before the live starts"""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=2),
        )

        # registration has been created 32 days ago (>30 days)
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(days=32),
            email="sarah3d@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )

        # LTI registration
        LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(days=32),
            email="chantal3d@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            lti_id="Maths",
            lti_user_id="56255f3807599c377bf0e5bf0723593d",
            username="Super Chantal3d",
            video=video,
        )

        # french
        LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(days=32),
            email="french3d@test-fun-mooc.fr",
            is_registered=True,
            language="fr",
            lti_id="Maths",
            lti_user_id="16255f3807599c377bf0e5bf0723593d",
            should_send_reminders=True,
            username="French Chantal3d",
            video=video,
        )

    def get_data_video_date_updated(self):
        """
        Data to simulate the reminder sent when video had its starting date
        updated
        """
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=2),
        )

        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=1),
            email="sarahupdated@test-fun-mooc.fr",
            must_notify=[settings.REMINDER_DATE_UPDATED],
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )

        # LTI registration
        LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(hours=1),
            email="chantalupadated@test-fun-mooc.fr",
            is_registered=True,
            must_notify=[settings.REMINDER_DATE_UPDATED],
            lti_id="Maths",
            lti_user_id="56255f3807599c377bf0e5bf072359fu",
            should_send_reminders=True,
            username="Super Chantal updated",
            video=video,
        )

        # french
        LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(hours=1),
            email="french@test-fun-mooc.fr",
            is_registered=True,
            language="fr",
            lti_id="Maths",
            lti_user_id="36255f3807599c377bf0e5bf072359fu",
            must_notify=[settings.REMINDER_DATE_UPDATED],
            should_send_reminders=True,
            username="French Chantal updated",
            video=video,
        )
