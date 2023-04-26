"""Marsha ``page`` app URLs configuration."""
from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .api import PageViewSet


app_name = "page"

router = DefaultRouter()

router.register("pages", PageViewSet, basename="pages")

urlpatterns = [
    path("api/", include(router.urls)),
]
