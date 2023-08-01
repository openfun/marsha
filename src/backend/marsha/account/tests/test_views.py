"""Test the ``account`` views."""
from urllib.parse import parse_qs, urlparse

from django.contrib.auth import get_user as auth_get_user
from django.test import TestCase, override_settings
from django.urls import reverse

from marsha.core.factories import SiteConfigFactory, UserFactory
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
        self.client.force_login(self.existing_user)
        self.assertUserIsAuthenticated()

    def assertUserIsAuthenticated(self):
        """Assert the user is authenticated."""
        user = auth_get_user(self.client)
        self.assertTrue(user.is_authenticated)

    def assertUserIsNotAuthenticated(self):
        """Assert the user is *not* authenticated."""
        user = auth_get_user(self.client)
        self.assertFalse(user.is_authenticated)


class RedirectToFrontendViewTestCase(BaseAuthenticationTestCase):
    """Test case for the full login/logout process."""

    def test_if_not_logged_in(self):
        """Assert the view is restricted to authenticated users."""
        self.assertUserIsNotAuthenticated()
        response = self.client.get(reverse("account:login_complete_redirect"))

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, "/accounts/login/?next=/account/login/complete/")
        self.assertUserIsNotAuthenticated()

    def test_redirects_with_token(self):
        """Assert the view is restricted to authenticated users."""
        self._login_user()

        response = self.client.get(reverse("account:login_complete_redirect"))

        self.assertEqual(response.status_code, 302)

        # Assert frontend redirection
        parsed_response_url = urlparse(response.url)
        self.assertEqual(parsed_response_url.netloc, "localhost:3000")
        self.assertEqual(parsed_response_url.path, "/")

        # Assert token presence
        challenge_token_str = parse_qs(parsed_response_url.query)["token"][0]
        challenge_token = ChallengeToken(challenge_token_str)
        self.assertEqual(challenge_token["user_id"], str(self.existing_user.pk))

    @override_settings(ALLOWED_HOSTS=["marsha.education"])
    def test_redirects_to_existing_site_config(self):
        """
        Assert user is redirected to an existing site config
        """

        SiteConfigFactory(
            site__domain="marsha.education",
        )

        self._login_user()

        response = self.client.get(
            reverse("account:login_complete_redirect"), HTTP_HOST="marsha.education"
        )

        self.assertEqual(response.status_code, 302)

        # Assert frontend redirection
        parsed_response_url = urlparse(response.url)
        self.assertEqual(parsed_response_url.netloc, "marsha.education")
        self.assertEqual(parsed_response_url.path, "/")

        # Assert token presence
        challenge_token_str = parse_qs(parsed_response_url.query)["token"][0]
        challenge_token = ChallengeToken(challenge_token_str)
        self.assertEqual(challenge_token["user_id"], str(self.existing_user.pk))

    @override_settings(ALLOWED_HOSTS=["marsha.education"])
    def test_redirects_to_not_existing_site_config(self):
        """
        Assert user is redirected to default FRONTEND_HOME_URL is site config does not exists
        """

        self._login_user()

        response = self.client.get(
            reverse("account:login_complete_redirect"), HTTP_HOST="marsha.education"
        )

        self.assertEqual(response.status_code, 302)

        # Assert frontend redirection
        parsed_response_url = urlparse(response.url)
        self.assertEqual(parsed_response_url.netloc, "localhost:3000")
        self.assertEqual(parsed_response_url.path, "/")

        # Assert token presence
        challenge_token_str = parse_qs(parsed_response_url.query)["token"][0]
        challenge_token = ChallengeToken(challenge_token_str)
        self.assertEqual(challenge_token["user_id"], str(self.existing_user.pk))
