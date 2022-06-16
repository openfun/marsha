"""Marsha BBB app URLs configuration."""

from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .api import ClassroomViewSet
from .views import ClassroomLTIView


app_name = "bbb"

router = DefaultRouter()
router.register("classrooms", ClassroomViewSet, basename="classrooms")

urlpatterns = [
    path(
        "lti/classrooms/<uuid:uuid>",
        ClassroomLTIView.as_view(),
        name="classroom_lti_view",
    ),
    path("api/", include(router.urls)),
]
