"""Account API serializers."""
from urllib.parse import urlparse

from django.conf import settings
from django.utils.encoding import iri_to_uri
from django.utils.http import url_has_allowed_host_and_scheme

from dj_rest_auth.serializers import (
    PasswordResetSerializer as DjRestAuthPasswordResetSerializer,
)
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
    TokenRefreshSerializer as BaseTokenRefreshSerializer,
)

from marsha.core.simple_jwt.tokens import MarshaRefreshToken, UserRefreshToken


class PasswordResetSerializer(DjRestAuthPasswordResetSerializer):
    """Serializer for requesting a password reset e-mail."""

    confirm_url = serializers.URLField(required=True)

    def validate_confirm_url(self, value):
        """
        Validate the confirm_url field.

        We check that the URL is valid and that it is a link to an allowed domain.
        For this, we allow ALLOWED_HOSTS and CORS_ALLOWED_ORIGINS's netloc.
        """
        allowed_hosts = {
            *settings.ALLOWED_HOSTS,
            *(urlparse(url).netloc for url in settings.CORS_ALLOWED_ORIGINS),
        }

        if not url_has_allowed_host_and_scheme(
            url=value,
            allowed_hosts=allowed_hosts,
            require_https=self.context["request"].is_secure(),
        ):
            raise ValidationError("Unallowed URL")

        if value[-1] != "/":
            value += "/"

        return value

    def get_email_options(self):
        """Update default e-mail options"""
        return {
            "subject_template_name": "registration/password_reset_subject.txt",
            "email_template_name": "account/password_reset_email.html",
            "extra_email_context": {
                "confirmation_url": iri_to_uri(self.validated_data["confirm_url"]),
            },
            # Below is the default value made explicit
            "from_email": None,
            "html_email_template_name": None,
        }


class UserTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer for the user token obtain pair API using our own refresh token."""

    token_class = UserRefreshToken


class TokenRefreshSerializer(BaseTokenRefreshSerializer):
    """Serializer to use our own refresh token."""

    token_class = MarshaRefreshToken
