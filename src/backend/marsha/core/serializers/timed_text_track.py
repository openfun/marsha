"""Structure of TimedTextTrack related models API responses with DRF serializers."""

from urllib.parse import quote_plus

from django.conf import settings
from django.utils.text import slugify

from rest_framework import serializers

from marsha.core.defaults import CELERY_PIPELINE
from marsha.core.models import TimedTextTrack
from marsha.core.serializers.base import TimestampField, get_video_cloudfront_url_params
from marsha.core.storage.storage_class import file_storage
from marsha.core.utils import cloudfront_utils, time_utils


class TimedTextTrackSerializer(serializers.ModelSerializer):
    """Serializer to display a timed text track model."""

    class Meta:  # noqa
        model = TimedTextTrack
        fields = (
            "active_stamp",
            "id",
            "is_ready_to_show",
            "mode",
            "language",
            "upload_state",
            "url",
            "source_url",
            "video",
        )
        read_only_fields = (
            "id",
            "active_stamp",
            "is_ready_to_show",
            "upload_state",
            "url",
            "video",
        )

    active_stamp = TimestampField(
        source="uploaded_on", required=False, allow_null=True, read_only=True
    )
    url = serializers.SerializerMethodField()
    source_url = serializers.SerializerMethodField()
    # Make sure video UUID is converted to a string during serialization
    video = serializers.PrimaryKeyRelatedField(
        read_only=True, pk_field=serializers.CharField()
    )
    is_ready_to_show = serializers.BooleanField(read_only=True)

    def to_internal_value(self, data):
        """Validate if the size is coherent with django settings."""
        max_file_size = settings.SUBTITLE_SOURCE_MAX_SIZE
        if "size" in data and int(data["size"]) > max_file_size:
            raise serializers.ValidationError(
                {"size": [f"File too large, max size allowed is {max_file_size} Bytes"]}
            )
        return super().to_internal_value(data)

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

        if "size" not in self.initial_data:
            raise serializers.ValidationError({"size": ["File size is required"]})

        return super().create(validated_data)

    def _sign_url(self, url, video_id):
        """Generate a presigned cloudfront url.

        Parameters
        ----------
        url: string
            The url to sign

        Returns:
        string
            The signed url

        """
        params = get_video_cloudfront_url_params(video_id)
        return cloudfront_utils.build_signed_url(url, params)

    def _generate_url(self, obj, object_path, extension=None, content_disposition=None):
        """Generate an url to fetch a timed text track file depending on argument passed.

        Parameters:
        obj : Type[models.TimedTextTrack]
            The timed text track that we want to serialize

        object_patch: string
            The path in the path the timed text track is stored

        extension: string or None
            If the timed text track need an extension in the url, add it to the end

        content_disposition: string or None
            Add a response-content-disposition query string to url if present
        """
        base = f"{settings.AWS_S3_URL_PROTOCOL}://{settings.CLOUDFRONT_DOMAIN}/{obj.video_id}"
        stamp = time_utils.to_timestamp(obj.uploaded_on)
        mode = f"_{obj.mode}" if obj.mode else ""
        url = f"{base}/{object_path}/{stamp}_{obj.language:s}{mode:s}"
        if extension:
            url = f"{url}.{extension}"

        if content_disposition:
            url = f"{url}?response-content-disposition={content_disposition}"
        return url

    def get_source_url(self, obj):
        """Source url of the timed text track, signed with a CloudFront key if activated.

        This is the url of the uploaded file without any modification.

        Parameters
        ----------
        obj : Type[models.TimedTextTrack]
            The timed text track that we want to serialize

        Returns
        -------
        string or None
            The url for the timed text track uploaded without modification.
            None if the timed text track is still not uploaded to S3 with success.

        """
        if not obj.uploaded_on or not obj.extension:
            return None

        stamp = time_utils.to_timestamp(obj.uploaded_on)

        if obj.process_pipeline == CELERY_PIPELINE:
            base = obj.get_storage_prefix()

            return file_storage.url(f"{base}/source.{obj.extension}")

        # Default AWS fallback
        filename = f"{slugify(obj.video.playlist.title)}_{stamp}.{obj.extension}"
        url = self._generate_url(
            obj,
            "timedtext/source",
            content_disposition=quote_plus(f"attachment; filename={filename}"),
        )

        # Sign the url only if the functionality is activated
        if settings.CLOUDFRONT_SIGNED_URLS_ACTIVE:
            url = self._sign_url(url, obj.video_id)
        return url

    def get_url(self, obj):
        """Url of the timed text track, signed with a CloudFront key if activated.

        Parameters
        ----------
        obj : Type[models.TimedTextTrack]
            The timed text track that we want to serialize

        Returns
        -------
        string or None
            The url for the timed text track converted to vtt.
            None if the timed text track is still not uploaded to S3 with success.

        """
        if not obj.uploaded_on:
            return None

        if obj.process_pipeline == CELERY_PIPELINE:
            stamp = time_utils.to_timestamp(obj.uploaded_on)
            base = obj.get_storage_prefix()

            return file_storage.url(f"{base}/{stamp}.vtt")

        # Default AWS fallback
        url = self._generate_url(obj, "timedtext", extension="vtt")

        # Sign the url only if the functionality is activated
        if settings.CLOUDFRONT_SIGNED_URLS_ACTIVE:
            url = self._sign_url(url, obj.video_id)
        return url
