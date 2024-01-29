"""Structure of Markdown related models API responses with Django Rest Framework serializers."""

import mimetypes
from os.path import splitext

from django.conf import settings
from django.urls import reverse

from rest_framework import serializers

from marsha.core.serializers import (
    BaseInitiateUploadSerializer,
    ReadOnlyModelSerializer,
    TimestampField,
    UploadableFileWithExtensionSerializerMixin,
    get_resource_cloudfront_url_params,
)
from marsha.core.serializers.playlist import PlaylistLiteSerializer
from marsha.core.utils import cloudfront_utils, time_utils
from marsha.markdown.models import MarkdownDocument, MarkdownImage


class MarkdownImageSerializer(
    UploadableFileWithExtensionSerializerMixin,
    ReadOnlyModelSerializer,
):
    """A serializer to display a MarkdownImage"""

    class Meta:  # noqa
        model = MarkdownImage
        fields = (
            "active_stamp",
            "filename",  # method
            "id",
            "is_ready_to_show",
            "upload_state",
            "url",
            "markdown_document",
        )

    active_stamp = TimestampField(
        source="uploaded_on", required=False, allow_null=True, read_only=True
    )
    # No need to serialize the Markdown document here
    markdown_document = serializers.PrimaryKeyRelatedField(
        read_only=True, pk_field=serializers.CharField()
    )
    is_ready_to_show = serializers.BooleanField(read_only=True)
    url = serializers.SerializerMethodField()

    filename = serializers.SerializerMethodField()

    def create(self, validated_data):
        """Force the Markdown document field to the Markdown document of the JWT Token if any.

        Parameters
        ----------
        validated_data : dictionary
            Deserialized values of each field after validation.

        Returns
        -------
        dictionary
            The "validated_data" dictionary is returned after modification.

        """
        markdown_document_id = self.context["view"].get_related_markdown_document_id()
        if not validated_data.get("markdown_document_id"):
            validated_data["markdown_document_id"] = markdown_document_id

        return super().create(validated_data)

    def get_filename(self, obj):
        """Retrieve the object's filename."""
        return (
            self._get_filename(str(obj.pk), extension=obj.extension)
            if obj.uploaded_on
            else None
        )

    def get_url(self, obj):
        """URL of the Markdown image.

        Parameters
        ----------
        obj : Type[models.MarkdownImage]
            The Markdown image we want to serialize

        Returns
        -------
        str or None
            The url of the Markdown image.
            None if the Markdown image is still not uploaded to S3 with success.

        """
        if not obj.uploaded_on:
            return None

        base = f"{settings.AWS_S3_URL_PROTOCOL}://{settings.CLOUDFRONT_DOMAIN}"
        base = f"{base}/{obj.markdown_document_id}/markdown-image"
        stamp = time_utils.to_timestamp(obj.uploaded_on)
        url = f"{base}/{obj.pk}/{stamp}.{obj.extension.lstrip('.')}"

        if not settings.CLOUDFRONT_SIGNED_URLS_ACTIVE:
            return url

        params = get_resource_cloudfront_url_params(
            "markdown-document", obj.markdown_document_id
        )
        return cloudfront_utils.build_signed_url(url, params)


class MarkdownImageUploadSerializer(BaseInitiateUploadSerializer):
    """An initiate-upload serializer dedicated to Markdown image."""

    @property
    def max_upload_file_size(self):
        """return the markdown image max file size define in the settings.

        The @property decorator is used to ease the use of @override_settings
        in tests. Otherwise the setting is not changed and we can't easily test
        an upload with a size higher than the one defined in the settings
        """
        return settings.MARKDOWN_IMAGE_SOURCE_MAX_SIZE

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

        if attrs["mimetype"] not in settings.ALLOWED_MARKDOWN_IMAGES_MIME_TYPES:
            raise serializers.ValidationError(
                {"mimetype": f"{attrs['mimetype']} is not a supported mimetype"}
            )

        return attrs


class MarkdownPreviewSerializer(serializers.Serializer):
    """A simple serializer for Markdown rendering API."""

    text = serializers.CharField(allow_blank=True, trim_whitespace=False)

    def get_markdown_content(self):
        """Helper to allow easier field name refactor.

        Note: `is_valid` method must be called before.
        """
        return self.validated_data["text"]


class MarkdownDocumentTranslationsSerializer(serializers.ModelSerializer):
    """A serializer to manage documents' translations."""

    class Meta:  # noqa
        # pylint: disable-next=protected-access
        model = MarkdownDocument._parler_meta.root.model
        fields = (
            "language_code",
            "title",
            "content",
            "rendered_content",
        )


class MarkdownDocumentSerializer(serializers.ModelSerializer):
    """A serializer to display a MarkdownDocument resource."""

    class Meta:  # noqa
        model = MarkdownDocument
        fields = (
            "id",
            # document attributes
            "is_draft",
            "rendering_options",
            "translations",
            # playlist attributes
            "playlist",
            "position",
            "images",
        )
        read_only_fields = (
            "id",
            "lti_id",
            # document attributes
            "translations",
            # playlist attributes
            "playlist",
            "position",
            "images",
        )

    playlist = PlaylistLiteSerializer(read_only=True)
    translations = MarkdownDocumentTranslationsSerializer(many=True, read_only=True)
    images = MarkdownImageSerializer(many=True, read_only=True)


class MarkdownDocumentSelectLTISerializer(MarkdownDocumentSerializer):
    """A serializer to display a MarkdownDocument resource for LTI select content request."""

    class Meta:  # noqa
        model = MarkdownDocument
        fields = (
            *MarkdownDocumentSerializer.Meta.fields,
            "lti_id",
            "lti_url",
        )

    lti_url = serializers.SerializerMethodField()

    def get_lti_url(self, obj):
        """LTI Url of the MarkdownDocument.

        Parameters
        ----------
        obj : Type[models.MarkdownDocument]
            The document that we want to serialize

        Returns
        -------
        String
            the LTI url to be used by LTI consumers

        """
        return self.context["request"].build_absolute_uri(
            reverse("markdown:markdown_document_lti_view", args=[obj.id]),
        )
