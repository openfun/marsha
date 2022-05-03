"""Structure of TimedTextTrack related models API responses with DRF serializers."""
from datetime import timedelta
from urllib.parse import quote_plus

from django.conf import settings
from django.utils import timezone
from django.utils.text import slugify

from botocore.signers import CloudFrontSigner
from rest_framework import serializers
from rest_framework_simplejwt.models import TokenUser

from ..models import TimedTextTrack
from ..utils import cloudfront_utils, time_utils
from .base import TimestampField


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
        # If the user just has a token for a video, force the video ID on the timed text track
        if not validated_data.get("video_id") and isinstance(user, TokenUser):
            validated_data["video_id"] = user.id
        return super().create(validated_data)

    def _sign_url(self, url):
        """Generate a presigned cloudfront url.

        Parameters
        ----------
        url: string
            The url to sign

        Returns:
        string
            The signed url

        """
        date_less_than = timezone.now() + timedelta(
            seconds=settings.CLOUDFRONT_SIGNED_URLS_VALIDITY
        )
        cloudfront_signer = CloudFrontSigner(
            settings.CLOUDFRONT_SIGNED_PUBLIC_KEY_ID, cloudfront_utils.rsa_signer
        )
        return cloudfront_signer.generate_presigned_url(
            url, date_less_than=date_less_than
        )

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
        base = f"{settings.AWS_S3_URL_PROTOCOL}://{settings.CLOUDFRONT_DOMAIN}/{obj.video.pk}"
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
        if obj.uploaded_on and obj.extension:
            stamp = time_utils.to_timestamp(obj.uploaded_on)
            filename = f"{slugify(obj.video.playlist.title)}_{stamp}.{obj.extension}"
            url = self._generate_url(
                obj,
                "timedtext/source",
                content_disposition=quote_plus(f"attachment; filename={filename}"),
            )

            # Sign the url only if the functionality is activated
            if settings.CLOUDFRONT_SIGNED_URLS_ACTIVE:
                url = self._sign_url(url)
            return url
        return None

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
        if obj.uploaded_on:

            url = self._generate_url(obj, "timedtext", extension="vtt")

            # Sign the url only if the functionality is activated
            if settings.CLOUDFRONT_SIGNED_URLS_ACTIVE:
                url = self._sign_url(url)
            return url
        return None
