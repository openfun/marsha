"""Structure of Video related models API responses with Django Rest Framework serializers."""
from datetime import timedelta
from urllib.parse import quote_plus

from django.conf import settings
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify

from botocore.signers import CloudFrontSigner
from rest_framework import serializers
from rest_framework_simplejwt.models import TokenUser

from ..defaults import IDLE, JITSI, LIVE_CHOICES, LIVE_TYPE_CHOICES, RUNNING, STOPPED
from ..models import (
    ConsumerSite,
    LivePairing,
    LiveRegistration,
    SharedLiveMedia,
    Thumbnail,
    TimedTextTrack,
    Video,
)
from ..utils import cloudfront_utils, time_utils, xmpp_utils
from ..utils.url_utils import build_absolute_uri_behind_proxy
from .base import TimestampField, UploadableFileWithExtensionSerializerMixin
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
            base = f"{settings.AWS_S3_URL_PROTOCOL}://{settings.CLOUDFRONT_DOMAIN}/{obj.video.pk}"
            urls = {}
            stamp = time_utils.to_timestamp(obj.uploaded_on)
            for resolution in settings.VIDEO_RESOLUTIONS:
                urls[resolution] = f"{base}/thumbnails/{stamp}_{resolution}.jpg"
            return urls
        return None


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


class LivePairingSerializer(serializers.ModelSerializer):
    """Serializer for LivePairing model."""

    class Meta:  # noqa
        model = LivePairing
        fields = ("secret", "expires_in")
        read_only_fields = ("secret", "expires_in")

    expires_in = serializers.SerializerMethodField()

    # pylint: disable=unused-argument
    def get_expires_in(self, obj):
        """Returns LivePairing expiration setting."""
        return settings.LIVE_PAIRING_EXPIRATION_SECONDS


class PairingChallengeSerializer(serializers.Serializer):
    """A serializer to validate data submitted on the PairingChallenge API endpoint."""

    box_id = serializers.UUIDField()
    secret = serializers.CharField(min_length=6, max_length=6)


class LiveRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for liveRegistration model."""

    class Meta:  # noqa
        model = LiveRegistration
        fields = (
            "anonymous_id",
            "consumer_site",
            "display_name",
            "email",
            "id",
            "is_registered",
            "lti_user_id",
            "lti_id",
            "should_send_reminders",
            "username",
            "video",
        )
        read_only_fields = (
            "consumer_site",
            "display_name",
            "id",
            "is_registered",
            "lti_user_id",
            "lti_id",
            "username",
            "video",
        )

    # Make sure video UUID is converted to a string during serialization
    video = serializers.PrimaryKeyRelatedField(
        read_only=True, pk_field=serializers.CharField()
    )

    def validate(self, attrs):
        """Control or set data with token informations.

        Force the video field to the video of the JWT Token if any.
        Check email, if present in the token, is equal to the one in the request.
        Set lti informations if they are present in the token. Control integrity
        errors and set specific messages.

        Parameters
        ----------
        data : dictionary
            Dictionary of the deserialized values of each field after validation.

        Returns
        -------
        dictionary
            The "data" dictionary is returned after modification.

        """
        # User here is a video as it comes from the JWT
        # It is named "user" by convention in the `rest_framework_simplejwt` dependency we use.
        user = self.context["request"].user
        video = get_object_or_404(Video, pk=user.id)
        if not attrs.get("email"):
            raise serializers.ValidationError({"email": "Email is mandatory."})
        if video.is_scheduled is False:
            raise serializers.ValidationError(
                {"video": f"video with id {user.id} doesn't accept registration."}
            )

        if not attrs.get("video_id") and isinstance(user, TokenUser):
            attrs["video_id"] = user.id
            is_lti = (
                user.token.payload.get("context_id")
                and user.token.payload.get("consumer_site")
                and user.token.payload.get("user")
                and user.token.payload["user"].get("id")
            )

            if is_lti:
                attrs["consumer_site"] = get_object_or_404(
                    ConsumerSite, pk=user.token.payload["consumer_site"]
                )
                attrs["lti_id"] = user.token.payload["context_id"]
                attrs["lti_user_id"] = user.token.payload["user"]["id"]

                # If email is present in token, we make sure the one sent is the one expected
                # lti users can't defined their email, the one from the token is used
                if user.token.payload["user"].get("email"):
                    if attrs["email"] != user.token.payload["user"]["email"]:
                        raise serializers.ValidationError(
                            {
                                "email": "You are not authorized to register with a specific email"
                                f" {attrs['email']}. You can only use the email from your "
                                "authentication."
                            }
                        )
                # We can identify the user for this context_id and consumer_site, we make sure
                # this user hasn't already registered for this video.
                if LiveRegistration.objects.filter(
                    consumer_site=attrs["consumer_site"],
                    lti_id=attrs["lti_id"],
                    lti_user_id=attrs["lti_user_id"],
                    video=video,
                ).exists():
                    raise serializers.ValidationError(
                        {
                            "lti_user_id": "This identified user is already "
                            "registered for this video and consumer site and "
                            "course."
                        }
                    )

                # If username is present in the token we catch it
                attrs["username"] = user.token.payload["user"].get("username")
            else:  # public token should have no LTI info
                if (
                    user.token.payload.get("context_id")
                    or user.token.payload.get("consumer_site")
                    or (
                        user.token.payload.get("user")
                        and user.token.payload["user"].get("id")
                    )
                ):
                    # we prevent any side effects if token's creation changes.
                    raise serializers.ValidationError(
                        {
                            "token": "Public token shouldn't have any LTI information, "
                            "cases are not expected."
                        }
                    )
                # Make sure we have the anonymous_id
                if not attrs.get("anonymous_id"):
                    raise serializers.ValidationError(
                        {"anonymous_id": "Anonymous id is mandatory."}
                    )

                # Control this email hasn't already been used for this video in the public case
                if LiveRegistration.objects.filter(
                    consumer_site=None,
                    email=attrs["email"],
                    lti_id=None,
                    video=video,
                ).exists():
                    raise serializers.ValidationError(
                        {
                            "email": f"{attrs['email']} is already registered "
                            "for this video, consumer site and course."
                        }
                    )

                attrs["consumer_site"] = None
                attrs["lti_id"] = None

        return super().validate(attrs)

    def create(self, validated_data):
        validated_data["is_registered"] = True
        return super().create(validated_data)


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
            f"{obj.video.pk}/sharedlivemedias/{obj.pk}/{stamp}"
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
            url = f"{base:s}/{page_number:d}.png"
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


class LiveAttendanceSerializer(serializers.ModelSerializer):
    """Serializer for liveRegistration model to monitor attendance."""

    class Meta:  # noqa
        model = LiveRegistration
        fields = (
            "id",
            "live_attendance",
            "video",
        )
        read_only_fields = (
            "id",
            "video",
        )

        extra_kwargs = {"live_attendance": {"allow_null": False, "required": True}}

    # Make sure video UUID is converted to a string during serialization
    video = serializers.PrimaryKeyRelatedField(
        read_only=True, pk_field=serializers.CharField()
    )


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
            "active_stamp",
            "description",
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
            "id",
            "active_stamp",
            "is_ready_to_show",
            "is_scheduled",
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
