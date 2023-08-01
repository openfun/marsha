"""Test custom marsha samlf fer backend"""
from django.test import TestCase, override_settings
from django.test.client import RequestFactory

from social_django.utils import load_strategy

from marsha.account.backends.saml_fer import MarshaFERSAMLAuth
from marsha.core.factories import SiteConfigFactory


class MarshaFERSAMLAuthTestCase(TestCase):
    def setUp(self):
        # Every test needs access to the request factory.
        self.factory = RequestFactory()

    @override_settings(FRONTEND_HOME_URL="testserver")
    @override_settings(
        SOCIAL_AUTH_SAML_FER_SP_ENTITY_ID="http://testserver/account/saml/metadata/"
    )
    def test_generate_config_default_frontend_home(self):
        """
        the generate_config should return with django settings info
        when the request comes from the default frontend
        """

        request = self.factory.get("/account/saml/metadata/", HTTP_HOST="testserver")
        # The strategy tries to store the request session, we have to create the attribute.
        request.session = {}

        strategy = load_strategy(request=request)
        backend = MarshaFERSAMLAuth(
            strategy=strategy, redirect_uri="http://testserver/"
        )

        config = backend.generate_saml_config()

        self.assertEqual(
            config["sp"]["entityId"], "http://testserver/account/saml/metadata/"
        )

    @override_settings(FRONTEND_HOME_URL="testserver")
    @override_settings(ALLOWED_HOSTS=["marsha.education"])
    def test_generate_config_domain_param_site_existing(self):
        """
        The generate_config should use site config if a corresponding domain exists
        """

        SiteConfigFactory(
            site__domain="marsha.education",
            saml_technical_contact={
                "givenName": "marsha tech contact",
                "emailAddress": "tech@marsha.education",
            },
            saml_support_contact={
                "givenName": "marsha support contact",
                "emailAddress": "support@marsha.education",
            },
            saml_organization_info={
                "en-US": {
                    "url": "https://marsha.education",
                    "name": "Marsha",
                    "displayname": "Marsha education",
                }
            },
            saml_entity_id="https://marsha.education/account/saml/metadata/",
        )

        request = self.factory.get(
            "/account/saml/metadata/", HTTP_HOST="marsha.education"
        )
        # The strategy tries to store the request session, we have to create the attribute.
        request.session = {}

        strategy = load_strategy(request=request)
        backend = MarshaFERSAMLAuth(
            strategy=strategy, redirect_uri="https://marsha.education/"
        )

        config = backend.generate_saml_config()

        self.assertEqual(
            config["sp"]["entityId"], "https://marsha.education/account/saml/metadata/"
        )
        self.assertEqual(
            config["contactPerson"],
            {
                "technical": {
                    "givenName": "marsha tech contact",
                    "emailAddress": "tech@marsha.education",
                },
                "support": {
                    "givenName": "marsha support contact",
                    "emailAddress": "support@marsha.education",
                },
            },
        )
        self.assertEqual(
            config["organization"],
            {
                "en-US": {
                    "url": "https://marsha.education",
                    "name": "Marsha",
                    "displayname": "Marsha education",
                }
            },
        )

    @override_settings(FRONTEND_HOME_URL="testserver")
    @override_settings(ALLOWED_HOSTS=["marsha.education"])
    @override_settings(
        SOCIAL_AUTH_SAML_FER_SP_ENTITY_ID="http://testserver/account/saml/metadata/"
    )
    def test_generate_config_domain_param_site_not_existing(self):
        """
        The generate should return config from settings if no corresponding site config exists
        """
        request = self.factory.get(
            "/account/saml/metadata/", HTTP_HOST="marsha.education"
        )
        # The strategy tries to store the request session, we have to create the attribute.
        request.session = {}

        strategy = load_strategy(request=request)
        backend = MarshaFERSAMLAuth(
            strategy=strategy, redirect_uri="http://testserver/"
        )

        config = backend.generate_saml_config()

        self.assertEqual(
            config["sp"]["entityId"], "http://testserver/account/saml/metadata/"
        )
