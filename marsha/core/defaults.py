"""Default settings for the ``core`` app of the Marsha project."""
from django.conf import settings


AWS_UPLOAD_EXPIRATION_DELAY = getattr(
    settings, "AWS_UPLOAD_EXPIRATION_DELAY", 24 * 60 * 60
)  # 24h

VIDEO_SOURCE_MAX_SIZE = getattr(settings, "VIDEO_SOURCE_MAX_SIZE", 2 ** 30)  # 1GB
