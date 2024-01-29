"""Declare API endpoints with Django RestFramework viewsets."""

from django.urls import reverse

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK
from rest_framework.views import APIView
from social_django.utils import load_backend, load_strategy
from social_edu_federation.django.metadata_store import CachedMetadataStore
from social_edu_federation.django.views import SocialBackendViewMixin


class SamlFerIdpListAPIView(SocialBackendViewMixin, APIView):
    """View for the SAML Renater FER IdP choice."""

    permission_classes = (AllowAny,)
    http_method_names = ["get"]

    backend_name = "saml_fer"
    # Enforce the use of the `CachedMetadataStore` because we want to use the cache.
    metadata_store_class = CachedMetadataStore

    def get_idp_list(self):
        """
        Returns the cached list of identity providers

        Returns a list like:
        ```
        [
            {
                'name': 'idp-university-1',
                'entityId': 'http://idp.domain/adfs/services/trust',
                'singleSignOnService': {
                    'url': 'https://idp.domain/adfs/ls/',
                    'binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
                },
                'singleLogoutService': {
                    'url': 'https://idp.domain/adfs/ls/',
                    'binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
                },
                'x509cert': 'MIIC4DCCAcigAwIBAgIQG...CQZXu/agfMc/tY+miyrD0=',
                'edu_fed_data' : {
                    'display_name': 'IdP University 1',
                    'organization_name': 'Organization',
                    'organization_display_name': 'Organization displayable name',
                }
            },
            ...
        ]
        ```
        """
        strategy = load_strategy(self.request)
        backend = load_backend(strategy, self.backend_name, redirect_uri=None)
        metadata_store = self.metadata_store_class(backend)

        idp_list = metadata_store.get("SamlFerIdpAPIView.get_idp_choices")
        if idp_list is None:
            all_idps = metadata_store.get(metadata_store.parsed_metadata_key)
            if all_idps is None:
                all_idps = metadata_store.refresh_cache_entries()
            idp_list = all_idps.values()
            metadata_store.set("SamlFerIdpAPIView.get_idp_choices", list(idp_list))

        return idp_list

    def get(self, request, *args, **kwargs):
        """List the available IdPs."""
        available_idps = self.get_idp_list()

        query_filter = request.query_params.get("q", "")
        if query_filter:
            query_filter = query_filter.lower()

            available_idps = [
                idp
                for idp in available_idps
                if (
                    query_filter in idp["edu_fed_data"]["display_name"].lower()
                    or query_filter in idp["edu_fed_data"]["organization_name"].lower()
                    or query_filter
                    in idp["edu_fed_data"]["organization_display_name"].lower()
                )
            ]

        # Sort the IdPs by display name
        available_idps = sorted(
            available_idps,
            key=lambda idp: idp["edu_fed_data"]["display_name"].casefold(),
        )

        base_login_url = request.build_absolute_uri(
            reverse("account:social:begin", args=("saml_fer",))
        )

        return Response(
            [
                {
                    "id": idp["name"],
                    "display_name": idp["edu_fed_data"]["display_name"],
                    "organization_name": idp["edu_fed_data"]["organization_name"],
                    "organization_display_name": idp["edu_fed_data"][
                        "organization_display_name"
                    ],
                    "logo": idp["edu_fed_data"].get("logo"),
                    "login_url": f'{base_login_url}?idp={idp["name"]}',
                }
                for idp in available_idps
            ],
            status=HTTP_200_OK,
        )
