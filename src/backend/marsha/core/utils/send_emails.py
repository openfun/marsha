"""Utils to send mail to users."""
from datetime import timedelta
from urllib.parse import urljoin

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.translation import gettext as _

from marsha.core.utils.time_utils import to_datetime


def expiration_date(video):
    """Return the expiration date of the live stream recording."""
    return (
        (video.starting_at or to_datetime(video.live_info.get("started_at")))
        + timedelta(days=settings.NB_DAYS_BEFORE_DELETING_AWS_ELEMENTAL_STACK)
    ).strftime("%d/%m/%Y")


def _send_email(
    video,
    subject,
    paragraphs=None,
    video_frontend_access_label=None,
    video_lti_access_label=None,
):
    """Email the user."""
    if email := video.live_info.get("live_stopped_with_email"):
        template_vars = {
            "subject": subject,
            "email": email,
            "time_zone": settings.TIME_ZONE,
            "video": video,
            "paragraphs": paragraphs,
            "video_frontend_access_url": urljoin(
                settings.FRONTEND_HOME_URL, f"my-contents/videos/{video.id}"
            ),
            "video_frontend_access_label": video_frontend_access_label,
            "video_lti_access_url": video.last_lti_url,
            "video_lti_access_label": video_lti_access_label,
        }

        msg_plain = render_to_string("core/mail/text/vod_conversion.txt", template_vars)
        msg_html = render_to_string("core/mail/html/vod_conversion.html", template_vars)
        return send_mail(
            subject=subject + " - " + video.title,
            message=msg_plain,
            from_email=None,
            recipient_list=[email],
            html_message=msg_html,
            fail_silently=False,
        )

    return None


def send_ready_to_convert_notification(video):
    """Send a ready to convert email notification."""
    return _send_email(
        video=video,
        subject=_("Live Stream is ready to convert"),
        paragraphs=[
            _(
                'The live stream you recorded for "%(video_title)s" '
                "is ready to be converted to VOD."
            )
            % {"video_title": video.title},
            _("The live stream recording will be available until %(expiration_date)s.")
            % {"expiration_date": expiration_date(video)},
        ],
        video_frontend_access_label=_("Access the live stream from Marsha"),
        video_lti_access_label=_("Access the live stream from your LMS"),
    )


def send_vod_ready_notification(video):
    """Send a convert to vod ready email notification."""
    return _send_email(
        video=video,
        subject=_("Live Stream is converted to VOD"),
        paragraphs=[
            _('The live stream you recorded for "%(video_title)s" is converted to VOD.')
            % {"video_title": video.title},
        ],
        video_frontend_access_label=_("Access the VOD from Marsha"),
        video_lti_access_label=_(
            "Access the VOD through the live stream from your LMS"
        ),
    )


def send_convert_reminder_notification(video):
    """Send a reminder to convert email notification."""
    return _send_email(
        video=video,
        subject=_("Live Stream will be deleted soon"),
        paragraphs=[
            _(
                'The live stream you recorded for "%(video_title)s" '
                "is ready to be converted to VOD."
            )
            % {"video_title": video.title},
            _("The live stream recording will be available until %(expiration_date)s.")
            % {"expiration_date": expiration_date(video)},
        ],
        video_frontend_access_label=_("Access the live stream from Marsha"),
        video_lti_access_label=_("Access the live stream from your LMS"),
    )
