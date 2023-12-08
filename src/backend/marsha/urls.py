"""Marsha URLs configuration."""
import re

from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path, register_converter
from django.views.decorators.cache import cache_page

from django_peertube_runner_connector.urls import (
    urlpatterns as django_peertube_runner_connector_urls,
)
from rest_framework.routers import DefaultRouter

from marsha.core import models
from marsha.core.api import (
    ChallengeAuthenticationView,
    DocumentViewSet,
    LiveSessionViewSet,
    OrganizationViewSet,
    PlaylistAccessViewSet,
    PlaylistViewSet,
    PortabilityResourceViewSet,
    SharedLiveMediaViewSet,
    ThumbnailViewSet,
    TimedTextTrackViewSet,
    UserViewSet,
    VideoViewSet,
    XAPIStatementView,
    get_frontend_configuration,
    pairing_challenge,
    recording_slices_manifest,
    recording_slices_state,
    update_state,
)
from marsha.core.api.lti_user_association import LtiUserAssociationViewSet
from marsha.core.routers import MarshaDefaultRouter
from marsha.core.urls.converters import XAPIResourceKindConverter
from marsha.core.utils.lti_select_utils import get_lti_select_resources
from marsha.core.views import (
    DocumentLTIView,
    DocumentView,
    LTIConfigView,
    LTIRespondView,
    LTISelectView,
    RemindersCancelView,
    SiteView,
    VideoLTIView,
    VideoView,
)
from marsha.development.api import local_document_upload, local_video_upload


register_converter(XAPIResourceKindConverter, "xapi_resource_kind")

LTI_SELECT_ROUTE_PATTERN = (
    rf"lti/select/((?P<resource_kind>{'|'.join(get_lti_select_resources().keys())})/)?$"
)

router = MarshaDefaultRouter()
router.register(models.Video.RESOURCE_NAME, VideoViewSet, basename="videos")
router.register(models.Document.RESOURCE_NAME, DocumentViewSet, basename="documents")
router.register("organizations", OrganizationViewSet, basename="organizations")
router.register("playlists", PlaylistViewSet, basename="playlists")
router.register(
    "playlist-accesses", PlaylistAccessViewSet, basename="playlist_accesses"
)
router.register(
    "portability-requests", PortabilityResourceViewSet, basename="portability_requests"
)
router.register("users", UserViewSet, basename="users")
router.register(
    "lti-user-associations", LtiUserAssociationViewSet, basename="lti_user_associations"
)

# Video related resources (for nested routes)
video_related_router = DefaultRouter()
video_related_router.register(
    models.LiveSession.RESOURCE_NAME,
    LiveSessionViewSet,
    basename="live_sessions",
)

video_related_router.register(
    models.TimedTextTrack.RESOURCE_NAME,
    TimedTextTrackViewSet,
    basename="timed_text_tracks",
)

video_related_router.register(
    models.SharedLiveMedia.RESOURCE_NAME,
    SharedLiveMediaViewSet,
    basename="sharedlivemedias",
)

video_related_router.register(
    models.Thumbnail.RESOURCE_NAME, ThumbnailViewSet, basename="thumbnails"
)

urlpatterns = [
    # Account
    path("account/", include("marsha.account.urls")),
    # Admin
    path("admin/", admin.site.urls),
    path("", include("marsha.page.urls")),
    # LTI
    path("lti/<str:model>/config.xml", LTIConfigView.as_view(), name="config_lti_view"),
    path("lti/config.xml", LTIConfigView.as_view(), name="config_lti_view"),
    re_path(
        LTI_SELECT_ROUTE_PATTERN,
        LTISelectView.as_view(),
        name="select_lti_view",
    ),
    path("lti/respond/", LTIRespondView.as_view(), name="respond_lti_view"),
    path("lti/videos/", VideoLTIView.as_view(), name="videos_lti_view_generic"),
    path("lti/videos/<uuid:uuid>", VideoLTIView.as_view(), name="video_lti_view"),
    path(
        "lti/documents/<uuid:uuid>", DocumentLTIView.as_view(), name="document_lti_view"
    ),
    # Public resources
    path("videos/<uuid:uuid>", VideoView.as_view(), name="video_direct_access"),
    path("documents/<uuid:uuid>", DocumentView.as_view(), name="document_public"),
    # API
    path(
        "api/auth/challenge/",
        ChallengeAuthenticationView.as_view(),
        name="api_authentication",
    ),
    path("api/pairing-challenge", pairing_challenge, name="pairing_challenge"),
    path("api/update-state", update_state, name="update_state"),
    path(
        "api/recording-slices-manifest",
        recording_slices_manifest,
        name="recording_slices_manifest",
    ),
    path(
        "api/recording-slices-state",
        recording_slices_state,
        name="recording_slices_state",
    ),
    path("api/config/", get_frontend_configuration, name="config"),
    path("api/", include(router.urls)),
    path(
        f"api/{models.Video.RESOURCE_NAME}/<uuid:video_id>/",
        include(video_related_router.urls),
    ),
    path(
        "reminders/cancel/<str:pk>/<str:key>",
        RemindersCancelView.as_view(),
        name="reminders_cancel",
    ),
    path(
        "xapi/<xapi_resource_kind:resource_kind>/<uuid:resource_id>/",
        XAPIStatementView.as_view(),
        name="xapi",
    ),
]

if settings.BBB_ENABLED:
    urlpatterns += [path("", include("marsha.bbb.urls"))]

if settings.DEPOSIT_ENABLED:
    urlpatterns += [path("", include("marsha.deposit.urls"))]

if settings.MARKDOWN_ENABLED:
    urlpatterns += [path("", include("marsha.markdown.urls"))]

if settings.DEBUG:
    urlpatterns += [path("", include("marsha.development.urls"))]

if "dummy" in settings.STORAGE_BACKEND:
    urlpatterns += [
        path(
            "e2e/api/video-upload/<uuid:uuid>",
            local_video_upload,
            name="local-video-upload",
        ),
        path(
            "api/document-upload/<uuid:uuid>",
            local_document_upload,
            name="local-document-upload",
        ),
    ]
urlpatterns += django_peertube_runner_connector_urls

static_path = re.escape(settings.STATIC_URL.lstrip("/"))
media_path = re.escape(settings.MEDIA_URL.lstrip("/"))
SITE_IGNORE_PREFIX = "|".join([static_path, media_path])

urlpatterns += [
    re_path(
        # Catch all URLs that are not handled before
        # and which do not regard static files or media files
        rf"^(?!{SITE_IGNORE_PREFIX}).*",
        cache_page(86400, key_prefix=settings.RELEASE)(SiteView.as_view()),
        name="site",
    ),
]
