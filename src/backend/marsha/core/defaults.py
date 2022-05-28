"""Default settings for the ``core`` app of the Marsha project."""
from django.utils.translation import gettext_lazy as _


(
    PENDING,
    PROCESSING,
    HARVESTING,
    HARVESTED,
    ERROR,
    ENDED,
    READY,
    IDLE,
    STARTING,
    STOPPED,
    STOPPING,
    RUNNING,
    DELETED,
    PAUSED,
    APPROVAL,
    DENIED,
    FORCED,
) = (
    "pending",
    "processing",
    "harvesting",
    "harvested",
    "error",
    "ended",
    "ready",
    "idle",
    "starting",
    "stopped",
    "stopping",
    "running",
    "deleted",
    "paused",
    "approval",
    "denied",
    "forced",
)
STATE_CHOICES = (
    (PENDING, _("pending")),
    (PROCESSING, _("processing")),
    (ERROR, _("error")),
    (READY, _("ready")),
    (DELETED, _("deleted")),
)

LIVE_CHOICES = (
    (ENDED, _("ended")),
    (HARVESTED, _("harvested")),
    (HARVESTING, _("processing live to VOD")),
    (IDLE, _("idle")),
    (RUNNING, _("running")),
    (STARTING, _("starting")),
    (STOPPED, _("stopped")),
    (STOPPING, _("stopping")),
)

# LIVE TYPE
(RAW, JITSI) = ("raw", "jitsi")

LIVE_TYPE_CHOICES = ((RAW, _("raw")), (JITSI, _("jitsi")))

JOIN_MODE_CHOICES = (
    (APPROVAL, _("approval")),
    (DENIED, _("denied")),
    (FORCED, _("forced")),
)

# FLAGS
SENTRY = "sentry"
BBB = "BBB"
LIVE_RAW = "live_raw"
MARKDOWN = "markdown"
