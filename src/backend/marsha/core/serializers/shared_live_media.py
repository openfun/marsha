"""Structure of SharedLiveMedia related models API responses with DRF serializers."""

from urllib.parse import quote_plus

from django.conf import settings

from rest_framework import serializers

from marsha.core.defaults import CELERY_PIPELINE
from marsha.core.models import SharedLiveMedia
from marsha.core.serializers.base import (
    TimestampField,
    UploadableFileWithExtensionSerializerMixin,
    get_video_cloudfront_url_params,
)
from marsha.core.storage.storage_class import file_storage
from marsha.core.utils import cloudfront_utils, time_utils


class SharedLiveMediaSerializer(
    UploadableFileWithExtensionSerializerMixin, serializers.ModelSerializer
):
    """Serializer to display a shared live media model."""

    class Meta:  # noqa
        model = SharedLiveMedia
        fields = (
            "active_stamp",
            "filename",
            "id",
            "is_ready_to_show",
            "nb_pages",
            "show_download",
            "title",
            "upload_state",
            "urls",
            "video",
        )
        read_only_fields = (
            "active_stamp",
            "filename",
            "id",
            "is_ready_to_show",
            "nb_pages",
            "upload_state",
            "urls",
            "video",
        )

    active_stamp = TimestampField(
        source="uploaded_on", required=False, allow_null=True, read_only=True
    )
    filename = serializers.SerializerMethodField()
    is_ready_to_show = serializers.BooleanField(read_only=True)
    urls = serializers.SerializerMethodField()
    # Make sure video UUID is converted to a string during serialization
    video = serializers.PrimaryKeyRelatedField(
        read_only=True, pk_field=serializers.CharField()
    )

    def create(self, validated_data):
        """Force the video field to the video of the JWT Token if any.

        Parameters
        ----------
        validated_data : dictionary
            Dictionary of the deserialized values of each field after validation.

        Returns
        -------
        dictionary
            The "validated_data" dictionary is returned after modification.

        """
        validated_data["video_id"] = self.context["video_id"]
        return super().create(validated_data)

    def get_filename(self, obj):
        """Filename of the shared live media."""
        return (
            self._get_filename(obj.title, extension=obj.extension)
            if obj.uploaded_on
            else None
        )

    def get_urls(self, obj):
        """urls for each media's pages."""

        if obj.uploaded_on is None or obj.nb_pages is None:
            return None

        if obj.process_pipeline == CELERY_PIPELINE:
            return self.get_celery_pipeline_url(obj)

        # default AWS fallback: obj.process_pipeline == AWS_PIPELINE
        return self.get_aws_pipeline_url(obj)

    def get_aws_pipeline_url(self, obj):
        """Get the url for the shared live media processed with AWS."""
        urls = {}

        stamp = time_utils.to_timestamp(obj.uploaded_on)
        base = (
            f"{settings.AWS_S3_URL_PROTOCOL}://{settings.CLOUDFRONT_DOMAIN}/"
            f"{obj.video_id}/sharedlivemedia/{obj.pk}/{stamp}"
        )

        if settings.CLOUDFRONT_SIGNED_URLS_ACTIVE:
            params = get_video_cloudfront_url_params(obj.video_id)

        pages = {}
        for page_number in range(1, obj.nb_pages + 1):
            url = f"{base:s}_{page_number:d}.svg"
            if settings.CLOUDFRONT_SIGNED_URLS_ACTIVE:
                url = cloudfront_utils.build_signed_url(url, params)
            pages[page_number] = url

        urls["pages"] = pages

        # Downloadable link can be generated only when cloudfront request is signed
        if (
            self.context.get("is_admin") or obj.show_download
        ) and settings.CLOUDFRONT_SIGNED_URLS_ACTIVE:
            extension = f".{obj.extension}" if obj.extension else ""
            urls["media"] = cloudfront_utils.build_signed_url(
                f"{base}{extension}?response-content-disposition="
                f"{quote_plus('attachment; filename=' + self.get_filename(obj))}",
                params,
            )

        return urls

    def get_celery_pipeline_url(self, obj):
        """Get the url for the shared live media processed with Celery."""
        urls = {}

        stamp = time_utils.to_timestamp(obj.uploaded_on)
        base = obj.get_storage_prefix()

        pages = {}
        for page_number in range(1, obj.nb_pages + 1):
            url = f"{base}/{stamp}_{page_number}.svg"
            pages[page_number] = file_storage.url(url)

        urls["pages"] = pages

        if self.context.get("is_admin") or obj.show_download:
            url = f"{base}/{stamp}.pdf"
            urls["media"] = file_storage.url(url)

        return urls


class SharedLiveMediaId3TagsSerializer(serializers.ModelSerializer):
    """Serializer to display a shared live media model in id3 Tags."""

    class Meta:  # noqa
        model = SharedLiveMedia
        fields = ("id",)
        read_only_fields = ("id",)
