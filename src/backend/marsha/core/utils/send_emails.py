"""Utils to send mail to users."""
from datetime import timedelta
from urllib.parse import urljoin

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.translation import gettext as _

from marsha.core.utils.time_utils import to_datetime


def send_ready_to_convert_notification(video):
    """Send a ready to convert email notification."""
    if email := video.live_info.get("live_stopped_with_email"):
        template_vars = {
            "email": email,
            "time_zone": settings.TIME_ZONE,
            "video": video,
            "video_access_url": video.last_lti_url,
            "expiration_date": (
                video.starting_at or to_datetime(video.live_info.get("started_at"))
            )
            + timedelta(days=settings.NB_DAYS_BEFORE_DELETING_AWS_ELEMENTAL_STACK),
        }

        msg_plain = render_to_string(
            "core/mail/text/vod_conversion_ready.txt", template_vars
        )
        msg_html = render_to_string(
            "core/mail/html/vod_conversion_ready.html", template_vars
        )
        return send_mail(
            subject=_("Live Stream is ready to convert - %(video.title)s")
            % {"video.title": video.title},
            message=msg_plain,
            from_email=None,
            recipient_list=[email],
            html_message=msg_html,
            fail_silently=False,
        )

    return None


def send_vod_ready_notification(video):
    """Send a convert to vod ready email notification."""
    if email := video.live_stopped_by_email:
        template_vars = {
            "email": email,
            "time_zone": settings.TIME_ZONE,
            "video": video,
            "video_access_url": video.last_lti_url,
        }

        msg_plain = render_to_string("core/mail/text/vod_ready.txt", template_vars)
        msg_html = render_to_string("core/mail/html/vod_ready.html", template_vars)
        return send_mail(
            subject=_("Live Stream is converted to VOD - %(video.title)s")
            % {"video.title": video.title},
            message=msg_plain,
            from_email=None,
            recipient_list=[email],
            html_message=msg_html,
            fail_silently=False,
        )

    return None


def send_convert_reminder_notification(video):
    """Send a reminder to convert email notification."""
    if email := video.live_stopped_by_email:
        template_vars = {
            "email": email,
            "time_zone": settings.TIME_ZONE,
            "video": video,
            "video_access_url": video.last_lti_url,
            "expiration_date": (
                video.starting_at or to_datetime(video.live_info.get("started_at"))
            )
            + timedelta(days=settings.NB_DAYS_BEFORE_DELETING_AWS_ELEMENTAL_STACK),
        }

        msg_plain = render_to_string(
            "core/mail/text/vod_conversion_reminder.txt", template_vars
        )
        msg_html = render_to_string(
            "core/mail/html/vod_conversion_reminder.html", template_vars
        )
        return send_mail(
            subject=_("Live Stream will be deleted soon - %(video.title)s")
            % {"video.title": video.title},
            message=msg_plain,
            from_email=None,
            recipient_list=[email],
            html_message=msg_html,
            fail_silently=False,
        )

    return None
