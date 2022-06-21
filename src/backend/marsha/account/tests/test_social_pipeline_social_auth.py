"""Tests for the social pipeline `social_auth` module."""
from unittest import mock

from django.conf import settings
from django.test import TestCase

from social_django.utils import load_backend, load_strategy
from waffle.testutils import override_switch

from marsha.account.social_pipeline import MARSHA_DEFAULT_AUTH_PIPELINE
from marsha.account.social_pipeline.social_auth import auth_allowed
from marsha.core.defaults import RENATER_FER_SAML


class AuthAllowedPipelineTestCase(TestCase):
    """Test case for the `auth_allowed` pipeline step."""

    def test_marsha_pipeline_includes_auth_allowed_step(self):
        """Asserts our step is in Marsha's default pipeline."""
        self.assertIn(
            "marsha.account.social_pipeline.social_auth.auth_allowed",
            MARSHA_DEFAULT_AUTH_PIPELINE,
            msg="MARSHA_DEFAULT_AUTH_PIPELINE must be fixed to include marsha's`auth_allowed`",
        )

        self.assertIn(
            "marsha.account.social_pipeline.social_auth.auth_allowed",
            settings.SOCIAL_AUTH_SAML_FER_PIPELINE,
            msg="SOCIAL_AUTH_SAML_FER_PIPELINE must be fixed to include marsha's`auth_allowed`",
        )

    @override_switch(RENATER_FER_SAML, active=True)
    def test_auth_allowed_step_enabled(self):
        """Asserts the authentication is left to social auth when waffle switch is enabled."""
        strategy = load_strategy()
        backend = load_backend(strategy, "saml_fer", None)
        with mock.patch(
            "marsha.account.social_pipeline.social_auth.social_auth_allowed"
        ) as social_create_user_mock:
            details = {"not": "relevant"}

            auth_allowed(backend, details, strategy, 42, some_kwargs=18)

            social_create_user_mock.assert_called_once_with(
                backend,
                details,
                strategy,
                42,
                some_kwargs=18,
            )

    @override_switch(RENATER_FER_SAML, active=False)
    def test_auth_allowed_step_disabled(self):
        """Asserts the authentication is not allowed when waffle switch is disabled."""
        strategy = load_strategy()
        backend = load_backend(strategy, "saml_fer", None)
        with mock.patch(
            "marsha.account.social_pipeline.social_auth.social_auth_allowed"
        ) as social_create_user_mock:
            details = {"not": "relevant"}

            self.assertFalse(
                auth_allowed(backend, details, strategy, 42, some_kwargs=18)
            )
            self.assertFalse(social_create_user_mock.called)
