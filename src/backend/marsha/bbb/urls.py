"""Marsha BBB app URLs configuration."""

from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .api import MeetingViewSet
from .views import MeetingView


app_name = "bbb"

router = DefaultRouter()
router.register("meetings", MeetingViewSet, basename="meetings")

urlpatterns = [
    path("lti/meetings/<uuid:uuid>", MeetingView.as_view(), name="meeting_lti_view"),
    path("api/", include(router.urls)),
]
