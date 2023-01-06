"""Account API serializers."""
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
    TokenRefreshSerializer as BaseTokenRefreshSerializer,
)

from marsha.core.simple_jwt.tokens import MarshaRefreshToken, UserRefreshToken


class UserTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer for the user token obtain pair API using our own refresh token."""

    token_class = UserRefreshToken


class TokenRefreshSerializer(BaseTokenRefreshSerializer):
    """Serializer to use our own refresh token."""

    token_class = MarshaRefreshToken
