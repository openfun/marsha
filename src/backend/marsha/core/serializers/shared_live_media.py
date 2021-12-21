"""Structure of SharedLiveMedia related models API responses with DRF serializers."""
from datetime import timedelta
from urllib.parse import quote_plus

from django.conf import settings
from django.utils import timezone

from botocore.signers import CloudFrontSigner
from rest_framework import serializers
from rest_framework_simplejwt.models import TokenUser

from ..models import SharedLiveMedia
from ..utils import cloudfront_utils, time_utils
from .base import TimestampField, UploadableFileWithExtensionSerializerMixin


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
        # user here is a video as it comes from the JWT
        # It is named "user" by convention in the `rest_framework_simplejwt` dependency we use.
        user = self.context["request"].user
        # Set the video field from the payload if there is one and the user is identified
        # as a proper user object through access rights
        if (
            self.initial_data.get("video")
            and user.token.get("user")
            and user.token["resource_id"] == user.token.get("user", {}).get("id")
        ):
            validated_data["video_id"] = self.initial_data.get("video")
        # If the user just has a token for a video, force the video ID on the shared live media
        if not validated_data.get("video_id") and isinstance(user, TokenUser):
            validated_data["video_id"] = user.id
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

        urls = {}

        stamp = time_utils.to_timestamp(obj.uploaded_on)
        base = (
            f"{settings.AWS_S3_URL_PROTOCOL}://{settings.CLOUDFRONT_DOMAIN}/"
            f"{obj.video.pk}/sharedlivemedia/{obj.pk}/{stamp}"
        )

        cloudfront_signer = None
        if settings.CLOUDFRONT_SIGNED_URLS_ACTIVE:
            date_less_than = timezone.now() + timedelta(
                seconds=settings.CLOUDFRONT_SIGNED_URLS_VALIDITY
            )
            cloudfront_signer = CloudFrontSigner(
                settings.CLOUDFRONT_ACCESS_KEY_ID, cloudfront_utils.rsa_signer
            )

        pages = {}
        for page_number in range(1, obj.nb_pages + 1):
            url = f"{base:s}_{page_number:d}.svg"
            if cloudfront_signer:
                url = cloudfront_signer.generate_presigned_url(
                    url, date_less_than=date_less_than
                )
            pages[page_number] = url

        urls["pages"] = pages

        # Downloadable link can be generated only when cloudfront request is signed
        if (self.context.get("is_admin") or obj.show_download) and cloudfront_signer:
            extension = f".{obj.extension}" if obj.extension else ""
            urls["media"] = cloudfront_signer.generate_presigned_url(
                f"{base}/{stamp}/{stamp}{extension}?response-content-disposition="
                f"{quote_plus('attachment; filename=' + self.get_filename(obj))}",
                date_less_than=date_less_than,
            )

        return urls
