"""This module holds the models for the marsha project."""

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

from safedelete import HARD_DELETE

from marsha.core.base_models import BaseModel, NonDeletedUniqueIndex
from marsha.core.managers import UserManager
from marsha.stubs import M2MType, ReverseFKType


class User(BaseModel, AbstractUser):
    """Model representing a user that can be authenticated to act on the Marsha instance."""

    # `related_name` of fields pointing to this model, for typing
    administrated_sites: M2MType["ConsumerSite"]
    sites_admins: ReverseFKType["SiteAdmin"]
    managed_organizations: M2MType["Organization"]
    author_organizations: M2MType["Organization"]
    authoring: ReverseFKType["Authoring"]
    authored_videos: ReverseFKType["Video"]
    created_playlists: ReverseFKType["Playlist"]
    managed_playlists: M2MType["Playlist"]
    playlists_accesses: ReverseFKType["PlaylistAccess"]
    managed_organizations_links: ReverseFKType["OrganizationManager"]

    objects = UserManager()

    class Meta:
        """Options for the ``User`` model."""

        db_table: str = "user"
        verbose_name: str = _("user")
        verbose_name_plural: str = _("users")

    def __str__(self) -> str:
        """Get the string representation of an instance."""
        result: str = f"{self.username}"
        if self.email:
            result += f" ({self.email})"
        if self.deleted:
            result += _(" [deleted]")
        return result


class ConsumerSite(BaseModel):
    """Model representing an external site with access to the Marsha instance."""

    name: str = models.CharField(
        max_length=255, verbose_name=_("name"), help_text=_("Name of the site")
    )
    admins: M2MType["User"] = models.ManyToManyField(
        to=User,
        through="SiteAdmin",
        related_name="administrated_sites",
        verbose_name=_("administrators"),
        help_text=_("users able to manage this site"),
    )

    # `related_name` of fields pointing to this model, for typing
    sites_admins: ReverseFKType["SiteAdmin"]
    organizations: M2MType["Organization"]
    organizations_links: ReverseFKType["SiteOrganization"]

    class Meta:
        """Options for the ``ConsumerSite`` model."""

        db_table: str = "consumer_site"
        verbose_name: str = _("site")
        verbose_name_plural: str = _("sites")

    def __str__(self) -> str:
        """Get the string representation of an instance."""
        result: str = f"{self.name}"
        if self.deleted:
            result += _(" [deleted]")
        return result


class SiteAdmin(BaseModel):
    """Model representing users with access to manage a site.

    ``through`` model between ``ConsumerSite.admins`` and ``User.administrated_sites``.

    """

    # we allow deleting entries in this through table
    _safedelete_policy = HARD_DELETE

    user: User = models.ForeignKey(
        to=User,
        related_name="sites_admins",
        verbose_name=_("user"),
        help_text=_("user with access to the site"),
        # link is (soft-)deleted if user is (soft-)deleted
        on_delete=models.CASCADE,
    )
    site: ConsumerSite = models.ForeignKey(
        to=ConsumerSite,
        related_name="sites_admins",
        verbose_name=_("site"),
        help_text=_("site to which the user has access"),
        # link is (soft-)deleted if site is (soft-)deleted
        on_delete=models.CASCADE,
    )

    class Meta:
        """Options for the ``SiteAdmin`` model."""

        db_table: str = "site_admin"
        verbose_name: str = _("site admin")
        verbose_name_plural: str = _("site admins")
        indexes = [NonDeletedUniqueIndex(["user", "site"])]

    def __str__(self) -> str:
        """Get the string representation of an instance."""
        args: dict = {"user": str(self.user), "site": str(self.site)}
        if self.deleted:
            return _("%(user)s was admin of %(site)s") % args
        return _("%(user)s is admin of %(site)s") % args


