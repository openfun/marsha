"""Structure of Document related models API responses with Django Rest Framework serializers."""

import mimetypes
from os.path import splitext

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.urls import reverse

from rest_framework import serializers

from marsha.core.defaults import AWS_STORAGE_BASE_DIRECTORY, SCW_S3
from marsha.core.models import Document
from marsha.core.serializers.base import (
    TimestampField,
    UploadableFileWithExtensionSerializerMixin,
)
from marsha.core.serializers.playlist import PlaylistLiteSerializer
from marsha.core.storage.storage_class import file_storage


class DocumentSerializer(
    UploadableFileWithExtensionSerializerMixin, serializers.ModelSerializer
):
    """A serializer to display a Document resource."""

    class Meta:  # noqa
        model = Document
        fields = (
            "active_stamp",
            "extension",
            "filename",
            "id",
            "is_ready_to_show",
            "title",
            "upload_state",
            "url",
            "show_download",
            "playlist",
        )
        read_only_fields = (
            "active_stamp",
            "extension",
            "filename",
            "id",
            "is_ready_to_show",
            "upload_state",
            "url",
        )

    active_stamp = TimestampField(
        source="uploaded_on", required=False, allow_null=True, read_only=True
    )
    filename = serializers.SerializerMethodField()
    url = serializers.SerializerMethodField()
    is_ready_to_show = serializers.BooleanField(read_only=True)
    playlist = PlaylistLiteSerializer(read_only=True)

    def _get_extension_string(self, obj):
        """Document extension with the leading dot.

        Parameters
        ----------
        obj : Type[models.Document]
            The document that we want to serialize

        Returns
        -------
        String
            The document with the leading dot if the document has an extension
            An empty string otherwise

        """
        return "." + obj.extension if obj.extension else ""

    def get_filename(self, obj):
        """Filename of the Document.

        Parameters
        ----------
        obj : Type[models.Document]
            The document that we want to serialize

        Returns
        -------
        String
            The document's filename

        """
        return obj.filename

    def get_url(self, obj):
        """Url of the Document.

        Parameters
        ----------
        obj : Type[models.Document]
            The document that we want to serialize

        Returns
        -------
        String or None
            the url to fetch the document on CloudFront
            None if the document is still not uploaded to S3 with success

        """
        if obj.uploaded_on is None:
            return None

        if obj.storage_location == SCW_S3:
            file_key = obj.get_storage_key(self.get_filename(obj))
        else:
            file_key = obj.get_storage_key(
                self.get_filename(obj), base_dir=AWS_STORAGE_BASE_DIRECTORY
            )

        return file_storage.url(file_key)


