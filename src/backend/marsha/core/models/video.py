"""This module holds the models for the marsha project."""

import secrets

from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.contrib.sites.models import Site
from django.db import models
from django.db.models import OuterRef
from django.urls import reverse
from django.utils import timezone
from django.utils.crypto import get_random_string
from django.utils.functional import lazy
from django.utils.module_loading import import_string
from django.utils.translation import gettext_lazy as _

from safedelete import HARD_DELETE_NOCASCADE
from safedelete.managers import SafeDeleteManager
from safedelete.queryset import SafeDeleteQueryset

from marsha.core.defaults import (
    APPROVAL,
    CELERY_PIPELINE,
    DELETED,
    DELETED_VIDEOS_STORAGE_BASE_DIRECTORY,
    ENDED,
    HARVESTED,
    IDLE,
    JOIN_MODE_CHOICES,
    LICENCES_CHOICES,
    LIVE_CHOICES,
    LIVE_TYPE_CHOICES,
    PENDING,
    PROCESS_PIPELINE_CHOICES,
    RUNNING,
    STOPPING,
    TRANSCODE_PIPELINE_CHOICES,
    UPLOAD_ERROR_REASON_CHOICES,
    VIDEOS_STORAGE_BASE_DIRECTORY,
    VOD_VIDEOS_STORAGE_BASE_DIRECTORY,
)
from marsha.core.models.account import ADMINISTRATOR, INSTRUCTOR, OrganizationAccess
from marsha.core.models.base import BaseModel
from marsha.core.models.file import AbstractImage, BaseFile, UploadableFileMixin
from marsha.core.models.playlist import PlaylistAccess, RetentionDateObjectMixin
from marsha.core.utils.api_utils import generate_salted_hmac
from marsha.core.utils.time_utils import to_timestamp


# pylint: disable=too-many-lines


class VideoQueryset(SafeDeleteQueryset):
    """A queryset to provide helper for querying videos."""

    def annotate_can_edit(self, user_id, force_value=None):
        """
        Annotate the queryset with a boolean indicating if the user can act
        on the video.
        Required for the VideoSerializer serializer.

        Parameters
        ----------
        user_id : str
            The user ID determine rights on video.
            We use the user ID here because it can be provided from UserToken

        force_value : optional[bool]
            If set, force the value of the annotation to `force_value`.
            Useful to avoid heavy request when we already know the answer.

        Returns
        -------
        QuerySet
            The annotated queryset.
        """
        if force_value is not None:
            return self.annotate(
                can_edit=models.Value(force_value, output_field=models.BooleanField()),
            )

        organization_subquery = OrganizationAccess.objects.filter(
            role=ADMINISTRATOR,
            organization__playlists__videos__id=OuterRef("pk"),
            user_id=user_id,
        )

        playlist_subquery = PlaylistAccess.objects.filter(
            role__in=[
                ADMINISTRATOR,
                INSTRUCTOR,
            ],
            playlist__videos__id=OuterRef("pk"),
            user_id=user_id,
        )

        return self.annotate(
            can_edit=models.Case(
                models.When(
                    # Has admin or instructor role on playlist
                    models.Exists(playlist_subquery),
                    then=models.Value(True),
                ),
                models.When(
                    # Has admin role on organization
                    models.Exists(organization_subquery),
                    then=models.Value(True),
                ),
                default=models.Value(False),
                output_field=models.BooleanField(),
            ),
        )


