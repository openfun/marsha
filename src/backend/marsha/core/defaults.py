"""Default settings for the ``core`` app of the Marsha project."""
from django.utils.translation import gettext_lazy as _


PENDING, PROCESSING, ERROR, READY, IDLE, STARTING, STOPPED, RUNNING = (
    "pending",
    "processing",
    "error",
    "ready",
    "idle",
    "starting",
    "stopped",
    "running",
)
STATE_CHOICES = (
    (PENDING, _("pending")),
    (PROCESSING, _("processing")),
    (ERROR, _("error")),
    (READY, _("ready")),
)

LIVE_CHOICES = (
    (IDLE, _("idle")),
    (STARTING, _("starting")),
    (RUNNING, _("running")),
    (STOPPED, _("stopped")),
)
