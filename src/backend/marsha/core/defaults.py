"""Default settings for the ``core`` app of the Marsha project."""
from django.utils.translation import gettext_lazy as _


PENDING, PROCESSING, ERROR, READY = "pending", "processing", "error", "ready"
STATE_CHOICES = (
    (PENDING, _("pending")),
    (PROCESSING, _("processing")),
    (ERROR, _("error")),
    (READY, _("ready")),
)
