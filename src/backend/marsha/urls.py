"""Marsha URLs configuration."""

from django.conf import settings
from django.urls import include, path, re_path

from rest_framework.renderers import CoreJSONRenderer
from rest_framework.routers import DefaultRouter
from rest_framework.schemas import get_schema_view

from marsha.core import models
from marsha.core.admin import admin_site
from marsha.core.api import (
    DocumentViewSet,
    LiveRegistrationViewSet,
    OrganizationViewSet,
    PlaylistViewSet,
    SharedLiveMediaViewSet,
    ThumbnailViewSet,
    TimedTextTrackViewSet,
    UserViewSet,
    VideoViewSet,
    XAPIStatementView,
    pairing_challenge,
    update_state,
)
from marsha.core.views import (
    DocumentView,
    LTIRespondView,
    LTISelectView,
    RemindersCancelView,
    SiteView,
    VideoView,
)
from marsha.development.api import local_document_upload, local_video_upload


router = DefaultRouter()
router.register(models.Video.RESOURCE_NAME, VideoViewSet, basename="videos")
router.register(models.Document.RESOURCE_NAME, DocumentViewSet, basename="documents")
router.register(
    models.LiveRegistration.RESOURCE_NAME,
    LiveRegistrationViewSet,
    basename="live_registrations",
)
router.register(
    models.TimedTextTrack.RESOURCE_NAME,
    TimedTextTrackViewSet,
    basename="timed_text_tracks",
)
router.register(models.Thumbnail.RESOURCE_NAME, ThumbnailViewSet, basename="thumbnails")
router.register("organizations", OrganizationViewSet, basename="organizations")
router.register("playlists", PlaylistViewSet, basename="playlists")
router.register("users", UserViewSet, basename="users")
router.register(
    models.SharedLiveMedia.RESOURCE_NAME,
    SharedLiveMediaViewSet,
    basename="sharedlivemedias",
)

urlpatterns = [
    # Admin
    path(f"{admin_site.name}/", admin_site.urls),
    # LTI
    path("lti/select/", LTISelectView.as_view(), name="select_lti_view"),
    path("lti/respond/", LTIRespondView.as_view(), name="respond_lti_view"),
    path("lti/videos/<uuid:uuid>", VideoView.as_view(), name="video_lti_view"),
    path("lti/documents/<uuid:uuid>", DocumentView.as_view(), name="document_lti_view"),
    # Public resources
    path("videos/<uuid:uuid>", VideoView.as_view(), name="video_public"),
    path("documents/<uuid:uuid>", DocumentView.as_view(), name="document_public"),
    # API
    path("api/pairing-challenge", pairing_challenge, name="pairing_challenge"),
    path("api/update-state", update_state, name="update_state"),
    path(
        "api/schema",
        get_schema_view(title="Marsha API", renderer_classes=[CoreJSONRenderer]),
        name="schema",
    ),
    path("api/", include(router.urls)),
    path(
        "reminders/cancel/<str:pk>/<str:key>",
        RemindersCancelView.as_view(),
        name="reminders_cancel",
    ),
    re_path(
        r"^xapi/(?P<resource>video|document)/$",
        XAPIStatementView.as_view(),
        name="xapi",
    ),
]

if settings.BBB_ENABLED:
    urlpatterns += [path("", include("marsha.bbb.urls"))]

if settings.DEBUG:
    urlpatterns += [path("", include("marsha.development.urls"))]

if "dummy" in settings.STORAGE_BACKEND:
    urlpatterns += [
        path(
            "api/video-upload/<uuid:uuid>",
            local_video_upload,
            name="local-video-upload",
        ),
        path(
            "api/document-upload/<uuid:uuid>",
            local_document_upload,
            name="local-document-upload",
        ),
    ]

urlpatterns += [
    re_path(".*", SiteView.as_view(), name="site"),
]
