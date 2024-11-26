"""Test SocialAuthExceptionMiddleware."""

from importlib import reload
import sys
from unittest import mock

from django.conf import settings
from django.http import HttpResponseRedirect
from django.test import TestCase, override_settings
from django.urls import reverse

from social_core.exceptions import AuthFailed


@override_settings(
    AUTHENTICATION_BACKENDS=["marsha.account.tests.utils.MockedAuthFailedFERSAMLAuth"]
)
class TestMiddleware(TestCase):
    """Test SocialAuthExceptionMiddleware."""

    def setUp(self):
        """Define complete url."""
        self.complete_url = reverse(
            "account:social:complete", kwargs={"backend": "saml_fer"}
        )
        self.complete_url += "?RelayState=marsha-local-idp"

        # Reload module social_core.backends.utils, it makes a global
        # cache with already loaded backend defined in settings.AUTHENTICATION_BACKENDS.
        # In this test we want to change it.
        if "social_core.backends.utils" in sys.modules:
            reload(sys.modules["social_core.backends.utils"])

    @override_settings()
    def test_exception(self):
        """Without SOCIAL_AUTH_LOGIN_ERROR_URL the exception should bubble."""
        del settings.SOCIAL_AUTH_LOGIN_ERROR_URL
        with self.assertRaises(AuthFailed), mock.patch(
            "marsha.account.middleware.capture_exception"
        ) as sentry_capture_exception:
            self.assertFalse(sentry_capture_exception.called)
            self.client.post(self.complete_url, {"SAMLResponse": "dummy-response"})

    @override_settings(SOCIAL_AUTH_LOGIN_ERROR_URL="/")
    def test_return_url(self):
        """When SOCIAL_AUTH_LOGIN_ERROR_URL is defined, should be redirected to it
        with message and backend query string."""
        with mock.patch(
            "marsha.account.middleware.capture_exception"
        ) as sentry_capture_exception:
            response = self.client.post(
                self.complete_url, {"SAMLResponse": "dummy-response"}
            )
            self.assertTrue(sentry_capture_exception.called)
        self.assertTrue(isinstance(response, HttpResponseRedirect))
        self.assertEqual(
            response.url,
            "/?message=Authentication%20failed%3A%20SAML%20login%20failed&backend=saml_fer",
        )
