"""Marsha URLs configuration."""

from django.conf import settings
from django.urls import include, path

from rest_framework.renderers import CoreJSONRenderer
from rest_framework.routers import DefaultRouter
from rest_framework.schemas import get_schema_view

from marsha.core import models
from marsha.core.admin import admin_site
from marsha.core.api import (
    DocumentViewSet,
    ThumbnailViewSet,
    TimedTextTrackViewSet,
    VideoViewSet,
    XAPIStatementView,
    update_state,
)
from marsha.core.views import DevelopmentLTIView, DocumentLTIView, VideoLTIView


router = DefaultRouter()
router.register(models.Video.RESOURCE_NAME, VideoViewSet, basename="videos")
router.register(models.Document.RESOURCE_NAME, DocumentViewSet, basename="documents")
router.register(
    models.TimedTextTrack.RESOURCE_NAME,
    TimedTextTrackViewSet,
    basename="timed_text_tracks",
)
router.register(models.Thumbnail.RESOURCE_NAME, ThumbnailViewSet, basename="thumbnails")

urlpatterns = [
    # Admin
    path(f"{admin_site.name}/", admin_site.urls),
    # LTI
    path("lti/videos/<uuid:uuid>", VideoLTIView.as_view(), name="video_lti_view"),
    path(
        "lti/documents/<uuid:uuid>", DocumentLTIView.as_view(), name="document_lti_view"
    ),
    # API
    path("api/update-state", update_state, name="update_state"),
    path(
        "api/schema",
        get_schema_view(title="Marsha API", renderer_classes=[CoreJSONRenderer]),
        name="schema",
    ),
    path("api/", include(router.urls)),
    path("xapi/", XAPIStatementView.as_view(), name="xapi"),
]

if settings.DEBUG:
    urlpatterns += [
        path("development/", DevelopmentLTIView.as_view(), name="lti-development-view")
    ]
