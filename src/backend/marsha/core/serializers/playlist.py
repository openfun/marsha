"""Structure of Playlist model API responses with Django Rest Framework serializers."""
from collections import OrderedDict

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from rest_framework import serializers

from ..models import ConsumerSite, Organization, Playlist
from .account import ConsumerSiteSerializer, OrganizationLiteSerializer
from .base import ReadWritePrimaryKeyRelatedField


class PlaylistSerializer(serializers.ModelSerializer):
    """Serializer allowing to create a new playlist resource."""

    class Meta:
        """Meta for PlaylistCreateSerializer."""

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
    organization = ReadWritePrimaryKeyRelatedField(
        OrganizationLiteSerializer,
        queryset=Organization.objects.all(),
        required=False,
        allow_null=True,
    )
    consumer_site = ReadWritePrimaryKeyRelatedField(
        ConsumerSiteSerializer,
        queryset=ConsumerSite.objects.all(),
        required=False,
        allow_null=True,
    )

    def get_portable_to(self, obj):
        """Getter for portable_to attribute instead of PlaylistSerializer to prevent recursion."""
        return obj.portable_to.values("id", "title")

    def to_internal_value(self, data):
        """
        Validate portable_to.

        Raise a ValidationError if portable_to contains current object playlist id
        or an unknown playlist id.
        """
        value: OrderedDict = super().to_internal_value(data)
        if "portable_to" in data.keys():
            reachable_from_playlist_ids = data.get("portable_to")

            if str(self.instance.id) in reachable_from_playlist_ids:
                raise serializers.ValidationError(
                    {"portable_to": _("Playlist is not portable to itself.")}
                )

            try:
                existing_playlist_ids = {
                    str(playlist_id)
                    for playlist_id in Playlist.objects.filter(
                        id__in=reachable_from_playlist_ids
                    ).values_list("id", flat=True)
                }
            except ValidationError as error:
                raise serializers.ValidationError(
                    {"portable_to": ", ".join(error.messages)}
                ) from error

            ids_diff = set(reachable_from_playlist_ids) - existing_playlist_ids
            if ids_diff:
                raise serializers.ValidationError(
                    {
                        "portable_to": _(
                            f"Some playlists don't exist: {', '.join(ids_diff):s}."
                        )
                    }
                )
            value.update({"portable_to": reachable_from_playlist_ids})
        return value


class PlaylistLiteSerializer(serializers.ModelSerializer):
    """A serializer to display a Playlist resource."""

    class Meta:  # noqa
        model = Playlist
        fields = ("id", "title", "lti_id")
        read_only_fields = ("id", "title", "lti_id")
