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
    SCANNING,
    INFECTED,
    COPYING,
    INITIALIZED,
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
    "scanning",
    "infected",
    "copying",
    "initialized",
)
STATE_CHOICES = (
    (INITIALIZED, _("initialized")),
    (PENDING, _("pending")),
    (PROCESSING, _("processing")),
    (ERROR, _("error")),
    (READY, _("ready")),
    (DELETED, _("deleted")),
    (SCANNING, _("scanning")),
    (INFECTED, _("infected")),
    (COPYING, _("copying")),
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
CLASSROOM = "classroom"
DEPOSIT = "deposit"
LIVE_RAW = "live_raw"
MARKDOWN = "markdown"
RENATER_FER_SAML = "renater_fer_saml"

VIDEO_ATTENDANCE_KEY_CACHE = "attendances:video:"

# Licenses

CC_BY = "CC_BY"
CC_BY_SA = "CC_BY-SA"
CC_BY_NC = "CC_BY-NC"
CC_BY_NC_SA = "CC_BY-NC-SA"
CC_BY_ND = "CC_BY-ND"
CC_BY_NC_ND = "CC_BY-NC-ND"
CC0 = "CC0"
NO_CC = "NO_CC"

LICENCES_CHOICES = (
    (CC_BY, _("Creative Common By Attribution")),
    (CC_BY_SA, _("Creative Common By Attribution Share Alike")),
    (CC_BY_NC, _("Creative Common By Attribution Non Commercial")),
    (CC_BY_NC_SA, _("Creative Common By Attribution Non Commercial Share Alike")),
    (CC_BY_ND, _("Creative Common By Attribution No Derivates")),
    (CC_BY_NC_ND, _("Creative Common By Attribution Non Commercial No Derivates")),
    (CC0, _("Public Domain Dedication ")),
    (NO_CC, _("All rights reserved")),
)

LTI_DOCUMENT_ROUTE = "/lti/documents/"
LTI_VIDEO_ROUTE = "/lti/videos/"
