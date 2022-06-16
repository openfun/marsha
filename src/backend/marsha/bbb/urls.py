"""Marsha BBB app URLs configuration."""

from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .api import ClassroomViewSet
from .views import ClassroomLTIView


app_name = "bbb"

router = DefaultRouter()
router.register("classrooms", ClassroomViewSet, basename="classrooms")

# The following URL patterns are used to support legacy model name.
# They must be removed in the future.
router.register("meetings", ClassroomViewSet, basename="meetings")

urlpatterns = [
    path(
        "lti/classrooms/<uuid:uuid>",
        ClassroomLTIView.as_view(),
        name="classroom_lti_view",
    ),
    # The following URL pattern is used to support legacy model name.
    # It must be removed in the future.
    path(
        "lti/meetings/<uuid:uuid>",
        ClassroomLTIView.as_view(),
        name="meeting_lti_view",
    ),
    path("api/", include(router.urls)),
]
