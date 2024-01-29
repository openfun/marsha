"""Defines testing settings for the SAML FER authentication."""

from django.test import override_settings

from social_core.exceptions import AuthFailed
from social_edu_federation.backends.saml_fer import FERSAMLAuth
from social_edu_federation.testing.certificates import get_dev_certificate
from social_edu_federation.testing.settings import saml_fer_settings


class MockedFERSAMLAuth(FERSAMLAuth):
    """Mocking the base SAML backend to ease testing."""

    def __init__(
        self,
        *args,
        idp_name="marsha-local-idp",
        entity_id="http://marcha.local/idp/",
        organization_display_name="Marsha organization",
        **kwargs
    ):
        super().__init__(*args, **kwargs)
        self.idp_name = idp_name
        self.entity_id = entity_id
        self.organization_display_name = organization_display_name

    def get_idp(self, idp_name):
        """Always return our simple Identity Provider configuration."""
        return self.edu_fed_saml_idp_class.create_from_config_dict(
            name=self.idp_name,
            entityId=self.entity_id,
            singleSignOnService={"url": "http://marcha.local/idp/sso/"},  # unused
            singleLogoutService={"url": "http://marcha.local/idp/slo/"},  # unused
            x509cert=get_dev_certificate(),  # unused
            edu_fed_data={
                "display_name": "Marsha local IdP",  # unused
                "organization_name": "Marsha organization name",  # unused
                "organization_display_name": self.organization_display_name,
            },
        )


class MockedAuthFailedFERSAMLAuth(MockedFERSAMLAuth):
    """Mocking the base SAML backend with auth complete failure."""

    def auth_complete(self, *args, **kwargs):
        """Raise an AuthFailed exception to ease failure test."""
        raise AuthFailed(self, "SAML login failed")


class override_saml_fer_settings(override_settings):  # pylint: disable=invalid-name
    """Add default testing settings for SAML with FER backend."""

    def __init__(self, **kwargs):  # pylint: disable=useless-super-delegation
        """Add Social Auth specific settings as default settings."""
        super().__init__(**saml_fer_settings, **kwargs)
