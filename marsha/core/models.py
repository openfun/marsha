"""This module holds the models for the marsha project."""

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

from safedelete import HARD_DELETE

from marsha.core.base_models import BaseModel, NonDeletedUniqueIndex
from marsha.core.managers import UserManager


ADMINISTRATOR, INSTRUCTOR, STUDENT = ("administrator", "instructor", "student")
ROLE_CHOICES = (
    (ADMINISTRATOR, _("administrator")),
    (INSTRUCTOR, _("instructor")),
    (STUDENT, _("student")),
)


class User(BaseModel, AbstractUser):
    """Model representing a user that can be authenticated to act on the Marsha instance."""

    objects = UserManager()

    class Meta:
        """Options for the ``User`` model."""

        db_table = "user"
        verbose_name = _("user")
        verbose_name_plural = _("users")

    def __str__(self):
        """Get the string representation of an instance."""
        result = f"{self.username}"
        if self.email:
            result += f" ({self.email})"
        if self.deleted:
            result += _(" [deleted]")
        return result


class LTIPassport(BaseModel):
    """
    Model representing an LTI passport for LTI consumers to interact with Marsha.

    An LTI passport stores credentials that can be used by an LTI consumer to interact with
    Marsha as an LTI provider.

    """

    oauth_consumer_key = models.CharField(
        max_length=255,
        verbose_name=_("oauth consumer key"),
        help_text=_(
            "oauth consumer key to authenticate an LTI consumer on the LTI provider"
        ),
    )
    shared_secret = models.CharField(
        max_length=255,
        verbose_name=_("shared secret"),
        help_text=_("LTI Shared secret"),
    )
    created_by = models.ForeignKey(
        to=User,
        related_name="lti_passports",
        # don't delete an LTI passport if the user who created it is hard deleted
        on_delete=models.SET_NULL,
        null=True,
    )
    is_enabled = models.BooleanField(
        verbose_name=_("is enabled"), help_text=_("whether the passport is enabled")
    )

    class Meta:
        """Options for the ``LTIPassport`` model."""

        db_table = "lti_passport"
        verbose_name = _("LTI passport")
        verbose_name_plural = _("LTI passports")


class LTIPassportScope(BaseModel):
    """
    Model representing the scope of an LTI passport.

    A passport can be granted for:
    - a playlist: to be used when we trust an instructor. A playlist pre-exists in Marsha. The
        course instructor receives credentials and associates them at the level of his/her
        course to handle the course videos inside the playlist.
    - a consumer site: to be used when we trust the administrator of a VLE (virtual learning
        environment). The administrator receives credentials and associates them at the level
        of the VLE so that all instructors on the VLE can handle their videos inside playlists
        that will be created on the fly.

    """

    lti_passport = models.ForeignKey(
        to=LTIPassport,
        related_name="scopes",
        # Scope is (soft-)deleted if related LTI passport is (soft-)deleted
        on_delete=models.CASCADE,
    )
    consumer_site = models.ForeignKey(
        to="LTIPassport",
        related_name="lti_passport_scopes",
        # don't allow hard deleting a consumer site if it is still linked to a passport
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )
    playlist = models.ForeignKey(
        to="Playlist",
        related_name="lti_passport_scopes",
        # don't allow hard deleting a playlist if it is still linked to a passport
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )

    class Meta:
        """Options for the ``LTIPassportScope`` model."""

        db_table = "lti_passport_scope"
        verbose_name = _("LTI passport scope")
        verbose_name_plural = _("LTI passport scopes")


class ConsumerSite(BaseModel):
    """Model representing an external site with access to the Marsha instance."""

    name = models.CharField(
        max_length=255, verbose_name=_("name"), help_text=_("Name of the site")
    )
    users = models.ManyToManyField(
        to=User,
        through="ConsumerSiteAccess",
        verbose_name=_("users"),
        help_text=_("users who have been granted access to this consumer site"),
    )

    class Meta:
        """Options for the ``ConsumerSite`` model."""

        db_table = "consumer_site"
        verbose_name = _("consumer site")
        verbose_name_plural = _("consumer sites")

    def __str__(self):
        """Get the string representation of an instance."""
        result = f"{self.name}"
        if self.deleted:
            result += _(" [deleted]")
        return result


