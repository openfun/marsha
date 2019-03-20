"""Marsha URLs configuration."""

from django.conf import settings
from django.urls import include, path

from rest_framework.routers import DefaultRouter
from rest_framework.schemas import get_schema_view

from marsha.core.admin import admin_site
from marsha.core.api import (
    ThumbnailViewSet,
    TimedTextTrackViewSet,
    VideoViewSet,
    XAPIStatementView,
    update_state,
)
from marsha.core.views import LTIDevelopmentView, OpenEdxVideoLTIView, VideoLTIView


router = DefaultRouter()
router.register(r"videos", VideoViewSet, base_name="videos")
router.register(
    r"timedtexttracks", TimedTextTrackViewSet, base_name="timed_text_tracks"
)
router.register(r"thumbnail", ThumbnailViewSet, base_name="thumbnail")

urlpatterns = [
    # Admin
    path(f"{admin_site.name}/", admin_site.urls),
    # LTI
    path("lti/videos/<uuid:uuid>", VideoLTIView.as_view(), name="lti_video"),
    # This view is deprecated and will be removed in a future release:
    path("lti-video/", OpenEdxVideoLTIView.as_view(), name="lti_video"),
    # API
    path("api/update-state", update_state, name="update_state"),
    path("api/schema", get_schema_view(title="Marsha API"), name="schema"),
    path("api/", include(router.urls)),
    path("xapi/", XAPIStatementView.as_view(), name="xapi"),
]

if settings.DEBUG:
    urlpatterns += [
        path("development/", LTIDevelopmentView.as_view(), name="lti-development-view")
    ]
