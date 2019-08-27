"""This module holds the models for the marsha project."""
from django.conf import settings
from django.db import models
from django.utils.functional import lazy
from django.utils.translation import gettext_lazy as _

from ..defaults import PENDING, STATE_CHOICES
from ..utils.time_utils import to_timestamp
from .base import AbstractImage, BaseModel
from .file import BaseFile


class Video(BaseFile):
    """Model representing a video, created by an author."""

    RESOURCE_NAME = "videos"

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
            )
        ]

    @property
    def is_ready_to_play(self):
        """Whether the video is ready to play (ie) has been sucessfully uploaded.

        The value of this field seems to be trivially derived from the value of the
        `uploaded_on` field but it is necessary for conveniency and clarity in the client.
        """
        return self.uploaded_on is not None

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
        return "{pk!s}/video/{pk!s}/{stamp:s}".format(pk=self.pk, stamp=stamp)


class BaseTrack(BaseModel):
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
    uploaded_on = models.DateTimeField(
        verbose_name=_("uploaded on"),
        help_text=_("datetime at which the active version of the video was uploaded."),
        null=True,
        blank=True,
    )
    upload_state = models.CharField(
        max_length=20,
        verbose_name=_("upload state"),
        help_text=_("state of the upload and transcoding pipeline in AWS."),
        choices=STATE_CHOICES,
        default=PENDING,
    )

    class Meta:
        """Options for the ``BaseTrack`` model."""

        abstract = True

    @property
    def is_ready_to_play(self):
        """Whether the track is ready to play (ie) has been sucessfully uploaded.

        The value of this field seems to be trivially derived from the value of the
        `uploaded_on` field but it is necessary for conveniency and clarity in the client.
        """
        return self.uploaded_on is not None


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
        return "{video!s}/timedtexttrack/{pk!s}/{stamp:s}_{language:s}{mode:s}".format(
            video=self.video.pk,
            pk=self.pk,
            stamp=stamp,
            language=self.language,
            mode="_{:s}".format(self.mode) if self.mode else "",
        )


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
        return "{video!s}/thumbnail/{pk!s}/{stamp:s}".format(
            video=self.video.pk, pk=self.pk, stamp=stamp
        )
