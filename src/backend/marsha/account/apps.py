"""Defines the django app config for the ``account`` app."""

from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _

from onelogin.saml2.constants import OneLogin_Saml2_Constants


class AccountConfig(AppConfig):
    """Django app config for the ``account`` app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "marsha.account"
    verbose_name = _("Account")

    def ready(self):
        super().ready()

        # Enforce some namespace definition for python3-saml
        # - Add mdui from SAML V2.0 Metadata Extensions for Login and Discovery
        OneLogin_Saml2_Constants.NSMAP["mdui"] = "urn:oasis:names:tc:SAML:metadata:ui"
        # - Add saml2p support (not adding it makes random results)
        #   This is not really a namespace recommended, still we must allow its use.
        #   For instance it may be used by Google or https://samltest.id
        OneLogin_Saml2_Constants.NSMAP["saml2"] = OneLogin_Saml2_Constants.NS_SAML
        OneLogin_Saml2_Constants.NSMAP["saml2p"] = OneLogin_Saml2_Constants.NS_SAMLP
