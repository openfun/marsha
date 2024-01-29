"""Tests for the social pipeline `social_auth` module."""

from unittest import mock

from django.conf import settings
from django.test import TestCase, override_settings

from social_django.utils import load_backend, load_strategy
from waffle.testutils import override_switch

from marsha.account.social_pipeline import MARSHA_DEFAULT_AUTH_PIPELINE
from marsha.account.social_pipeline.social_auth import auth_allowed, social_details
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


class SocialDetailsPipelineTestCase(TestCase):
    """Test case for the `social_details` pipeline step."""

    def test_marsha_pipeline_includes_social_details_step(self):
        """Asserts our step is in Marsha's default pipeline."""
        self.assertIn(
            "marsha.account.social_pipeline.social_auth.social_details",
            MARSHA_DEFAULT_AUTH_PIPELINE,
            msg="MARSHA_DEFAULT_AUTH_PIPELINE must be fixed to include marsha's`social_details`",
        )

        self.assertIn(
            "marsha.account.social_pipeline.social_auth.social_details",
            settings.SOCIAL_AUTH_SAML_FER_PIPELINE,
            msg="SOCIAL_AUTH_SAML_FER_PIPELINE must be fixed to include marsha's`social_details`",
        )

    @override_settings(AUTHENTICATION_BACKENDS=["social_core.backends.saml.SAMLAuth"])
    def test_social_details_step_with_other_backend(self):
        """Assert the details are untouched when the backend is not SAML FER."""
        strategy = load_strategy()
        backend = load_backend(strategy, "saml", None)
        details = {"first_name": "", "last_name": "", "fullname": "John Doe"}

        with mock.patch(
            "marsha.account.social_pipeline.social_auth.social_social_details"
        ) as social_details_mock:
            social_details_mock.return_value = {"details": details}
            self.assertDictEqual(
                social_details(backend, details, response=None),
                {"details": details},
            )

    def test_social_details_step_with_first_name_and_last_name(self):
        """Assert the first name and last name are preserved."""
        strategy = load_strategy()
        backend = load_backend(strategy, "saml_fer", None)
        details = {"first_name": "John", "last_name": "Doe", "fullname": "John Doe"}

        with mock.patch(
            "marsha.account.social_pipeline.social_auth.social_social_details"
        ) as social_details_mock:
            social_details_mock.return_value = {"details": details}
            self.assertDictEqual(
                social_details(backend, details, response=None),
                {"details": details},
            )

    def test_social_details_step_without_first_name(self):
        """Assert the first name and last name are updated when first name missing."""
        strategy = load_strategy()
        backend = load_backend(strategy, "saml_fer", None)
        details = {"first_name": " ", "last_name": "Doe", "fullname": "John Doe"}

        with mock.patch(
            "marsha.account.social_pipeline.social_auth.social_social_details"
        ) as social_details_mock:
            social_details_mock.return_value = {"details": details}
            self.assertDictEqual(
                social_details(backend, details, response=None),
                {
                    "details": {
                        "first_name": "",
                        "last_name": "John Doe",
                        "fullname": "John Doe",
                    }
                },
            )

    def test_social_details_step_without_last_name(self):
        """Assert the first name and last name are updated when last name missing."""
        strategy = load_strategy()
        backend = load_backend(strategy, "saml_fer", None)
        details = {"first_name": "John", "last_name": " ", "fullname": "John Doe"}

        with mock.patch(
            "marsha.account.social_pipeline.social_auth.social_social_details"
        ) as social_details_mock:
            social_details_mock.return_value = {"details": details}
            self.assertDictEqual(
                social_details(backend, details, response=None),
                {
                    "details": {
                        "first_name": "",
                        "last_name": "John Doe",
                        "fullname": "John Doe",
                    }
                },
            )

    def test_social_details_step_without_full_name(self):
        """Assert the full name is not required."""
        strategy = load_strategy()
        backend = load_backend(strategy, "saml_fer", None)
        details = {"first_name": "John", "last_name": "Doe"}

        with mock.patch(
            "marsha.account.social_pipeline.social_auth.social_social_details"
        ) as social_details_mock:
            social_details_mock.return_value = {"details": details}
            self.assertDictEqual(
                social_details(backend, details, response=None),
                {"details": {"first_name": "John", "last_name": "Doe"}},
            )

    def test_social_details_step_without_names(self):
        """
        Coverage test when no names are provided, still this
        is an edge case we expect not to have.
        """
        strategy = load_strategy()
        backend = load_backend(strategy, "saml_fer", None)
        details = {}

        with mock.patch(
            "marsha.account.social_pipeline.social_auth.social_social_details"
        ) as social_details_mock:
            social_details_mock.return_value = {"details": details}
            self.assertDictEqual(
                social_details(backend, details, response=None),
                {"details": {"first_name": "", "last_name": ""}},
            )
