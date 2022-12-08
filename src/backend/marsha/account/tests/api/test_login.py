"""Tests for the account login API."""
import json

from django.test import TestCase
from django.utils import timezone

from marsha.core.factories import UserFactory


class LoginAPITest(TestCase):
    """Testcase for the account login API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        """Set up the test suite."""
        super().setUpClass()
        cls.user = UserFactory(username="marsha")

    def test_login_no_data(self):
        """An empty request should return a 400 error."""

        response = self.client.post(
            "/account/api/login/",
            content_type="application/json",
            data=json.dumps({}),
        )

        self.assertEqual(response.status_code, 400)  # Bad request

    def test_login_user_does_not_exist(self):
        """A request with a username that does not exist should return a 400 error."""

        response = self.client.post(
            "/account/api/login/",
            content_type="application/json",
            data=json.dumps(
                {
                    "username": "doesnotexist",
                    "password": "password",
                }
            ),
        )

        self.assertEqual(response.status_code, 401)  # Unauthorized

    def test_login_user_wrong_password(self):
        """A request with a wrong password should return a 400 error."""

        response = self.client.post(
            "/account/api/login/",
            content_type="application/json",
            data=json.dumps(
                {
                    "username": "marsha",
                    "password": "wrong-password",
                }
            ),
        )

        self.assertEqual(response.status_code, 401)  # Unauthorized

    def test_login_success(self):
        """A request with a correct username and password should return a 200 response."""

        now = timezone.now()
        self.user.last_login = now
        self.user.save()

        response = self.client.post(
            "/account/api/login/",
            content_type="application/json",
            data=json.dumps(
                {
                    "username": "marsha",
                    "password": "password",
                }
            ),
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("challenge_token", response.json())

        self.user.refresh_from_db()
        self.assertGreater(self.user.last_login, now)
