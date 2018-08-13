"""Marsha URLs configuration."""

from django.urls import include, path

from rest_framework.routers import DefaultRouter

from marsha.core.admin import admin_site
from marsha.core.api import VideoViewSet
from marsha.core.views import VideoLTIView


router = DefaultRouter()
router.register(r"videos", VideoViewSet, base_name="video")

urlpatterns = [
    path(f"{admin_site.name}/", admin_site.urls),
    path("lti-video/", VideoLTIView.as_view(), name="lti-video"),
    path("api/", include(router.urls)),
]
