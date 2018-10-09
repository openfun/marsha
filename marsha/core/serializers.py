"""Define the structure of our API responses with Django Rest Framework serializers."""
from datetime import timedelta
import re

from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone

from botocore.signers import CloudFrontSigner
from rest_framework import serializers
from rest_framework_simplejwt.models import TokenUser

from .models import ERROR, READY, STATE_CHOICES, SubtitleTrack, Video
from .utils import cloudfront_utils, time_utils


UUID_REGEX = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
# This regex matches keys in AWS for videos or subtitle tracks
KEY_PATTERN = (
    "^(?P<resource_id>{uuid:s})/(?P<model_name>video|subtitletrack)/(?P<object_id>{uuid:s})/"
    "(?P<stamp>[0-9]{{10}})(_[a-z]{{2}}(_cc)?)?$".format(uuid=UUID_REGEX)
)
KEY_REGEX = re.compile(KEY_PATTERN)


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
        try:
            return super(TimestampField, self).to_internal_value(
                time_utils.to_datetime(value)
            )
        except OverflowError as error:
            raise ValidationError(error)


class SubtitleTrackSerializer(serializers.ModelSerializer):
    """Serializer to display a subtitle track model."""

    class Meta:  # noqa
        model = SubtitleTrack
        fields = (
            "active_stamp",
            "id",
            "has_closed_captioning",
            "language",
            "state",
            "url",
            "video",
        )
        read_only_fields = ("id", "url", "video")

    active_stamp = TimestampField(source="uploaded_on", required=False, allow_null=True)
    url = serializers.SerializerMethodField()

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
        user = self.context["request"].user
        if not validated_data.get("video_id") and isinstance(user, TokenUser):
            validated_data["video_id"] = user.id
        return super().create(validated_data)

    def get_url(self, obj):
        """Url of the subtitle track, signed with a CloudFront key if activated.

        Parameters
        ----------
        obj : Type[models.SubtitleTrack]
            The subtitle track that we want to serialize

        Returns
        -------
        string or None
            The url for the subtitle track converted to vtt.
            None if the subtitle track is still not uploaded to S3 with success.

        """
        if obj.uploaded_on and obj.state == READY:

            base = "{cloudfront:s}/{resource!s}".format(
                cloudfront=settings.CLOUDFRONT_URL, resource=obj.video.resource_id
            )
            url = "{base:s}/subtitles/{stamp:s}_{language:s}{cc:s}.vtt".format(
                base=base,
                stamp=time_utils.to_timestamp(obj.uploaded_on),
                language=obj.language,
                cc="_cc" if obj.has_closed_captioning else "",
            )

            # Sign the url only if the functionality is activated
            if settings.CLOUDFRONT_SIGNED_URLS_ACTIVE:
                date_less_than = timezone.now() + timedelta(
                    seconds=settings.CLOUDFRONT_SIGNED_URLS_VALIDITY
                )
                cloudfront_signer = CloudFrontSigner(
                    settings.CLOUDFRONT_ACCESS_KEY_ID, cloudfront_utils.rsa_signer
                )
                url = cloudfront_signer.generate_presigned_url(
                    url, date_less_than=date_less_than
                )
            return url
        return None


class VideoSerializer(serializers.ModelSerializer):
    """Serializer to display a video model with all its resolution options."""

    class Meta:  # noqa
        model = Video
        fields = (
            "id",
            "title",
            "description",
            "active_stamp",
            "state",
            "subtitle_tracks",
            "urls",
        )
        read_only_fields = ("id", "active_stamp", "state", "urls")

    active_stamp = TimestampField(
        source="uploaded_on", required=False, allow_null=True, read_only=True
    )
    subtitle_tracks = SubtitleTrackSerializer(
        source="subtitletracks", many=True, read_only=True
    )
    urls = serializers.SerializerMethodField()

    def get_urls(self, obj):
        """Urls of the video for each type of encoding.

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
                - manifest of the DASH encodings of the video
                - manifest of the HLS encodings of the video
            None if the video is still not uploaded to S3 with success

        """
        if obj.uploaded_on is None or obj.state != READY:
            return None

        urls = {"mp4": {}, "thumbnails": {}}
        base = "{cloudfront:s}/{resource!s}".format(
            cloudfront=settings.CLOUDFRONT_URL, resource=obj.resource_id
        )
        stamp = time_utils.to_timestamp(obj.uploaded_on)

        date_less_than = timezone.now() + timedelta(
            seconds=settings.CLOUDFRONT_SIGNED_URLS_VALIDITY
        )
        for resolution in settings.VIDEO_RESOLUTIONS:
            # MP4
            mp4_url = "{base:s}/mp4/{stamp:s}_{resolution:d}.mp4".format(
                base=base,
                stamp=time_utils.to_timestamp(obj.uploaded_on),
                resolution=resolution,
            )

            # Thumbnails
            urls["thumbnails"][
                resolution
            ] = "{base:s}/thumbnails/{stamp:s}_{resolution:d}.0000000.jpg".format(
                base=base, stamp=stamp, resolution=resolution
            )

            # Sign the urls of mp4 videos only if the functionality is activated
            if settings.CLOUDFRONT_SIGNED_URLS_ACTIVE:
                cloudfront_signer = CloudFrontSigner(
                    settings.CLOUDFRONT_ACCESS_KEY_ID, cloudfront_utils.rsa_signer
                )
                mp4_url = cloudfront_signer.generate_presigned_url(
                    mp4_url, date_less_than=date_less_than
                )

            urls["mp4"][resolution] = mp4_url

        # Adaptive Bit Rate manifests
        urls["manifests"] = {
            "dash": "{base:s}/cmaf/{stamp:s}.mpd".format(base=base, stamp=stamp),
            "hls": "{base:s}/cmaf/{stamp:s}.m3u8".format(base=base, stamp=stamp),
        }

        # Previews
        urls["previews"] = "{base:s}/previews/{stamp:s}_100.jpg".format(
            base=base, stamp=stamp
        )

        return urls


class UploadConfirmSerializer(serializers.Serializer):
    """A serializer to validate data submitted on the UploadConfirm API endpoint."""

    key = serializers.RegexField(KEY_REGEX)
    state = serializers.ChoiceField(
        tuple(c for c in STATE_CHOICES if c[0] in (READY, ERROR))
    )
    signature = serializers.CharField(max_length=200)

    def get_key_elements(self):
        """Use a regex to parse elements from the key."""
        elements = KEY_REGEX.match(self.validated_data["key"]).groupdict()
        elements["uploaded_on"] = time_utils.to_datetime(elements["stamp"])
        return elements
