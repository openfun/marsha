"""Tests for the obtain token pair (access/refresh) API."""
import json

from django.test import TestCase

from rest_framework_simplejwt.exceptions import TokenError

from marsha.core.factories import UserFactory
from marsha.core.simple_jwt.tokens import UserAccessToken, UserRefreshToken


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
                    "access": "could_be_anything",
                    "refresh": "wrong_refresh_token",
                }
            ),
        )

        self.assertEqual(response.status_code, 401)  # Unauthorized

    def test_success(self):
        """
        A request with a correct refresh token should return a 200 response with new token pair.
        """
        refresh_token = UserRefreshToken.for_user(self.user)
        # note: OutstandingToken is created by UserRefreshToken.for_user
        access_token = refresh_token.access_token

        response = self.client.post(
            "/account/api/token/refresh/",
            content_type="application/json",
            data=json.dumps(
                {
                    "access": str(access_token),
                    "refresh": str(refresh_token),
                }
            ),
        )

        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIn("access", response_data)
        self.assertIn("refresh", response_data)

        # Verify tokens
        UserAccessToken(response_data["access"])
        new_refresh_token = UserRefreshToken(response_data["refresh"])

        # Assert old refresh token is blacklisted ...
        with self.assertRaises(TokenError):
            refresh_token.verify()
        # ... and new refresh token is not
        new_refresh_token.verify()
