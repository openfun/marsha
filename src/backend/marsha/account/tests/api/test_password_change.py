"""Tests for the account password change API."""

import json

from django.test import TestCase

from marsha.core.factories import UserFactory
from marsha.core.simple_jwt.factories import LTIPlaylistAccessTokenFactory
from marsha.core.simple_jwt.tokens import UserAccessToken


class PasswordChangeAPIViewTest(TestCase):
    """Testcase for the account password change API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        """Set up the test suite."""
        super().setUpClass()
        cls.user = UserFactory(username="marsha")

    def test_password_change_anonymous(self):
        """An unauthenticated request should return a 401."""

        response = self.client.post(
            "/account/api/password/change/",
            content_type="application/json",
            data=json.dumps({}),
        )

        self.assertEqual(response.status_code, 401)  # Unauthorized

    def test_password_change_no_data(self):
        """An empty request should return a 400."""

        response = self.client.post(
            "/account/api/password/change/",
            content_type="application/json",
            data=json.dumps({}),
            HTTP_AUTHORIZATION=f"Bearer {str(UserAccessToken.for_user(self.user))}",
        )

        self.assertEqual(response.status_code, 400)  # Bad request

    def test_password_change_wrong_authentication(self):
        """A resource access token cannot use this endpoint."""
        response = self.client.post(
            "/account/api/password/change/",
            content_type="application/json",
            data=json.dumps(
                {
                    "old_password": "password",
                    "new_password1": "new_password",
                    "new_password2": "new_password",
                }
            ),
            HTTP_AUTHORIZATION=f"Bearer {str(LTIPlaylistAccessTokenFactory())}",
        )

        self.assertEqual(response.status_code, 401)  # Unauthorized
        self.assertDictEqual(
            response.json(),
            {"detail": "Wrong authentication method."},
        )

    def test_password_change_old_password_missing(self):
        """The old password must be provided."""
        response = self.client.post(
            "/account/api/password/change/",
            content_type="application/json",
            data=json.dumps(
                {
                    "new_password1": "new_password",
                    "new_password2": "new_password",
                }
            ),
            HTTP_AUTHORIZATION=f"Bearer {str(UserAccessToken.for_user(self.user))}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertDictEqual(
            response.json(),
            {"old_password": ["This field is required."]},
        )

    def test_password_change_different_passwords(self):
        """The same password must be provided twice."""
        response = self.client.post(
            "/account/api/password/change/",
            content_type="application/json",
            data=json.dumps(
                {
                    "old_password": "password",
                    "new_password1": "new_password",
                    "new_password2": "new_password_clumsy",
                }
            ),
            HTTP_AUTHORIZATION=f"Bearer {str(UserAccessToken.for_user(self.user))}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertDictEqual(
            response.json(),
            {"new_password2": ["The two password fields didn’t match."]},
        )

    def test_password_change_success(self):
        """A request with proper data returns a 200."""
        response = self.client.post(
            "/account/api/password/change/",
            content_type="application/json",
            data=json.dumps(
                {
                    "old_password": "password",
                    "new_password1": "new_password",
                    "new_password2": "new_password",
                }
            ),
            HTTP_AUTHORIZATION=f"Bearer {str(UserAccessToken.for_user(self.user))}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            response.json(),
            {"detail": "New password has been saved."},
        )

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("new_password"))