class Video(BaseFile, RetentionDateObjectMixin):
    """Model representing a video, created by an author."""

    RESOURCE_NAME = "videos"
    S3_IDENTIFIER = "video"

    active_shared_live_media = models.ForeignKey(
        "SharedLiveMedia",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="active_video",
        verbose_name=_("Video"),
    )
    active_shared_live_media_page = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text=_("Current displayed page of the active shared live media"),
    )
    allow_recording = models.BooleanField(
        default=True,
        verbose_name=_("allow video recording"),
        help_text=_("Allow video recording?"),
    )
    last_lti_url = models.URLField(
        blank=True,
        null=True,
        verbose_name=_("last LTI URL"),
        help_text=_("Last LTI URL which was used to launch this video"),
    )
    estimated_duration = models.DurationField(
        blank=True,
        null=True,
        verbose_name=_("estimated duration"),
        help_text=_("Estimated duration of the video."),
    )
    has_chat = models.BooleanField(
        default=True,
        verbose_name=_("enable video chat"),
        help_text=_("Enable video chat?"),
    )
    has_live_media = models.BooleanField(
        default=True,
        verbose_name=_("enable video live media"),
        help_text=_("Enable video live media?"),
    )
    join_mode = models.CharField(
        max_length=20,
        verbose_name=_("Join the discussion mode"),
        help_text=_("Join the discussion mode."),
        choices=JOIN_MODE_CHOICES,
        default=APPROVAL,
    )
    participants_asking_to_join = models.JSONField(
        blank=True,
        default=list,
        verbose_name=_("asking Live participants"),
        help_text=_("Current list of users asking to join the live."),
    )
    participants_in_discussion = models.JSONField(
        blank=True,
        default=list,
        verbose_name=_("live participants"),
        help_text=_("Current participants list for the live."),
    )
    recording_slices = models.JSONField(
        blank=True,
        default=list,
        verbose_name=_("recording slices"),
        help_text=_("Recording slices of the video."),
    )
    starting_at = models.DateTimeField(
        blank=True,
        verbose_name=_("starting at"),
        help_text=_("date and time at which a video live is scheduled"),
        null=True,
    )
    should_use_subtitle_as_transcript = models.BooleanField(
        default=False,
        verbose_name=_("use subtitle as transcript"),
        help_text=_(
            "When there is at least one subtitle but no transcript this flag allows "
            "to use subtitles as transcripts."
        ),
    )
    resolutions = ArrayField(
        models.IntegerField(),
        null=True,
        blank=True,
        verbose_name=_("video sizes"),
        help_text=_("List of available sizes for this video"),
    )
    live_info = models.JSONField(
        null=True,
        blank=True,
        verbose_name=_("Live info"),
        help_text=_("Information needed to manage live streaming"),
    )
    live_state = models.CharField(
        max_length=20,
        verbose_name=_("live state"),
        help_text=_("state of the live mode."),
        choices=LIVE_CHOICES,
        null=True,
        blank=True,
    )
    live_type = models.CharField(
        max_length=20,
        verbose_name=_("type of live"),
        help_text=_("type of live."),
        choices=LIVE_TYPE_CHOICES,
        null=True,
        blank=True,
    )
    is_public = models.BooleanField(
        default=False,
        verbose_name=_("is video public"),
        help_text=_("Is the video publicly accessible?"),
    )
    tags = ArrayField(
        models.CharField(max_length=200),
        blank=True,
        default=list,
        help_text=_("video tags"),
    )
    license = models.CharField(
        max_length=20,
        verbose_name=_("licenses"),
        help_text=_("License for this video"),
        choices=LICENCES_CHOICES,
        null=True,
        blank=True,
    )
    transcode_pipeline = models.CharField(
        max_length=255,
        verbose_name=_("transcode pipeline"),
        help_text=_("Transcode pipeline for this video"),
        choices=TRANSCODE_PIPELINE_CHOICES,
        null=True,
        blank=True,
    )

    upload_error_reason = models.CharField(
        max_length=50,
        verbose_name=_("upload error reason"),
        help_text=_("Reason why an upload is in error state."),
        choices=UPLOAD_ERROR_REASON_CHOICES,
        null=True,
        blank=True,
    )

    objects = SafeDeleteManager(VideoQueryset)

    class Meta:
        """Options for the ``Video`` model."""

        db_table = "video"
        ordering = ["position", "id"]
        verbose_name = _("video")
        verbose_name_plural = _("videos")
        constraints = [
            models.CheckConstraint(
                name="live_type_check",
                check=models.Q(
                    models.Q(live_state__isnull=True, live_type__isnull=True)
                    | models.Q(live_state__isnull=False, live_type__isnull=False),
                ),
            ),
        ]

    def get_source_s3_key(self, stamp=None):
        """Compute the S3 key in the source bucket (ID of the video + version stamp).

        Parameters
        ----------
        stamp: Type[string]
            Passing a value for this argument will return the source S3 key for the video assuming
            its active stamp is set to this value. This is useful to create an upload policy for
            this prospective version of the video, so that the client can upload the file to S3
            and the confirmation lambda can set the `uploaded_on` field to this value only after
            the video transcoding job is successful.

        Returns
        -------
        string
            The S3 key for the video in the source bucket, where uploaded videos are stored before
            they are converted to the destination bucket.

        """
        stamp = stamp or self.uploaded_on_stamp()
        return f"{self.pk}/video/{self.pk}/{stamp}"

    def get_videos_storage_prefix(
        self,
        stamp=None,
        base_dir: VIDEOS_STORAGE_BASE_DIRECTORY = VOD_VIDEOS_STORAGE_BASE_DIRECTORY,
    ):
        """Compute the videos storage prefix for the video.

        Parameters
        ----------
        stamp: Type[string]
            Passing a value for this argument will return the videos storage prefix for the video
            assuming its active stamp is set to this value. This is useful to create an upload
            policy for this prospective version of the video, so that the client can upload the
            file to S3 and the transcodings job can set the `uploaded_on` field to this value.

        base: Type[VIDEOS_STORAGE_BASE_DIRECTORY]
            The videos storage base directory. Defaults to VOD. It will be used to compute the
            videos storage prefix.

        Returns
        -------
        string
            The videos storage prefix for the video, depending on the base directory passed.
        """
        stamp = stamp or self.uploaded_on_stamp()
        base = base_dir
        if base == DELETED_VIDEOS_STORAGE_BASE_DIRECTORY:
            base = f"{base}/{VOD_VIDEOS_STORAGE_BASE_DIRECTORY}"

        return f"{base}/{self.pk}/video/{stamp}"

    def update_upload_state(self, upload_state, uploaded_on, **extra_parameters):
        """Manage upload state.

        Parameters
        ----------
        upload_state: Type[string]
            state of the upload in AWS.

        uploaded_on: Type[DateTime]
            datetime at which the active version of the file was uploaded.

        extra_parameters: Type[Dict]
            Dictionary containing arbitrary data sent from AWS lambda.
        """
        if "resolutions" in extra_parameters:
            self.resolutions = extra_parameters.get("resolutions")

        super().update_upload_state(upload_state, uploaded_on, **extra_parameters)

        # This function is imported using import_string to avoid circular import error.
        dispatch_video_to_groups = import_string(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        )
        dispatch_video_to_groups(self)

    @property
    def is_scheduled(self):
        """Whether this video is scheduled or not.

        Video is considered in scheduled mode when live hasn't started yet and date
        is planned in the future.
        """
        # pylint:disable=unexpected-keyword-arg
        return (
            self.starting_at is not None
            and self.starting_at > timezone.now()
            and self.live_state == IDLE
        )

    @property
    def is_ready_to_show(self):
        """Whether the file is ready to display (ie) has been successfully uploaded.

        The value of this field seems to be trivially derived from the value of the
        `uploaded_on` field, but it is necessary for convenience and clarity in the client.
        """
        return (
            self.uploaded_on is not None and self.upload_state != DELETED
        ) or self.live_state is not None

    @property
    def is_live(self):
        """Whether the video is a live one."""
        return self.live_state is not None and self.live_state != ENDED

    @staticmethod
    def get_ready_clause():
        """Clause used in lti.utils.get_or_create_resource to filter the videos.

        Only show videos that have successfully gone through the upload process,
        or live streams that are in the running state or videos that have a starting_at
        date defined and an IDLE live_state.

        Returns
        -------
        models.Q
            A condition added to a QuerySet
        """
        return (
            models.Q(uploaded_on__isnull=False, live_state__isnull=True)
            | models.Q(live_state__isnull=False)
            | models.Q(
                starting_at__isnull=False,
                live_state=IDLE,
            )
        )

    def get_medialive_input(self):
        """Return the medialive input info if existing."""
        return self.live_info.get("medialive").get("input")

    def get_medialive_channel(self):
        """Return the medialive channel info if existing."""
        return self.live_info.get("medialive").get("channel")

    def get_mediapackage_channel(self):
        """Return the mediapackage channel info if existing."""
        return self.live_info.get("mediapackage").get("channel")

    def get_mediapackage_endpoints(self):
        """Return the mediapackage endpoints info."""
        return self.live_info.get("mediapackage").get("endpoints")

    @property
    def is_recording(self):
        """Whether the video is currently recording."""
        if not self.recording_slices:
            return False
        last_recording_slice = self.recording_slices[-1]
        return (
            last_recording_slice.get("start")
            and last_recording_slice.get("stop") is None
        )

    @property
    def recording_time(self):
        """Return the total duration of all recording slices in seconds."""
        if not self.recording_slices:
            return 0
        recording_time = sum(
            (int(recording_slice.get("stop")) - int(recording_slice.get("start")))
            for recording_slice in self.recording_slices
            if recording_slice.get("stop") is not None
        )
        if self.is_recording:
            recording_time += int(to_timestamp(timezone.now())) - int(
                self.recording_slices[-1].get("start")
            )
        return recording_time

    @property
    def live_duration(self):
        """
        Return the duration since the live started.
        """
        if self.live_info:
            end = self.live_ended_at
            start = self.live_info.get("started_at")
            if end and start:
                return int(end) - int(start)
        return 0

    @property
    def live_ended_at(self):
        """
        Return the timestamp at which the live ended or current timestamp if it's still running
        """
        if self.live_info and self.live_info.get("stopped_at"):
            return int(self.live_info.get("stopped_at"))

        if self.live_state in (RUNNING, STOPPING):
            return int(to_timestamp(timezone.now()))

        return None

    def get_list_timestamps_attendances(self):
        """
        Depending on the duration of the video, build an array of timestamps.
        """

        timestamp_list = {}

        duration = self.live_duration
        if duration > settings.ATTENDANCE_POINTS:
            # we expect to have a minimum a point per seconds
            started = int(self.live_info.get("started_at"))
            elapsed = int(duration / (settings.ATTENDANCE_POINTS - 1))
            for index in range(settings.ATTENDANCE_POINTS):
                sec = index * elapsed + started
                timestamp_list[str(sec)] = {}

        return timestamp_list

    def set_recording_slice_manifest_key(self, harvest_job_id, manifest_key):
        """Set the manifest key for a recording slice."""
        if not self.recording_slices:
            return None
        for recording_slice in self.recording_slices:
            if recording_slice.get("harvest_job_id") == harvest_job_id:
                recording_slice.update(
                    {"manifest_key": manifest_key, "status": HARVESTED}
                )
                self.recording_slices = self.recording_slices
                self.save()
                return True
        return False

    def get_recording_slices_state(self):
        """Return the state of the recording slices."""
        if not self.recording_slices:
            return None
        main_status = HARVESTED
        for recording_slice in self.recording_slices:
            if recording_slice.get("status") != HARVESTED:
                main_status = PENDING
        return {
            "status": main_status,
            "recording_slices": self.recording_slices,
        }


