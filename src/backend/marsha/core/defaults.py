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
    STOPPING,
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
    "stopping",
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
    (STOPPING, _("stopping")),
)

# LIVE TYPE
(RAW, JITSI) = ("raw", "jitsi")

LIVE_TYPE_CHOICES = ((RAW, _("raw")), (JITSI, _("jitsi")))

# FLAGS
SENTRY = "sentry"
BBB = "BBB"
