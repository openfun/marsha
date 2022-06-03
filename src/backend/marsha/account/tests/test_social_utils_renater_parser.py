"""Test the Renater federation metadata parser."""
import io
from unittest import mock

from django.core.cache import cache as default_cache
from django.test import TestCase, override_settings

from marsha.account.social_testing.certificates import get_dev_certificate
from marsha.account.social_testing.saml_tools import (
    generate_idp_federation_metadata,
    generate_idp_metadata,
)
from marsha.account.social_testing.settings import override_renater_saml_settings
from marsha.account.social_utils.renater_parser import (
    RenaterCacheEntry,
    convert_identity_provider_to_saml_idp_class,
    fetch_renater_metadata,
    get_all_renater_identity_providers,
    get_all_renater_idp_choices,
    get_renater_idp,
    parse_renater_metadata,
    update_renater_identity_providers_cache,
)
from marsha.core.tests.utils import reload_urlconf


@override_settings(
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "renater_cache_entry_tests",
        }
    }
)
class RenaterCacheEntryTestCase(TestCase):
    """Test case for the cache definition of the metadata parser."""

    def setUp(self) -> None:
        """Clears the cache before each test"""
        default_cache.clear()

    def test_set_and_get(self):
        """Asserts the cache works"""
        cache_entry = RenaterCacheEntry("some-key")
        self.assertIsNone(cache_entry.get())
        cache_entry.set("some_value")
        self.assertEqual(cache_entry.get(), "some_value")

    def test_set_many(self):
        """Asserts we can set many keys/values at once"""
        RenaterCacheEntry.set_many(
            toto="toto_value",
            tutu=1,
            titi={"dict_key": "dict_value"},
        )
        cache_entry = RenaterCacheEntry("toto")
        self.assertEqual(cache_entry.get(), "toto_value")
        cache_entry = RenaterCacheEntry("tutu")
        self.assertEqual(cache_entry.get(), 1)
        cache_entry = RenaterCacheEntry("titi")
        self.assertDictEqual(cache_entry.get(), {"dict_key": "dict_value"})


