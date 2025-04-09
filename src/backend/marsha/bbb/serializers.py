"""Structure of BBB related models API responses with Django Rest Framework serializers."""

from datetime import datetime
import mimetypes
from os.path import splitext
from urllib.parse import quote_plus
from uuid import uuid4

from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import transaction
from django.urls import reverse
from django.utils import timezone

from rest_framework import serializers

from marsha.bbb.models import (
    Classroom,
    ClassroomDocument,
    ClassroomRecording,
    ClassroomSession,
)
from marsha.bbb.utils.bbb_utils import get_recording_url, get_url as get_document_url
from marsha.core.defaults import (
    CLASSROOM_RECORDINGS_KEY_CACHE,
    CLASSROOM_STORAGE_BASE_DIRECTORY,
    VOD_CONVERT,
)
from marsha.core.serializers import (
    BaseInitiateUploadSerializer,
    PlaylistLiteSerializer,
    ReadOnlyModelSerializer,
    UploadableFileWithExtensionSerializerMixin,
    VideoFromRecordingSerializer,
)
from marsha.core.utils import time_utils


class ClassroomRecordingSerializer(ReadOnlyModelSerializer):
    """A serializer to display a ClassroomRecording resource."""

    class Meta:  # noqa
        model = ClassroomRecording
        fields = (
            "id",
            "classroom_id",
            "record_id",
            "started_at",
            "video_file_url",
            "vod",
        )
        read_only_fields = (
            "id",
            "classroom_id",
            "record_id",
            "started_at",
            "video_file_url",
            "vod",
        )

    # Make sure classroom and vod UUIDs are converted to a string during serialization
    classroom_id = serializers.PrimaryKeyRelatedField(
        read_only=True, pk_field=serializers.CharField()
    )
    vod = VideoFromRecordingSerializer(read_only=True)
    video_file_url = serializers.SerializerMethodField()

    def _get_recording_cache_key(self, obj):
        """Compute the cache key for the current context."""
        request = self.context.get("request")
        if request:
            if request.resource:
                # LTI context
                payload = request.resource.token.payload
                user_id = payload.get("user", {}).get("id", str(uuid4()))
            else:
                user_id = request.user.id

            return f"{CLASSROOM_RECORDINGS_KEY_CACHE}{obj.record_id}:{user_id}"

        return f"{CLASSROOM_RECORDINGS_KEY_CACHE}{str(uuid4())}"

    def get_video_file_url(self, obj):
        """Method for video_file_url field."""
        video_file_url = None
        cache_key = self._get_recording_cache_key(obj)

        video_file_url = cache.get(cache_key)

        if video_file_url is None:
            # The url timeout has expired.
            # We must retrieve it from BBB and cache it again.
            video_file_url = get_recording_url(record_id=obj.record_id)
            cache.set(
                cache_key,
                video_file_url,
                settings.RECORDINGS_URL_CACHE_TIMEOUT,
            )

        return video_file_url