class Organization(BaseModel):
    """Model representing an organization to manage its playlists on one or many sites."""

    name: str = models.CharField(
        max_length=255, verbose_name=_("name"), help_text=_("name of the organization")
    )
    sites: M2MType[ConsumerSite] = models.ManyToManyField(
        to=ConsumerSite,
        through="SiteOrganization",
        related_name="organizations",
        verbose_name="sites",
        help_text=_("sites where this organization is present"),
    )
    managers: M2MType[User] = models.ManyToManyField(
        to=User,
        through="OrganizationManager",
        related_name="managed_organizations",
        verbose_name=_("managers"),
        help_text=_("users able to manage this organization"),
    )
    authors: M2MType[User] = models.ManyToManyField(
        to=User,
        through="Authoring",
        related_name="author_organizations",
        verbose_name=_("authors"),
        help_text=_("users able to manage playlists in this organization"),
    )

    # `related_name` of fields pointing to this model, for typing
    authoring: ReverseFKType["Authoring"]
    playlists: ReverseFKType["Playlist"]
    sites_links: ReverseFKType["SiteOrganization"]
    managers_links: ReverseFKType["OrganizationManager"]

    class Meta:
        """Options for the ``Organization`` model."""

        db_table: str = "organization"
        verbose_name: str = _("organization")
        verbose_name_plural: str = _("organizations")

    def __str__(self) -> str:
        """Get the string representation of an instance."""
        result: str = f"{self.name}"
        if self.deleted:
            result += _(" [deleted]")
        return result


class SiteOrganization(BaseModel):
    """Model representing organizations in sites.

    ``through`` model between ``Organization.sites`` and ``ConsumerSite.organizations``.

    """

    # we allow deleting entries in this through table
    _safedelete_policy = HARD_DELETE

    site: ConsumerSite = models.ForeignKey(
        to=ConsumerSite,
        related_name="organizations_links",
        verbose_name=_("site"),
        help_text=_("site having this organization"),
        # link is (soft-)deleted if site is (soft-)deleted
        on_delete=models.CASCADE,
    )
    organization: Organization = models.ForeignKey(
        to=Organization,
        related_name="sites_links",
        verbose_name=_("organization"),
        help_text=_("organization in this site"),
        # link is (soft-)deleted if organization is (soft-)deleted
        on_delete=models.CASCADE,
    )

    class Meta:
        """Options for the ``SiteOrganization`` model."""

        db_table: str = "site_organization"
        verbose_name: str = _("organization in site")
        verbose_name_plural: str = _("organizations in sites")
        indexes = [NonDeletedUniqueIndex(["site", "organization"])]

    def __str__(self) -> str:
        """Get the string representation of an instance."""
        args: dict = {"organization": str(self.organization), "site": str(self.site)}
        if self.deleted:
            return _("%(organization)s was in %(site)s") % args
        return _("%(organization)s is in %(site)s") % args


class OrganizationManager(BaseModel):
    """Model representing managers of organizations.

    ``through`` model between ``Organization.managers`` and ``User.managed_organizations``.

    """

    # we allow deleting entries in this through table
    _safedelete_policy = HARD_DELETE

    user: User = models.ForeignKey(
        to=User,
        related_name="managed_organizations_links",
        verbose_name=_("manager"),
        help_text=_("user managing this organization"),
        # link is (soft-)deleted if user is (soft-)deleted
        on_delete=models.CASCADE,
    )
    organization: Organization = models.ForeignKey(
        to=Organization,
        related_name="managers_links",
        verbose_name=_("organization"),
        help_text=_("organization managed by this user"),
        # link is (soft-)deleted if organization is (soft-)deleted
        on_delete=models.CASCADE,
    )

    class Meta:
        """Options for the ``OrganizationManager`` model."""

        db_table: str = "organization_manager"
        verbose_name: str = _("organization manager")
        verbose_name_plural: str = _("organizations managers")
        indexes = [NonDeletedUniqueIndex(["user", "organization"])]

    def __str__(self) -> str:
        """Get the string representation of an instance."""
        args: dict = {"user": str(self.user), "organization": str(self.organization)}
        if self.deleted:
            return _("%(user)s was manager of %(organization)s") % args
        return _("%(user)s is manager of %(organization)s") % args


