"""Marsha URLs configuration."""

from typing import Iterable

from django.urls import path

from marsha.core.admin import admin_site
from marsha.core.views import VideoLTIView


urlpatterns: Iterable[path] = [
    path(f"{admin_site.name}/", admin_site.urls),
    path("lti-video/", VideoLTIView.as_view(), name="lti-video"),
]
