"""Tests for the obtain token pair (access/refresh) API."""
import json
import uuid

from django.test import TestCase

from rest_framework_simplejwt.exceptions import TokenError

from marsha.core.factories import UserFactory
from marsha.core.simple_jwt.tokens import (
    PlaylistAccessToken,
    PlaylistRefreshToken,
    UserAccessToken,
    UserRefreshToken,
)


class TokenObtainPairViewTest(TestCase):
    """Testcase for the obtain token pair (access/refresh) API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        """Set up the test suite."""
        super().setUpClass()
        cls.user = UserFactory(username="marsha")

    def test_no_data(self):
        """An empty request should return a 400 error."""

        response = self.client.post(
            "/account/api/token/refresh/",
            content_type="application/json",
            data=json.dumps({}),
        )

        self.assertEqual(response.status_code, 400)  # Bad request

    def test_invalid_refresh_token(self):
        """A request with an invalid refresh token should return a 401 error."""

        response = self.client.post(
            "/account/api/token/refresh/",
            content_type="application/json",
            data=json.dumps(
                {
                    "refresh": "wrong_refresh_token",
                }
            ),
        )

        self.assertEqual(response.status_code, 401)  # Unauthorized

    def test_success_user_access(self):
        """
        A request with a correct refresh token should return a 200 response with new token pair.
        """
        refresh_token = UserRefreshToken.for_user(self.user)

        response = self.client.post(
            "/account/api/token/refresh/",
            content_type="application/json",
            data=json.dumps(
                {
                    "refresh": str(refresh_token),
                }
            ),
        )

        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIn("access", response_data)
        self.assertIn("refresh", response_data)

        # Verify tokens
        new_token = UserAccessToken(response_data["access"])
        new_refresh_token = UserRefreshToken(response_data["refresh"])

        self.assertEqual(new_token.payload["token_type"], "user_access")
        self.assertEqual(new_refresh_token.payload["access_token_type"], "user_access")

        # Assert old refresh token is blacklisted ...
        with self.assertRaises(TokenError):
            refresh_token.verify()
        # ... and new refresh token is not
        new_refresh_token.verify()

    def test_success_resource_access(self):
        """
        A request with a correct resource refresh token should return a 200 with a new token pair.
        """
        session_id = str(uuid.uuid4())
        resource_id = str(uuid.uuid4())
        refresh_token = PlaylistRefreshToken.for_resource_id(resource_id, session_id)

        response = self.client.post(
            "/account/api/token/refresh/",
            content_type="application/json",
            data=json.dumps(
                {
                    "refresh": str(refresh_token),
                }
            ),
        )

        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIn("access", response_data)
        self.assertIn("refresh", response_data)

        # Verify tokens
        new_token = PlaylistAccessToken(response_data["access"])
        new_refresh_token = PlaylistRefreshToken(response_data["refresh"])

        self.assertEqual(new_token.payload["token_type"], "resource_access")
        self.assertEqual(
            new_refresh_token.payload["access_token_type"], "resource_access"
        )

        # Assert old refresh token is blacklisted ...
        with self.assertRaises(TokenError):
            refresh_token.verify()
        # ... and new refresh token is not
        new_refresh_token.verify()
