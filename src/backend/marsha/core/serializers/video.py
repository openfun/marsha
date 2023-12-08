"""Structure of Video related models API responses with Django Rest Framework serializers."""
import datetime
from datetime import timedelta
from urllib.parse import quote_plus

from django.conf import settings
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify

from rest_framework import serializers
from sentry_sdk import capture_message

from marsha.core.defaults import (
    AWS_PIPELINE,
    ENDED,
    HARVESTED,
    IDLE,
    JITSI,
    LIVE_CHOICES,
    LIVE_TYPE_CHOICES,
    PEERTUBE_PIPELINE,
    RUNNING,
    STOPPED,
)
from marsha.core.models import TimedTextTrack, Video
from marsha.core.serializers.base import TimestampField, get_video_cloudfront_url_params
from marsha.core.serializers.playlist import PlaylistLiteSerializer
from marsha.core.serializers.shared_live_media import (
    SharedLiveMediaId3TagsSerializer,
    SharedLiveMediaSerializer,
)
from marsha.core.serializers.thumbnail import ThumbnailSerializer
from marsha.core.serializers.timed_text_track import TimedTextTrackSerializer
from marsha.core.storage.storage_class import video_storage
from marsha.core.utils import cloudfront_utils, jitsi_utils, time_utils, xmpp_utils
from marsha.core.utils.time_utils import to_datetime


MAX_DATETIME = timezone.datetime.max.replace(tzinfo=datetime.timezone.utc)


class UpdateLiveStateSerializer(serializers.Serializer):
    """A serializer to validate data submitted on the UpdateLiveState API endpoint."""

    state = serializers.ChoiceField(
        tuple(c for c in LIVE_CHOICES if c[0] in (RUNNING, STOPPED, HARVESTED))
    )
    logGroupName = serializers.CharField()
    requestId = serializers.CharField()
    extraParameters = serializers.DictField(allow_null=True, required=False)


class VideoUploadEndedSerializer(serializers.Serializer):
    """A serializer to validate data submitted on the UploadEnded API endpoint."""

    file_key = serializers.CharField()

    def validate_file_key(self, value):
        """Check if the file_key is valid."""
        base_video_pk = self.context["pk"]
        [tmp_dir, video_pk, video_dir, stamp] = value.split("/")

        if base_video_pk != video_pk or tmp_dir != "tmp" or video_dir != "video":
            raise serializers.ValidationError("file_key is not valid")
        try:
            to_datetime(stamp)
        except serializers.ValidationError as error:
            raise serializers.ValidationError("file_key is not valid") from error

        return value


class InitLiveStateSerializer(serializers.Serializer):
    """A serializer to validate data submitted on the initiate-live API endpoint."""

    type = serializers.ChoiceField(LIVE_TYPE_CHOICES)


class JitsiModeratorSerializer(serializers.Serializer):
    """A serializer to validate data submitted on the jitsi info API endpoint."""

    moderator = serializers.BooleanField(required=False, default=False)


