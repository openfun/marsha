"""Defines testing settings for the SAML Renater authentication."""
from django.test import override_settings

from .certificates import get_dev_certificate, get_dev_private_key


renater_saml_settings = {
    # `"SOCIAL_AUTH_RENATER_SAML_IDP_FAKER": True` is not enforced here
    "SOCIAL_AUTH_RENATER_SAML_SECURITY_CONFIG": {
        "authnRequestsSigned": True,
        "signMetadata": True,
        "wantMessagesSigned": False,
        "wantAssertionsSigned": True,
        "wantAssertionsEncrypted": False,
        "rejectDeprecatedAlgorithm": True,
        # allow single label domain as tests use "testserver" as domain
        "allowSingleLabelDomains": True,
    },
    "SOCIAL_AUTH_RENATER_SAML_SP_ENTITY_ID": "marsha-fun",
    "SOCIAL_AUTH_RENATER_SAML_SP_PRIVATE_KEY": get_dev_private_key(),
    "SOCIAL_AUTH_RENATER_SAML_SP_PUBLIC_CERT": get_dev_certificate(),
    "SOCIAL_AUTH_RENATER_SAML_ORG_INFO": {
        "en-US": {
            "name": "marsha-fun",
            "displayname": "Marsha France Université Numérique",
            "url": "marsha-fun.example.com",
        },
    },
    "SOCIAL_AUTH_RENATER_SAML_TECHNICAL_CONTACT": {
        "givenName": "Marsha dev team",
        "emailAddress": "marsha@example.com",
    },
    "SOCIAL_AUTH_RENATER_SAML_SUPPORT_CONTACT": {
        "givenName": "Marsha dev team",
        "emailAddress": "marsha@example.com",
    },
    "SOCIAL_AUTH_RENATER_SAML_METADATA": "http://testserver/account/saml/idp/metadata/",
}


class override_renater_saml_settings(override_settings):  # pylint: disable=invalid-name
    """Add default testing settings for SAML."""

    def __init__(self, **kwargs):  # pylint: disable=useless-super-delegation
        """Add Social Auth specific settings as default settings."""
        super().__init__(**renater_saml_settings, **kwargs)
