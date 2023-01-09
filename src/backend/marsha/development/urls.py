"""Marsha Development app URLs configuration."""

from django.urls import path

from .views import DevelopmentLTIView, service_worker_view


app_name = "development"

urlpatterns = [
    path("development/", DevelopmentLTIView.as_view(), name="lti-development-view"),
    path("service-worker.js", service_worker_view, name="service-worker-view"),
]
