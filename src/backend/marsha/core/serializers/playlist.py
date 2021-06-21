"""Structure of Playlist model API responses with Django Rest Framework serializers."""
from collections import OrderedDict

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

    portable_to = serializers.SerializerMethodField(read_only=False)

    def get_portable_to(self, obj):
        """Getter for portable_to attribute instead of PlaylistSerializer to prevent recursion."""
        return [
            {"id": playlist.id, "title": playlist.title}
            for playlist in obj.portable_to.all()
        ]

    def create(self, validated_data):
        """Create the Playlist object with the passed data."""
        return Playlist.objects.create(**validated_data)

    def update(self, instance, validated_data):
        """
        Update the Playlist object with the passed data.

        Instance id is removed from portable_to attribute.
        """
        if "portable_to" in validated_data and str(instance.id) in validated_data.get(
            "portable_to"
        ):
            validated_data.get("portable_to").remove(str(instance.id))
        return super().update(instance, validated_data)

    def to_internal_value(self, data):
        """Override to add portable_to playlists."""
        value: OrderedDict = super().to_internal_value(data)
        if "portable_to" in data.keys():
            value.update({"portable_to": data.get("portable_to")})
        return value


class PlaylistLiteSerializer(serializers.ModelSerializer):
    """A serializer to display a Playlist resource."""

    class Meta:  # noqa
        model = Playlist
        fields = ("id", "title", "lti_id")
        read_only_fields = ("id", "title", "lti_id")
