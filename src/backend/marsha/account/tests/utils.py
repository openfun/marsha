"""Defines testing settings for the SAML FER authentication."""
from django.test import override_settings

from social_edu_federation.testing.settings import saml_fer_settings


class override_saml_fer_settings(override_settings):  # pylint: disable=invalid-name
    """Add default testing settings for SAML with FER backend."""

    def __init__(self, **kwargs):  # pylint: disable=useless-super-delegation
        """Add Social Auth specific settings as default settings."""
        super().__init__(**saml_fer_settings, **kwargs)
