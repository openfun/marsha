"""Custom permission classes for the BBB app."""

from rest_framework import permissions
from rest_framework_simplejwt.models import TokenUser

from marsha.core import models


class HasPlaylistToken(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Only if the user has a playlist token payload.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Only if the playlist exists.
        """
        user = request.user
        if isinstance(user, TokenUser):
            playlist_id = user.token.payload.get("playlist_id")
            return models.Playlist.objects.filter(id=playlist_id).exists()
        return False
