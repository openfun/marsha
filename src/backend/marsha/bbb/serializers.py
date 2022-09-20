"""Structure of BBB related models API responses with Django Rest Framework serializers."""
from datetime import datetime
import mimetypes
from os.path import splitext
from urllib.parse import quote_plus

from django.conf import settings
from django.urls import reverse
from django.utils import timezone

from rest_framework import serializers

from marsha.bbb.utils.bbb_utils import ApiMeetingException, get_meeting_infos
from marsha.core.serializers.playlist import PlaylistLiteSerializer
from marsha.core.utils.url_utils import build_absolute_uri_behind_proxy

from ..core.serializers import (
    InitiateUploadSerializer,
    UploadableFileWithExtensionSerializerMixin,
    get_resource_cloudfront_url_params,
)
from ..core.utils import cloudfront_utils, time_utils
from .models import Classroom, ClassroomDocument


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


class ClassroomDocumentSerializer(
    UploadableFileWithExtensionSerializerMixin, serializers.ModelSerializer
):
    """A serializer to display a ClassroomDocument resource."""

    class Meta:  # noqa
        model = ClassroomDocument
        fields = (
            "classroom",
            "filename",
            "id",
            "is_default",
            "upload_state",
            "uploaded_on",
            "url",
        )
        read_only_fields = (
            "classroom",
            "id",
            "upload_state",
            "uploaded_on",
            "url",
        )

    url = serializers.SerializerMethodField()
    # Make sure classroom UUID is converted to a string during serialization
    classroom = serializers.PrimaryKeyRelatedField(
        read_only=True, pk_field=serializers.CharField()
    )

    def create(self, validated_data):
        """Force the classroom field to the classroom of the JWT Token if any.

        Parameters
        ----------
        validated_data : dictionary
            Dictionary of the deserialized values of each field after validation.

        Returns
        -------
        dictionary
            The "validated_data" dictionary is returned after modification.

        """
        resource = self.context["request"].resource

        if not validated_data.get("classroom_id") and resource:
            validated_data["classroom_id"] = resource.id

        return super().create(validated_data)

    def _get_extension_string(self, obj):
        """Classroom document extension with the leading dot.

        Parameters
        ----------
        obj : Type[models.DepositedFile]
            The classroom document that we want to serialize

        Returns
        -------
        String
            The extension with the leading dot if the classroom document has an extension
            An empty string otherwise

        """
        if "." not in obj.filename:
            return ""
        return splitext(obj.filename)[1]

    def get_url(self, obj):
        """Url of the ClassroomDocument.

        Parameters
        ----------
        obj : Type[models.DepositedFile]
            The classroom document that we want to serialize

        Returns
        -------
        String or None
            the url to fetch the classroom document on CloudFront
            None if the classroom document is still not uploaded to S3 with success

        """
        if obj.uploaded_on is None:
            return None

        url = (
            f"{settings.AWS_S3_URL_PROTOCOL}://{settings.CLOUDFRONT_DOMAIN}/"
            f"{obj.classroom.pk}/classroomdocument/{obj.pk}/"
            f"{time_utils.to_timestamp(obj.uploaded_on)}{self._get_extension_string(obj)}?"
            f"response-content-disposition={quote_plus('attachment; filename=' + obj.filename)}"
        )

        if settings.CLOUDFRONT_SIGNED_URLS_ACTIVE:
            params = get_resource_cloudfront_url_params(
                "classroomdocument", obj.classroom_id
            )
            url = cloudfront_utils.build_signed_url(url, params)
        return url


class ClassroomDocumentInitiateUploadSerializer(InitiateUploadSerializer):
    """An initiate-upload serializer dedicated to classroom document."""

    def validate(self, attrs):
        """Validate if the mimetype is allowed or not."""
        # mimetype is provided, we directly check it
        if attrs["mimetype"] != "":
            attrs["extension"] = mimetypes.guess_extension(attrs["mimetype"])

        # mimetype is not provided, we have to guess it from the extension
        else:
            mimetypes.init()
            extension = splitext(attrs["filename"])[1]
            mimetype = mimetypes.types_map.get(extension)
            # extension is added to the data in order to be used later
            attrs["extension"] = extension
            attrs["mimetype"] = mimetype

        return attrs
