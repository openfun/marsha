"""Tests for the account password reset API."""
import json

from django.core import mail
from django.test import TestCase

from marsha.core.factories import UserFactory


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
                }
            ),
        )

        self.assertEqual(response.status_code, 400)  # Bad request
        self.assertDictEqual(
            response.json(),
            {"email": ["Enter a valid email address."]},
        )

    def test_password_reset_success(self):
        """A request with an existing email returns a 200."""
        response = self.client.post(
            "/account/api/password/reset/",
            content_type="application/json",
            data=json.dumps(
                {
                    "email": "marsha@example.org",
                }
            ),
        )

        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            response.json(),
            {"detail": "Password reset e-mail has been sent."},
        )
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("http://example.com/account/reset/", mail.outbox[0].body)
