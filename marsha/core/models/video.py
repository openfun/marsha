"""This module holds the models for the marsha project."""

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from safedelete import HARD_DELETE

from .account import INSTRUCTOR, ROLE_CHOICES
from .base import BaseModel, NonDeletedUniqueIndex


class Playlist(BaseModel):
    """Model representing a playlist which is a list of videos."""

    name = models.CharField(
        max_length=255, verbose_name=_("name"), help_text=_("name of the playlist")
    )
    lti_id = models.CharField(
        max_length=255,
        verbose_name=_("lti id"),
        help_text=_("ID for synchronization with an external LTI tool"),
    )
    organization = models.ForeignKey(
        to="Organization",
        related_name="playlists",
        # playlist is (soft-)deleted if organization is (soft-)deleted
        on_delete=models.CASCADE,
        null=True,
    )
    created_by = models.ForeignKey(
        to="User",
        related_name="created_playlists",
        # playlist is (soft-)deleted if author is (soft-)deleted
        on_delete=models.CASCADE,
        null=True,
    )
    is_public = models.BooleanField(
        default=False,
        verbose_name=_("is public"),
        help_text=_("if this playlist can be viewed without any access control"),
    )
    duplicated_from = models.ForeignKey(
        to="self",
        related_name="duplicates",
        verbose_name=_("duplicate from"),
        help_text=_("original playlist this one was duplicated from"),
        # don't delete a playlist if the one it was duplicated from is hard deleted
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    users = models.ManyToManyField(
        to="User",
        through="PlaylistAccess",
        related_name="playlists",
        verbose_name=_("users"),
        help_text=_("users who have been granted access to this playlist"),
    )

    class Meta:
        """Options for the ``Playlist`` model."""

        db_table = "playlist"
        verbose_name = _("playlist")
        verbose_name_plural = _("playlists")


class PlaylistAccess(BaseModel):
    """
    Model representing accesses to playlists that are granted to users.

    ``through`` model between ``Playlist.users`` and ``User.playlists``.

    """

    # we allow deleting entries in this through table
    _safedelete_policy = HARD_DELETE

    user = models.ForeignKey(
        to="User",
        related_name="playlist_accesses",
        verbose_name=_("user"),
        help_text=_("user who has access to the playlist"),
        # link is (soft-)deleted if user is (soft-)deleted
        on_delete=models.CASCADE,
    )
    playlist = models.ForeignKey(
        to="Playlist",
        related_name="user_accesses",
        verbose_name=_("playlist"),
        help_text=_("playlist to which the user has access"),
        # link is (soft-)deleted if playlist is (soft-)deleted
        on_delete=models.CASCADE,
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        verbose_name=_("role"),
        help_text=_("role granted to the user on the consumer site"),
        default=INSTRUCTOR,
    )

    class Meta:
        """Options for the ``PlaylistAccess`` model."""

        db_table = "playlist_access"
        verbose_name = _("playlist access")
        verbose_name_plural = _("playlist accesses")
        indexes = [NonDeletedUniqueIndex(["user", "playlist"])]


class Video(BaseModel):
    """Model representing a video, created by an author."""

    name = models.CharField(
        max_length=255, verbose_name=_("name"), help_text=_("name of the video")
    )
    description = models.TextField(
        verbose_name=_("description"),
        help_text=_("description of the video"),
        blank=True,
        null=True,
    )
    lti_id = models.CharField(
        max_length=255,
        verbose_name=_("lti id"),
        help_text=_("ID for synchronization with an external LTI tool"),
    )
    created_by = models.ForeignKey(
        to="User",
        related_name="created_videos",
        verbose_name=_("author"),
        help_text=_("author of the video"),
        # video is (soft-)deleted if author is (soft-)deleted
        on_delete=models.CASCADE,
        null=True,
    )
    language = models.CharField(
        max_length=5,
        choices=settings.LANGUAGES,
        verbose_name=_("language"),
        help_text=_("language of the video"),
    )
    playlist = models.ForeignKey(
        to="Playlist",
        related_name="videos",
        verbose_name=_("playlist"),
        help_text=_("playlist to which this video belongs"),
        # don't allow hard deleting a playlist if it still contains videos
        on_delete=models.PROTECT,
    )
    order = models.PositiveIntegerField(
        verbose_name=_("order"), help_text=_("video order in the playlist"), default=0
    )
    duplicated_from = models.ForeignKey(
        to="self",
        related_name="duplicates",
        verbose_name=_("duplicate from"),
        help_text=_("original video this one was duplicated from"),
        # don't delete a video if the one it was duplicated from is hard deleted
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    class Meta:
        """Options for the ``Video`` model."""

        db_table = "video"
        ordering = ["order", "id"]
        verbose_name = _("video")
        verbose_name_plural = _("videos")

    def __str__(self):
        """Get the string representation of an instance."""
        result = f"{self.name} by f{self.created_by.username}"
        if self.deleted:
            result += _(" [deleted]")
        return result


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
        max_length=5,
        choices=settings.LANGUAGES,
        verbose_name=_("track language"),
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
        indexes = [NonDeletedUniqueIndex(["video", "language"])]


class SubtitleTrack(BaseTrack):
    """Model representing a subtitle track for a video."""

    has_closed_captioning = models.BooleanField(
        default=False,
        verbose_name=_("closed captioning"),
        help_text=_(
            "if closed captioning (for deaf or hard of hearing viewers) "
            "is on for this subtitle track"
        ),
    )

    class Meta:
        """Options for the ``SubtitleTrack`` model."""

        db_table = "subtitle_track"
        verbose_name = _("subtitles track")
        verbose_name_plural = _("subtitles tracks")
        indexes = [
            NonDeletedUniqueIndex(["video", "language", "has_closed_captioning"])
        ]


class SignTrack(BaseTrack):
    """Model representing a signs language track for a video."""

    class Meta:
        """Options for the ``SignTrack`` model."""

        db_table = "sign_track"
        verbose_name = _("signs language track")
        verbose_name_plural = _("signs language tracks")
        indexes = [NonDeletedUniqueIndex(["video", "language"])]
