"""Module configuring the websocket application used in the asgi module."""

from channels.routing import URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

from marsha.websocket.middlewares import JWTMiddleware
from marsha.websocket.routing import websocket_urlpatterns


base_application = JWTMiddleware(URLRouter(websocket_urlpatterns))

websocket_application = AllowedHostsOriginValidator(base_application)
