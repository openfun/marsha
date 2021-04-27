"""Structure of Video related models API responses with Django Rest Framework serializers."""
from datetime import timedelta
from urllib.parse import parse_qs, quote_plus, urlencode, urlparse, urlunparse

from django.conf import settings
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify

from botocore.signers import CloudFrontSigner
from rest_framework import serializers
from rest_framework_simplejwt.models import TokenUser

from ..defaults import IDLE, LIVE_CHOICES, RUNNING, STOPPED
from ..models import Thumbnail, TimedTextTrack, Video
from ..models.account import ADMINISTRATOR, INSTRUCTOR, LTI_ROLES
from ..utils import cloudfront_utils, time_utils, xmpp_utils
from .base import TimestampField
from .playlist import PlaylistLiteSerializer


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
            settings.CLOUDFRONT_ACCESS_KEY_ID, cloudfront_utils.rsa_signer
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
        base = "{protocol:s}://{cloudfront:s}/{video!s}".format(
            protocol=settings.AWS_S3_URL_PROTOCOL,
            cloudfront=settings.CLOUDFRONT_DOMAIN,
            video=obj.video.pk,
        )
        stamp = time_utils.to_timestamp(obj.uploaded_on)
        url = "{base:s}/{object_path}/{stamp:s}_{language:s}{mode:s}".format(
            base=base,
            stamp=stamp,
            language=obj.language,
            mode="_{:s}".format(obj.mode) if obj.mode else "",
            object_path=object_path,
        )
        if extension:
            url = "{url:s}.{extension:s}".format(url=url, extension=extension)

        if content_disposition:
            url = "{url:s}?response-content-disposition={content_disposition:s}".format(
                url=url, content_disposition=content_disposition
            )
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
            filename = "{playlist_title:s}_{stamp:s}.{extension:s}".format(
                playlist_title=slugify(obj.video.playlist.title),
                stamp=stamp,
                extension=obj.extension,
            )
            url = self._generate_url(
                obj,
                "timedtext/source",
                content_disposition=quote_plus("attachment; filename=" + filename),
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


class ThumbnailSerializer(serializers.ModelSerializer):
    """Serializer to display a thumbnail."""

    class Meta:  # noqa
        model = Thumbnail
        fields = (
            "active_stamp",
            "id",
            "is_ready_to_show",
            "upload_state",
            "urls",
            "video",
        )
        read_only_fields = (
            "active_stamp",
            "id",
            "is_ready_to_show",
            "upload_state",
            "urls",
            "video",
        )

    active_stamp = TimestampField(
        source="uploaded_on", required=False, allow_null=True, read_only=True
    )
    video = serializers.PrimaryKeyRelatedField(
        read_only=True, pk_field=serializers.CharField()
    )
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
        if not validated_data.get("video_id") and isinstance(user, TokenUser):
            validated_data["video_id"] = user.id
        return super().create(validated_data)

    def get_urls(self, obj):
        """Urls of the thumbnail.

        Parameters
        ----------
        obj : Type[models.Thumbnail]
            The thumbnail that we want to serialize

        Returns
        -------
        Dict or None
            The urls for the thumbnail.
            None if the thumbnail is still not uploaded to S3 with success.

        """
        if obj.uploaded_on:
            base = "{protocol:s}://{cloudfront:s}/{video!s}".format(
                protocol=settings.AWS_S3_URL_PROTOCOL,
                cloudfront=settings.CLOUDFRONT_DOMAIN,
                video=obj.video.pk,
            )
            urls = {}
            for resolution in settings.VIDEO_RESOLUTIONS:
                urls[
                    resolution
                ] = "{base:s}/thumbnails/{stamp:s}_{resolution:d}.jpg".format(
                    base=base,
                    stamp=time_utils.to_timestamp(obj.uploaded_on),
                    resolution=resolution,
                )
            return urls
        return None


class UpdateLiveStateSerializer(serializers.Serializer):
    """A serializer to validate data submitted on the UpdateLiveState API endpoint."""

    state = serializers.ChoiceField(
        tuple(c for c in LIVE_CHOICES if c[0] in (IDLE, RUNNING, STOPPED))
    )
    logGroupName = serializers.CharField()


class VideoBaseSerializer(serializers.ModelSerializer):
    """Base Serializer to factorize common Video attributes."""

    class Meta:  # noqa
        model = Video
        fields = (
            "urls",
            "thumbnail",
            "is_ready_to_show",
        )
        read_only_fields = (
            "urls",
            "is_ready_to_show",
        )

    urls = serializers.SerializerMethodField()
    thumbnail = ThumbnailSerializer(read_only=True, allow_null=True)
    is_ready_to_show = serializers.BooleanField(read_only=True)

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
                - manifest of the HLS encodings of the video
            For a video in live mode only the HLS url is added
            None if the video is still not uploaded to S3 with success

        """
        if obj.live_state is not None:
            # Adaptive Bit Rate manifests
            return {
                "manifests": {
                    "hls": obj.live_info["mediapackage"]["endpoints"]["hls"]["url"],
                },
                "mp4": {},
                "thumbnails": {},
            }

        if obj.uploaded_on is None:
            return None

        thumbnail_urls = {}
        try:
            thumbnail = obj.thumbnail
        except Thumbnail.DoesNotExist:
            pass
        else:
            if thumbnail.uploaded_on is not None:
                thumbnail_serialized = ThumbnailSerializer(thumbnail)
                thumbnail_urls.update(thumbnail_serialized.data.get("urls"))

        urls = {"mp4": {}, "thumbnails": {}}

        base = "{protocol:s}://{cloudfront:s}/{pk!s}".format(
            protocol=settings.AWS_S3_URL_PROTOCOL,
            cloudfront=settings.CLOUDFRONT_DOMAIN,
            pk=obj.pk,
        )
        stamp = time_utils.to_timestamp(obj.uploaded_on)

        date_less_than = timezone.now() + timedelta(
            seconds=settings.CLOUDFRONT_SIGNED_URLS_VALIDITY
        )
        filename = "{playlist_title:s}_{stamp:s}.mp4".format(
            playlist_title=slugify(obj.playlist.title), stamp=stamp
        )
        for resolution in obj.resolutions:
            # MP4
            mp4_url = (
                "{base:s}/mp4/{stamp:s}_{resolution:d}.mp4"
                "?response-content-disposition={content_disposition:s}"
            ).format(
                base=base,
                stamp=stamp,
                resolution=resolution,
                content_disposition=quote_plus("attachment; filename=" + filename),
            )

            # Thumbnails
            urls["thumbnails"][resolution] = thumbnail_urls.get(
                resolution,
                "{base:s}/thumbnails/{stamp:s}_{resolution:d}.0000000.jpg".format(
                    base=base, stamp=stamp, resolution=resolution
                ),
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
            "hls": "{base:s}/cmaf/{stamp:s}.m3u8".format(base=base, stamp=stamp),
        }

        # Previews
        urls["previews"] = "{base:s}/previews/{stamp:s}_100.jpg".format(
            base=base, stamp=stamp
        )

        return urls


class VideoSerializer(VideoBaseSerializer):
    """Serializer to display a video model with all its resolution options."""

    class Meta:  # noqa
        model = Video
        fields = (
            "active_stamp",
            "description",
            "id",
            "is_ready_to_show",
            "timed_text_tracks",
            "thumbnail",
            "title",
            "upload_state",
            "urls",
            "show_download",
            "should_use_subtitle_as_transcript",
            "has_transcript",
            "playlist",
            "live_info",
            "live_state",
            "xmpp",
        )
        read_only_fields = (
            "id",
            "active_stamp",
            "is_ready_to_show",
            "urls",
            "has_transcript",
            "live_info",
            "live_state",
        )

    active_stamp = TimestampField(
        source="uploaded_on", required=False, allow_null=True, read_only=True
    )
    timed_text_tracks = TimedTextTrackSerializer(
        source="timedtexttracks", many=True, read_only=True
    )
    playlist = PlaylistLiteSerializer(read_only=True)
    has_transcript = serializers.SerializerMethodField()
    live_info = serializers.SerializerMethodField()
    xmpp = serializers.SerializerMethodField()

    def get_xmpp(self, obj):
        """Chat info.

        Parameters
        ----------
        obj : Type[models.Video]
            The video that we want to serialize

        Returns
        -------
        Dictionnary
            A dictionary containing all info needed to manage a connection to a xmpp server.
        """
        if (
            settings.LIVE_CHAT_ENABLED
            and obj.live_state is not None
            and self.context.get("user_id", False)
        ):
            roles = self.context.get("roles", [])
            is_admin = bool(LTI_ROLES[ADMINISTRATOR] & set(roles))
            is_instructor = bool(LTI_ROLES[INSTRUCTOR] & set(roles))
            token = xmpp_utils.generate_jwt(
                str(obj.id),
                self.context["user_id"],
                "owner" if is_admin or is_instructor else "member",
                timezone.now() + timedelta(days=1),
            )
            bosh_url = list(urlparse(settings.XMPP_BOSH_URL))
            bosh_query_string = dict(parse_qs(bosh_url[4]))
            bosh_query_string.update({"token": token})
            bosh_url[4] = urlencode(bosh_query_string)

            return {
                "bosh_url": urlunparse(bosh_url),
                "conference_url": f"{obj.id}@{settings.XMPP_CONFERENCE_DOMAIN}",
                "jid": settings.XMPP_DOMAIN,
            }

        return None

    def get_live_info(self, obj):
        """Live streaming informations.

        Parameters
        ----------
        obj : Type[models.Video]
            The video that we want to serialize

        Returns
        -------
        Dictionnary
            A dictionnary containing all info needed to manage a live stream for an admin.
            For other users, an empty dictionnary is returned.
        """
        can_return_live_info = self.context.get("can_return_live_info", False)

        if obj.live_state is None or can_return_live_info is False:
            return {}

        return {
            "medialive": {
                "input": {
                    "endpoints": obj.live_info["medialive"]["input"]["endpoints"],
                }
            }
        }

    def get_has_transcript(self, obj):
        """Compute if should_use_subtitle_as_transcript behavior is disabled.

        Parameters
        ----------
        obj : Type[models.Video]
            The video that we want to serialize

        Returns
        -------
        Boolean
            If there is at least one transcript ready to be shown the method will return True.
            Returns False otherwise.
        """
        return obj.timedtexttracks.filter(mode="ts", uploaded_on__isnull=False).exists()


class VideoSelectLTISerializer(VideoBaseSerializer):
    """A serializer to display a Video resource for LTI select content request."""

    class Meta:  # noqa
        model = Video
        fields = (
            "id",
            "is_ready_to_show",
            "thumbnail",
            "title",
            "upload_state",
            "urls",
            "lti_url",
        )
        read_only_fields = (
            "id",
            "is_ready_to_show",
            "thumbnail",
            "title",
            "upload_state",
            "urls",
            "lti_url",
        )

    lti_url = serializers.SerializerMethodField()

    def get_lti_url(self, obj):
        """LTI Url of the Video.

        Parameters
        ----------
        obj : Type[models.Video]
            The document that we want to serialize

        Returns
        -------
        String
            the LTI url to be used by LTI consumers

        """
        return self.context["request"].build_absolute_uri(
            reverse("video_lti_view", args=[obj.id])
        )