class VideoBaseSerializer(serializers.ModelSerializer):
    """Base Serializer to factorize common Video attributes."""

    thumbnail_instance = None

    class Meta:  # noqa
        model = Video
        fields = (
            "urls",
            "thumbnail",
            "is_ready_to_show",
            # Non-model fields
            "can_edit",
        )
        read_only_fields = (
            "urls",
            "is_ready_to_show",
        )

    urls = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()
    is_ready_to_show = serializers.BooleanField(read_only=True)

    can_edit = serializers.SerializerMethodField(read_only=True)

    def to_representation(self, instance):
        """
        Object instance -> Dict of primitive datatypes.
        Try to fetch existing thumbnail related to the current video.
        If a thumbnail exists, we keep it in the serializer instance
        to use it several times without having to fetch it again and again
        in the database.
        """
        # force initializing to None, otherwise when the serializer is used with a collection,
        # the thumbnail_instance will be use with the next video not having a thumbnail.
        self.thumbnail_instance = None
        try:
            # There can be only one thumbnail per video, we use this to take advantage of the
            # prefetch_related in the viewset (instead of making a new `get`).
            self.thumbnail_instance = instance.thumbnail.all()[0]
        except IndexError:
            pass

        return super().to_representation(instance)

    def get_can_edit(self, obj):
        """
        Return the `can_edit` attribute of the object.
        Required because this is not a real model field and is a forced attribute
        (eg. when creating the video, we enforce the attribute).

        We still accept the `is_admin` context key, mainly for testing purposes.
        """
        return getattr(obj, "can_edit", self.context.get("is_admin", False))

    def get_thumbnail(self, _):
        """Return a serialized thumbnail if it exists."""
        if self.thumbnail_instance:
            return ThumbnailSerializer(self.thumbnail_instance).data

        return None

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
        if not self.get_can_edit(obj) and obj.live_state == HARVESTED:
            return None

        if obj.live_info is not None and obj.live_info.get("mediapackage"):
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
        return self.get_vod_urls(obj)

    def get_vod_urls(self, obj):
        """Return URLS for a VOD video. Urls differ depending on the
        transcode pipeline. If no pipeline is set, we use the default AWS one.

        Parameters
        ----------
        obj : Type[models.Video]
            The video that we want to serialize

        """
        thumbnail_urls = {}
        if self.thumbnail_instance and self.thumbnail_instance.uploaded_on is not None:
            thumbnail_serialized = ThumbnailSerializer(self.thumbnail_instance)
            thumbnail_urls.update(thumbnail_serialized.data.get("urls"))

        urls = {"mp4": {}, "thumbnails": {}, "manifests": {}}

        base = f"{settings.AWS_S3_URL_PROTOCOL}://{settings.CLOUDFRONT_DOMAIN}/{obj.pk}"
        stamp = time_utils.to_timestamp(obj.uploaded_on)
        if settings.CLOUDFRONT_SIGNED_URLS_ACTIVE:
            params = get_video_cloudfront_url_params(obj.pk)

        filename = f"{slugify(obj.playlist.title)}_{stamp}.mp4"
        content_disposition = quote_plus(f"attachment; filename={filename}")

        # Trying to recover the transcoding pipeline
        if obj.transcode_pipeline is None:
            if video_storage.exists(f"scw/{obj.pk}/video/{stamp}/thumbnail.jpg"):
                obj.transcode_pipeline = PEERTUBE_PIPELINE
            else:  # Fallback to AWS_PIPELINE
                obj.transcode_pipeline = AWS_PIPELINE
            obj.save(update_fields=["transcode_pipeline"])
            capture_message(
                f"VOD {obj.pk} had no transcode_pipeline and "
                f"was recovered to {obj.transcode_pipeline}",
            )

        if obj.transcode_pipeline == AWS_PIPELINE:
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
                    mp4_url = cloudfront_utils.build_signed_url(mp4_url, params)

                urls["mp4"][resolution] = mp4_url

            if obj.live_state != HARVESTED:
                # Adaptive Bit Rate manifests
                urls["manifests"] = {
                    "hls": f"{base}/cmaf/{stamp}.m3u8",
                }

                # Previews
                urls["previews"] = f"{base}/previews/{stamp}_100.jpg"
        elif obj.transcode_pipeline == PEERTUBE_PIPELINE:
            base = obj.get_videos_storage_prefix(stamp=stamp)
            for resolution in obj.resolutions:
                # MP4
                mp4_url = (
                    video_storage.url(f"{base}/{stamp}-{resolution}-fragmented.mp4")
                    + f"?response-content-disposition={content_disposition}"
                )
                # Sign the urls of mp4 videos only if the functionality is activated
                if settings.CLOUDFRONT_SIGNED_URLS_ACTIVE:
                    mp4_url = cloudfront_utils.build_signed_url(mp4_url, params)

                urls["mp4"][resolution] = mp4_url

                urls["thumbnails"][resolution] = thumbnail_urls.get(
                    resolution, video_storage.url(f"{base}/thumbnail.jpg")
                )
                urls["previews"] = video_storage.url(f"{base}/thumbnail.jpg")
                urls["manifests"] = {
                    "hls": video_storage.url(f"{base}/master.m3u8"),
                }

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
            "is_live",
            "is_public",
            "is_ready_to_show",
            "is_recording",
            "is_scheduled",
            "join_mode",
            "timed_text_tracks",
            "thumbnail",
            "title",
            "upload_state",
            "urls",
            "show_download",
            "should_use_subtitle_as_transcript",
            "starting_at",
            "participants_asking_to_join",
            "participants_in_discussion",
            "playlist",
            "recording_time",
            "retention_date",
            "live_info",
            "live_state",
            "live_type",
            "xmpp",
            "shared_live_medias",
            "tags",
            "license",
            # Non-model fields
            "can_edit",
        )
        read_only_fields = (
            "active_shared_live_media",
            "active_shared_live_media_page",
            "id",
            "is_live",
            "active_stamp",
            "is_ready_to_show",
            "is_recording",
            "is_scheduled",
            "upload_state",
            "urls",
            "recording_time",
            "live_info",
            "live_state",
            "participants_asking_to_join",
            "participants_in_discussion",
        )

    active_shared_live_media = SharedLiveMediaSerializer(read_only=True)
    active_stamp = TimestampField(
        source="uploaded_on", required=False, allow_null=True, read_only=True
    )
    timed_text_tracks = TimedTextTrackSerializer(
        source="timedtexttracks", many=True, read_only=True
    )
    shared_live_medias = serializers.SerializerMethodField()
    playlist = PlaylistLiteSerializer(read_only=True)
    live_info = serializers.SerializerMethodField()
    xmpp = serializers.SerializerMethodField()
    title = serializers.CharField(allow_blank=False, allow_null=False, max_length=255)

    def to_representation(self, instance):
        """
        compute the has_transcript field based on existing timed_text_tracks data
        already present in the serialized data. Doing this help us to decrease the
        number of queries made against the database. We have all the data we need.
        """
        rep = super().to_representation(instance)
        timed_text_tracks = rep.get("timed_text_tracks")
        rep["has_transcript"] = any(
            timed_text_track.get("mode") == TimedTextTrack.TRANSCRIPT
            and timed_text_track.get("is_ready_to_show", False)
            for timed_text_track in timed_text_tracks
        )
        return rep

    def get_shared_live_medias(self, instance):
        """Get shared live media for a video sorted by reverse uploaded_on."""
        # Sort shared live media by reverse uploaded_on on python side
        # to take advantage of the prefetch_related
        shared_live_medias = sorted(
            instance.shared_live_medias.all(),
            key=lambda x: x.uploaded_on or MAX_DATETIME,
            reverse=True,
        )
        return SharedLiveMediaSerializer(
            shared_live_medias,
            many=True,
            context=self.context,
        ).data

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

    def validate_estimated_duration(self, value):
        """Reject negative duration"""
        if value != self.instance.estimated_duration:
            if value.days < 0:
                raise serializers.ValidationError(
                    "Ensure this value is greater than or equal to 0."
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
        Dictionary
            A dictionary containing all info needed to manage a connection to a xmpp server.
        """
        if (
            settings.LIVE_CHAT_ENABLED
            and obj.live_state
            and obj.live_state not in [IDLE]
        ):
            token = xmpp_utils.generate_jwt(
                str(obj.id),
                "owner" if self.get_can_edit(obj) else "member",
                timezone.now() + timedelta(days=1),
            )

            return {
                "bosh_url": xmpp_utils.add_jwt_token_to_url(
                    settings.XMPP_BOSH_URL, token
                ),
                "converse_persistent_store": settings.XMPP_CONVERSE_PERSISTENT_STORE,
                "websocket_url": xmpp_utils.add_jwt_token_to_url(
                    settings.XMPP_WEBSOCKET_URL, token
                ),
                "conference_url": f"{obj.id}@{settings.XMPP_CONFERENCE_DOMAIN}",
                "jid": settings.XMPP_DOMAIN,
            }

        return None

    def get_live_info(self, obj):
        """Live streaming information.

        Parameters
        ----------
        obj : Type[models.Video]
            The video that we want to serialize

        Returns
        -------
        Dictionary
            A dictionary containing all info needed to manage a live stream for an admin.
            For other users, an empty dictionary is returned.
            The data are filtered to only return RTMP endpoints and jitsi configuration if needed.
            All other data are sensitive, used only by the backend and must never be exposed.
        """
        if obj.live_state in [None, ENDED]:
            return {}

        live_info = {}

        if obj.live_info is not None:
            for attribute in ["started_at", "stopped_at"]:
                if obj.live_info.get(attribute):
                    live_info.update({attribute: obj.live_info[attribute]})

        if not self.get_can_edit(obj):
            return live_info

        if obj.live_info is not None and obj.live_info.get("medialive"):
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
                {"jitsi": jitsi_utils.generate_jitsi_info(obj, self.get_can_edit(obj))}
            )

        return live_info


class VideoFromRecordingSerializer(VideoBaseSerializer):
    """A serializer to display a Video resource in Classroom recording serializer."""

    class Meta:  # noqa
        model = Video
        fields = (
            "id",
            "title",
            "upload_state",
        )
        read_only_fields = (
            "id",
            "title",
            "upload_state",
        )


class VideoSelectLTISerializer(VideoFromRecordingSerializer):
    """A serializer to display a Video resource for LTI select content request."""

    class Meta:  # noqa
        model = Video
        fields = (
            "id",
            "is_ready_to_show",
            "is_live",
            "thumbnail",
            "title",
            "description",
            "upload_state",
            "urls",
            "lti_url",
        )
        read_only_fields = (
            "id",
            "is_ready_to_show",
            "is_live",
            "thumbnail",
            "title",
            "description",
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
            reverse("video_lti_view", args=[obj.id]),
        )


class VideoId3TagsSerializer(serializers.ModelSerializer):
    """A serializer to display a Video resource in id3 tags."""

    class Meta:
        model = Video
        fields = (
            "active_shared_live_media",
            "active_shared_live_media_page",
            "id",
            "live_state",
        )
        read_only_fields = (
            "active_shared_live_media",
            "active_shared_live_media_page",
            "id",
            "live_state",
        )

    active_shared_live_media = SharedLiveMediaId3TagsSerializer(read_only=True)


class ParticipantSerializer(serializers.Serializer):
    """A serializer to validate a participant submitted on the live participants API endpoint."""

    name = serializers.CharField(required=True, max_length=128)
    id = serializers.CharField(required=True, max_length=128)