class ConsumerSiteAccess(BaseModel):
    """Model representing accesses to a consumer site that are granted to users."""

    # we allow deleting entries in this through table
    _safedelete_policy = HARD_DELETE

    user = models.ForeignKey(
        to=User,
        related_name="consumersite_accesses",
        verbose_name=_("user"),
        help_text=_("user with access to the consumer site"),
        # link is (soft-)deleted if user is (soft-)deleted
        on_delete=models.CASCADE,
    )
    consumer_site = models.ForeignKey(
        to=ConsumerSite,
        related_name="user_accesses",
        verbose_name=_("site"),
        help_text=_("consumer site to which the user has access"),
        # link is (soft-)deleted if site is (soft-)deleted
        on_delete=models.CASCADE,
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        verbose_name=_("role"),
        help_text=_("role granted to the user on the consumer site"),
        default=ADMINISTRATOR,
    )

    class Meta:
        """Options for the ``ConsumerSiteAccess`` model."""

        db_table = "consumersite_access"
        verbose_name = _("consumer site access")
        verbose_name_plural = _("consumer site accesses")
        indexes = [NonDeletedUniqueIndex(["user", "consumer_site"])]

    def __str__(self):
        """Get the string representation of an instance."""
        kwargs: dict = {
            "user": self.user,
            "consumer_site": self.consumer_site,
            "role": self.get_role_display(),
        }
        if self.deleted:
            return _("{user} was {role} of {consumer_site}").format(**kwargs)
        return _("{user} is {role} of {consumer_site}").format(**kwargs)


class Organization(BaseModel):
    """Model representing an organization to manage its playlists on one or many sites."""

    name = models.CharField(
        max_length=255, verbose_name=_("name"), help_text=_("name of the organization")
    )
    consumer_sites = models.ManyToManyField(
        to=ConsumerSite,
        through="ConsumerSiteOrganization",
        related_name="organizations",
        verbose_name="consumer sites",
        help_text=_("consumer sites on which this organization is present"),
    )
    users = models.ManyToManyField(
        to=User,
        through="OrganizationAccess",
        verbose_name=_("users"),
        help_text=_("users who have been granted access to this organization"),
    )

    class Meta:
        """Options for the ``Organization`` model."""

        db_table = "organization"
        verbose_name = _("organization")
        verbose_name_plural = _("organizations")

    def __str__(self):
        """Get the string representation of an instance."""
        result = f"{self.name}"
        if self.deleted:
            result += _(" [deleted]")
        return result


class ConsumerSiteOrganization(BaseModel):
    """Model representing organizations in sites.

    ``through`` model between ``Organization.sites`` and ``ConsumerSite.organizations``.

    """

    # we allow deleting entries in this through table
    _safedelete_policy = HARD_DELETE

    consumer_site = models.ForeignKey(
        to=ConsumerSite,
        related_name="organizations_links",
        verbose_name=_("site"),
        help_text=_("consumer site having this organization"),
        # link is (soft-)deleted if site is (soft-)deleted
        on_delete=models.CASCADE,
    )
    organization = models.ForeignKey(
        to=Organization,
        related_name="sites_links",
        verbose_name=_("organization"),
        help_text=_("organization in this consumer site"),
        # link is (soft-)deleted if organization is (soft-)deleted
        on_delete=models.CASCADE,
    )

    class Meta:
        """Options for the ``ConsumerSiteOrganization`` model."""

        db_table = "consumersite_organization"
        verbose_name = _("organization in consumer site")
        verbose_name_plural = _("organizations in consumer sites")
        indexes = [NonDeletedUniqueIndex(["consumer_site", "organization"])]

    def __str__(self):
        """Get the string representation of an instance."""
        kwargs = {
            "organization": self.organization,
            "consumer_site": self.consumer_site,
        }
        if self.deleted:
            return _("{organization} was in {consumer_site}").format(**kwargs)
        return _("{organization} is in {consumer_site}").format(**kwargs)


