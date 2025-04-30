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

# UPLOAD ERROR REASONS
MAX_RESOLUTION_EXCEDEED = "max_resolution_excedeed"
RECORDING_SOURCE_ERROR = "recording_source_error"

UPLOAD_ERROR_REASON_CHOICES = (
    (MAX_RESOLUTION_EXCEDEED, _("max_resolution_excedeed")),
    (RECORDING_SOURCE_ERROR, _("recording_source_error")),
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
VIDEO = "video"
WEBINAR = "webinar"
DOCUMENT = "document"
RENATER_FER_SAML = "renater_fer_saml"
VOD_CONVERT = "vod_convert"
TRANSCRIPTION = "transcription"
ALLOW_PLAYLIST_CREATION_FOR_ALL_ROLES = "allow_playlist_creation_for_all_roles"

# LTI view states expected by the frontend LTI application
APP_DATA_STATE_ERROR = "error"
APP_DATA_STATE_PORTABILITY = "portability"
APP_DATA_STATE_SUCCESS = "success"

VIDEO_ATTENDANCE_KEY_CACHE = "attendances:video:"
XAPI_STATEMENT_ID_CACHE = "xapi:statements:"
CLASSROOM_RECORDINGS_KEY_CACHE = "classrooms:recordings:"
LTI_REPLAY_PROTECTION_CACHE = "lti:replay_protection"

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
    (CC_BY_ND, _("Creative Common By Attribution No Derivatives")),
    (CC_BY_NC_ND, _("Creative Common By Attribution Non Commercial No Derivatives")),
    (CC0, _("Public Domain Dedication ")),
    (NO_CC, _("All rights reserved")),
)

LTI_DOCUMENT_ROUTE = "/lti/documents/"
LTI_VIDEO_ROUTE = "/lti/videos/"

RESOURCES_CHOICES = (
    (VIDEO, _("video")),
    (WEBINAR, _("webinar")),
    (DOCUMENT, _("document")),
    (CLASSROOM, _("classroom")),
    (MARKDOWN, _("markdown")),
    (DEPOSIT, _("deposit file")),
)

FEATURES_CHOICES = ((VOD_CONVERT, _("VOD conversion")),)

# Transcode pipelines

AWS_PIPELINE = "AWS"
PEERTUBE_PIPELINE = "peertube"
CELERY_PIPELINE = "celery"

TRANSCODE_PIPELINE_CHOICES = (
    (AWS_PIPELINE, _("AWS")),
    (PEERTUBE_PIPELINE, _("Peertube")),
)

PROCESS_PIPELINE_CHOICES = (
    (AWS_PIPELINE, _("AWS")),
    (CELERY_PIPELINE, _("Celery")),
)

# Storage location
AWS_S3 = "AWS"
SCW_S3 = "SCW"

STORAGE_LOCATION_CHOICES = (
    (AWS_S3, _("AWS")),
    (SCW_S3, _("SCW")),
)

TMP_STORAGE_BASE_DIRECTORY = "tmp"
DELETED_STORAGE_BASE_DIRECTORY = "deleted"
VOD_STORAGE_BASE_DIRECTORY = "vod"
CLASSROOM_STORAGE_BASE_DIRECTORY = "classroom"
FILE_DEPOSITORY_STORAGE_BASE_DIRECTORY = "filedepository"

STORAGE_BASE_DIRECTORY = (
    (TMP_STORAGE_BASE_DIRECTORY, _("tmp")),
    (VOD_STORAGE_BASE_DIRECTORY, _("VOD")),
    (CLASSROOM_STORAGE_BASE_DIRECTORY, _("Classroom")),
    (DELETED_STORAGE_BASE_DIRECTORY, _("deleted")),
    (FILE_DEPOSITORY_STORAGE_BASE_DIRECTORY, _("File Depository")),
)
