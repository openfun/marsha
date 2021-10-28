"""Structure of BBB related models API responses with Django Rest Framework serializers."""

from django.urls import reverse

from rest_framework import serializers

from marsha.core.serializers.playlist import PlaylistLiteSerializer
from marsha.core.utils.url_utils import build_absolute_uri_behind_proxy

from .models import ApiMeetingException, Meeting


class MeetingSerializer(serializers.ModelSerializer):
    """A serializer to display a Meeting resource."""

    class Meta:  # noqa
        model = Meeting
        fields = (
            "id",
            "lti_id",
            "title",
            "playlist",
            "meeting_id",
            "welcome_text",
            "started",
            "infos",
        )
        read_only_fields = (
            "id",
            "lti_id",
            "playlist",
            "meeting_id",
            "started",
            "infos",
        )

    playlist = PlaylistLiteSerializer(read_only=True)
    infos = serializers.SerializerMethodField()

    def get_infos(self, obj):
        """Meeting infos from BBB server."""
        try:
            return obj.bbb_get_meeting_infos()
        except ApiMeetingException:
            return None


class MeetingSelectLTISerializer(MeetingSerializer):
    """A serializer to display a Meeting resource for LTI select content request."""

    class Meta:  # noqa
        model = Meeting
        fields = (
            "id",
            "lti_id",
            "lti_url",
            "title",
            "playlist",
            "meeting_id",
        )

    lti_url = serializers.SerializerMethodField()

    def get_lti_url(self, obj):
        """LTI Url of the Meeting.

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
            reverse("bbb:meeting_lti_view", args=[obj.id]),
        )
