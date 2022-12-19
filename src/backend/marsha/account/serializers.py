"""Account API serializers."""
from dj_rest_auth.serializers import (
    PasswordResetSerializer as DjRestAuthPasswordResetSerializer,
)
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
    TokenRefreshSerializer as BaseTokenRefreshSerializer,
)

from marsha.core.simple_jwt.tokens import MarshaRefreshToken, UserRefreshToken


class PasswordResetSerializer(DjRestAuthPasswordResetSerializer):
    """Serializer for requesting a password reset e-mail."""

    def get_email_options(self):
        """Update default e-mail options"""
        return {
            "subject_template_name": "registration/password_reset_subject.txt",
            "email_template_name": "account/password_reset_email.html",
            # Below is the default value made explicit
            "from_email": None,
            "html_email_template_name": None,
            "extra_email_context": None,
        }


class UserTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer for the user token obtain pair API using our own refresh token."""

    token_class = UserRefreshToken


class TokenRefreshSerializer(BaseTokenRefreshSerializer):
    """Serializer to use our own refresh token."""

    token_class = MarshaRefreshToken
