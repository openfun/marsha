"""Marsha Development app URLs configuration."""

from django.urls import path

from .views import DevelopmentLTIView


app_name = "development"

urlpatterns = [
    path("development/", DevelopmentLTIView.as_view(), name="lti-development-view"),
]
