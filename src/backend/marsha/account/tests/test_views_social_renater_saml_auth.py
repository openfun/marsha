"""Test the Renater SAML views."""
import io
from unittest import mock

from django.contrib.auth import get_user as auth_get_user
from django.contrib.sites.models import Site
from django.test import LiveServerTestCase, TestCase, override_settings
from django.urls import reverse

from waffle.testutils import override_switch

from marsha.account.social_testing.saml_tools import (
    generate_idp_federation_metadata,
    generate_idp_metadata,
)
from marsha.account.social_testing.settings import override_renater_saml_settings
from marsha.account.views import RenaterIdpChoiceView
from marsha.core.defaults import RENATER_SAML
from marsha.core.models import STUDENT
from marsha.core.tests.utils import reload_urlconf


@override_renater_saml_settings(
    SOCIAL_AUTH_RENATER_SAML_IDP_FAKER=True,
    # Don't use any cache to prevent impact between tests
    CACHES={"default": {"BACKEND": "django.core.cache.backends.dummy.DummyCache"}},
)
class RenaterSAMLTestCase(TestCase):
    """Test case for SAML authentication views with Renater federation."""

    @classmethod
    def setUpClass(cls):
        """Forces the URLs configuration reloading"""
        super().setUpClass()

        reload_urlconf()

    def tearDown(self) -> None:
        """Cookie cleanup after each test"""
        try:
            del self.client.cookies[RenaterIdpChoiceView.recent_use_cookie_name]
        except KeyError:
            pass
        super().tearDown()

    def assertIdpLinkButtonInHTML(self, idp_hrid, idp_name, html):
        """Assert link button to IdP is in HTML"""
        return self.assertInHTML(
            f"""
            <button
                class="btn-idp-link"
                type="submit" name="idp"
                value="{idp_hrid}"
                onclick="storeRecentIdpCookie(\'{idp_hrid}\')"
            >
                {idp_name}
            </button>
            """,
            html,
        )

    def assertLastIdpButtonInHTML(self, idp_hrid, idp_name, html):
        """Assert recently used link button to IdP is in HTML"""
        return self.assertInHTML(
            f"""
            <button
                class="btn-idp-link recently-used-idp"
                type="submit"
                name="idp"
                value="{idp_hrid}"
            >
                {idp_name}
                <span
                    class="remove-idp-btn"
                    onclick="removeRecentIdpCookie(event, \'{idp_hrid}\')"
                >
                    x
                </span>
            </button>
            """,
            html,
        )

    def test_metadata_get(self):
        """
        Asserts the metadata view is reachable.

        The content is actually already tested in Python Social Auth.
        """
        response = self.client.get(
            reverse("account:saml_metadata"),
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'entityID="marsha-fun"')
        self.assertContains(response, "<ds:X509Certificate>", count=2)

    @override_switch(RENATER_SAML, active=True)
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
        self.assertContains(response, "/account/saml/renater_idp_choice/")

    @override_switch(RENATER_SAML, active=False)
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
        self.assertNotContains(response, "/account/saml/renater_idp_choice/")

    @override_switch(RENATER_SAML, active=False)
    def test_saml_renater_choice_get_no_enabled(self):
        """Asserts we can't reach choice view when feature is disabled."""

        response = self.client.get(
            reverse("account:saml_renater_choice"),
        )
        self.assertEqual(response.status_code, 404)

    @override_switch(RENATER_SAML, active=True)
    @mock.patch("urllib.request.urlopen")
    def test_saml_renater_choice_get(self, urlopen_mock):
        """Asserts the IdP list displays properly."""
        idp_1 = generate_idp_metadata(
            entity_id="http://idp-1.example.com/adfs/services/trust",
            display_name_fr="First identity provider",
            sso_location="http://idp_1.example.com/sso/",
        )
        idp_2 = generate_idp_metadata(
            entity_id="http://idp-2.example.com/adfs/services/trust",
            display_name_fr="Second identity provider",
            sso_location="http://idp-2.example.com/sso/",
        )
        idp_3 = generate_idp_metadata(
            entity_id="http://idp-3.example.com/adfs/services/trust",
            display_name_fr="Third identity provider",
            sso_location="http://idp-3.example.com/sso/",
        )

        urlopen_mock.return_value = io.BytesIO(
            generate_idp_federation_metadata(
                entity_descriptor_list=[idp_1, idp_2, idp_3],
            ).encode("utf-8")
        )

        response = self.client.get(
            reverse("account:saml_renater_choice"),
        )

        # Assert data are correctly provided to the javascript
        response_str = response.content.decode("utf-8")
        idp_data = """
            <script id="renater-idps-data" type="application/json">
                [
                    ["first-identity-provider", "First identity provider"],
                     ["second-identity-provider", "Second identity provider"],
                     ["third-identity-provider", "Third identity provider"]
                ]
            </script>
        """
        idp_data = idp_data.replace("\n", "")
        idp_data = idp_data.replace("    ", "")
        self.assertInHTML(
            idp_data,
            response_str,
        )

        # Assert all three IdP are listed
        self.assertIdpLinkButtonInHTML(
            "first-identity-provider",
            "First identity provider",
            response_str,
        )
        self.assertIdpLinkButtonInHTML(
            "second-identity-provider", "Second identity provider", response_str
        )
        self.assertIdpLinkButtonInHTML(
            "third-identity-provider", "Third identity provider", response_str
        )

    @override_switch(RENATER_SAML, active=True)
    @mock.patch("urllib.request.urlopen")
    def test_saml_renater_choice_get_with_cookie(self, urlopen_mock):
        """Assert the recently used IdP is displayed properly."""
        idp_batch = [
            generate_idp_metadata(
                entity_id=f"http://idp-{i}.example.com/adfs/services/trust",
                display_name_fr=f"{i}th identity provider",
                sso_location=f"http://idp-{i}.example.com/sso/",
            )
            for i in range(5)
        ]
        last_idp = generate_idp_metadata(
            entity_id="http://last.example.com/adfs/services/trust",
            display_name_fr="Last identity provider",
            sso_location="http://last.example.com/sso/",
        )

        urlopen_mock.return_value = io.BytesIO(
            generate_idp_federation_metadata(
                entity_descriptor_list=[*idp_batch, last_idp],
            ).encode("utf-8")
        )

        self.client.cookies.load(
            {RenaterIdpChoiceView.recent_use_cookie_name: "last-identity-provider"}
        )

        response = self.client.get(
            reverse("account:saml_renater_choice"),
        )
        # `recently-used-idp` is in JS + 1 button
        self.assertContains(response, "recently-used-idp", count=2)

        response_str = response.content.decode("utf-8")
        # Assert the last selected IdP in the cookie is presented in the
        # latest used IdP.
        self.assertLastIdpButtonInHTML(
            "last-identity-provider", "Last identity provider", response_str
        )

        # Also test it's still in the "normal" list
        self.assertIdpLinkButtonInHTML(
            "last-identity-provider", "Last identity provider", response_str
        )

    @override_switch(RENATER_SAML, active=True)
    @mock.patch("urllib.request.urlopen")
    def test_saml_renater_choice_get_with_two_cookies(self, urlopen_mock):
        """Assert the two recently used IdP are displayed properly."""
        idp_batch = [
            generate_idp_metadata(
                entity_id=f"http://idp-{i}.example.com/adfs/services/trust",
                display_name_fr=f"{i}th identity provider",
                sso_location=f"http://idp-{i}.example.com/sso/",
            )
            for i in range(5)
        ]

        urlopen_mock.return_value = io.BytesIO(
            generate_idp_federation_metadata(
                entity_descriptor_list=idp_batch,
            ).encode("utf-8")
        )

        self.client.cookies.load(
            {
                RenaterIdpChoiceView.recent_use_cookie_name: (
                    "0th-identity-provider+3th-identity-provider"
                )
            }
        )

        response = self.client.get(
            reverse("account:saml_renater_choice"),
        )
        # `recently-used-idp` is in JS + 2 buttons
        self.assertContains(response, "recently-used-idp", count=3)

        response_str = response.content.decode("utf-8")
        self.assertLastIdpButtonInHTML(
            "0th-identity-provider", "0th identity provider", response_str
        )
        self.assertLastIdpButtonInHTML(
            "3th-identity-provider", "3th identity provider", response_str
        )

    @override_switch(RENATER_SAML, active=True)
    @mock.patch("urllib.request.urlopen")
    def test_saml_renater_choice_get_with_non_existing_cookie(self, urlopen_mock):
        """Asserts the cookie containing an IdP which does not exist anymore does nothing."""
        urlopen_mock.return_value = io.BytesIO(
            generate_idp_federation_metadata().encode("utf-8")
        )

        self.client.cookies.load(
            {
                RenaterIdpChoiceView.recent_use_cookie_name: (
                    "0th-identity-provider"  # missing IdP
                )
            }
        )

        response = self.client.get(
            reverse("account:saml_renater_choice"),
        )

        # the `recently-used-idp` exists only in the JS part
        self.assertContains(response, "recently-used-idp", count=1)

        response_str = response.content.decode("utf-8")
        self.assertIdpLinkButtonInHTML(
            "marsha-local-idp", "Marsha local IdP", response_str
        )


