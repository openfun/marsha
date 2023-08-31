from django.urls import include, re_path
from rest_framework import routers

from transcode_api.views import (
    RunnerJobViewSet,
    RunnerRegistrationTokenViewSet,
    RunnerViewSet,
    VideoViewSet,
)

router = routers.DefaultRouter(trailing_slash=False)
router.register(r"runners/registration-tokens", RunnerRegistrationTokenViewSet)
router.register(r"runners/jobs", RunnerJobViewSet)
router.register(r"runners", RunnerViewSet)
router.register(r"videos", VideoViewSet)

urlpatterns = [
    re_path(r"api/v1/", include(router.urls)),
]