@override_renater_saml_settings(
    SOCIAL_AUTH_RENATER_SAML_IDP_FAKER=True,
    # Don't use any cache to prevent impact between tests
    CACHES={"default": {"BACKEND": "django.core.cache.backends.dummy.DummyCache"}},
)
class RenaterParserFunctionsTestCase(TestCase):
    """Test case for all functions defined in the parser module."""

    def _generate_idp_list(self, count=1):
        """Helper to generate IdP metadata by batch."""
        return [
            generate_idp_metadata(
                entity_id=f"http://idp-{i}.example.com/adfs/services/trust",
                display_name_fr=f"{i}th identity provider",
                sso_location=f"http://idp-{i}.example.com/sso/",
            )
            for i in range(count)
        ]

    def _get_cleaned_certificate(self):
        """Adapts the test certificate to the expected format."""
        return (
            get_dev_certificate()
            .replace("-----BEGIN CERTIFICATE-----", "")
            .replace("\n", "")
            .replace("-----END CERTIFICATE-----", "")
        )

    @classmethod
    def setUpClass(cls):
        """Forces the URLs configuration reloading"""
        super().setUpClass()

        reload_urlconf()

    @mock.patch("urllib.request.urlopen")
    def test_fetch_renater_metadata(self, urlopen_mock):
        """Test the `fetch_renater_metadata` function to get remote metadata."""
        urlopen_mock.return_value = io.BytesIO(
            generate_idp_federation_metadata(
                entity_descriptor_list=self._generate_idp_list(5),
            ).encode("utf-8")
        )
        metadata = fetch_renater_metadata()

        urlopen_mock.assert_called_with(
            "http://testserver/account/saml/idp/metadata/",
            timeout=10,
        )

        self.assertIn(b"md:EntitiesDescriptor", metadata)
        self.assertIn(b"http://idp-0.example.com/adfs/services/trust", metadata)
        self.assertIn(b"http://idp-1.example.com/adfs/services/trust", metadata)
        self.assertIn(b"http://idp-2.example.com/adfs/services/trust", metadata)
        self.assertIn(b"http://idp-3.example.com/adfs/services/trust", metadata)
        self.assertIn(b"http://idp-4.example.com/adfs/services/trust", metadata)

    def test_convert_identity_provider_to_saml_idp_class(self):
        """Tests the metadata conversion to SAMLIdentityProvider objects."""
        identity_provider_settings = {
            "entityId": "http://idp.domain/adfs/services/trust",
            "singleSignOnService": {
                "url": "https://idp.domain/adfs/ls/",
                "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect",
            },
            "singleLogoutService": {
                "url": "https://idp.domain/adfs/ls/",
                "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect",
            },
            # Note: the certificate is not validated at this step
            "x509cert": "MIIC4DCCAcigAwIBAgIQG...CQZXu/agfMc/tY+miyrD0=",
            "display_name": "IdP displayable name",
            "organization_name": "Organization",
            "organization_display_name": "Organization displayable name",
        }

        idp_configuration = convert_identity_provider_to_saml_idp_class(
            identity_provider_settings,
        )

        self.assertEqual(idp_configuration.name, "idp-displayable-name")
        self.assertEqual(
            idp_configuration.conf["entity_id"],
            "http://idp.domain/adfs/services/trust",
        )
        self.assertEqual(
            idp_configuration.conf["url"],
            "https://idp.domain/adfs/ls/",
        )
        self.assertEqual(
            idp_configuration.conf["slo_url"],
            "https://idp.domain/adfs/ls/",
        )
        self.assertEqual(
            idp_configuration.conf["x509cert"],
            "MIIC4DCCAcigAwIBAgIQG...CQZXu/agfMc/tY+miyrD0=",
        )
        self.assertEqual(
            idp_configuration.conf["marsha_display_name"],
            "IdP displayable name",
        )
        self.assertEqual(
            idp_configuration.conf["marsha_organization_name"],
            "Organization",
        )
        self.assertEqual(
            idp_configuration.conf["marsha_organization_display_name"],
            "Organization displayable name",
        )

    def test_parse_renater_metadata(self):
        """Tests the raw metadata conversion to usable objects."""
        metadata = generate_idp_federation_metadata(
            entity_descriptor_list=self._generate_idp_list(5),
        ).encode("utf-8")

        saml_idp_dict = parse_renater_metadata(metadata)

        self.assertEqual(len(saml_idp_dict), 5)

        cleaned_certificate = self._get_cleaned_certificate()
        for i in range(5):
            idp_configuration = saml_idp_dict[f"{i}th-identity-provider"]
            self.assertEqual(idp_configuration.name, f"{i}th-identity-provider")
            self.assertEqual(
                idp_configuration.conf["entity_id"],
                f"http://idp-{i}.example.com/adfs/services/trust",
            )
            self.assertEqual(
                idp_configuration.conf["url"],
                f"http://idp-{i}.example.com/sso/",
            )
            self.assertIsNone(idp_configuration.conf["slo_url"])
            self.assertEqual(
                idp_configuration.conf["x509cert"],
                cleaned_certificate,
            )
            self.assertEqual(
                idp_configuration.conf["marsha_display_name"],
                f"{i}th identity provider",
            )
            self.assertEqual(
                idp_configuration.conf["marsha_organization_name"],
                "OrganizationName",
            )
            self.assertEqual(
                idp_configuration.conf["marsha_organization_display_name"],
                "OrganizationName",
            )

    @mock.patch("urllib.request.urlopen")
    def test_get_all_renater_identity_providers(self, urlopen_mock):
        """Coverage test for `get_all_renater_identity_providers`"""
        urlopen_mock.return_value = io.BytesIO(
            generate_idp_federation_metadata(
                entity_descriptor_list=self._generate_idp_list(2),
            ).encode("utf-8")
        )

        saml_idp_dict = get_all_renater_identity_providers()

        self.assertEqual(len(saml_idp_dict), 2)

        idp_configuration = saml_idp_dict["1th-identity-provider"]
        self.assertEqual(
            idp_configuration.conf["entity_id"],
            "http://idp-1.example.com/adfs/services/trust",
        )

    @override_settings(
        CACHES={
            "default": {
                "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
                "LOCATION": "test_update_renater_identity_providers_cache",
            }
        }
    )
    @mock.patch("urllib.request.urlopen")
    def test_update_renater_identity_providers_cache(self, urlopen_mock):
        """Coverage test for `update_renater_identity_providers_cache`"""
        urlopen_mock.return_value = io.BytesIO(
            generate_idp_federation_metadata(
                entity_descriptor_list=self._generate_idp_list(2),
            ).encode("utf-8")
        )

        configurations = update_renater_identity_providers_cache()

        # Test returned values
        self.assertEqual(len(configurations), 2)
        self.assertEqual(
            configurations["1th-identity-provider"].conf["entity_id"],
            "http://idp-1.example.com/adfs/services/trust",
        )

        # Test cache values
        available_idp_list = RenaterCacheEntry("available_idp_list")
        self.assertEqual(len(available_idp_list.get()), 2)

        idp_configuration = RenaterCacheEntry("1th-identity-provider")
        self.assertEqual(
            idp_configuration.get().conf["entity_id"],
            "http://idp-1.example.com/adfs/services/trust",
        )

        # Assert a second call does not break
        urlopen_mock.return_value.seek(0)  # rewind the tape with a pen
        update_renater_identity_providers_cache()

    @override_settings(
        CACHES={
            "default": {
                "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
                "LOCATION": "test_get_all_renater_idp_choices",
            }
        }
    )
    @mock.patch("urllib.request.urlopen")
    def test_get_all_renater_idp_choices(self, urlopen_mock):
        """Tests the IdP list fetching and caching works as expected."""
        urlopen_mock.return_value = io.BytesIO(
            generate_idp_federation_metadata(
                entity_descriptor_list=self._generate_idp_list(2),
            ).encode("utf-8")
        )

        idp_choices = get_all_renater_idp_choices()

        # Test returned values
        self.assertListEqual(
            idp_choices,
            [
                ("0th-identity-provider", "0th identity provider"),
                ("1th-identity-provider", "1th identity provider"),
            ],
        )

        # Test cache values
        available_idp_list = RenaterCacheEntry("available_idp_list")
        self.assertListEqual(
            available_idp_list.get(),
            [
                ("0th-identity-provider", "0th identity provider"),
                ("1th-identity-provider", "1th identity provider"),
            ],
        )

        # Assert second call uses the cache
        urlopen_mock.reset_mock()

        self.assertListEqual(
            get_all_renater_idp_choices(),
            [
                ("0th-identity-provider", "0th identity provider"),
                ("1th-identity-provider", "1th identity provider"),
            ],
        )

        self.assertFalse(urlopen_mock.called)

    @override_settings(
        CACHES={
            "default": {
                "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
                "LOCATION": "test_get_all_renater_idp_choices",
            }
        }
    )
    @mock.patch("urllib.request.urlopen")
    def test_get_renater_idp(self, urlopen_mock):
        """Tests the named IdP fetching and caching works as expected."""
        urlopen_mock.return_value = io.BytesIO(
            generate_idp_federation_metadata(
                entity_descriptor_list=self._generate_idp_list(2),
            ).encode("utf-8")
        )

        idp_configuration = get_renater_idp("0th-identity-provider")

        # Test returned values
        self.assertEqual(
            idp_configuration.conf["entity_id"],
            "http://idp-0.example.com/adfs/services/trust",
        )

        # Test cache values
        idp_configuration_cache = RenaterCacheEntry("0th-identity-provider")
        self.assertEqual(
            idp_configuration_cache.get().conf["entity_id"],
            "http://idp-0.example.com/adfs/services/trust",
        )

        # Also check cache includes other IdP
        second_idp_configuration_cache = RenaterCacheEntry("1th-identity-provider")
        self.assertEqual(
            second_idp_configuration_cache.get().conf["entity_id"],
            "http://idp-1.example.com/adfs/services/trust",
        )

        # Assert second call uses the cache
        urlopen_mock.reset_mock()

        second_idp_configuration = get_renater_idp("1th-identity-provider")
        self.assertEqual(
            second_idp_configuration.conf["entity_id"],
            "http://idp-1.example.com/adfs/services/trust",
        )

        self.assertFalse(urlopen_mock.called)