class BaseTrack(UploadableFileMixin, BaseModel):
    """Base model for different kinds of tracks tied to a video."""

    video = models.ForeignKey(
        to="Video",
        related_name="%(class)ss",  # will be `audiotracks` for `AudioTrack` model,
        verbose_name=_("video"),
        help_text=_("video for which this track is"),
        # track is (soft-)deleted if video is (soft-)deleted
        on_delete=models.CASCADE,
    )
    language = models.CharField(
        max_length=10,
        choices=lazy(lambda: settings.ALL_LANGUAGES, tuple)(),
        verbose_name=_("language"),
        help_text=_("language of this track"),
    )

    class Meta:
        """Options for the ``BaseTrack`` model."""

        abstract = True


class AudioTrack(BaseTrack):
    """Model representing an additional audio track for a video."""

    class Meta:
        """Options for the ``AudioTrack`` model."""

        db_table = "audio_track"
        verbose_name = _("audio track")
        verbose_name_plural = _("audio tracks")
        constraints = [
            models.UniqueConstraint(
                fields=["video", "language"],
                condition=models.Q(deleted=None),
                name="audio_track_unique_idx",
            )
        ]


class TimedTextTrack(BaseTrack):
    """Model representing a timed text track for a video.

    Can be subtitles, closed captioning or transcripts.
    """

    RESOURCE_NAME = "timedtexttracks"
    S3_IDENTIFIER = "timedtexttrack"

    SUBTITLE, TRANSCRIPT, CLOSED_CAPTIONING = "st", "ts", "cc"
    MODE_CHOICES = (
        (SUBTITLE, _("Subtitle")),
        (TRANSCRIPT, _("Transcript")),
        (CLOSED_CAPTIONING, _("Closed captioning")),
    )

    mode = models.CharField(
        verbose_name=_("mode"),
        max_length=2,
        choices=MODE_CHOICES,
        help_text=_(
            "Activate a special mode for this timed text track: simple subtitles, closed "
            "captioning (for deaf or hard of hearing viewers) or transcription (complete text "
            "below aside of the player)."
        ),
        default=SUBTITLE,
    )

    extension = models.CharField(
        blank=True,
        default=None,
        help_text=_("timed text track extension"),
        max_length=10,
        null=True,
        verbose_name=_("extension"),
    )

    process_pipeline = models.CharField(
        max_length=255,
        verbose_name=_("process pipeline"),
        help_text=_("Pipeline used to process the timed text track"),
        choices=PROCESS_PIPELINE_CHOICES,
        default=CELERY_PIPELINE,
    )

    class Meta:
        """Options for the ``TimedTextTrack`` model."""

        db_table = "timed_text_track"
        verbose_name = _("timed text track")
        verbose_name_plural = _("timed text tracks")
        constraints = [
            models.UniqueConstraint(
                fields=["video", "language", "mode"],
                condition=models.Q(deleted=None),
                name="timed_text_track_unique_idx",
            )
        ]

    def get_source_s3_key(self, stamp=None):
        """Compute the S3 key in the source bucket.

        It is built from the video ID + ID of the timed text track + version stamp + language +
        closed captioning flag.

        Parameters
        ----------
        stamp: Type[string]
            Passing a value for this argument will return the source S3 key for the timed text
            track assuming its active stamp is set to this value. This is useful to create an
            upload policy for this prospective version of the track, so that the client can
            upload the file to S3 and the confirmation lambda can set the `uploaded_on` field
            to this value only after the file upload and processing is successful.

        Returns
        -------
        string
            The S3 key for the timed text files in the source bucket, where uploaded files are
            stored before they are converted and copied to the destination bucket.

        """
        stamp = stamp or self.uploaded_on_stamp()
        mode = f"_{self.mode}" if self.mode else ""
        return f"{self.video.pk}/timedtexttrack/{self.pk}/{stamp}_{self.language}{mode}"

    def get_videos_storage_prefix(
        self,
        stamp=None,
        base_dir: VIDEOS_STORAGE_BASE_DIRECTORY = VOD_VIDEOS_STORAGE_BASE_DIRECTORY,
    ):
        """Compute the videos storage prefix for the video.

        Parameters
        ----------
        stamp: Type[string]
            Passing a value for this argument will return the videos storage prefix for the video
            assuming its active stamp is set to this value. This is useful to create an upload
            policy for this prospective version of the video, so that the client can upload the
            file to S3 and the transcodings job can set the `uploaded_on` field to this value.

        base_dir: Type[VIDEOS_STORAGE_BASE_DIRECTORY]
            The videos storage base directory. Defaults to VOD. It will be used to compute the
            videos storage prefix.

        Returns
        -------
        string
            The videos storage prefix for the video, depending on the base directory passed.
        """
        stamp = stamp or self.uploaded_on_stamp()
        base = base_dir
        if base_dir == DELETED_VIDEOS_STORAGE_BASE_DIRECTORY:
            base = f"{DELETED_VIDEOS_STORAGE_BASE_DIRECTORY}/{VOD_VIDEOS_STORAGE_BASE_DIRECTORY}"

        return f"{base}/{self.video.pk}/timedtext/{self.pk}/{stamp}"

    def update_upload_state(self, upload_state, uploaded_on, **extra_parameters):
        """Manage upload state.

        Parameters
        ----------
        upload_state: Type[string]
            state of the upload in AWS.

        uploaded_on: Type[DateTime]
            datetime at which the active version of the file was uploaded.

        extra_parameters: Type[Dict]
            Dictionary containing arbitrary data sent from AWS lambda.
        """
        if "extension" in extra_parameters:
            self.extension = extra_parameters["extension"]

        super().update_upload_state(upload_state, uploaded_on, **extra_parameters)

        # This function is imported using import_string to avoid circular import error.
        channel_layers_utils = import_string(
            "marsha.websocket.utils.channel_layers_utils"
        )
        channel_layers_utils.dispatch_timed_text_track(self)
        channel_layers_utils.dispatch_video(self.video, to_admin=True)


