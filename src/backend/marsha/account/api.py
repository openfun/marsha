"""Declare API endpoints with Django RestFramework viewsets."""
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.tokens import default_token_generator
from django.urls import reverse

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK, HTTP_400_BAD_REQUEST
from rest_framework.views import APIView
from social_django.utils import load_backend, load_strategy
from social_edu_federation.django.metadata_store import CachedMetadataStore
from social_edu_federation.django.views import SocialBackendViewMixin

from marsha.account.serializers import SetPasswordSerializer


class PasswordResetAPIView(APIView):
    """
    Ask the user's email and send an email with password reset link.
    """

    subject_template_name = "registration/password_reset_subject.txt"
    email_template_name = "account/password_reset_email.html"

    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        """Handle POST requests: instantiate a form instance with the passed
        POST variables and then check if it's valid.
        """
        form = PasswordResetForm(request.data)
        if form.is_valid():
            form.save(
                use_https=self.request.is_secure(),
                token_generator=default_token_generator,
                from_email=None,
                email_template_name=self.email_template_name,
                subject_template_name=self.subject_template_name,
                request=self.request,
                html_email_template_name=None,
                extra_email_context=None,
            )
            return Response(
                {"detail": "Password reset e-mail has been sent."},
                status=HTTP_200_OK,
            )

        return Response(form.errors, status=HTTP_400_BAD_REQUEST)


class PasswordResetConfirmAPIView(APIView):
    """Set the new password for the user."""

    def post(self, request, *args, **kwargs):
        """Manage posted data to set the new password."""
        serializer = SetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "Password has been reset with the new password."},
            status=HTTP_200_OK,
        )


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
            key=lambda idp: idp["edu_fed_data"]["display_name"],
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