class Authoring(BaseModel):
    """Model representing authors in an organization.

    ``through`` model between ``Organization.authors`` and ``User.authoring``.

    """

    # we allow deleting entries in this through table
    _safedelete_policy = HARD_DELETE

    user: User = models.ForeignKey(
        to=User,
        related_name="authoring",
        verbose_name=_("author"),
        help_text=_("user having authoring access in this organization"),
        # link is (soft-)deleted if user is (soft-)deleted
        on_delete=models.CASCADE,
    )
    organization: Organization = models.ForeignKey(
        to=Organization,
        related_name="authoring",
        verbose_name=_("organization"),
        help_text=_("organization on which the user is an author"),
        # link is (soft-)deleted if organization is (soft-)deleted
        on_delete=models.CASCADE,
    )

    class Meta:
        """Options for the ``Authoring`` model."""

        db_table: str = "authoring"
        verbose_name: str = _("author in organization")
        verbose_name_plural: str = _("authors in organizations")
        indexes = [NonDeletedUniqueIndex(["user", "organization"])]

    def __str__(self) -> str:
        """Get the string representation of an instance."""
        args: dict = {"user": str(self.user), "organization": str(self.organization)}
        if self.deleted:
            return _("%(user)s was author in %(organization)s") % args
        return _("%(user)s is author in %(organization)s") % args


