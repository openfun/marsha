"""Default settings for the ``core`` app of the Marsha project."""
from django.conf import settings
from django.utils.translation import gettext_lazy as _


AWS_UPLOAD_EXPIRATION_DELAY = getattr(
    settings, "AWS_UPLOAD_EXPIRATION_DELAY", 24 * 60 * 60
)  # 24h

VIDEO_SOURCE_MAX_SIZE = getattr(settings, "VIDEO_SOURCE_MAX_SIZE", 2 ** 30)  # 1GB
SUBTITLE_SOURCE_MAX_SIZE = getattr(settings, "SUBTITLE_SOURCE_MAX_SIZE", 2 ** 20)  # 1MB
THUMBNAIL_SOURCE_MAX_SIZE = getattr(
    settings, "THUMBNAIL_SOURCE_MAX_SIZE", 10 * (2 ** 20)
)  # 10MB

PENDING, PROCESSING, ERROR, READY = "pending", "processing", "error", "ready"
STATE_CHOICES = (
    (PENDING, _("pending")),
    (PROCESSING, _("processing")),
    (ERROR, _("error")),
    (READY, _("ready")),
)
