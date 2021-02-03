"""Default settings for the ``core`` app of the Marsha project."""
from django.utils.translation import gettext_lazy as _


(
    PENDING,
    PROCESSING,
    HARVESTING,
    HARVESTED,
    ERROR,
    READY,
    IDLE,
    STARTING,
    STOPPED,
    RUNNING,
    DELETED,
) = (
    "pending",
    "processing",
    "harvesting",
    "harvested",
    "error",
    "ready",
    "idle",
    "starting",
    "stopped",
    "running",
    "deleted",
)
STATE_CHOICES = (
    (PENDING, _("pending")),
    (PROCESSING, _("processing")),
    (HARVESTING, _("processing live to VOD")),
    (ERROR, _("error")),
    (READY, _("ready")),
    (HARVESTED, _("harvested")),
    (DELETED, _("deleted")),
)

LIVE_CHOICES = (
    (IDLE, _("idle")),
    (STARTING, _("starting")),
    (RUNNING, _("running")),
    (STOPPED, _("stopped")),
)

# FLAGS
VIDEO_LIVE = "video_live"
