"""ASGI script for the marsha project."""

from channels.routing import ProtocolTypeRouter
from configurations.asgi import get_asgi_application

from marsha.websocket.application import websocket_application


application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": websocket_application,
    }
)
