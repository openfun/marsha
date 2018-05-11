"""Marsha URLs configuration."""

from typing import Iterable

from django.contrib import admin
from django.urls import path


urlpatterns: Iterable[path] = [path("admin/", admin.site.urls)]
