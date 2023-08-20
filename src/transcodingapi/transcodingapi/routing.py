from django.urls import re_path

from transcodingapi.transcoding.socket import SocketConsumer

websocket_urlpatterns = [
    re_path(r"socket.io/$", SocketConsumer.as_asgi()),
]
