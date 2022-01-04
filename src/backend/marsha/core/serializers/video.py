"""Structure of Video related models API responses with Django Rest Framework serializers."""
from datetime import timedelta
from urllib.parse import quote_plus

from django.conf import settings
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify

from botocore.signers import CloudFrontSigner
from rest_framework import serializers

from ..defaults import IDLE, JITSI, LIVE_CHOICES, LIVE_TYPE_CHOICES, RUNNING, STOPPED
from ..models import Thumbnail, Video
from ..utils import cloudfront_utils, time_utils, xmpp_utils
from ..utils.url_utils import build_absolute_uri_behind_proxy
from .base import TimestampField
from .playlist import PlaylistLiteSerializer
from .shared_live_media import SharedLiveMediaSerializer
from .thumbnail import ThumbnailSerializer
from .timed_text_track import TimedTextTrackSerializer


class UpdateLiveStateSerializer(serializers.Serializer):
    """A serializer to validate data submitted on the UpdateLiveState API endpoint."""

    state = serializers.ChoiceField(
        tuple(c for c in LIVE_CHOICES if c[0] in (RUNNING, STOPPED))
    )
    logGroupName = serializers.CharField()
    requestId = serializers.CharField()


class InitLiveStateSerializer(serializers.Serializer):
    """A serializer to validate data submitted on the initiate-live API endpoint."""

    type = serializers.ChoiceField(LIVE_TYPE_CHOICES)


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
        if obj.live_info is not None:
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

        base = f"{settings.AWS_S3_URL_PROTOCOL}://{settings.CLOUDFRONT_DOMAIN}/{obj.pk}"
        stamp = time_utils.to_timestamp(obj.uploaded_on)

        date_less_than = timezone.now() + timedelta(
            seconds=settings.CLOUDFRONT_SIGNED_URLS_VALIDITY
        )
        filename = f"{slugify(obj.playlist.title)}_{stamp}.mp4"
        content_disposition = quote_plus(f"attachment; filename={filename}")
        for resolution in obj.resolutions:
            # MP4
            mp4_url = (
                f"{base}/mp4/{stamp}_{resolution}.mp4"
                f"?response-content-disposition={content_disposition}"
            )

            # Thumbnails
            urls["thumbnails"][resolution] = thumbnail_urls.get(
                resolution,
                f"{base}/thumbnails/{stamp}_{resolution}.0000000.jpg",
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
            "hls": f"{base}/cmaf/{stamp}.m3u8",
        }

        # Previews
        urls["previews"] = f"{base}/previews/{stamp}_100.jpg"

        return urls


class VideoSerializer(VideoBaseSerializer):
    """Serializer to display a video model with all its resolution options."""

    class Meta:  # noqa
        model = Video
        fields = (
            "active_shared_live_media",
            "active_shared_live_media_page",
            "active_stamp",
            "allow_recording",
            "description",
            "estimated_duration",
            "has_chat",
            "has_live_media",
            "id",
            "is_public",
            "is_ready_to_show",
            "is_scheduled",
            "timed_text_tracks",
            "thumbnail",
            "title",
            "upload_state",
            "urls",
            "show_download",
            "should_use_subtitle_as_transcript",
            "starting_at",
            "has_transcript",
            "playlist",
            "live_info",
            "live_state",
            "live_type",
            "xmpp",
            "shared_live_medias",
        )
        read_only_fields = (
            "active_shared_live_media",
            "active_shared_live_media_page",
            "id",
            "active_stamp",
            "is_ready_to_show",
            "is_scheduled",
            "urls",
            "has_transcript",
            "live_info",
            "live_state",
        )

    active_shared_live_media = SharedLiveMediaSerializer(read_only=True)
    active_stamp = TimestampField(
        source="uploaded_on", required=False, allow_null=True, read_only=True
    )
    timed_text_tracks = TimedTextTrackSerializer(
        source="timedtexttracks", many=True, read_only=True
    )
    shared_live_medias = SharedLiveMediaSerializer(many=True, read_only=True)
    playlist = PlaylistLiteSerializer(read_only=True)
    has_transcript = serializers.SerializerMethodField()
    live_info = serializers.SerializerMethodField()
    xmpp = serializers.SerializerMethodField()

    def validate_starting_at(self, value):
        """Add extra controls for starting_at field."""
        # Field starting_at has a new value
        if value != self.instance.starting_at:
            # New value is past, it can't be updated
            if value is not None and value < timezone.now():
                raise serializers.ValidationError(
                    f"{value} is not a valid date, date should be planned after!"
                )
            # Check live_state is in IDLE state as expected when scheduling a live
            if self.instance.live_state != IDLE:
                raise serializers.ValidationError(
                    "Field starting_at can't be changed, video live is "
                    "not in default mode."
                )
            # Initial value is already past, it can't be updated anymore
            if (
                self.instance.starting_at is not None
                and self.instance.starting_at < timezone.now()
            ):
                raise serializers.ValidationError(
                    f"Field starting_at {self.instance.starting_at} is already "
                    "past and can't be updated!"
                )

        return value

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
        user_id = self.context.get("user", {}).get("id") or self.context.get(
            "session_id"
        )
        if settings.LIVE_CHAT_ENABLED and user_id and obj.live_state is not None:
            token = xmpp_utils.generate_jwt(
                str(obj.id),
                user_id,
                "owner" if self.context.get("is_admin") else "member",
                timezone.now() + timedelta(days=1),
            )

            return {
                "bosh_url": xmpp_utils.add_jwt_token_to_url(
                    settings.XMPP_BOSH_URL, token
                ),
                "websocket_url": xmpp_utils.add_jwt_token_to_url(
                    settings.XMPP_WEBSOCKET_URL, token
                ),
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
            The data are filtered to only return RTMP endpoints and jitsi configuration if needed.
            All other data are sensitive, used only by the backend and must never be exposed.
        """
        if obj.live_state is None:
            return {}

        live_info = {}

        if obj.live_info is not None and obj.live_info.get("paused_at"):
            live_info.update({"paused_at": obj.live_info["paused_at"]})

        if not self.context.get("is_admin"):
            return live_info

        if obj.live_info is not None:
            live_info.update(
                {
                    "medialive": {
                        "input": {
                            "endpoints": obj.live_info["medialive"]["input"][
                                "endpoints"
                            ],
                        }
                    },
                }
            )

        if obj.live_type == JITSI:
            live_info.update(
                {
                    "jitsi": {
                        "external_api_url": settings.JITSI_EXTERNAL_API_URL,
                        "domain": settings.JITSI_DOMAIN,
                        "config_overwrite": settings.JITSI_CONFIG_OVERWRITE,
                        "interface_config_overwrite": settings.JITSI_INTERFACE_CONFIG_OVERWRITE,
                    }
                }
            )

        return live_info

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
        return build_absolute_uri_behind_proxy(
            self.context["request"],
            reverse("video_lti_view", args=[obj.id]),
        )