class SignTrack(BaseTrack):
    """Model representing a signs language track for a video."""

    class Meta:
        """Options for the ``SignTrack`` model."""

        db_table = "sign_track"
        verbose_name = _("signs language track")
        verbose_name_plural = _("signs language tracks")
        constraints = [
            models.UniqueConstraint(
                fields=["video", "language"],
                condition=models.Q(deleted=None),
                name="sign_track_unique_idx",
            )
        ]


class Thumbnail(AbstractImage):
    """Thumbnail model illustrating a video."""

    RESOURCE_NAME = "thumbnails"
    S3_IDENTIFIER = "thumbnail"

    video = models.ForeignKey(
        Video,
        related_name="thumbnail",
        verbose_name=_("video"),
        help_text=_("video for which this thumbnail is"),
        # Thumbnails are (soft-)deleted if video is (soft-)deleted
        on_delete=models.CASCADE,
    )

    process_pipeline = models.CharField(
        max_length=255,
        verbose_name=_("process pipeline"),
        help_text=_("Process pipeline used to process the thumbnail"),
        choices=PROCESS_PIPELINE_CHOICES,
        default=CELERY_PIPELINE,
    )

    @property
    def playlist(self):
        """Return the playlist of the video."""
        return self.video.playlist

    @property
    def playlist_id(self):
        """Return the playlist id of the video."""
        return self.video.playlist_id

    class Meta:
        """Options for the ``Thumbnail`` model."""

        db_table = "video_thumbnail"
        verbose_name = _("thumbnail")
        # The relation with the video is a foreign key
        # but we want the behavior of a OneToOneField. Unfortunately,
        # this field doesn't work with django-safedelete so we have to manage
        # the unicity with a unique constraint.
        # see https://github.com/makinacorpus/django-safedelete/issues/211
        constraints = [
            models.UniqueConstraint(
                fields=["video"],
                condition=models.Q(deleted=None),
                name="thumbnail_video_unique_idx",
            )
        ]

    def get_source_s3_key(self, stamp=None):
        """Compute the S3 key in the source bucket.

        It is built from the video ID + ID of the thumbnail + version stamp.

        Parameters
        ----------
        stamp: Type[string]
            Passing a value for this argument will return the source S3 key for the thumbnail
            assuming its active stamp is set to this value. This is useful to create an
            upload policy for this prospective version of the thumbnail, so that the client can
            upload the file to S3 and the confirmation lambda can set the `uploaded_on` field
            to this value only after the file upload and processing is successful.

        Returns
        -------
        string
            The S3 key for the thumbnail file in the source bucket, where uploaded files are
            stored before they are converted and copied to the destination bucket.

        """
        stamp = stamp or self.uploaded_on_stamp()
        return f"{self.video.pk}/thumbnail/{self.pk}/{stamp}"

    def get_videos_storage_prefix(
        self,
        stamp=None,
        base_dir: VIDEOS_STORAGE_BASE_DIRECTORY = VOD_VIDEOS_STORAGE_BASE_DIRECTORY,
    ):
        """Compute the videos storage prefix for the thumbnail.

        Parameters
        ----------
        stamp: Type[string]
            Passing a value for this argument will return the videos storage prefix for the shared
            live media assuming its active stamp is set to this value. This is useful to create
            an upload policy for this prospective version of the thumbnail, so that the
            client can upload the file and celery task can set the `uploaded_on` field to this
            value.

        base_dir: Type[VIDEOS_STORAGE_BASE_DIRECTORY]
            The videos storage base directory. Defaults to VOD. It will be used to compute the
            videos storage prefix.

        Returns
        -------
        string
            The videos storage prefix for the thumbnail.
        """
        stamp = stamp or self.uploaded_on_stamp()
        base = base_dir
        if base_dir == DELETED_VIDEOS_STORAGE_BASE_DIRECTORY:
            base = f"{DELETED_VIDEOS_STORAGE_BASE_DIRECTORY}/{VOD_VIDEOS_STORAGE_BASE_DIRECTORY}"

        return f"{base}/{self.video.pk}/thumbnail/{stamp}"

    def update_upload_state(self, upload_state, uploaded_on, **extra_parameters):
        """Manage upload state.

        Parameters
        ----------
        upload_state: Type[string]
            state of the upload in AWS.

        uploaded_on: Type[DateTime]
            datetime at which the active version of the file was uploaded.

        extra_parameters: Type[Dict]
            Dictionary containing arbitrary data sent from AWS lambda.
        """
        super().update_upload_state(upload_state, uploaded_on, **extra_parameters)

        # This function is imported using import_string to avoid circular import error.
        channel_layers_utils = import_string(
            "marsha.websocket.utils.channel_layers_utils"
        )
        channel_layers_utils.dispatch_thumbnail(self)
        channel_layers_utils.dispatch_video(self.video, to_admin=True)


