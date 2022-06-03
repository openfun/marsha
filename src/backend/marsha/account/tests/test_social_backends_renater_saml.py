"""Test the Renater SAML authentication backend."""
from unittest import mock

from django.test import TestCase

from social_core.backends.saml import SAMLIdentityProvider
from social_django.utils import load_strategy
from waffle.testutils import override_switch

from marsha.account.social_backends.renater_saml import RenaterShibbolethSAMLAuth
from marsha.account.social_testing.certificates import get_dev_certificate
from marsha.account.social_testing.settings import override_renater_saml_settings
from marsha.core.defaults import RENATER_SAML


@override_renater_saml_settings()
class RenaterSAMLBackendTestCase(TestCase):
    """Test case for Renater SAML authentication backend."""

    @classmethod
    def setUpClass(cls):
        """Create a mocked backend once for all tests."""
        super().setUpClass()
        # Can't use the testing strategy without renaming all settings
        # prefer the default "Django" one and override methods.
        cls.strategy = load_strategy()
        cls.strategy.request_is_secure = lambda: False
        cls.strategy.request_path = lambda: "/"
        cls.strategy.request_port = lambda: "1234"
        cls.strategy.request_get = lambda: {}
        cls.strategy.request_post = lambda: {}
        cls.backend = RenaterShibbolethSAMLAuth(
            cls.strategy,
            redirect_uri="http://testserver/",
        )

    @override_switch(RENATER_SAML, active=True)
    def test_auth_allowed(self):
        """Asserts `auth_allowed` is True when setting is enabled"""
        response = None  # Not used here
        details = {}  # Not used here
        self.assertTrue(self.backend.auth_allowed(response, details))

    @override_switch(RENATER_SAML, active=False)
    def test_auth_not_allowed(self):
        """Asserts `auth_allowed` is False when setting is disabled"""
        response = None  # Not used here
        details = {}  # Not used here
        self.assertFalse(self.backend.auth_allowed(response, details))

    def test_create_saml_auth(self):
        """Assert the `server_port` information is dropped from `_create_saml_auth`."""
        idp = SAMLIdentityProvider(
            "test-idp",
            entity_id="https://example.com/idp/",
            url="https://example.com/idp/",
            x509cert=get_dev_certificate(),
        )
        saml_auth = self.backend._create_saml_auth(  # pylint: disable=protected-access
            idp,
        )
        self.assertNotIn(
            "server_port",
            saml_auth._request_data,  # pylint: disable=protected-access
        )

    @mock.patch("marsha.account.social_backends.renater_saml.get_renater_idp")
    def test_get_idp(self, mock_get_renater_idp):
        """Test backend's `get_idp` method."""
        tmp_idp = SAMLIdentityProvider(
            "test-idp",
            entity_id="https://example.com/idp/",
            url="https://example.com/idp/",
            x509cert=get_dev_certificate(),
        )
        mock_get_renater_idp.return_value = tmp_idp
        self.assertEqual(self.backend.get_idp("test-idp"), tmp_idp)
        mock_get_renater_idp.assert_called_with("test-idp")

    def test_get_attribute(self):
        """Test the backend's `get_attribute` method."""
        attributes = {
            "a_list": [1, 2, 3],
            "a_one_item_list": ["item"],
        }

        # If the value is a list return the first one (same as default social auth)
        self.assertEqual(self.backend.get_attribute(attributes, "a_list"), 1)
        self.assertEqual(
            self.backend.get_attribute(attributes, "a_one_item_list"), "item"
        )

        # If missing, provide the default value
        self.assertEqual(
            self.backend.get_attribute(attributes, "missing", "not here"), "not here"
        )
        self.assertEqual(self.backend.get_attribute(attributes, "missing", ""), "")

        # Raise when no default value provided
        with self.assertRaises(KeyError):
            self.backend.get_attribute(attributes, "failing")
        with self.assertRaises(KeyError):
            self.backend.get_attribute(attributes, "failing", None)

    def test_get_user_id(self):
        """Test the backend's `get_user_id` method."""
        details = {}  # Not used here
        response = {
            "idp_name": "some-idp-name",
            "attributes": {
                "urn:oid:1.3.6.1.4.1.5923.1.1.1.6": "unique_identifier",
            },
        }
        self.assertEqual(
            self.backend.get_user_id(details, response),
            "some-idp-name:unique_identifier",
        )

    def test_get_user_details(self):
        """Test the backend's `get_user_details` method."""
        response = {
            "attributes": {
                "urn:oid:2.5.4.4": "last name",
                "urn:oid:2.5.4.42": "first name",
                "urn:oid:2.16.840.1.113730.3.1.241": "full name",
                "urn:oid:0.9.2342.19200300.100.1.3": "email@example.com",
                "urn:oid:1.3.6.1.4.1.5923.1.1.1.1": "role",
            }
        }
        self.assertDictEqual(
            self.backend.get_user_details(response),
            {
                "first_name": "first name",
                "last_name": "last name",
                "username": "email@example.com",
                "email": "email@example.com",
                "role": "role",
            },
        )

        # Role may not be provided
        del response["attributes"]["urn:oid:1.3.6.1.4.1.5923.1.1.1.1"]

        self.assertDictEqual(
            self.backend.get_user_details(response),
            {
                "first_name": "first name",
                "last_name": "last name",
                "username": "email@example.com",
                "email": "email@example.com",
                "role": "",
            },
        )

        # First and last names may not be provided
        del response["attributes"]["urn:oid:2.5.4.4"]
        del response["attributes"]["urn:oid:2.5.4.42"]

        self.assertDictEqual(
            self.backend.get_user_details(response),
            {
                "first_name": "",
                "last_name": "full name",
                "username": "email@example.com",
                "email": "email@example.com",
                "role": "",
            },
        )

        # Fail if full name is also missing
        del response["attributes"]["urn:oid:2.16.840.1.113730.3.1.241"]
        with self.assertRaises(KeyError):
            self.backend.get_user_details(response)

        # Fail if email is missing
        response["attributes"]["urn:oid:2.16.840.1.113730.3.1.241"] = "full name"
        del response["attributes"]["urn:oid:0.9.2342.19200300.100.1.3"]
        with self.assertRaises(KeyError):
            self.backend.get_user_details(response)