class DocumentSelectLTISerializer(serializers.ModelSerializer):
    """A serializer to display a Document resource for LTI select content request."""

    class Meta:  # noqa
        model = Document
        fields = (
            "id",
            "is_ready_to_show",
            "title",
            "description",
            "upload_state",
            "lti_url",
        )
        read_only_fields = (
            "id",
            "is_ready_to_show",
            "title",
            "description",
            "upload_state",
            "lti_url",
        )

    is_ready_to_show = serializers.BooleanField(read_only=True)
    lti_url = serializers.SerializerMethodField()

    def get_lti_url(self, obj):
        """LTI Url of the Document.

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
            reverse("document_lti_view", args=[obj.id])
        )


class BaseInitiateUploadSerializer(serializers.Serializer):
    """A serializer to validate data submitted on the initiate-upload API endpoint."""

    filename = serializers.CharField()
    mimetype = serializers.CharField(allow_blank=True)
    size = serializers.IntegerField()

    def validate_size(self, value):
        """Validate if the size is coherent with django settings."""
        if not self.max_upload_file_size:
            raise ImproperlyConfigured(
                f"{self.__class__.__name__} must define a `max_upload_file_size`."
            )

        if value > self.max_upload_file_size:
            raise serializers.ValidationError(
                f"file too large, max size allowed is {self.max_upload_file_size} Bytes"
            )

        return value


class DocumentInitiateUploadSerializer(BaseInitiateUploadSerializer):
    """An initiate-upload serializer dedicated to Document."""

    @property
    def max_upload_file_size(self):
        """return the document max file size define in the settings.

        The @property decorator is used to ease the use of @override_settings
        in tests. Otherwise the setting is not changed and we can't easily test
        an upload with a size higher than the one defined in the settings
        """
        return settings.DOCUMENT_SOURCE_MAX_SIZE

    def validate_filename(self, value):
        """Check if the filename is valid."""
        if "/" in value or "\\" in value:
            raise serializers.ValidationError("Filename must not contain slashes.")

        if value.startswith("."):
            raise serializers.ValidationError("Filename must not start with a dot.")

        if len(value) > 255:
            raise serializers.ValidationError("Filename is too long.")

        return value

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


class DocumentUploadEndedSerializer(serializers.Serializer):
    """A serializer to validate data submitted on the UploadEnded API endpoint."""

    file_key = serializers.CharField()

    def validate_file_key(self, value):
        """Check if the file_key is valid."""
        filename = value.split("/")[-1]
        _, extension = splitext(filename)

        if not extension:
            raise serializers.ValidationError("Filename must include an extension.")

        if self.context["obj"].get_storage_key(filename=filename) != value:
            raise serializers.ValidationError("file_key is not valid")

        return value


class SharedLiveMediaInitiateUploadSerializer(BaseInitiateUploadSerializer):
    """An initiate-upload serializer dedicated to shared live media."""

    @property
    def max_upload_file_size(self):
        """return the shared live media max file size define in the settings.

        The @property decorator is used to ease the use of @override_settings
        in tests. Otherwise the setting is not changed and we can't easily test
        an upload with a size higher than the one defined in the settings
        """
        return settings.SHARED_LIVE_MEDIA_SOURCE_MAX_SIZE

    def validate(self, attrs):
        # mimetype is provided, we directly check it
        if attrs["mimetype"] != "":
            if attrs["mimetype"] not in settings.ALLOWED_SHARED_LIVE_MEDIA_MIME_TYPES:
                raise serializers.ValidationError(
                    {"mimetype": f"{attrs['mimetype']} is not a supported mimetype"}
                )
            attrs["extension"] = mimetypes.guess_extension(attrs["mimetype"])

        # mimetype is not provided, we have to guess it from the extension
        else:
            mimetypes.init()
            extension = splitext(attrs["filename"])[1]
            mimetype = mimetypes.types_map.get(extension)
            if mimetype not in settings.ALLOWED_SHARED_LIVE_MEDIA_MIME_TYPES:
                raise serializers.ValidationError(
                    {"mimetype": "mimetype not guessable"}
                )
            # extension is added to the data in order to be used later
            attrs["extension"] = extension
            attrs["mimetype"] = mimetype

        return attrs


class VideoUploadSerializer(BaseInitiateUploadSerializer):
    """An initiate-upload serializer dedicated to videos"""

    @property
    def max_upload_file_size(self):
        """return the video max file size define in the settings.

        The @property decorator is used to ease the use of @override_settings
        in tests. Otherwise the setting is not changed and we can't easily test
        an upload with a size higher than the one defined in the settings
        """
        return settings.VIDEO_SOURCE_MAX_SIZE


class TimedTextUploadSerializer(BaseInitiateUploadSerializer):
    """An initiate-upload serializer dedicated to subtitles"""

    @property
    def max_upload_file_size(self):
        """returns the subtitle max file size define in the settings.

        The @property decorator is used to ease the use of @override_settings
        in tests. Otherwise the setting is not changed and we can't easily test
        an upload with a size higher than the one defined in the settings
        """
        return settings.SUBTITLE_SOURCE_MAX_SIZE


class ThumbnailInitiateUploadSerializer(BaseInitiateUploadSerializer):
    """An initiate-upload serializer dedicated to thumbnails"""

    @property
    def max_upload_file_size(self):
        """return the video max file size define in the settings.

        The @property decorator is used to ease the use of @override_settings
        in tests. Otherwise the setting is not changed and we can't easily test
        an upload with a size higher than the one defined in the settings
        """
        return settings.THUMBNAIL_SOURCE_MAX_SIZE
