"""Tests for the account password reset API."""

import json

from django.core import mail
from django.test import TestCase, override_settings

from marsha.core.factories import UserFactory


@override_settings(ALLOWED_HOSTS=["*", "localhost:3000"])
class PasswordResetAPIViewTest(TestCase):
    """Testcase for the account password reset API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        """Set up the test suite."""
        super().setUpClass()
        cls.user = UserFactory(username="marsha")

    def setUp(self):
        """Reset the mail outbox before each test."""
        mail.outbox = []
        super().setUp()

    def test_password_reset_no_data(self):
        """An empty request should return a 400 error."""

        response = self.client.post(
            "/account/api/password/reset/",
            content_type="application/json",
            data=json.dumps({}),
        )

        self.assertEqual(response.status_code, 400)  # Bad request

    def test_password_reset_user_does_not_exist(self):
        """A request with an email that does not exist should return a 200."""

        response = self.client.post(
            "/account/api/password/reset/",
            content_type="application/json",
            data=json.dumps(
                {
                    "email": "not-existing@example.org",
                    "confirm_url": "http://localhost:3000/auth/password-reset/confirm/",
                }
            ),
        )

        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            response.json(),
            {"detail": "Password reset e-mail has been sent."},
        )
        self.assertEqual(len(mail.outbox), 0)

    def test_password_reset_not_an_email(self):
        """A request with a wrong email parameter return a 400 error."""

        response = self.client.post(
            "/account/api/password/reset/",
            content_type="application/json",
            data=json.dumps(
                {
                    "email": "not-an-email",
                    "confirm_url": "http://localhost:3000/auth/password-reset/confirm/",
                }
            ),
        )

        self.assertEqual(response.status_code, 400)  # Bad request
        self.assertDictEqual(
            response.json(),
            {"email": ["Enter a valid email address."]},
        )

    def test_password_reset_missing_confirm_url(self):
        """A request with a missing confirm_url parameter return a 400 error."""

        response = self.client.post(
            "/account/api/password/reset/",
            content_type="application/json",
            data=json.dumps(
                {
                    "email": "marsha@example.org",
                }
            ),
        )

        self.assertEqual(response.status_code, 400)  # Bad request
        self.assertDictEqual(
            response.json(),
            {"confirm_url": ["This field is required."]},
        )

    def test_password_reset_bad_confirm_url(self):
        """A request with a non-allowed confirm_url parameter return a 400 error."""

        response = self.client.post(
            "/account/api/password/reset/",
            content_type="application/json",
            data=json.dumps(
                {
                    "email": "marsha@example.org",
                    "confirm_url": "https://i-am-bad.com/auth/password-reset/confirm/",
                }
            ),
        )

        self.assertEqual(response.status_code, 400)  # Bad request
        self.assertDictEqual(
            response.json(),
            {"confirm_url": ["Unallowed URL"]},
        )

    def test_password_reset_success(self):
        """A request with an existing email returns a 200."""
        response = self.client.post(
            "/account/api/password/reset/",
            content_type="application/json",
            data=json.dumps(
                {
                    "email": "marsha@example.org",
                    "confirm_url": "http://localhost:3000/auth/password-reset/confirm/",
                }
            ),
        )

        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            response.json(),
            {"detail": "Password reset e-mail has been sent."},
        )
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(
            "http://localhost:3000/auth/password-reset/confirm/", mail.outbox[0].body
        )
