"""Structure of Document related models API responses with Django Rest Framework serializers."""
from datetime import timedelta
import mimetypes
from os.path import splitext
from urllib.parse import quote_plus

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.urls import reverse
from django.utils import timezone

from botocore.signers import CloudFrontSigner
from rest_framework import serializers

from ..models import Document
from ..utils import cloudfront_utils, time_utils
from .base import TimestampField, UploadableFileWithExtensionSerializerMixin
from .playlist import PlaylistLiteSerializer


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
        return self._get_filename(obj.title, obj.extension, obj.playlist.title)

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

        url = (
            f"{settings.AWS_S3_URL_PROTOCOL}://{settings.CLOUDFRONT_DOMAIN}/{obj.pk}/document/"
            f"{time_utils.to_timestamp(obj.uploaded_on)}{self._get_extension_string(obj)}?response"
            f"-content-disposition={quote_plus('attachment; filename=' + self.get_filename(obj))}"
        )

        # Sign the document urls only if the functionality is activated
        if settings.CLOUDFRONT_SIGNED_URLS_ACTIVE:
            date_less_than = timezone.now() + timedelta(
                seconds=settings.CLOUDFRONT_SIGNED_URLS_VALIDITY
            )
            cloudfront_signer = CloudFrontSigner(
                settings.CLOUDFRONT_SIGNED_PUBLIC_KEY_ID, cloudfront_utils.rsa_signer
            )
            url = cloudfront_signer.generate_presigned_url(
                url, date_less_than=date_less_than
            )

        return url


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
    """A serializer to validate data submitted on the initiate-upload API endoint."""

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


class DocumentUploadSerializer(BaseInitiateUploadSerializer):
    """An initiate-upload serializer dedicated to Document."""

    @property
    def max_upload_file_size(self):
        """return the document max file size define in the settings.

        The @property decorator is used to ease the use of @override_settings
        in tests. Otherwise the setting is not changed and we can't easily test
        an upload with a size higher than the one defined in the settings
        """
        return settings.DOCUMENT_SOURCE_MAX_SIZE


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
