"""Structure of Playlist model API responses with Django Rest Framework serializers."""
from rest_framework import serializers

from ..models import Playlist


class PlaylistSerializer(serializers.ModelSerializer):
    """Serializer to display a complete Playlist resource."""

    class Meta:
        """Meta for Playlistserializer."""

        model = Playlist
        fields = [
            "consumer_site",
            "created_by",
            "duplicated_from",
            "id",
            "is_portable_to_playlist",
            "is_portable_to_consumer_site",
            "is_public",
            "lti_id",
            "organization",
            "portable_to",
            "title",
            "users",
        ]

    def create(self, validated_data):
        """Create the Playlist object with the passed data."""
        return Playlist.objects.create(**validated_data)


class PlaylistLiteSerializer(serializers.ModelSerializer):
    """A serializer to display a Playlist resource."""

    class Meta:  # noqa
        model = Playlist
        fields = ("title", "lti_id")
        read_only_fields = ("title", "lti_id")
