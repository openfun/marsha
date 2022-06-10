"""Middleware checking if the JWT is valid."""
import logging
from urllib.parse import parse_qs

from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken


logger = logging.getLogger(__name__)


class WebsocketDenier(AsyncWebsocketConsumer):
    """
    Simple application which denies all requests to it.
    """

    async def connect(self):
        """
        During handshake it is not possible to close the websocket with a specific
        code. To do that we must accept first the connection and then close it with the code we
        want
        """
        await self.accept()
        await self.close(code=4003)


class JWTMiddleware:
    """Middleware checking if the JWT is valid."""

    def __init__(self, application):
        """Store the ASGI application we were passed."""
        self.application = application

    async def __call__(self, scope, receive, send):
        # Make sure the scope is of type websocket
        if scope["type"] != "websocket":
            raise ValueError(
                "You cannot use JWTMiddleware on a non-WebSocket connection"
            )

        try:
            token = self.validate_jwt(scope)
            scope["token"] = token
            return await self.application(scope, receive, send)
        except TokenError:
            # Deny the connection
            denier = WebsocketDenier()
            return await denier(scope, receive, send)

    def validate_jwt(self, scope):
        """Validate the JWT token."""

        query_string = parse_qs(scope["query_string"])

        if b"jwt" not in query_string:
            raise ValueError("jwt query string is missing")

        raw_token = query_string[b"jwt"]
        if len(raw_token) != 1:
            raise ValueError("jwt query string is missing")

        try:
            return AccessToken(token=raw_token[0])
        except TokenError as err:
            logger.debug("Invalid jwt token")
            raise err