class OrganizationAccess(BaseModel):
    """
    Model representing accesses to an organization that are granted to users.

    ``through`` model between ``Organization.users`` and ``User.linked_organizations``.

    """

    # we allow deleting entries in this through table
    _safedelete_policy = HARD_DELETE

    user = models.ForeignKey(
        to=User,
        related_name="organization_accesses",
        verbose_name=_("user"),
        help_text=_("user who has access to the organization"),
        # link is (soft-)deleted if user is (soft-)deleted
        on_delete=models.CASCADE,
    )
    organization = models.ForeignKey(
        to=Organization,
        related_name="user_accesses",
        verbose_name=_("organization"),
        help_text=_("organization to which the user has access"),
        # link is (soft-)deleted if organization is (soft-)deleted
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
        """Options for the ``OrganizationManager`` model."""

        db_table = "organization_access"
        verbose_name = _("organization access")
        verbose_name_plural = _("organization accesses")
        indexes = [NonDeletedUniqueIndex(["user", "organization"])]

    def __str__(self):
        """Get the string representation of an instance."""
        kwargs = {
            "user": self.user,
            "organization": self.organization,
            "role": self.get_role_display(),
        }
        if self.deleted:
            return _("{user} was {role} of {organization}").format(**kwargs)

        return _("{user} is {role} of {organization}").format(**kwargs)


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
        to=User,
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
        to=Video,
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

        abstract: bool = True


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
        to=Organization,
        related_name="playlists",
        # playlist is (soft-)deleted if organization is (soft-)deleted
        on_delete=models.CASCADE,
        null=True,
    )
    created_by = models.ForeignKey(
        to=User,
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
        to=User,
        through="PlaylistAccess",
        related_name="playlists",
        verbose_name=_("users"),
        help_text=_("users who have been granted access to this playlist"),
    )
    videos = models.ManyToManyField(
        to=Video,
        through="PlaylistVideo",
        related_name="playlists",
        verbose_name=_("videos"),
        help_text=_("videos in this playlist"),
    )

    class Meta:
        """Options for the ``Playlist`` model."""

        db_table = "playlist"
        verbose_name = _("playlist")
        verbose_name_plural = _("playlists")


class PlaylistVideo(BaseModel):
    """Model representing a video in a playlist.

    ``through`` model between ``Playlist.videos`` and ``Video.playlists``.

    """

    # we allow deleting entries in this through table
    _safedelete_policy = HARD_DELETE

    video = models.ForeignKey(
        to=Video,
        related_name="playlist_links",
        verbose_name=_("video"),
        help_text=_("video contained in this playlist"),
        # link is (soft-)deleted if video is (soft-)deleted
        on_delete=models.CASCADE,
    )
    playlist = models.ForeignKey(
        to=Playlist,
        related_name="video_links",
        verbose_name=_("playlist"),
        help_text=_("playlist containing this video"),
        # link is (soft-)deleted if playlist is (soft-)deleted
        on_delete=models.CASCADE,
    )
    order = models.PositiveIntegerField(
        verbose_name=_("order"), help_text=_("video order in the playlist"), default=0
    )

    class Meta:
        """Options for the ``PlaylistVideo`` model."""

        db_table = "playlist_video"
        verbose_name = _("playlist video link")
        verbose_name_plural = _("playlist video links")
        ordering = ["order", "id"]
        indexes = [NonDeletedUniqueIndex(["video", "playlist"])]


class PlaylistAccess(BaseModel):
    """
    Model representing accesses to playlists that are granted to users.

    ``through`` model between ``Playlist.users`` and ``User.playlists``.

    """

    # we allow deleting entries in this through table
    _safedelete_policy = HARD_DELETE

    user = models.ForeignKey(
        to=User,
        related_name="playlist_accesses",
        verbose_name=_("user"),
        help_text=_("user who has access to the playlist"),
        # link is (soft-)deleted if user is (soft-)deleted
        on_delete=models.CASCADE,
    )
    playlist = models.ForeignKey(
        to=Playlist,
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
