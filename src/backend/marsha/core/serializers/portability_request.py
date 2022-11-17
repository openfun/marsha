"""Structure of portability request related models API ."""
from rest_framework import serializers

from marsha.core.lti.user_association import get_user_from_lti_user_id_and_consumer_site
from marsha.core.models import ConsumerSite, Playlist, User
from marsha.core.models.portability_request import PortabilityRequest
from marsha.core.serializers import (
    ConsumerSiteSerializer,
    PlaylistLiteSerializer,
    ReadWritePrimaryKeyRelatedField,
    UserSerializer,
)


class PortabilityRequestSerializer(serializers.ModelSerializer):
    """A serializer for portability requests"""

    for_playlist = ReadWritePrimaryKeyRelatedField(
        PlaylistLiteSerializer,
        queryset=Playlist.objects.all(),
    )
    from_playlist = ReadWritePrimaryKeyRelatedField(
        PlaylistLiteSerializer,
        queryset=Playlist.objects.all(),
    )
    from_lti_consumer_site = ReadWritePrimaryKeyRelatedField(
        ConsumerSiteSerializer,
        queryset=ConsumerSite.objects.all(),
    )
    from_user = ReadWritePrimaryKeyRelatedField(
        UserSerializer,
        queryset=User.objects.all(),
        required=False,
    )

    class Meta:  # noqa
        model = PortabilityRequest
        fields = (
            "id",
            "for_playlist",
            "from_playlist",
            "from_lti_consumer_site",
            "from_lti_user_id",
            "from_user",
            "state",
            "updated_by_user",
        )
        read_only_fields = (
            "id",
            "state",
            "updated_by_user",
        )

    def create(self, validated_data):
        """

        Parameters
        ----------
        validated_data : dict
            Dictionary of the deserialized values of each field after validation.

        Returns
        -------
        PortabilityRequest
            The created portability request instance.
        """
        resource = self.context["request"].resource

        if "from_user" in validated_data:
            # We allow from_user to be writtable to allow the user to be set in object creation,
            # but it is not expected to be set by the provided data
            raise serializers.ValidationError("Unexpected provided user")

        if resource is None:
            raise serializers.ValidationError("Needs to be in an LTI context")

        # We allow to pass arguments for request creation, because on the "site" part
        # the provided information won't comme from the resource JWT token.
        if str(validated_data["from_playlist"].id) != resource.playlist_id:
            raise serializers.ValidationError("Unexpected playlist")
        if str(validated_data["from_lti_consumer_site"].id) != resource.consumer_site:
            raise serializers.ValidationError("Unexpected consumer site")
        if str(validated_data["from_lti_user_id"]) != resource.user["id"]:
            raise serializers.ValidationError("Unexpected user id")

        # Extract the frontend user if we already have it in database
        user = get_user_from_lti_user_id_and_consumer_site(
            validated_data["from_lti_user_id"],
            validated_data["from_lti_consumer_site"].id,
        )
        # User maybe None at this point and this is expected
        validated_data["from_user"] = user

        return super().create(validated_data)
