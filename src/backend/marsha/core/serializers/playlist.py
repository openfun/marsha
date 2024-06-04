"""Structure of Playlist model API responses with Django Rest Framework serializers."""

from collections import OrderedDict

from django.core.exceptions import ValidationError
from django.db.transaction import atomic
from django.utils.translation import gettext_lazy as _

from rest_framework import serializers

from marsha.core.models import (
    ADMINISTRATOR,
    ConsumerSite,
    Organization,
    Playlist,
    PlaylistAccess,
)
from marsha.core.serializers.account import (
    ConsumerSiteSerializer,
    OrganizationLiteSerializer,
)
from marsha.core.serializers.base import ReadWritePrimaryKeyRelatedField


class PlaylistSerializer(serializers.ModelSerializer):
    """Serializer allowing to create a new playlist resource."""

    class Meta:
        """Meta for PlaylistCreateSerializer."""

        model = Playlist
        fields = [
            "consumer_site",
            "created_by",
            "created_on",
            "duplicated_from",
            "id",
            "is_portable_to_playlist",
            "is_portable_to_consumer_site",
            "is_public",
            "is_claimable",
            "lti_id",
            "organization",
            "portable_to",
            "title",
            "users",
            "retention_duration",
            # Non-model fields
            "can_edit",
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

    # Field consuming the `can_edit` property filled by
    # the `PlaylistManager` `annotate_can_edit`
    can_edit = serializers.BooleanField(read_only=True)
    lti_id = serializers.CharField(required=False)

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

    @atomic
    def create(self, validated_data):
        """Create a new Playlist instance."""
        if self.context["request"].resource is not None:
            raise ValidationError(
                "PlaylistSerializer create should not be called in LTI context"
            )

        validated_data["created_by_id"] = self.context["request"].user.id
        instance = super().create(validated_data)

        PlaylistAccess.objects.create(
            playlist=instance,
            user_id=self.context["request"].user.id,
            role=ADMINISTRATOR,
        )
        return instance


class PlaylistLiteSerializer(serializers.ModelSerializer):
    """A serializer to display a Playlist resource."""

    class Meta:  # noqa
        model = Playlist
        fields = ("id", "title", "lti_id")
        read_only_fields = ("id", "title", "lti_id")