class Video(BaseModel):
    """Model representing a video, by an author."""

    name: str = models.CharField(
        max_length=255, verbose_name=_("name"), help_text=_("name of the video")
    )

    description: str = models.TextField(
        verbose_name=_("description"),
        help_text=_("description of the video"),
        blank=True,
        null=True,
    )

    author: User = models.ForeignKey(
        to=User,
        related_name="authored_videos",
        verbose_name=_("author"),
        help_text=_("author of the video"),
        # video is (soft-)deleted if author is (soft-)deleted
        on_delete=models.CASCADE,
        null=True,
    )
    language: str = models.CharField(
        max_length=5,
        choices=settings.LANGUAGES,
        verbose_name=_("language"),
        help_text=_("language of the video"),
    )
    duplicated_from: "Video" = models.ForeignKey(
        to="self",
        related_name="duplicates",
        verbose_name=_("duplicate from"),
        help_text=_("original video this one was duplicated from"),
        # don't delete a video if the one it was duplicated from is hard deleted
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    # `related_name` of fields pointing to this model, for typing
    audiotracks: ReverseFKType["AudioTrack"]
    subtitletracks: ReverseFKType["SubtitleTrack"]
    signtracks: ReverseFKType["SignTrack"]
    duplicates: ReverseFKType["Video"]
    playlists: M2MType["Playlist"]
    playlists_links: ReverseFKType["PlaylistVideo"]

    class Meta:
        """Options for the ``Video`` model."""

        db_table: str = "video"
        verbose_name: str = _("video")
        verbose_name_plural: str = _("videos")

    def __str__(self) -> str:
        """Get the string representation of an instance."""
        result: str = f"{self.name} by f{self.author.username}"
        if self.deleted:
            result += _(" [deleted]")
        return result


class BaseTrack(BaseModel):
    """Base model for different kinds of tracks tied to a video."""

    video: Video = models.ForeignKey(
        to=Video,
        related_name="%(class)ss",  # will be `audiotracks` for `AudioTrack` model,
        verbose_name=_("video"),
        help_text=_("video for which this track is"),
        # track is (soft-)deleted if video is (soft-)deleted
        on_delete=models.CASCADE,
    )
    language: str = models.CharField(
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

    # annotate inherited fields for mypy
    video: Video
    language: str

    class Meta:
        """Options for the ``AudioTrack`` model."""

        db_table: str = "audio_track"
        verbose_name: str = _("audio track")
        verbose_name_plural: str = _("audio tracks")
        indexes = [NonDeletedUniqueIndex(["video", "language"])]


class SubtitleTrack(BaseTrack):
    """Model representing a subtitle track for a video."""

    has_closed_captioning: bool = models.BooleanField(
        default=False,
        verbose_name=_("closed captioning"),
        help_text=_(
            "if closed captioning (for death or hard of hearing viewers) "
            "is on for this subtitle track"
        ),
    )

    # annotate inherited fields for mypy
    video: Video
    language: str

    class Meta:
        """Options for the ``SubtitleTrack`` model."""

        db_table: str = "subtitle_track"
        verbose_name: str = _("subtitles track")
        verbose_name_plural: str = _("subtitles tracks")
        indexes = [
            NonDeletedUniqueIndex(["video", "language", "has_closed_captioning"])
        ]


class SignTrack(BaseTrack):
    """Model representing a signs language track for a video."""

    # annotate inherited fields for mypy
    video: Video
    language: str

    class Meta:
        """Options for the ``SignTrack`` model."""

        db_table: str = "sign_track"
        verbose_name: str = _("signs language track")
        verbose_name_plural: str = _("signs language tracks")
        indexes = [NonDeletedUniqueIndex(["video", "language"])]


class Playlist(BaseModel):
    """Model representing a playlist which is a list of videos."""

    name: str = models.CharField(
        max_length=255, verbose_name=_("name"), help_text=_("name of the playlist")
    )

    organization: Organization = models.ForeignKey(
        to=Organization,
        related_name="playlists",
        # playlist is (soft-)deleted if organization is (soft-)deleted
        on_delete=models.CASCADE,
        null=True,
    )
    author: User = models.ForeignKey(
        to=User,
        related_name="created_playlists",
        # playlist is (soft-)deleted if author is (soft-)deleted
        on_delete=models.CASCADE,
        null=True,
    )
    editors: M2MType[User] = models.ManyToManyField(
        to=User,
        through="PlaylistAccess",
        related_name="managed_playlists",
        verbose_name=_("editors"),
        help_text=_("users allowed to manage this playlist"),
    )
    is_public: bool = models.BooleanField(
        default=False,
        verbose_name=_("is public"),
        help_text=_("if this playlist can be viewed without any access control"),
    )
    duplicated_from: "Playlist" = models.ForeignKey(
        to="self",
        related_name="duplicates",
        verbose_name=_("duplicate from"),
        help_text=_("original playlist this one was duplicated from"),
        # don't delete a playlist if the one it was duplicated from is hard deleted
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    videos: M2MType[Video] = models.ManyToManyField(
        to=Video,
        through="PlaylistVideo",
        related_name="playlists",
        verbose_name=_("videos"),
        help_text=_("videos in this playlist"),
    )

    # `related_name` of fields pointing to this model, for typing
    duplicates: ReverseFKType["Playlist"]
    videos_links: ReverseFKType["PlaylistVideo"]
    users_accesses: ReverseFKType["PlaylistAccess"]

    class Meta:
        """Options for the ``Playlist`` model."""

        db_table: str = "playlist"
        verbose_name: str = _("playlist")
        verbose_name_plural: str = _("playlists")


class PlaylistVideo(BaseModel):
    """Model representing a video in a playlist.

    ``through`` model between ``Playlist.videos`` and ``Video.playlists``.

    """

    # we allow deleting entries in this through table
    _safedelete_policy = HARD_DELETE

    video: Video = models.ForeignKey(
        to=Video,
        related_name="playlists_links",
        verbose_name=_("video"),
        help_text=_("video contained in this playlist"),
        # link is (soft-)deleted if video is (soft-)deleted
        on_delete=models.CASCADE,
    )
    playlist: Playlist = models.ForeignKey(
        to=Playlist,
        related_name="videos_links",
        verbose_name=_("playlist"),
        help_text=_("playlist containing this video"),
        # link is (soft-)deleted if playlist is (soft-)deleted
        on_delete=models.CASCADE,
    )
    order: int = models.PositiveIntegerField(
        verbose_name=_("order"), help_text=_("video order in the playlist")
    )

    class Meta:
        """Options for the ``PlaylistVideo`` model."""

        db_table: str = "playlist_video"
        verbose_name: str = _("playlist video link")
        verbose_name_plural: str = _("playlist video links")
        indexes = [NonDeletedUniqueIndex(["video", "playlist"])]


class PlaylistAccess(BaseModel):
    """Model representing a user having right to manage a playlist.

    ``through`` model between ``Playlist.editors`` and ``User.managed_playlists``.

    """

    # we allow deleting entries in this through table
    _safedelete_policy = HARD_DELETE

    user: User = models.ForeignKey(
        to=User,
        related_name="playlists_accesses",
        verbose_name=_("user"),
        help_text=_("user having rights to manage this playlist"),
        # link is (soft-)deleted if user is (soft-)deleted
        on_delete=models.CASCADE,
    )
    playlist: Playlist = models.ForeignKey(
        to=Playlist,
        related_name="users_accesses",
        verbose_name=_("playlist"),
        help_text=_("playlist the user has rights to manage"),
        # link is (soft-)deleted if playlist is (soft-)deleted
        on_delete=models.CASCADE,
    )

    class Meta:
        """Options for the ``PlaylistAccess`` model."""

        db_table: str = "playlist_access"
        verbose_name: str = _("playlist access")
        verbose_name_plural: str = _("playlists accesses")
        indexes = [NonDeletedUniqueIndex(["user", "playlist"])]
