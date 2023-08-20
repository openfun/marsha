from django.contrib import admin
from django.urls import include, path, re_path
from rest_framework import routers

from transcodingapi.transcoding.views import (
    RunnerJobViewSet,
    RunnerRegistrationTokenViewSet,
    RunnerViewSet,
    VideoViewSet,
)

router = routers.DefaultRouter(trailing_slash=False)
router.register(r"runners/registration-tokens", RunnerRegistrationTokenViewSet)
router.register(r"runners", RunnerViewSet)
router.register(r"runners/jobs", RunnerJobViewSet, basename="jobs")
router.register(r"videos", VideoViewSet, basename="videos")

urlpatterns = [
    path("admin/", admin.site.urls),
    re_path(r"api/v1/", include(router.urls)),
]
