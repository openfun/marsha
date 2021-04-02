"""Test the xmpp module for marsha core app."""
from unittest import mock

from django.test import TestCase, override_settings

from ..utils import xmpp_utils


class XmppUtilsTestCase(TestCase):
    """Test xmpp utils."""

    @override_settings(XMPP_JWT_AUDIENCE="marsha")
    @override_settings(XMPP_JWT_ISSUER="marsha")
    @override_settings(XMPP_DOMAIN="exemple.com")
    @override_settings(XMPP_JWT_SHARED_SECRET="thisIsASecret")
    def test_generate_jwt(self):
        """Test generating a JWT token."""
        with mock.patch.object(xmpp_utils.jwt, "encode") as jwt_encode_mock:
            xmpp_utils.generate_jwt("room_name", "user_id", "affiliation", 1617889150)

            jwt_encode_mock.assert_called_once_with(
                {
                    "context": {
                        "user": {
                            "id": "user_id",
                            "affiliation": "affiliation",
                        },
                    },
                    "aud": "marsha",
                    "iss": "marsha",
                    "sub": "exemple.com",
                    "room": "room_name",
                    "exp": 1617889150,
                },
                "thisIsASecret",
            )