class LiveSession(BaseModel):
    """Model representing a live session.

    On LTI connection, email has no constraint. Same email can be registered
    multiple times as it's a data that can be changed in the LMS.
    """

    # pylint: disable=no-method-argument
    def set_random_key_access():
        """Generates a random string"""
        return get_random_string(length=50)

    RESOURCE_NAME = "livesessions"

    anonymous_id = models.UUIDField(blank=True, db_index=True, null=True)

    display_name = models.CharField(
        blank=True,
        db_index=True,
        max_length=155,
        null=True,
        verbose_name=_("Display username"),
    )

    email = models.EmailField(_("email address"), blank=True, db_index=True, null=True)

    consumer_site = models.ForeignKey(
        blank=True,
        help_text=_("Only present for lti users."),
        null=True,
        on_delete=models.CASCADE,
        related_name="livesessions",
        to="ConsumerSite",
        verbose_name=_("LTI consumer site"),
    )

    language = models.CharField(
        max_length=10,
        choices=settings.LANGUAGES,
        default=settings.DEFAULT_LTI_LAUNCH_PRESENTATION_LOCALE,
        verbose_name=_("language"),
        help_text=_("language of this livesession"),
    )

    is_registered = models.BooleanField(
        db_index=True,
        default=False,
        verbose_name=_("is the user registered"),
        help_text=_("Is the user registered?"),
    )

    registered_at = models.DateTimeField(
        verbose_name=_("registered at"),
        help_text=_("date and time at which the user registered"),
        blank=True,
        null=True,
    )

    key_access = models.CharField(
        blank=False,
        default=set_random_key_access,
        help_text=_("Field to build url with encryption to target the record"),
        max_length=50,
        null=False,
    )

    live_attendance = models.JSONField(
        null=True,
        blank=True,
        verbose_name=_("Live attendance"),
        help_text=_("Live online presence"),
    )

    lti_id = models.CharField(
        blank=True,
        help_text=_("ID for synchronization with an external LTI tool"),
        max_length=255,
        null=True,
        verbose_name=_("lti id"),
    )

    lti_user_id = models.CharField(
        blank=True,
        db_index=True,
        help_text=_(
            "Unique identifier for the user on the tool consumer, only present for lti users."
        ),
        max_length=150,
        null=True,
        verbose_name=_("LTI user identifier"),
    )

    must_notify = ArrayField(
        models.CharField(max_length=200),
        blank=True,
        default=list,
        help_text=_("List of new notifications to send"),
        verbose_name=_("List of new notifications to send"),
    )

    reminders = ArrayField(
        models.CharField(max_length=200),
        blank=True,
        help_text=_("List of reminders already sent"),
        null=True,
        verbose_name=_("List of reminders sent"),
    )

    should_send_reminders = models.BooleanField(
        db_index=True,
        default=True,
        help_text=_("whether user reminders are enabled for this live"),
        verbose_name=_("should send reminders"),
    )

    username = models.CharField(
        max_length=155, blank=True, null=True, verbose_name=_("Username")
    )

    video = models.ForeignKey(
        Video,
        on_delete=models.CASCADE,
        related_name="livesessions",
        verbose_name=_("Video"),
    )

    channel_name = models.CharField(
        blank=True,
        max_length=255,
        null=True,
        help_text=_("Websocket channel_name"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name="livesessions",
        verbose_name=_("User"),
    )

    class Meta:
        """Options for the `livesessions` model."""

        db_table = "live_session"
        constraints = [
            models.CheckConstraint(
                name="livesession_lti_or_public_or_standalone",
                check=(
                    # LTI user
                    models.Q(
                        consumer_site__isnull=False,
                        lti_id__isnull=False,
                        lti_user_id__isnull=False,
                        user__isnull=True,
                    )
                    # Public/anonymous user
                    | models.Q(
                        consumer_site__isnull=True,
                        anonymous_id__isnull=False,
                        lti_id__isnull=True,
                        lti_user_id__isnull=True,
                        username__isnull=True,
                        user__isnull=True,
                    )
                    # Standalone site user
                    | models.Q(
                        consumer_site__isnull=True,
                        anonymous_id__isnull=True,
                        lti_id__isnull=True,
                        lti_user_id__isnull=True,
                        username__isnull=True,
                        user__isnull=False,
                    )
                ),
            ),
            models.CheckConstraint(
                name="livesession_email_is_registered",
                check=(
                    models.Q(email__isnull=True, is_registered=False)
                    | (models.Q(email__isnull=False))
                ),
            ),
            models.UniqueConstraint(
                fields=["email", "video"],
                condition=models.Q(
                    deleted=None,
                    consumer_site__isnull=True,
                    user__isnull=True,
                ),
                name="livesession_unique_email_video_with_consumer_site_user_none",
            ),
            models.UniqueConstraint(
                condition=models.Q(deleted=None),
                fields=("lti_user_id", "lti_id", "consumer_site", "video"),
                name="livesession_unique_video_lti_idx",
            ),
            models.UniqueConstraint(
                condition=models.Q(deleted=None),
                fields=("display_name", "video"),
                name="livesession_unique_video_display_name",
            ),
            models.UniqueConstraint(
                condition=models.Q(deleted=None),
                fields=("anonymous_id", "video"),
                name="livesession_unique_video_anonymous_id",
            ),
            models.UniqueConstraint(
                condition=models.Q(deleted=None),
                fields=("user", "video"),
                name="livesession_unique_video_user",
            ),
        ]

        verbose_name = _("live session")

    def update_reminders(self, step):
        """Update reminders field, append or init field."""
        if self.reminders:
            self.reminders.append(step)
        else:
            self.reminders = [step]
        self.save()

    def get_generate_salted_hmac(self):
        """Generates key used to send emails."""
        return generate_salted_hmac(settings.REMINDERS_SECRET, self.key_access)

    @property
    def cancel_reminder_url(self):
        """Returns url to not receive reminders anymore."""
        return f"//{Site.objects.get_current()}" + reverse(
            "reminders_cancel",
            kwargs={"pk": self.pk, "key": self.get_generate_salted_hmac()},
        )

    @property
    def video_access_reminder_url(self):
        """Returns url to access video from mails."""
        return (
            f"//{Site.objects.get_current()}"
            f"{reverse('video_direct_access', kwargs={'uuid': self.video.pk})}"
            f"?lrpk={self.pk}&key={self.get_generate_salted_hmac()}"
        )

    @property
    def is_from_lti_connection(self):
        """livesession generated by an LTI connection has necessary specific fields set."""
        return bool(self.consumer_site and self.lti_id and self.lti_user_id)


class LivePairingManager(models.Manager):
    """Model manager for a LivePairing"""

    def delete_expired(self):
        """Deletes all expired LivePairing objects."""
        expired_date = timezone.now() - timezone.timedelta(
            seconds=settings.LIVE_PAIRING_EXPIRATION_SECONDS
        )
        return self.filter(created_on__lt=expired_date).delete()


class LivePairing(BaseModel):
    """Model representing a live pairing."""

    RESOURCE_NAME = "livepairings"
    objects = LivePairingManager()
    _safedelete_policy = HARD_DELETE_NOCASCADE

    secret = models.CharField(
        max_length=6,
        unique=True,
        verbose_name=_("secret"),
        help_text=_("live pairing secret"),
    )

    video = models.OneToOneField(
        to="Video",
        related_name="live_pairing",
        verbose_name=_("video"),
        help_text=_("live pairing video"),
        # LivePairing is deleted if video is (soft-)deleted
        on_delete=models.CASCADE,
    )

    class Meta:
        """Options for the ``LivePairing`` model."""

        db_table = "live_pairing"
        ordering = ["created_on"]
        verbose_name = _("live pairing")
        verbose_name_plural = _("live pairings")

    def __str__(self):
        """Get the string representation of an instance."""
        return self.video.title

    @classmethod
    def secret_generator(cls, existing_secrets):
        """Generates a random 6 digit string."""
        # Generate a list of all possible 6 digits strings
        all_secrets = (str(i).zfill(6) for i in range(0, 1_000_000))

        # Difference between all and existing secrets
        available_secrets = set(all_secrets) - set(existing_secrets)

        # Return one of available secrets
        return secrets.choice(list(available_secrets))

    def generate_secret(self):
        """Stores generated secret and expiration date."""
        existing_secrets = LivePairing.objects.values_list("secret", flat=True)
        self.secret = self.secret_generator(existing_secrets)

    def save(self, *args, **kwargs):
        """Enforce secret presence each time an instance is saved."""
        if not self.pk:
            self.generate_secret()
        super().save(*args, **kwargs)


class Device(BaseModel):
    """Model representing a pairable device."""

    RESOURCE_NAME = "device"

    class Meta:
        """Options for the ``Device`` model."""

        db_table = "device"
        verbose_name = _("device")
        verbose_name_plural = _("devices")


class SharedLiveMedia(UploadableFileMixin, BaseModel):
    """Model representing a shared media in a video live."""

    RESOURCE_NAME = "sharedlivemedias"
    S3_IDENTIFIER = "sharedlivemedia"

    video = models.ForeignKey(
        Video,
        on_delete=models.CASCADE,
        related_name="shared_live_medias",
        verbose_name=_("Video"),
    )

    title = models.CharField(
        blank=True,
        null=True,
        max_length=255,
        verbose_name=_("title"),
        help_text=_("title of the shared live media"),
    )

    show_download = models.BooleanField(default=True)

    nb_pages = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text=_("Number of pages contained by the media"),
    )

    extension = models.CharField(
        blank=True,
        default=None,
        help_text=_("media extension"),
        max_length=10,
        null=True,
        verbose_name=_("extension"),
    )

    process_pipeline = models.CharField(
        max_length=255,
        verbose_name=_("process pipeline"),
        help_text=_("Pipeline used to process the shared live media"),
        choices=PROCESS_PIPELINE_CHOICES,
        default=CELERY_PIPELINE,
    )

    class Meta:
        """Options for the ``SharedLiveMedia`` model."""

        db_table = "shared_live_media"
        verbose_name = _("shared live media")
        verbose_name_plural = _("shared live medias")

    def get_source_s3_key(self, stamp=None, extension=None):
        """Compute the S3 key in the source bucket.

        It is built from the video ID + ID of the shared live media + version stamp.

        Parameters
        ----------
        stamp: Type[string]
            Passing a value for this argument will return the source S3 key for the shared live
            media assuming its active stamp is set to this value. This is useful to create an
            upload policy for this prospective version of the track, so that the client can
            upload the file to S3 and the confirmation lambda can set the `uploaded_on` field
            to this value only after the file upload and processing is successful.


        extension: Type[string]
            The extension used by the uploaded media. This extension is added at the end of the key
            to keep a record of the extension. We will use it in the update-state endpoint to
            record it in the database.

        Returns
        -------
        string
            The S3 key for the shared live media in the source bucket, where uploaded files are
            stored before they are converted and copied to the destination bucket.

        """
        # We don't want to deal with None value so we set it with an empty string
        extension = extension or ""

        # We check if the extension starts with a leading dot or not. If it's not the case we add
        # it at the beginning of the string
        if extension and not extension.startswith("."):
            extension = "." + extension

        stamp = stamp or self.uploaded_on_stamp()
        return f"{self.video.pk}/sharedlivemedia/{self.pk}/{stamp}{extension}"

    def get_videos_storage_prefix(
        self,
        stamp=None,
        base_dir: VIDEOS_STORAGE_BASE_DIRECTORY = VOD_VIDEOS_STORAGE_BASE_DIRECTORY,
    ):
        """Compute the videos storage prefix for the shared live media.

        Parameters
        ----------
        stamp: Type[string]
            Passing a value for this argument will return the videos storage prefix for the shared
            live media assuming its active stamp is set to this value. This is useful to create
            an upload policy for this prospective version of the shared live media, so that the
            client can upload the file and celery task can set the `uploaded_on` field to this
            value.

        base_dir: Type[VIDEOS_STORAGE_BASE_DIRECTORY]
            The videos storage base directory. Defaults to VOD. It will be used to compute the
            videos storage prefix.

        Returns
        -------
        string
            The videos storage prefix for the shared live media.
        """
        stamp = stamp or self.uploaded_on_stamp()
        base = base_dir
        if base_dir == DELETED_VIDEOS_STORAGE_BASE_DIRECTORY:
            base = f"{DELETED_VIDEOS_STORAGE_BASE_DIRECTORY}/{VOD_VIDEOS_STORAGE_BASE_DIRECTORY}"

        return f"{base}/{self.video.pk}/sharedlivemedia/{self.pk}/{stamp}"

    def update_upload_state(self, upload_state, uploaded_on, **extra_parameters):
        """Manage upload state.

        Parameters
        ----------
        upload_state: Type[string]
            state of the upload in AWS.

        uploaded_on: Type[DateTime]
            datetime at which the active version of the file was uploaded.

        extra_parameters: Type[Dict]
            Dictionary containing arbitrary data sent from AWS lambda.
        """
        if "nbPages" in extra_parameters:
            self.nb_pages = extra_parameters.get("nbPages")

        if "extension" in extra_parameters:
            self.extension = extra_parameters.get("extension")

        super().update_upload_state(upload_state, uploaded_on, **extra_parameters)

        # This function is imported using import_string to avoid circular import error.
        channel_layers_utils = import_string(
            "marsha.websocket.utils.channel_layers_utils"
        )
        channel_layers_utils.dispatch_shared_live_media(self)
        channel_layers_utils.dispatch_video(self.video, to_admin=True)