class ClassroomSessionSerializer(serializers.ModelSerializer):
    """A serializer to display a ClassroomSession resource."""

    class Meta:  # noqa
        model = ClassroomSession
        fields = (
            "started_at",
            "ended_at",
            "attendees",
        )
        read_only_fields = (
            "started_at",
            "ended_at",
            "attendees",
        )


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
            "recordings",
            "sessions",
            "vod_conversion_enabled",
            # specific generated fields
            "infos",
            "public_token",
            "instructor_token",
            # specific for widget fields
            "enable_waiting_room",
            "enable_shared_notes",
            "enable_chat",
            "enable_presentation_supports",
            "enable_recordings",
            "recording_purpose",
            "retention_date",
        )
        read_only_fields = (
            "id",
            "lti_id",
            "playlist",
            "meeting_id",
            "started",
            "ended",
            "recordings",
            "sessions",
            "vod_conversion_enabled",
            "infos",
        )

    playlist = PlaylistLiteSerializer(read_only=True)
    sessions = serializers.SerializerMethodField()
    infos = serializers.JSONField(read_only=True)
    public_token = serializers.SerializerMethodField()
    instructor_token = serializers.SerializerMethodField()
    recordings = serializers.SerializerMethodField()
    vod_conversion_enabled = serializers.SerializerMethodField()

    def get_public_token(self, obj):
        """Get the invite token for the classroom."""
        if self.context.get("is_admin", False):
            return obj.public_token
        return None

    def get_instructor_token(self, obj):
        """Get the instructor token for the classroom."""
        if self.context.get("is_admin", False):
            return obj.instructor_token
        return None

    def get_recordings(self, obj):
        """Get the recordings for the classroom.

        Only available for admins.
        """
        if self.context.get("is_admin", True):
            return ClassroomRecordingSerializer(
                obj.recordings.all(), many=True, context=self.context
            ).data
        return []

    def get_sessions(self, obj):
        """Get the sessions for the classroom."""
        if self.context.get("is_admin", True):
            return ClassroomSessionSerializer(
                obj.sessions.all(), many=True, context=self.context
            ).data
        return []

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

    def get_vod_conversion_enabled(self, obj):
        """Return whether the classroom recordings can be converted to a VOD."""
        try:
            consumer_site_inactive_features = (
                obj.playlist.consumer_site.inactive_features
            )
        except AttributeError:
            consumer_site_inactive_features = []

        try:
            organization_inactive_features = obj.playlist.organization.inactive_features
        except AttributeError:
            organization_inactive_features = []

        inactive_features = (
            consumer_site_inactive_features + organization_inactive_features
        )

        return VOD_CONVERT not in inactive_features


class ClassroomLiteSerializer(ReadOnlyModelSerializer):
    """Classroom lite serializer without infos fetch from the BBB api."""

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
            "playlist",
            "recording_purpose",
        )

    playlist = PlaylistLiteSerializer(read_only=True)


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
            "classroom_id",
            "filename",
            "id",
            "is_default",
            "upload_state",
            "uploaded_on",
            "url",
        )
        read_only_fields = (
            "classroom_id",
            "id",
            "upload_state",
            "uploaded_on",
            "url",
        )

    url = serializers.SerializerMethodField()
    # Make sure classroom UUID is converted to a string during serialization
    classroom_id = serializers.PrimaryKeyRelatedField(
        read_only=True, pk_field=serializers.CharField()
    )

    def to_internal_value(self, data):
        """Validate if the size is coherent with django settings."""
        max_file_size = settings.CLASSROOM_DOCUMENT_SOURCE_MAX_SIZE
        if "filename" in data and "size" not in data:
            raise ValidationError({"size": ["File size is required"]})
        if "size" in data and data.pop("size") > max_file_size:
            raise ValidationError(
                {"size": [f"File too large, max size allowed is {max_file_size} Bytes"]}
            )
        return super().to_internal_value(data)

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
        classroom_id = self.context["view"].get_related_classroom_id()
        if not validated_data.get("classroom_id"):
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


class ClassroomDocumentInitiateUploadSerializer(BaseInitiateUploadSerializer):
    """An initiate-upload serializer dedicated to classroom document."""

    @property
    def max_upload_file_size(self):
        """return the classroom document max file size define in the settings.

        The @property decorator is used to ease the use of @override_settings
        in tests. Otherwise the setting is not changed and we can't easily test
        an upload with a size higher than the one defined in the settings
        """
        return settings.CLASSROOM_DOCUMENT_SOURCE_MAX_SIZE

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


class ClassroomDocumentUploadEndedSerializer(serializers.Serializer):
    """A serializer to validate data submitted on the UploadEnded API endpoint."""

    file_key = serializers.CharField()

    def validate_file_key(self, value):
        """Check if the file_key is valid."""

        stamp = value.split("/")[-1]

        try:
            time_utils.to_datetime(stamp)
        except serializers.ValidationError as error:
            raise serializers.ValidationError("file_key is not valid") from error

        if (
            self.context["obj"].get_storage_prefix(
                stamp, CLASSROOM_STORAGE_BASE_DIRECTORY
            )
            != value
        ):
            raise serializers.ValidationError("file_key is not valid")
        return value
