"""Routing for marsha consumers."""

from django.urls import re_path

from marsha.websocket.consumers import VideoConsumer


UUID_REGEX = (
    "[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}"
)

websocket_urlpatterns = [
    re_path(
        f"ws/video/(?P<video_id>{UUID_REGEX:s})/$",
        VideoConsumer.as_asgi(),
    ),
]
