"""Check live state management command."""
from datetime import timedelta
from logging import getLogger
import smtplib

from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from sentry_sdk import capture_exception

from marsha.core.defaults import IDLE, RUNNING
from marsha.core.models import LiveRegistration


logger = getLogger(__name__)


class Command(BaseCommand):
    """Send reminders for scheduled webinar."""

    help = "Send reminders for scheduled webinar."

    def query_to_update_step(self, liveregistration, step):
        """scripts could be called simultaneously, we update reminders field
        using strict where clauses, the same ones used in the select query."""

        if liveregistration.reminders:
            liveregistration.reminders.append(step)
        else:
            liveregistration.reminders = [step]

        # to send mails if still appropriate
        return (
            LiveRegistration.objects.filter(
                id=liveregistration.id, should_send_reminders=True
            )
            .exclude(
                reminders__overlap=[
                    step,
                    settings.REMINDER_IS_STARTED,
                    settings.REMINDER_ERROR,
                ]
            )
            .update(reminders=liveregistration.reminders)
        )

    def send_reminders_and_update_liveregistrations_step(
        self, liveregistrations, step, template="reminder"
    ):
        """Send email with template and update reminders field."""
        for liveregistration in liveregistrations:
            """For each liveregistration we send the email"""

            # if record was updated
            if self.query_to_update_step(liveregistration, step) == 1:

                self.stdout.write(
                    f"Sending email for liveregistration {liveregistration.id} "
                    f"for video {liveregistration.video.id} step {step}"
                )

                # send email with the appropriate template and object
                vars = (
                    {
                        "reminder_timer_text": _(f"reminder_timer_text_{step}"),
                        "reminder_timer_title": _(f"reminder_timer_title_{step}"),
                    }
                    if template == "reminder"
                    else {}
                )

                msg_plain = render_to_string(f"core/mail/text/{template}.txt", vars)
                msg_html = render_to_string(f"core/mail/html/{template}.html", vars)

                try:
                    send_mail(
                        _(f"object_{template}_{step}"),
                        msg_plain,
                        settings.EMAIL_FROM,
                        [liveregistration.email],
                        html_message=msg_html,
                        fail_silently=False,
                    )
                except smtplib.SMTPException as exception:
                    # send error to sentry and print it
                    liveregistration.update_reminders(settings.REMINDER_ERROR)
                    self.stderr.write(f"Mail failed {liveregistration.email} ")
                    capture_exception(exception)

    def handle(self, *args, **options):
        """Execute management command."""
        self.send_reminders_is_already_started()
        self.send_reminders_depending_on_time()

    def send_reminders_is_already_started(self):
        """Videos that have been started before send a reminder.

        Search for all liveregistrations that have a scheduled webinar planned ahead
        but are already running. Only concerns liveregistrations that have is_registered
        True and should_send_reminders True.
        """
        liveregistrations = LiveRegistration.objects.filter(
            should_send_reminders=True,
            is_registered=True,
            video__starting_at__gt=timezone.now(),
            video__live_state=RUNNING,
        ).exclude(
            reminders__overlap=[settings.REMINDER_IS_STARTED, settings.REMINDER_ERROR]
        )
        self.send_reminders_and_update_liveregistrations_step(
            liveregistrations, settings.REMINDER_IS_STARTED, "reminder_already_started"
        )

    def send_reminders_depending_on_time(self):
        """Send reminders depending on time. Videos mustn't be started yet,
        liveregistrations concerned are the ones where is_registered is True and
        should_send_reminders is True."""

        for step in settings.REMINDERS_STEP:
            reminder = settings.REMINDERS_STEP[step]
            starting_at_max = timezone.now() + timedelta(
                seconds=reminder[settings.REMINDER_KEY_STARTS_IN_S]
            )
            created_on = timezone.now() - timedelta(
                seconds=reminder[settings.REMINDER_KEY_REGISTER_BEFORE_S]
            )
            liveregistrations = (
                LiveRegistration.objects.filter(
                    created_on__lt=created_on,
                    should_send_reminders=True,
                    is_registered=True,
                    video__starting_at__gt=timezone.now(),
                    video__starting_at__lt=starting_at_max,
                    video__live_state=IDLE,
                ).exclude(
                    reminders__overlap=[
                        step,
                        settings.REMINDER_IS_STARTED,
                        settings.REMINDER_ERROR,
                    ]
                )
            ).order_by("created_on")

            # on some cases reminders can only be sent if others haven't
            if reminder.get(settings.REGISTER_EXCLUDE_STEP):
                liveregistrations = liveregistrations.exclude(
                    reminders__overlap=reminder[settings.REGISTER_EXCLUDE_STEP]
                )

            self.send_reminders_and_update_liveregistrations_step(
                liveregistrations, step
            )
