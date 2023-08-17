from django.contrib import admin
from django.urls import include, path
from rest_framework import routers

from transcodingapi.transcoding.views import (
    RunnerJobViewSet,
    RunnerRegistrationTokenViewSet,
    RunnerViewSet,
    VideoViewSet,
)

router = routers.DefaultRouter()
router.register(r"registration-tokens", RunnerRegistrationTokenViewSet)
router.register(r"runners", RunnerViewSet)
router.register(r"jobs", RunnerJobViewSet)
router.register(r"videos", VideoViewSet)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include(router.urls)),
]
