"""Account API serializers."""

from urllib.parse import urlparse

from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils.encoding import iri_to_uri
from django.utils.http import url_has_allowed_host_and_scheme

from dj_rest_auth.serializers import (
    PasswordChangeSerializer as DjRestAuthPasswordChangeSerializer,
    PasswordResetSerializer as DjRestAuthPasswordResetSerializer,
)
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework_simplejwt.models import TokenUser
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
    TokenRefreshSerializer as BaseTokenRefreshSerializer,
)

from marsha.core.simple_jwt.authentication import TokenPlaylist
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


class PasswordChangeSerializer(DjRestAuthPasswordChangeSerializer):
    """
    Serializer for requesting a password change.

    We override this serializer to convert the `TokenUser` into a "real" user.
    This serializer also completes the `IsAuthenticated` permission check from the
    `dj_rest_auth` view, which allows us not to override the view and only
    use the `PASSWORD_CHANGE_SERIALIZER` setting to configure the view.
    """

    def __init__(self, *args, **kwargs):
        """Instantiate the serializer and make the `TokenUser` to `User` conversion."""
        super().__init__(*args, **kwargs)
        if isinstance(self.user, TokenUser) and not isinstance(
            self.user, TokenPlaylist
        ):
            # May raise 500 here but this is not expected so let it raise
            self.user = get_user_model().objects.get(pk=self.user.pk)
        else:
            # In this case, either we are using a ResourceToken or we did not
            # go through the expected authentication backend.
            raise AuthenticationFailed({"detail": "Wrong authentication method."})


class UserTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer for the user token obtain pair API using our own refresh token."""

    token_class = UserRefreshToken


class TokenRefreshSerializer(BaseTokenRefreshSerializer):
    """Serializer to use our own refresh token."""

    token_class = MarshaRefreshToken
