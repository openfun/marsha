"""Marsha specific authentication class for API."""
from django.utils.functional import cached_property
from django.utils.translation import gettext_lazy as _

from rest_framework_simplejwt.authentication import JWTStatelessUserAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.models import TokenUser


class TokenPlaylist(TokenUser):
    """Same as TokenUser but for playlist access JWT, with helpers for payload."""

    @cached_property
    def id(self):
        """Returns the playlist ID."""
        return self.token["playlist_id"]

    @cached_property
    def roles(self):
        """Payload roles is a list"""
        return self.token.get("roles", [])

    @cached_property
    def user(self):
        """Payload user is a dict"""
        return self.token.get("user", {})


class JWTStatelessUserOrPlaylistAuthentication(JWTStatelessUserAuthentication):
    """
    An authentication plugin that authenticates requests through a JSON web
    token provided in a request header without performing a database lookup
    to obtain a user instance.
    """

    def get_user(self, validated_token):
        """
        Returns a stateless user object which is backed by the given validated
        token.

        We keep an actual user-like object to go through Django logic but this
        method can return:
         - TokenUser for user authentication
         - TokenPlaylist for playlist authentication
        """
        try:
            user = super().get_user(validated_token)
        except InvalidToken as exc:
            if "playlist_id" not in validated_token:
                raise InvalidToken(
                    _("Token contained no recognizable playlist identification")
                ) from exc
            return TokenPlaylist(validated_token)

        return user
