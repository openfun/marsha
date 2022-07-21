"""Test the ``account`` views."""
import re
from urllib.parse import parse_qs, urlparse

from django.contrib.auth import get_user as auth_get_user
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.test import TestCase
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from marsha.core.factories import UserFactory
from marsha.core.simple_jwt.tokens import ChallengeToken


class BaseAuthenticationTestCase(TestCase):
    """Base test case with authentication methods."""

    @classmethod
    def setUpClass(cls):
        """Create the user only once for the whole test case."""
        super().setUpClass()
        cls.existing_user = UserFactory(username="existing_username")

    def _login_user(self):
        """Authenticate the user to be logged in."""
        self.client.post(
            reverse("account:login"),
            {"username": self.existing_user.username, "password": "password"},
        )
        self.assertUserIsAuthenticated()

    def _generate_uid_token_for_password_reset(self):
        """Generate reset credentials to be used in the reset password link."""
        return {
            "uid": urlsafe_base64_encode(force_bytes(self.existing_user.pk)),
            "token": default_token_generator.make_token(self.existing_user),
        }

    def assertUserIsAuthenticated(self):
        """Assert the user is authenticated."""
        user = auth_get_user(self.client)
        self.assertTrue(user.is_authenticated)

    def assertUserIsNotAuthenticated(self):
        """Assert the user is *not* authenticated."""
        user = auth_get_user(self.client)
        self.assertFalse(user.is_authenticated)


class AccountViewTestCase(BaseAuthenticationTestCase):
    """Test case for the full login/logout process."""

    def test_login_get(self):
        """Assert the login view is reachable when not logged in."""
        response = self.client.get(
            reverse("account:login"),
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Username")
        self.assertContains(response, "Password")
        self.assertContains(response, "Forgotten your password or username?")

    def test_login_post_fails(self):
        """Assert the login view displays an error for non-matching username/password."""
        response = self.client.post(
            reverse("account:login"),
            {"username": self.existing_user.username, "password": "wrong_password"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Username")
        self.assertContains(response, "Password")
        self.assertContains(response, "Forgotten your password or username?")
        self.assertContains(
            response,
            "Please enter a correct username and password. "
            "Note that both fields may be case-sensitive.",
        )
        self.assertUserIsNotAuthenticated()

    def test_login_post_success(self):
        """Assert the login view redirects properly to the challenge token page."""
        response = self.client.post(
            reverse("account:login"),
            {"username": self.existing_user.username, "password": "password"},
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, "/account/login/complete/")
        self.assertUserIsAuthenticated()

    def test_logout_post_success(self):
        """Assert the logout view redirects properly to the main page."""
        self._login_user()

        response = self.client.post(reverse("account:logout"))

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, "http://localhost:8060/")
        self.assertUserIsNotAuthenticated()

    def test_logout_get_success(self):
        """Assert the logout view redirects properly to the main page."""
        self._login_user()

        response = self.client.get(reverse("account:logout"))

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, "http://localhost:8060/")
        self.assertUserIsNotAuthenticated()

    def test_logout_get_success_if_not_logged_in(self):
        """Assert the logout view works even when the user is not logged in."""
        self.assertUserIsNotAuthenticated()
        response = self.client.get(reverse("account:logout"))

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, "http://localhost:8060/")
        self.assertUserIsNotAuthenticated()

    def test_password_reset_get(self):
        """Assert the password reset view is available."""
        response = self.client.get(reverse("account:password_reset"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(
            response,
            "Forgotten your password? Enter your email address below, "
            "and we’ll email instructions for setting a new one.",
        )
        self.assertContains(response, "Email address:")

    def test_password_reset_post_existing_user(self):
        """
        Assert the password reset view works for existing user.
        Don't test already Django's tested code.
        """
        response = self.client.post(
            reverse("account:password_reset"), {"email": self.existing_user.email}
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, reverse("account:password_reset_done"))

        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(
            "Please go to the following page and choose a new password:",
            mail.outbox[0].body,
        )
        self.assertIsNotNone(
            re.search(
                r"http://example.com/account/reset/(\w)+/([\w-]+)/",
                mail.outbox[0].body,
            )
        )

    def test_password_reset_post_unknown_user(self):
        """
        Assert the password reset view works for unregistered user.
        Don't test already Django's tested code.
        """
        response = self.client.post(
            reverse("account:password_reset"), {"email": "missing@example.com"}
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, reverse("account:password_reset_done"))

        self.assertEqual(len(mail.outbox), 0)

    def test_password_reset_confirm_get(self):
        """
        Assert the reset mail confirmation view works.
        Don't test already Django's tested code.
        """
        # Need to generate a token first
        keys = self._generate_uid_token_for_password_reset()

        # The test starts here
        response = self.client.get(
            reverse(
                "account:password_reset_confirm",
                kwargs={"uidb64": keys["uid"], "token": keys["token"]},
            ),
            follow=True,
        )

        self.assertEqual(response.status_code, 200)
        self.assertContains(
            response,
            "Please enter your new password twice so we can verify you typed it in correctly.",
        )

    def test_password_reset_confirm_post(self):
        """
        Assert the password reset works.
        Don't test already Django's tested code.
        """
        # Need to generate a token first
        keys = self._generate_uid_token_for_password_reset()

        # A get is required before the POST
        self.client.get(
            reverse(
                "account:password_reset_confirm",
                kwargs={"uidb64": keys["uid"], "token": keys["token"]},
            ),
            follow=True,
        )

        # The test starts here
        response = self.client.post(
            reverse(
                "account:password_reset_confirm",
                kwargs={"uidb64": keys["uid"], "token": "set-password"},
            ),
            {"new_password1": "new#robust#1", "new_password2": "new#robust#1"},
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, reverse("account:password_reset_complete"))

    def test_password_reset_complete(self):
        """
        Assert the password change confirmation view available.
        Don't test already Django's tested code.
        """

        response = self.client.get(reverse("account:password_reset_complete"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Your password has been set.")
        self.assertContains(response, "You may go ahead and log in now.")
        self.assertInHTML(
            '<a href="/account/login/">Log in</a>',
            response.content.decode("utf-8"),
        )


class RedirectToFrontendViewTestCase(BaseAuthenticationTestCase):
    """Test case for the full login/logout process."""

    def test_if_not_logged_in(self):
        """Assert the view is restricted to authenticated users."""
        self.assertUserIsNotAuthenticated()
        response = self.client.get(reverse("account:login_complete_redirect"))

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, "/account/login/?next=/account/login/complete/")
        self.assertUserIsNotAuthenticated()

    def test_redirects_with_token(self):
        """Assert the view is restricted to authenticated users."""
        self._login_user()

        response = self.client.get(reverse("account:login_complete_redirect"))

        self.assertEqual(response.status_code, 302)

        # Assert frontend redirection
        parsed_response_url = urlparse(response.url)
        self.assertEqual(parsed_response_url.netloc, "localhost:8060")
        self.assertEqual(parsed_response_url.path, "/")

        # Assert token presence
        challenge_token_str = parse_qs(parsed_response_url.query)["token"][0]
        challenge_token = ChallengeToken(challenge_token_str)
        self.assertEqual(challenge_token["user_id"], str(self.existing_user.pk))
