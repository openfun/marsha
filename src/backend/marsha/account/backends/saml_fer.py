"""Specific fer saml implementation for marsha"""
from django.conf import settings

from social_edu_federation.backends.saml_fer import FERSAMLAuth

from marsha.core.models import SiteConfig


class MarshaFERSAMLAuth(FERSAMLAuth):
    """Marsha implementation of FERSAMAuth"""

    def generate_saml_config(self, idp=None):
        """
        Generate the configuration required to instantiate OneLogin_Saml2_Auth
        """
        config = super().generate_saml_config(idp=idp)
        domain = self.strategy.request_host()
        is_default_site = domain in settings.FRONTEND_HOME_URL

        if not is_default_site:
            try:
                site_config = SiteConfig.objects.get(site__domain=domain)
                config["contactPerson"] = {
                    "technical": site_config.saml_technical_contact,
                    "support": site_config.saml_support_contact,
                }
                config["organization"] = site_config.saml_organization_info
                config["sp"].update({"entityId": site_config.saml_entity_id})
            except SiteConfig.DoesNotExist:
                pass

        return config
