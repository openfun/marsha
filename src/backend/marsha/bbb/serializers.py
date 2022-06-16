"""Structure of BBB related models API responses with Django Rest Framework serializers."""
from datetime import datetime

from django.urls import reverse
from django.utils import timezone

from rest_framework import serializers

from marsha.bbb.utils.bbb_utils import ApiMeetingException, get_meeting_infos
from marsha.core.serializers.playlist import PlaylistLiteSerializer
from marsha.core.utils.url_utils import build_absolute_uri_behind_proxy

from .models import Classroom


class ClassroomSerializer(serializers.ModelSerializer):
    """A serializer to display a Classroom resource."""

    class Meta:  # noqa
        model = Classroom
        fields = (
            "id",
            "lti_id",
            "title",
            "description",
            "playlist",
            "meeting_id",
            "welcome_text",
            "started",
            "ended",
            "infos",
            "starting_at",
            "estimated_duration",
        )
        read_only_fields = (
            "id",
            "lti_id",
            "playlist",
            "meeting_id",
            "started",
            "ended",
            "infos",
        )

    playlist = PlaylistLiteSerializer(read_only=True)
    infos = serializers.SerializerMethodField()

    def get_infos(self, obj):
        """Meeting infos from BBB server."""
        try:
            return get_meeting_infos(classroom=obj)
        except ApiMeetingException:
            return None

    def update(self, instance, validated_data):
        if any(
            attribute in validated_data
            for attribute in ["starting_at", "estimated_duration"]
        ):
            validated_data["ended"] = False
        return super().update(instance, validated_data)

    def validate_starting_at(self, value):
        """Add extra controls for starting_at field."""
        # Field starting_at has a new value
        if value != self.instance.starting_at:
            # New value is past, it can't be updated
            if value is not None and value < timezone.now():
                sent_date_with_timezone = datetime.fromisoformat(
                    self.context.get("request").data.get("starting_at")
                )
                raise serializers.ValidationError(
                    f"{sent_date_with_timezone} is not a valid date, date should be planned after!"
                )

        return value


class ClassroomSelectLTISerializer(ClassroomSerializer):
    """A serializer to display a Classroom resource for LTI select content request."""

    class Meta:  # noqa
        model = Classroom
        fields = (
            "id",
            "lti_id",
            "lti_url",
            "title",
            "description",
            "playlist",
            "meeting_id",
        )

    lti_url = serializers.SerializerMethodField()

    def get_lti_url(self, obj):
        """LTI Url of the Classroom.

        Parameters
        ----------
        obj : Type[models.Document]
            The document that we want to serialize

        Returns
        -------
        String
            the LTI url to be used by LTI consumers

        """
        return build_absolute_uri_behind_proxy(
            self.context["request"],
            reverse("bbb:classroom_lti_view", args=[obj.id]),
        )
