"""Send reminders management command."""

from datetime import timedelta
from logging import getLogger
import smtplib

from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand
from django.template.loader import render_to_string
from django.utils import dateformat, timezone
from django.utils.translation import gettext as _, override

from sentry_sdk import capture_exception

from marsha.core.defaults import IDLE
from marsha.core.models import LiveSession


logger = getLogger(__name__)


class Command(BaseCommand):
    """Send reminders for scheduled webinar."""

    help = "Send reminders for scheduled webinar."

    def query_to_update_step(self, livesession, step):
        """scripts could be called simultaneously, we update reminders field
        using strict where clauses, the same ones used in the select query."""

        if livesession.reminders:
            livesession.reminders.append(step)
        else:
            livesession.reminders = [step]

        if livesession.must_notify and step in livesession.must_notify:
            livesession.must_notify.remove(step)

        # to send mails if still appropriate
        return (
            LiveSession.objects.filter(id=livesession.id, should_send_reminders=True)
            .exclude(
                reminders__overlap=[
                    step,
                    settings.REMINDER_ERROR,
                ]
            )
            .update(
                reminders=livesession.reminders, must_notify=livesession.must_notify
            )
        )

    # pylint: disable=too-many-arguments,too-many-positional-arguments
    def send_reminders_and_update_livesessions_step(
        self, livesessions, step, mail_object, trans_context=None, template="reminder"
    ):
        """Send email with template and update reminders field."""
        trans_context = trans_context or {}

        for livesession in livesessions:
            # For each livesession we send the email

            # if record was updated
            if self.query_to_update_step(livesession, step) == 1:
                with override(livesession.language):
                    self.stdout.write(
                        f"Sending email for livesession {livesession.id} "
                        f"for video {livesession.video.id} step {step}"
                    )
                    # send email with the appropriate template and object
                    context = {
                        "cancel_reminder_url": livesession.cancel_reminder_url,
                        "email": livesession.email,
                        "time_zone": settings.TIME_ZONE,
                        "username": livesession.username,
                        "video": livesession.video,
                        "video_access_url": livesession.video_access_reminder_url,
                    }
                    if trans_context:
                        context = context | {
                            key: _(value) for key, value in trans_context.items()
                        }
                    msg_plain = render_to_string(
                        f"core/mail/text/{template}.txt", context
                    )
                    msg_html = render_to_string(
                        f"core/mail/html/{template}.html", context
                    )

                    try:
                        send_mail(
                            subject=_(mail_object),
                            message=msg_plain,
                            from_email=None,
                            recipient_list=[livesession.email],
                            html_message=msg_html,
                            fail_silently=False,
                        )
                        self.stdout.write(
                            f"Mail sent {livesession.email} {_(mail_object)}"
                        )
                    except smtplib.SMTPException as exception:
                        # send error to sentry and print it
                        livesession.update_reminders(settings.REMINDER_ERROR)
                        self.stderr.write(f"Mail failed {livesession.email} ")
                        capture_exception(exception)

    def handle(self, *args, **options):
        """Execute management command."""
        self.send_reminders_depending_on_time()
        self.send_reminders_video_updated()

    def send_reminders_video_updated(self):
        """
        Send reminders when video's starting_at time has
        changed.
        """

        livesessions = (
            LiveSession.objects.filter(
                should_send_reminders=True,
                is_registered=True,
                video__starting_at__gt=timezone.now(),
                video__live_state=IDLE,
                must_notify__overlap=[
                    settings.REMINDER_DATE_UPDATED,
                ],
            ).exclude(
                reminders__overlap=[
                    settings.REMINDER_DATE_UPDATED,
                    settings.REMINDER_ERROR,
                ]
            )
        ).order_by("created_on")

        self.send_reminders_and_update_livesessions_step(
            livesessions,
            settings.REMINDER_DATE_UPDATED,
            _("Webinar has been updated."),
            {},
            "reminder_date_updated",
        )

        # now reminders have been sent, we delete the step for these specific livesession
        # step was only used not to update simultaneously the same record
        date_updated = dateformat.format(timezone.now(), "Y-m-d H:i")
        for livesession in livesessions:
            # For each livesession we reinit this step, so new update can be sent
            livesession.reminders.remove(settings.REMINDER_DATE_UPDATED)
            # keep the trace of this reminder
            livesession.reminders.append(
                f"{settings.REMINDER_DATE_UPDATED}_{date_updated}"
            )
            livesession.save()

    def send_reminders_depending_on_time(self):
        """Send reminders depending on time. Videos mustn't be started yet,
        livesessions concerned are the ones where is_registered is True and
        should_send_reminders is True."""

        for step in settings.REMINDERS_STEP:
            reminder = settings.REMINDERS_STEP[step]
            starting_at_max = timezone.now() + timedelta(
                seconds=reminder[settings.REMINDER_KEY_STARTS_IN_S]
            )
            created_on = timezone.now() - timedelta(
                seconds=reminder[settings.REMINDER_KEY_REGISTER_BEFORE_S]
            )
            livesessions = (
                LiveSession.objects.filter(
                    created_on__lt=created_on,
                    should_send_reminders=True,
                    is_registered=True,
                    video__starting_at__gt=timezone.now(),
                    video__starting_at__lt=starting_at_max,
                    video__live_state=IDLE,
                ).exclude(
                    reminders__overlap=[
                        step,
                        settings.REMINDER_ERROR,
                    ]
                )
            ).order_by("created_on")

            # on some cases reminders can only be sent if others haven't
            if reminder.get(settings.REGISTER_EXCLUDE_STEP):
                livesessions = livesessions.exclude(
                    reminders__overlap=reminder[settings.REGISTER_EXCLUDE_STEP]
                )
            self.send_reminders_and_update_livesessions_step(
                livesessions,
                step,
                reminder[settings.REMINDER_OBJECT_MAIL],
                {"reminder_timer_title": reminder[settings.REMINDER_ELAPSED_LABEL]},
            )
