"""Renater's Python Social Auth backend for marsha"""
from social_core.backends.saml import SAMLAuth
import waffle

from marsha.account.social_utils.renater_parser import get_renater_idp
from marsha.core.defaults import RENATER_SAML


class RenaterShibbolethSAMLAuth(SAMLAuth):
    """
    Backend that implements SAML 2.0 Service Provider (SP) functionality
    base on Python Social auth SAML Provider.

    This backend allows management for Shibboleth federation which supports
    authentication via +100 partner universities.
    """

    # Warning: the name is also used to fetch settings
    # ie. settings must be defined using `SOCIAL_AUTH_RENATER_SAML`
    # prefix instead of original `SOCIAL_AUTH_SAML`
    name = "renater_saml"

    def auth_allowed(self, response, details):
        """Only add check on the Waffle switch to reject auth when disabled."""
        return waffle.switch_is_active(RENATER_SAML) and super().auth_allowed(
            response, details
        )

    def _create_saml_auth(self, idp):
        """
        Drop the server port as it definitely is not always 80...

        This should not be overridden, but we wait for
        https://github.com/python-social-auth/social-core/issues/609
        fix to be merged.
        """
        saml2_auth = super()._create_saml_auth(idp)
        # This will fail when the fix is released and dependency is bump.
        # At this moment, this `_create_saml_auth` method can be removed.
        saml2_auth._request_data.pop("server_port")  # pylint:disable=protected-access
        return saml2_auth

    def get_idp(self, idp_name):
        """
        Given the name of an IdP, get a SAMLIdentityProvider instance.

        This replaces the following setting:

        ```
        SOCIAL_AUTH_SAML_ENABLED_IDPS = {
            "testshib": {
                "entity_id": "https://idp.testshib.org/idp/shibboleth",
                "url": "https://idp.testshib.org/idp/profile/SAML2/Redirect/SSO",
                "x509cert": "MIIEDjCCAvagAwI...+ev0peYzxFyF5sQA==",
            }
        }
        ```

        This method is only a boilerplate to the cached configurations.
        """
        return get_renater_idp(idp_name)

    def get_attribute(self, attributes, key, default_value=None):
        """
        Gets attribute `key` from `attributes`.
        Not the same as `self.get_attr` as it raises a KeyError
        if the attribute is not found and a `default_value` is
        not provided.
        """
        try:
            value = attributes[key]
        except KeyError:
            if default_value is not None:
                return default_value
            value = None

        if isinstance(value, list):
            value = value[0] if len(value) else None

        if value is None and default_value is None:
            raise KeyError

        return value

    def get_user_id(self, details, response):
        """
        Get the permanent ID for this user from the response.
        We prefix each ID with the name of the IdP so that we can
        connect multiple IdPs to this user.

        The most important method: Get a permanent, unique identifier
        for this user from the attributes supplied by the IdP.

        We override the default one to make our choice explicit.

        We use the following field:
         - urn:oid:1.3.6.1.4.1.5923.1.1.1.6 (eduPersonPrincipalName)
           globally unique, using the format <user>@<institution>

        This will raise if missing, on purpose.
        """
        idp_name = response["idp_name"]
        uid = self.get_attribute(
            response["attributes"],
            "urn:oid:1.3.6.1.4.1.5923.1.1.1.6",
        )
        return f"{idp_name}:{uid}"

    def get_user_details(self, response):
        """
        Get user details like full name, email, etc. from the
        response - see auth_complete.

        Given the SAML attributes extracted from the SSO response, get
        the user data like name.

        We override the default one to make our choices explicit.

        We use the following fields:
         - urn:oid:2.5.4.4 (sn) aka (surname) and urn:oid:2.5.4.42 (givenName) aka (gn)
           we try to get the user first name and last name, if any is missing
           we fallback on the full name field, see after.
         - urn:oid:2.16.840.1.113730.3.1.241 (displayName)
           This represents the user full name, only used when not both first and last
           names are available. This is stored in the user last name field.
         - urn:oid:0.9.2342.19200300.100.1.3 (mail)
           Provides us the user email, we use it as email address and username.
         - urn:oid:1.3.6.1.4.1.5923.1.1.1.1 (eduPersonAffiliation)
           Allows use to try to determine the role (student/professor).
           This is not mandatory, but may help to autofill the role.
           We default to student, see
           `marsha.account.pipeline.organization.create_organization`.

        Fields we do not use:
         - urn:oid:1.3.6.1.4.1.7135.1.2.1.14 (supannEtablissement)

        All available fields are available on:
            https://services.renater.fr/documentation/supann/
            supann2021/recommandations/attributs/liste_des_attributs
        """
        attributes = response["attributes"]

        # Try to get first and last names in separated fields
        last_name = self.get_attribute(attributes, "urn:oid:2.5.4.4", "")
        first_name = self.get_attribute(attributes, "urn:oid:2.5.4.42", "")
        if not (last_name and first_name):
            # If information not provided, we use only the
            # full name as last name.
            last_name = self.get_attribute(
                attributes, "urn:oid:2.16.840.1.113730.3.1.241"
            )
            first_name = ""

        # Use the email as username, therefore mandatory
        # Should fail if missing
        email = self.get_attribute(attributes, "urn:oid:0.9.2342.19200300.100.1.3")

        role = self.get_attribute(attributes, "urn:oid:1.3.6.1.4.1.5923.1.1.1.1", "")

        return {
            "first_name": first_name,
            "last_name": last_name,
            "username": email,
            "email": email,
            "role": role,
        }
