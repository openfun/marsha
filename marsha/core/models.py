"""This module holds the models for the marsha project."""

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

from marsha.core.base_models import BaseModel
from marsha.stubs import M2MType, ReverseFKType, UniqueTogether


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

    class Meta:
        """Options for the ``User`` model."""

        db_table: str = "user"
        verbose_name: str = _("user")
        verbose_name_plural: str = _("users")


class ConsumerSite(BaseModel):
    """Model representing an external site with access to the Marsha instance."""

    name: str = models.CharField(
        max_length=255, verbose_name=_("site"), help_text=_("Name of the site")
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


class SiteAdmin(BaseModel):
    """Model representing users with access to manage a site.

    ``through`` model between ``ConsumerSite.admins`` and ``User.administrated_sites``.

    """

    user: User = models.ForeignKey(
        to=User,
        related_name="sites_admins",
        verbose_name=_("user"),
        help_text=_("user with access to the site"),
        # delete the site-admin link if the user is deleted
        on_delete=models.CASCADE,
    )
    site: ConsumerSite = models.ForeignKey(
        to=ConsumerSite,
        related_name="sites_admins",
        verbose_name=_("site"),
        help_text=_("site to which the user has access"),
        # delete the site-admin link if the site is deleted
        on_delete=models.CASCADE,
    )

    class Meta:
        """Options for the ``SiteAdmin`` model."""

        db_table: str = "site_admin"
        verbose_name: str = _("site admin")
        verbose_name_plural: str = _("site admins")
        unique_together: UniqueTogether = [("user", "site")]


class Organization(BaseModel):
    """Model representing an organization to manage its playlists on one or many sites."""

    name: str = models.CharField(
        max_length=255,
        verbose_name=_("organization"),
        help_text=_("name of the organization"),
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


class SiteOrganization(BaseModel):
    """Model representing organizations in sites.

    ``through`` model between ``Organization.sites`` and ``ConsumerSite.organizations``.

    """

    site: ConsumerSite = models.ForeignKey(
        to=ConsumerSite,
        related_name="organizations_links",
        verbose_name=_("site"),
        help_text=_("site having this organization"),
        # delete the site-organization link if the site is deleted
        on_delete=models.CASCADE,
    )
    organization: Organization = models.ForeignKey(
        to=Organization,
        related_name="sites_links",
        verbose_name=_("organization"),
        help_text=_("organization in this site"),
        # delete the site-organization link if the organization is deleted
        on_delete=models.CASCADE,
    )

    class Meta:
        """Options for the ``SiteOrganization`` model."""

        db_table: str = "site_organization"
        verbose_name: str = _("organization in site")
        verbose_name_plural: str = _("organizations in sites")
        unique_together: UniqueTogether = [("site", "organization")]


class OrganizationManager(BaseModel):
    """Model representing managers of organizations.

    ``through`` model between ``Organization.managers`` and ``User.managed_organizations``.

    """

    user: User = models.ForeignKey(
        to=User,
        related_name="managed_organizations_links",
        verbose_name=_("manager"),
        help_text=_("user managing this organization"),
        # delete the user-organization link if the user is deleted
        on_delete=models.CASCADE,
    )
    organization: Organization = models.ForeignKey(
        to=Organization,
        related_name="managers_links",
        verbose_name=_("organization"),
        help_text=_("organization managed by this user"),
        # delete the user-organization link if the organization is deleted
        on_delete=models.CASCADE,
    )

    class Meta:
        """Options for the ``OrganizationManager`` model."""

        db_table: str = "organization_manager"
        verbose_name: str = _("organization manager")
        verbose_name_plural: str = _("organizations managers")
        unique_together: UniqueTogether = [("user", "organization")]


class Authoring(BaseModel):
    """Model representing authors in an organization.

    ``through`` model between ``Organization.authors`` and ``User.authoring``.

    """

    user: User = models.ForeignKey(
        to=User,
        related_name="authoring",
        verbose_name=_("author"),
        help_text=_("user having authoring access in this organization"),
        # delete the user-organization link if the user is deleted
        on_delete=models.CASCADE,
    )
    organization: Organization = models.ForeignKey(
        to=Organization,
        related_name="authoring",
        verbose_name=_("organization"),
        help_text=_("organization on which the user is an author"),
        # delete the user-organization link if the organization is deleted
        on_delete=models.CASCADE,
    )

    class Meta:
        """Options for the ``Authoring`` model."""

        db_table: str = "authoring"
        verbose_name: str = _("author in organization")
        verbose_name_plural: str = _("authors in organizations")
        unique_together: UniqueTogether = [("user", "organization")]


class Video(BaseModel):
    """Model representing a video, by an author."""

    author: User = models.ForeignKey(
        to=User,
        related_name="authored_videos",
        verbose_name=_("author"),
        help_text=_("author of the video"),
        # don't allow deleting a user if it has some videos
        on_delete=models.PROTECT,
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
        # don't delete a video if the one it was duplicated from is deleted
        on_delete=models.SET_NULL,
        null=True,
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


class BaseTrack(BaseModel):
    """Base model for different kinds of tracks tied to a video."""

    video: Video = models.ForeignKey(
        to=Video,
        related_name="%(class)ss",  # will be `audiotracks` for `AudioTrack` model,
        verbose_name=_("video"),
        help_text=_("video for which this track is"),
        # delete the track if the video is deleted
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
        unique_together: UniqueTogether = [("video", "language")]


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
        unique_together: UniqueTogether = [
            ("video", "language", "has_closed_captioning")
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
        unique_together: UniqueTogether = [("video", "language")]


class Playlist(BaseModel):
    """Model representing a playlist which is a list of videos."""

    organization: Organization = models.ForeignKey(
        to=Organization,
        related_name="playlists",
        # don't allow deleting an organization if it has some playlists
        on_delete=models.PROTECT,
        null=True,
    )
    author: User = models.ForeignKey(
        to=User,
        related_name="created_playlists",
        # don't allow deleting a user if it has some playlists
        on_delete=models.PROTECT,
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
        # don't delete a playlist if the one it was duplicated from is deleted
        on_delete=models.SET_NULL,
        null=True,
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

    video: Video = models.ForeignKey(
        to=Video,
        related_name="playlists_links",
        verbose_name=_("video"),
        help_text=_("video contained in this playlist"),
        # delete the video-playlist link if the video is deleted
        on_delete=models.CASCADE,
    )
    playlist: Playlist = models.ForeignKey(
        to=Playlist,
        related_name="videos_links",
        verbose_name=_("playlist"),
        help_text=_("playlist containing this video"),
        # delete the video-playlist link if the playlist is deleted
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
        unique_together: UniqueTogether = [("video", "playlist")]


class PlaylistAccess(BaseModel):
    """Model representing a user having right to manage a playlist.

    ``through`` model between ``Playlist.editors`` and ``User.managed_playlists``.

    """

    user: User = models.ForeignKey(
        to=User,
        related_name="playlists_accesses",
        verbose_name=_("user"),
        help_text=_("user having rights to manage this playlist"),
        # delete the user-playlist link if the user is deleted
        on_delete=models.CASCADE,
    )
    playlist: Playlist = models.ForeignKey(
        to=Playlist,
        related_name="users_accesses",
        verbose_name=_("playlist"),
        help_text=_("playlist the user has rights to manage"),
        # delete the user-playlist link if the playlist is deleted
        on_delete=models.CASCADE,
    )

    class Meta:
        """Options for the ``PlaylistAccess`` model."""

        db_table: str = "playlist_access"
        verbose_name: str = _("playlist access")
        verbose_name_plural: str = _("playlists accesses")
        unique_together: UniqueTogether = [("user", "playlist")]
