"""Test the Renater FER SAML views."""
from unittest import mock
from urllib.parse import urlparse

from django.contrib.auth import get_user as auth_get_user
from django.test import TestCase
from django.urls import reverse

from onelogin.saml2.utils import OneLogin_Saml2_Utils
from onelogin.saml2.xml_utils import OneLogin_Saml2_XML
from social_core.utils import parse_qs
from social_edu_federation.testing.saml_tools import (
    format_mdui_display_name,
    generate_auth_response,
    generate_idp_federation_metadata,
    generate_idp_metadata,
)
from waffle.testutils import override_switch

from marsha.account.tests.utils import override_saml_fer_settings
from marsha.core.defaults import RENATER_FER_SAML
from marsha.core.models import STUDENT
from marsha.core.tests.utils import reload_urlconf


class FERSAMLTestCase(TestCase):
    """Test case for SAML authentication views with Renater FER federation."""

    @classmethod
    def setUpClass(cls):
        """Forces the URLs configuration reloading"""
        super().setUpClass()

        reload_urlconf()

    @override_saml_fer_settings()
    def test_metadata_get(self):
        """
        Asserts the metadata view is reachable.

        The content is actually already tested in Python Social Auth.
        """
        response = self.client.get(
            reverse("account:saml_fer_metadata"),
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'entityID="edu-fed"')
        self.assertContains(response, "<ds:X509Certificate>", count=2)

    @override_switch(RENATER_FER_SAML, active=True)
    def test_login_view_presents_renater_login_choice(self):
        """
        The login view must display a link to the Renater IdP choices
        when feature is enabled.
        """

        response = self.client.get(
            reverse("account:login"),
        )

        # Only check the button name and the page location are in the response
        self.assertContains(response, "Log in with Renater")
        self.assertContains(response, "/account/saml/renater_fer_idp_choice/")

    @override_switch(RENATER_FER_SAML, active=False)
    def test_login_view_do_not_show_renater_login_choice(self):
        """
        The login view must not provide a link to the Renater IdP choices
        when feature is disabled.
        """

        response = self.client.get(
            reverse("account:login"),
        )

        # Only check the button name and the page location are *not* in the response
        self.assertNotContains(response, "Log in with Renater")
        self.assertNotContains(response, "/account/saml/renater_fer_idp_choice/")

    @override_switch(RENATER_FER_SAML, active=False)
    def test_saml_renater_choice_get_no_enabled(self):
        """Asserts we can't reach choice view when feature is disabled."""

        response = self.client.get(
            reverse("account:saml_fer_idp_choice"),
        )
        self.assertEqual(response.status_code, 404)


class RenaterSAMLFullProcessTestCase(TestCase):
    """
    Test case for full authentication process with Renater FER federation.
    """

    @override_switch(RENATER_FER_SAML, active=True)
    @override_saml_fer_settings()
    def test_full_login_process(self):
        """Asserts the nominal login process works."""
        sso_location = "http://testserver/account/saml/local-accepting-idp/sso/"
        entity_descriptor_list = [
            generate_idp_metadata(
                entity_id=sso_location,
                sso_location=sso_location,
                ui_info_display_names=format_mdui_display_name("Local accepting IdP"),
            ),
        ]

        # 1/ Select Idp in the provider list
        with mock.patch("urllib.request.urlopen") as urlopen_mock:

            class UrlOpenMock:
                """Mockin object for the urlopen"""

                def read(self):
                    """Allow object to be read several times."""
                    return generate_idp_federation_metadata(
                        entity_descriptor_list=entity_descriptor_list,
                    ).encode("utf-8")

            urlopen_mock.return_value = UrlOpenMock()

            response = self.client.get(
                reverse("account:saml_fer_idp_choice"),
            )

            self.assertContains(
                response,
                f'action="{reverse("account:social:begin", args=("saml_fer",))}"',
            )
            self.assertContains(response, "local-accepting-idp")

            response = self.client.get(
                f'{reverse("account:social:begin", args=("saml_fer",))}?idp=local-accepting-idp',
            )

            self.assertEqual(response.status_code, 302)
            self.assertTrue(
                response["Location"].startswith(
                    "http://testserver/account/saml/local-accepting-idp/sso/?SAMLRequest="
                )
            )

            # 2/ Fake the redirection to the SSO
            response = self.client.get(
                f'{reverse("account:social:begin", args=("saml_fer",))}?idp=local-accepting-idp',
                follow=False,
            )

            # 3/ Generate SAML response using SAML request
            query_values = parse_qs(urlparse(response["Location"]).query)
            saml_request = query_values["SAMLRequest"]
            saml_relay_state = query_values["RelayState"]
            readable_saml_request = OneLogin_Saml2_Utils.decode_base64_and_inflate(
                saml_request,
            )
            saml_request = OneLogin_Saml2_XML.to_etree(readable_saml_request)
            saml_acs_url = saml_request.get("AssertionConsumerServiceURL")
            request_id = saml_request.get("ID")

            auth_response = OneLogin_Saml2_Utils.b64encode(
                generate_auth_response(
                    request_id,
                    saml_acs_url,
                    issuer="http://testserver/account/saml/local-accepting-idp/sso/",
                )
            )

            # 4/ POST the data to our endpoint
            response = self.client.post(
                saml_acs_url,
                data={
                    "RelayState": saml_relay_state,
                    "SAMLResponse": auth_response,
                },
            )
            self.assertEqual(response.status_code, 302)
            self.assertEqual(response["Location"], "/")

        # Assert the user is authenticated
        user = auth_get_user(self.client)
        self.assertTrue(user.is_authenticated)

        # Assert the user has an organization
        organization_access = user.organization_accesses.select_related(
            "organization"
        ).get()  # also assert there is only one organization
        self.assertEqual(organization_access.role, STUDENT)
        self.assertEqual(organization_access.organization.name, "OrganizationDName")
