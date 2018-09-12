"""Define the structure of our API responses with Django Rest Framework serializers."""
from datetime import timedelta
import json

from django.conf import settings
from django.utils import timezone

from botocore.signers import CloudFrontSigner
from rest_framework import serializers

from .models import Video
from .utils import cloudfront_utils, time_utils


class TimestampField(serializers.DateTimeField):
    """A serializer field to serialize/deserialize a datetime to a Unix timestamp."""

    def to_representation(self, value):
        """Convert a datetime value to a Unix timestamp.

        Parameters
        ----------
        value: Type[datetime.datetime]
            The datetime value to convert

        Returns
        -------
        integer or `None`
            Unix timestamp for the datetime value or `None`

        """
        return time_utils.to_timestamp(value) if value else None

    def to_internal_value(self, value):
        """Convert a Unix timestamp value to a timezone aware datetime.

        Parameters
        ----------
        value: Type[string|integer]
            The Unix timestamp to convert

        Returns
        -------
        datetime.datetime or `None`
            datetime instance corresponding to the Unix timestamp or `None`

        Raises
        ------
        ValidationError
            when the value passed in argument is not a valid timestamp

        """
        return super(TimestampField, self).to_internal_value(
            time_utils.to_datetime(value)
        )


class VideoSerializer(serializers.ModelSerializer):
    """Serializer to display a video model with all its resolution options."""

    class Meta:  # noqa
        model = Video
        fields = ("id", "title", "description", "active_stamp", "urls")
        read_only_fields = ("id",)

    active_stamp = TimestampField(source="uploaded_on", required=False)
    urls = serializers.SerializerMethodField()

    def get_urls(self, obj):
        """Urls of the video for each type of encoding and in each resolution.

        Parameters
        ----------
        obj : Type[models.Video]
            The video that we want to serialize

        Returns
        -------
        Dictionary or None
            A dictionary of all urls for:
                - mp4 encodings of the video in each resolution
                - jpeg thumbnails of the video in each resolution
            None if the video is still not uploaded to S3 with success

        """
        if obj.uploaded_on is None:
            return None

        urls = {"mp4": {}, "thumbnails": {}}
        base = "{cloudfront:s}/{playlist!s}/{video!s}".format(
            cloudfront=settings.CLOUDFRONT_URL, playlist=obj.playlist.id, video=obj.id
        )

        date_less_than = timezone.now() + timedelta(
            seconds=settings.CLOUDFRONT_SIGNED_URLS_VALIDITY
        )
        for resolution in settings.VIDEO_RESOLUTIONS:
            # MP4
            mp4_url = "{base:s}/videos/{stamp:s}_{resolution:d}.mp4".format(
                base=base, stamp=obj.active_stamp, resolution=resolution
            )

            # Thumbnails
            thumbnail_url = "{base:s}/thumbnails/{stamp:s}_{resolution:d}.0000000.jpg".format(
                base=base, stamp=obj.active_stamp, resolution=resolution
            )

            # Sign urls if the functionality is activated
            if settings.CLOUDFRONT_SIGNED_URLS_ACTIVE:
                cloudfront_signer = CloudFrontSigner(
                    settings.CLOUDFRONT_ACCESS_KEY_ID, cloudfront_utils.rsa_signer
                )
                mp4_url = cloudfront_signer.generate_presigned_url(
                    mp4_url, date_less_than=date_less_than
                )
                thumbnail_url = cloudfront_signer.generate_presigned_url(
                    thumbnail_url, date_less_than=date_less_than
                )

            urls["mp4"][resolution] = mp4_url
            urls["thumbnails"][resolution] = thumbnail_url

        return json.dumps(urls)
