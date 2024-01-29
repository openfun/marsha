"""Tests for the account password reset API."""

import json
import uuid

from django.contrib.auth.tokens import default_token_generator
from django.test import TestCase
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from marsha.core.factories import UserFactory


class PasswordResetConfirmAPIViewTest(TestCase):
    """Testcase for the account password reset API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        """Set up the test suite."""
        super().setUpClass()
        cls.user = UserFactory(username="marsha")

    def test_password_reset_confirm_no_data(self):
        """An empty request should return a 400 error."""

        response = self.client.post(
            "/account/api/password/reset/confirm/",
            content_type="application/json",
            data=json.dumps({}),
        )

        self.assertEqual(response.status_code, 400)  # Bad request

    def test_password_reset_confirm_user_does_not_exist(self):
        """A request with a wrong user uid should return a 400."""

        response = self.client.post(
            "/account/api/password/reset/confirm/",
            content_type="application/json",
            data=json.dumps(
                {
                    "uid": urlsafe_base64_encode(force_bytes(uuid.uuid4())),
                    "token": default_token_generator.make_token(self.user),
                    "new_password1": "unused",
                    "new_password2": "unused",
                }
            ),
        )

        self.assertEqual(response.status_code, 400)
        self.assertDictEqual(
            response.json(),
            {"uid": ["Invalid value"]},
        )

    def test_password_reset_confirm_bad_token(self):
        """A request with a wrong token parameter returns a 400 error."""

        response = self.client.post(
            "/account/api/password/reset/confirm/",
            content_type="application/json",
            data=json.dumps(
                {
                    "uid": urlsafe_base64_encode(force_bytes(self.user.pk)),
                    "token": "wrong-token",
                    "new_password1": "unused",
                    "new_password2": "unused",
                }
            ),
        )

        self.assertEqual(response.status_code, 400)  # Bad request
        self.assertDictEqual(
            response.json(),
            {"token": ["Invalid value"]},
        )

    def test_password_reset_confirm_different_passwords(self):
        """A request with not twice the same password should return a 400."""

        response = self.client.post(
            "/account/api/password/reset/confirm/",
            content_type="application/json",
            data=json.dumps(
                {
                    "uid": urlsafe_base64_encode(force_bytes(self.user.pk)),
                    "token": default_token_generator.make_token(self.user),
                    "new_password1": "some complex pass 1",
                    "new_password2": "some complex pass 2",
                }
            ),
        )

        self.assertEqual(response.status_code, 400)  # Bad request
        self.assertDictEqual(
            response.json(),
            {"new_password2": ["The two password fields didn’t match."]},
        )

    def test_password_reset_confirm_success(self):
        """A request with not twice the same password should return a 400."""
        response = self.client.post(
            "/account/api/password/reset/confirm/",
            content_type="application/json",
            data=json.dumps(
                {
                    "uid": urlsafe_base64_encode(force_bytes(self.user.pk)),
                    "token": default_token_generator.make_token(self.user),
                    "new_password1": "some complex pass #465498745",
                    "new_password2": "some complex pass #465498745",
                }
            ),
        )

        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            response.json(),
            {"detail": "Password has been reset with the new password."},
        )
