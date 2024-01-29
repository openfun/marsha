"""Tests for the account logout API."""

import json

from django.test import TestCase

from rest_framework_simplejwt.exceptions import TokenError

from marsha.core.factories import UserFactory
from marsha.core.simple_jwt.tokens import UserRefreshToken


class LogoutAPIViewTest(TestCase):
    """Testcase for the account logout API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        """Set up the test suite."""
        super().setUpClass()
        cls.user = UserFactory(username="marsha")

    def test_logout_no_data(self):
        """An empty request should return a 401."""

        response = self.client.post(
            "/account/api/logout/",
            content_type="application/json",
            data=json.dumps({}),
        )

        self.assertEqual(response.status_code, 401)  # Unauthorized
        self.assertDictEqual(
            response.json(),
            {"detail": "Refresh token was not included in request data."},
        )

    def test_logout_success(self):
        """A request with a proper refresh token returns a 200."""
        refresh_token = UserRefreshToken.for_user(self.user)

        response = self.client.post(
            "/account/api/logout/",
            content_type="application/json",
            data=json.dumps(
                {
                    "refresh": str(refresh_token),
                }
            ),
        )

        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            response.json(),
            {"detail": "Successfully logged out."},
        )

        with self.assertRaises(TokenError):
            refresh_token.verify()

        # Call logout again
        response = self.client.post(
            "/account/api/logout/",
            content_type="application/json",
            data=json.dumps(
                {
                    "refresh": str(refresh_token),
                }
            ),
        )

        self.assertEqual(response.status_code, 401)
        self.assertDictEqual(
            response.json(),
            {"detail": "Token is blacklisted"},
        )
