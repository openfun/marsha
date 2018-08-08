"""Marsha URLs configuration."""

from typing import Iterable

from django.urls import path

from marsha.core.admin import admin_site
from marsha.core.views import video_lti_view


urlpatterns: Iterable[path] = [
    path(f"{admin_site.name}/", admin_site.urls),
    path("lti-video/", video_lti_view, name="lti-video"),
]
