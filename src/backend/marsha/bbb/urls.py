"""Marsha BBB app URLs configuration."""

from django.urls import include, path

from marsha.bbb.api import (
    ClassroomDocumentViewSet,
    ClassroomRecordingViewSet,
    ClassroomViewSet,
)
from marsha.bbb.views import ClassroomLTIView
from marsha.core.routers import MarshaDefaultRouter


app_name = "classroom"

router = MarshaDefaultRouter()

router.register("classrooms", ClassroomViewSet, basename="classrooms")

classroom_related_router = MarshaDefaultRouter()
classroom_related_router.register(
    "classroomdocuments", ClassroomDocumentViewSet, basename="classroom_documents"
)
classroom_related_router.register(
    "recordings", ClassroomRecordingViewSet, basename="recordings"
)

# The following URL patterns are used to support legacy model name.
# They must be removed in the future.
router.register("meetings", ClassroomViewSet, basename="meetings")

urlpatterns = [
    path(
        "lti/classrooms/",
        ClassroomLTIView.as_view(),
        name="classrooms_lti_view_generic",
    ),
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
    path(
        "api/classrooms/<uuid:classroom_id>/",
        include(classroom_related_router.urls),
    ),
]
