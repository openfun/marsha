"""Structure of BBB related models API responses with Django Rest Framework serializers."""
from datetime import datetime
import mimetypes
from os.path import splitext
from urllib.parse import quote_plus

from django.conf import settings
from django.db import transaction
from django.urls import reverse
from django.utils import timezone

from rest_framework import serializers

from marsha.bbb.models import Classroom, ClassroomDocument
from marsha.bbb.utils.bbb_utils import (
    ApiMeetingException,
    get_meeting_infos,
    get_url as get_document_url,
)
from marsha.bbb.utils.tokens import create_classroom_stable_invite_jwt
from marsha.core.serializers import (
    InitiateUploadSerializer,
    UploadableFileWithExtensionSerializerMixin,
)
from marsha.core.serializers.base import ReadOnlyModelSerializer
from marsha.core.serializers.playlist import PlaylistLiteSerializer


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
            "starting_at",
            "estimated_duration",
            # specific generated fields
            "infos",
            "invite_token",
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
    invite_token = serializers.SerializerMethodField()

    def get_infos(self, obj):
        """Meeting infos from BBB server."""
        try:
            return get_meeting_infos(classroom=obj)
        except ApiMeetingException:
            return None

    def get_invite_token(self, obj):
        """Get the invite token for the classroom."""
        if self.context.get("is_admin", False):
            return str(create_classroom_stable_invite_jwt(obj))
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


class ClassroomLiteSerializer(ReadOnlyModelSerializer):
    """Classroom lite serializer without playlist and infos fetch from the BBB api."""

    class Meta:  # noqa
        model = Classroom
        fields = (
            "id",
            "lti_id",
            "title",
            "description",
            "meeting_id",
            "welcome_text",
            "started",
            "ended",
            "starting_at",
            "estimated_duration",
        )


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
        return self.context["request"].build_absolute_uri(
            reverse("classroom:classroom_lti_view", args=[obj.id]),
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
        classroom_id = self.context["request"].data.get("classroom")
        if not validated_data.get("classroom_id"):
            if resource:
                validated_data["classroom_id"] = resource.id
            elif classroom_id:
                validated_data["classroom_id"] = classroom_id

        if not ClassroomDocument.objects.filter(
            classroom_id=validated_data["classroom_id"]
        ).exists():
            validated_data["is_default"] = True

        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Set the default attribute of the others classroom documents to false if
        set to true for this one.

        Parameters
        ----------
        instance : Type[models.ClassroomDocument]
            The document that we want to update

        validated_data : dictionary
            Dictionary of the deserialized values of each field after validation.

        Returns
        -------
        Type[models.ClassroomDocument]
            The updated document

        """
        with transaction.atomic():
            instance = super().update(instance, validated_data)
            if validated_data.get("is_default"):
                ClassroomDocument.objects.exclude(id=instance.id).filter(
                    classroom=instance.classroom, is_default=True
                ).update(is_default=False)
            return instance

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
        if url := get_document_url(obj):
            return (
                f"{url}?response-content-disposition="
                f"{quote_plus('attachment; filename=' + obj.filename)}"
            )
        return None


class ClassroomDocumentInitiateUploadSerializer(InitiateUploadSerializer):
    """An initiate-upload serializer dedicated to classroom document."""

    def validate(self, attrs):
        """Validate if the mimetype is allowed or not."""
        # mimetype is provided, we directly check it
        if attrs["mimetype"] != "":
            if attrs["mimetype"] not in settings.ALLOWED_CLASSROOM_DOCUMENT_MIME_TYPES:
                raise serializers.ValidationError(
                    {"mimetype": f"{attrs['mimetype']} is not a supported mimetype"}
                )
            attrs["extension"] = mimetypes.guess_extension(attrs["mimetype"])

        # mimetype is not provided, we have to guess it from the extension
        else:
            mimetypes.init()
            extension = splitext(attrs["filename"])[1]
            mimetype = mimetypes.types_map.get(extension)
            if mimetype not in settings.ALLOWED_CLASSROOM_DOCUMENT_MIME_TYPES:
                raise serializers.ValidationError(
                    {"mimetype": "mimetype not guessable"}
                )
            # extension is added to the data in order to be used later
            attrs["extension"] = extension
            attrs["mimetype"] = mimetype

        return attrs
