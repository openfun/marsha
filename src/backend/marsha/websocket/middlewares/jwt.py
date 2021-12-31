"""Middleware checking if the JWT is valid."""
import logging
from urllib.parse import parse_qs

from channels.security.websocket import WebsocketDenier
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken


logger = logging.getLogger(__name__)


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
            logger.info("jwt query string is missing")
            raise ValueError("jwt query string is missing")

        raw_token = query_string[b"jwt"]
        if len(raw_token) != 1:
            logger.info("More than one token present in the query string")
            raise ValueError("jwt query string is missing")

        try:
            return AccessToken(token=raw_token[0])
        except TokenError as err:
            logger.debug("Invalid jwt token")
            raise err