@override_renater_saml_settings(
    SOCIAL_AUTH_RENATER_SAML_IDP_FAKER=True,
    # Don't use any cache to prevent impact between tests
    CACHES={"default": {"BACKEND": "django.core.cache.backends.dummy.DummyCache"}},
)
class RenaterSAMLFullProcessTestCase(LiveServerTestCase):
    """
    Test case for full authentication process with Renater federation.

    Note: don't need to use `reload_urlconf` here as the test case uses the
    overridden settings to start a new server in a thread.
    We need a separated server to allow internal call to fetch metadata.
    """

    @classmethod
    def setUpClass(cls):
        """Setup the test case with a named `Site` for SAML test `_full_reverse_url` purpose."""
        super().setUpClass()

        current_site = Site.objects.get_current()
        cls._initial_domain = current_site.domain
        current_site.domain = "testserver"
        current_site.save(update_fields=("domain",))

        # Force URL configuration reloading
        reload_urlconf()

    @classmethod
    def tearDownClass(cls):
        """Cleans the `Site` domain after use."""
        current_site = Site.objects.get_current()
        current_site.domain = cls._initial_domain
        current_site.save(update_fields=("domain",))
        super().tearDownClass()

    @override_switch(RENATER_SAML, active=True)
    def test_full_login_process(self):
        """Asserts the nominal login process works."""
        # `http://testserver` is not reachable using urllib...
        # this is needed all along since we don't use cache here
        with override_settings(
            SOCIAL_AUTH_RENATER_SAML_METADATA=(
                f"{self.live_server_url}{reverse('account:idp_metadata')}"
            ),
        ):
            # 1/ Select Idp in the provider list
            response = self.client.get(
                reverse("account:saml_renater_choice"),
            )

            self.assertContains(
                response,
                f'action="{reverse("account:social:begin", args=("renater_saml",))}"',
            )
            print(response.content)
            self.assertContains(response, "marsha-local-idp")

            response = self.client.get(
                f'{reverse("account:social:begin", args=("renater_saml",))}?idp=marsha-local-idp',
            )

            self.assertEqual(response.status_code, 302)
            self.assertTrue(
                response["Location"].startswith(
                    "http://testserver/account/saml/idp/sso/?SAMLRequest="
                )
            )

            # 2/ Follow the redirection to the SSO
            response = self.client.get(
                f'{reverse("account:social:begin", args=("renater_saml",))}?idp=marsha-local-idp',
                follow=True,
            )

            # 3/ Fetch the fake SSO response and POST the data to our endpoint
            self.assertEqual(
                response.context["acs_url"],
                "http://testserver"
                f'{reverse("account:social:complete", args=("renater_saml",))}',
            )
            response = self.client.post(
                response.context["acs_url"],
                data={
                    "RelayState": response.context["saml_relay_state"],
                    "SAMLResponse": response.context["auth_response"],
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
        self.assertEqual(organization_access.organization.name, "OrganizationName")
