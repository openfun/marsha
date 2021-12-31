"""Test for the jwt middleware."""
from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.testing import WebsocketCommunicator
from rest_framework_simplejwt.tokens import AccessToken

from marsha.websocket.middlewares import JWTMiddleware


class JWTMiddlewareTest(TestCase):
    """Test for the jwt middleware."""

    maxDiff = None

    async def test_missing_token(self):
        """Without token in the query string the connection is refused."""
        application = JWTMiddleware(AsyncWebsocketConsumer())
        comminucator = WebsocketCommunicator(application, "/")

        with self.assertRaises(ValueError):
            connected, _ = await comminucator.connect()
            self.assertFalse(connected)
            await comminucator.disconnect()

    async def test_invalid_token(self):
        """With an invalid token the connection is refused."""
        token = AccessToken()
        token.set_exp(
            from_time=timezone.now() - timedelta(minutes=30),
            lifetime=timedelta(minutes=1),
        )

        application = JWTMiddleware(AsyncWebsocketConsumer())
        comminucator = WebsocketCommunicator(application, f"/?jwt={token}")

        connected, _ = await comminucator.connect()
        self.assertFalse(connected)
        await comminucator.disconnect()

    async def test_valid_token(self):
        """with a valid token the connection is accepted."""
        token = AccessToken()
        token.set_exp(lifetime=timedelta(minutes=20))

        application = JWTMiddleware(AsyncWebsocketConsumer())
        comminucator = WebsocketCommunicator(application, f"/?jwt={token}")

        connected, _ = await comminucator.connect()
        self.assertTrue(connected)
        await comminucator.disconnect()

    async def test_invalid_scope_type(self):
        """Only websocket scope type is accepted."""

        middleware = JWTMiddleware(AsyncWebsocketConsumer())
        with self.assertRaises(ValueError):
            await middleware({"type": "wrong-type"}, None, None)
