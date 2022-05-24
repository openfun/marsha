"""Marsha SAML testing views."""
from django.http import HttpResponse
from django.template import engines
from django.views import View

from onelogin.saml2.utils import OneLogin_Saml2_Utils
from onelogin.saml2.xml_utils import OneLogin_Saml2_XML

from marsha.account.social_testing.saml_tools import (
    generate_auth_response,
    generate_idp_federation_metadata,
)


class SamlFakeIdpSsoLocationView(View):
    """Local identity provider faking view"""

    def get(self, request):
        """
        This provides a fake view receiving the SAML authentication request.

        This view prepares an SAML authentication response and POST it
        to the usual marsha endpoint.

        Choice has been made to not write a template with the production
        templates for separation concerns. The very simple template is
        therefore included in the view code.
        """
        data = request.GET
        saml_request = data["SAMLRequest"]
        saml_relay_state = data["RelayState"]

        readable_saml_request = OneLogin_Saml2_Utils.decode_base64_and_inflate(
            saml_request
        )
        saml_request = OneLogin_Saml2_XML.to_etree(readable_saml_request)
        acs_url = saml_request.get("AssertionConsumerServiceURL")
        request_id = saml_request.get("ID")

        template = engines["django"].from_string(
            """
{% extends 'account/base.html' %}

{% block js_scripts %}
    <script type="text/javascript">
    window.onload = function(){
        document.SSO_Login.submit();
    };
    </script>
{% endblock %}

{% block content %}
  {{ block.super }}
  <div id="content-main" class="inner-container">
    <form action="{{ acs_url }}" method="post" name="SSO_Login">
        <input name="SAMLResponse" value="{{ auth_response|safe }}" />
        <input name="RelayState" value="{{ saml_relay_state|safe }}" />
        <div class="submit-row">
          <button class="btn-primary" type="submit" value="Log in">Log in</button>
        </div>
    </form>
  </div>
{% endblock %}
        """
        )

        return HttpResponse(
            template.render(
                {
                    "acs_url": acs_url,
                    "auth_response": OneLogin_Saml2_Utils.b64encode(
                        generate_auth_response(request_id, acs_url)
                    ),
                    "saml_relay_state": saml_relay_state,
                },
                request,
            ),
        )


class SamlFakeIdpMetadataView(View):
    """Local identity provider faking metdata view"""

    def get(self, request):
        """Returns SAML metadata for a fake Renater federation."""
        return HttpResponse(generate_idp_federation_metadata())
