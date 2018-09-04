"""Define the structure of our API responses with Django Rest Framework serializers."""
from datetime import timedelta
import json

from django.conf import settings
from django.utils import timezone

from botocore.signers import CloudFrontSigner
from rest_framework import serializers

from .models import Video
from .utils.aws_cloudfront import rsa_signer


class VideoSerializer(serializers.ModelSerializer):
    """Serializer to display a video model with all its resolution options."""

    class Meta:  # noqa
        model = Video
        fields = ("id", "title", "description", "urls")
        read_only_fields = ("id",)

    urls = serializers.SerializerMethodField()

    def get_urls(self, obj):
        """Urls of the video for each type of encoding and in each resolution.

        Parameters
        ----------
        obj : Type[models.Video]
            The video that we want to serialize

        Returns
        -------
        Dictionary
            A dictionary of all urls for:
                - mp4 encodings of the video in each resolution
                - jpeg thumbnails of the video in each resolution

        """
        urls = {"mp4": {}, "thumbnails": {}}

        date_less_than = timezone.now() + timedelta(
            seconds=settings.CLOUDFRONT_SIGNED_URLS_VALIDITY
        )
        for resolution in settings.VIDEO_RESOLUTIONS:
            # MP4
            mp4_url = "{:s}/{!s}/mp4/{!s}_{:d}.mp4".format(
                settings.CLOUDFRONT_URL, obj.playlist.id, obj.id, resolution
            )

            # Thumbnails
            thumbnail_url = "{:s}/{!s}/thumbnails/{!s}_{:d}.0000000.jpg".format(
                settings.CLOUDFRONT_URL, obj.playlist.id, obj.id, resolution
            )

            # Sign urls if the functionality is activated
            if settings.CLOUDFRONT_SIGNED_URLS_ACTIVE:
                cloudfront_signer = CloudFrontSigner(
                    settings.CLOUDFRONT_ACCESS_KEY_ID, rsa_signer
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
