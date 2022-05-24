"""Marsha SAML testing URLs. Do not use in production."""

from django.urls import path

from .views import SamlFakeIdpMetadataView, SamlFakeIdpSsoLocationView


urlpatterns = [
    # SAML
    path("saml/idp/sso/", SamlFakeIdpSsoLocationView.as_view(), name="idp_sso_login"),
    path("saml/idp/metadata/", SamlFakeIdpMetadataView.as_view(), name="idp_metadata"),
]
