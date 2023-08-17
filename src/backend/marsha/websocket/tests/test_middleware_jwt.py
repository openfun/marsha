"""Test for the jwt middleware."""
from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.testing import WebsocketCommunicator

from marsha.core.simple_jwt.factories import PlaylistAccessTokenFactory
from marsha.websocket.middlewares import JWTMiddleware


class JWTMiddlewareTest(TestCase):
    """Test for the jwt middleware."""

    maxDiff = None

    async def test_missing_token(self):
        """Without token the connection is refused."""
        application = JWTMiddleware(AsyncWebsocketConsumer())
        comminucator = WebsocketCommunicator(application, "/")

        with self.assertRaises(ValueError):
            connected, _ = await comminucator.connect()
            self.assertFalse(connected)
            await comminucator.disconnect()

    async def test_invalid_token(self):
        """With an invalid token the connection is refused."""
        token = PlaylistAccessTokenFactory()
        token.set_exp(
            from_time=timezone.now() - timedelta(minutes=30),
            lifetime=timedelta(minutes=1),
        )

        application = JWTMiddleware(AsyncWebsocketConsumer())
        communicator = WebsocketCommunicator(application, f"/?jwt={token}")

        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        response = await communicator.receive_output()

        self.assertEqual(response["type"], "websocket.close")
        self.assertEqual(response["code"], 4003)
        await communicator.disconnect()

    async def test_valid_token(self):
        """With a valid token the connection is accepted."""
        token = PlaylistAccessTokenFactory()
        token.set_exp(lifetime=timedelta(minutes=20))

        application = JWTMiddleware(AsyncWebsocketConsumer())
        communicator = WebsocketCommunicator(application, f"/?jwt={token}")

        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        await communicator.disconnect()

    async def test_invalid_scope_type(self):
        """Only websocket scope type is accepted."""

        middleware = JWTMiddleware(AsyncWebsocketConsumer())
        with self.assertRaises(ValueError):
            await middleware({"type": "wrong-type"}, None, None)
