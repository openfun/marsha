"""Structure of PlaylistAccess model API responses with Django Rest Framework serializers."""

from rest_framework import serializers

from marsha.core.models import Playlist, PlaylistAccess, User
from marsha.core.serializers.account import UserSerializer
from marsha.core.serializers.base import ReadWritePrimaryKeyRelatedField
from marsha.core.serializers.playlist import PlaylistLiteSerializer


class PlaylistAccessSerializer(serializers.ModelSerializer):
    """Serializer for the PlaylistAccess model."""

    class Meta:
        """Meta for PlaylistAccessSerializer."""

        model = PlaylistAccess
        fields = [
            "id",
            "user",
            "playlist",
            "role",
        ]

    playlist = ReadWritePrimaryKeyRelatedField(
        PlaylistLiteSerializer,
        queryset=Playlist.objects.all(),
        required=False,
        allow_null=True,
    )
    user = ReadWritePrimaryKeyRelatedField(
        UserSerializer,
        queryset=User.objects.all(),
        required=False,
        allow_null=True,
    )
