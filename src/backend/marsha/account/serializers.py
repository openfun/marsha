"""Account API serializers."""
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
    TokenRefreshSerializer,
)

from marsha.core.simple_jwt.tokens import UserRefreshToken


class UserTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer for the user token obtain pair API using our own refresh token."""

    token_class = UserRefreshToken


class UserTokenRefreshSerializer(TokenRefreshSerializer):
    """Serializer for the user token refresh API using our own refresh token."""

    token_class = UserRefreshToken
