"""This module holds the models for the marsha project."""
import secrets

from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.utils import timezone
from django.utils.functional import lazy
from django.utils.translation import gettext_lazy as _

from safedelete import HARD_DELETE_NOCASCADE

from ..defaults import DELETED, HARVESTED, IDLE, LIVE_CHOICES, LIVE_TYPE_CHOICES
from ..utils.time_utils import to_timestamp
from .base import BaseModel
from .file import AbstractImage, BaseFile, UploadableFileMixin


class Video(BaseFile):
    """Model representing a video, created by an author."""

    RESOURCE_NAME = "videos"

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

    class Meta:
        """Options for the ``Video`` model."""

        db_table = "video"
        ordering = ["position", "id"]
        verbose_name = _("video")
        verbose_name_plural = _("videos")
        constraints = [
            models.UniqueConstraint(
                fields=["lti_id", "playlist"],
                condition=models.Q(deleted=None),
                name="video_unique_idx",
            ),
            models.CheckConstraint(
                name="live_type_check",
                check=models.expressions.RawSQL(
                    "(live_state IS NULL) = (live_type IS NULL)",
                    {},
                    models.fields.BooleanField(),
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
        stamp = stamp or to_timestamp(self.uploaded_on)
        return f"{self.pk}/video/{self.pk}/{stamp}"

    def update_upload_state(self, upload_state, uploaded_on, **extra_parameters):
        """Manage upload state.

        Parameters
        ----------
        upload_state: Type[string]
            state of the upload in AWS.

        uploaded_on: Type[DateTime]
            datetime at which the active version of the file was uploaded.

        extra_paramters: Type[Dict]
            Dictionnary containing arbitrary data sent from AWS lambda.
        """
        if "resolutions" in extra_parameters:
            self.resolutions = extra_parameters.get("resolutions")

        if upload_state == HARVESTED:
            # reset live state and info
            self.live_state = None
            self.live_info = None
            self.live_type = None

        super().update_upload_state(upload_state, uploaded_on, **extra_parameters)

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
        """Whether the file is ready to display (ie) has been sucessfully uploaded.

        The value of this field seems to be trivially derived from the value of the
        `uploaded_on` field but it is necessary for conveniency and clarity in the client.
        """
        return (
            self.uploaded_on is not None
            and self.upload_state not in [HARVESTED, DELETED]
        ) or self.live_state is not None

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
        """Return the mediapackage enspoints info."""
        return self.live_info.get("mediapackage").get("endpoints")


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
        stamp = stamp or to_timestamp(self.uploaded_on)
        mode = f"_{self.mode}" if self.mode else ""
        return f"{self.video.pk}/timedtexttrack/{self.pk}/{stamp}_{self.language}{mode}"

    def update_upload_state(self, upload_state, uploaded_on, **extra_parameters):
        """Manage upload state.

        Parameters
        ----------
        upload_state: Type[string]
            state of the upload in AWS.

        uploaded_on: Type[DateTime]
            datetime at which the active version of the file was uploaded.

        extra_paramters: Type[Dict]
            Dictionnary containing arbitrary data sent from AWS lambda.
        """
        if "extension" in extra_parameters:
            self.extension = extra_parameters["extension"]

        super().update_upload_state(upload_state, uploaded_on, **extra_parameters)


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

    video = models.OneToOneField(
        to="Video",
        related_name="thumbnail",
        verbose_name=_("video"),
        help_text=_("video for which this thumbnail is"),
        # Thumbnails is (soft-)deleted if video is (soft-)deleted
        on_delete=models.CASCADE,
    )

    class Meta:
        """Options for the ``Thumbnail`` model."""

        db_table = "video_thumbnail"
        verbose_name = _("thumbnail")
        ordering = ["-created_on", "id"]

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
        stamp = stamp or to_timestamp(self.uploaded_on)
        return f"{self.video.pk}/thumbnail/{self.pk}/{stamp}"


class LiveRegistration(BaseModel):
    """Model representing a scheduling live registration."""

    RESOURCE_NAME = "liveregistrations"

    email = models.EmailField(_("email address"), db_index=True)

    consumer_site = models.ForeignKey(
        blank=True,
        help_text=_("Only present for lti users."),
        null=True,
        on_delete=models.CASCADE,
        related_name="liveregistrations",
        to="ConsumerSite",
        verbose_name=_("LTI consumer site"),
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

    should_send_reminders = models.BooleanField(
        default=False,
        help_text=_("whether user reminders are enabled for this live"),
        verbose_name=_("should send reminders"),
    )

    video = models.ForeignKey(
        Video,
        on_delete=models.CASCADE,
        related_name="liveregistrations",
        verbose_name=_("Video"),
    )

    class Meta:
        """Options for the `liveregistrations` model."""

        db_table = "live_registration"
        constraints = [
            models.UniqueConstraint(
                fields=("email", "consumer_site", "video"),
                condition=models.Q(deleted=None),
                name="liveregistration_unique_email_consumer_site_video_idx",
            ),
            models.UniqueConstraint(
                fields=["email", "video"],
                condition=models.Q(deleted=None, consumer_site=None),
                name="liveregistration_unique_email_video_with_consumer_site_none",
            ),
            models.UniqueConstraint(
                condition=models.Q(("deleted", None)),
                fields=("lti_user_id", "consumer_site", "video"),
                name="liveregistration_unique_video_lti_idx",
            ),
        ]

        verbose_name = _("live registration")


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

        stamp = stamp or to_timestamp(self.uploaded_on)
        return f"{self.video.pk}/sharedlivemedia/{self.pk}/{stamp}{extension}"
