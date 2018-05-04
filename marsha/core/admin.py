"""Admin of the ``core`` app of the Marsha project."""

from typing import List, Sequence, Type

from django.contrib import admin
from django.contrib.admin.options import InlineModelAdmin
from django.contrib.auth.admin import UserAdmin as DefaultUserAdmin
from django.db.models import Model
from django.utils.translation import gettext_lazy as _

from safedelete.admin import SafeDeleteAdmin

from marsha.core.models import (
    AudioTrack,
    Authoring,
    ConsumerSite,
    Organization,
    OrganizationManager,
    Playlist,
    PlaylistAccess,
    PlaylistVideo,
    SignTrack,
    SiteAdmin,
    SiteOrganization,
    SubtitleTrack,
    User,
    Video,
)


class MarshaAdminSite(admin.AdminSite):
    """Admin site for Marsha."""

    site_title: str = _("%(marsha_name)s administration") % {"marsha_name": "Marsha"}
    site_header: str = "Marsha"


admin_site = MarshaAdminSite(name="admin")


class BaseTabularInline(admin.TabularInline):
    """Base for all our tabular inlines."""

    model: Type[Model]
    verbose_name: str
    verbose_name_plural: str


class BaseModelAdmin(SafeDeleteAdmin):
    """Base for all our model admins."""

    list_display: Sequence[str]
    inlines: List[InlineModelAdmin]
    exclude: Sequence[str]


class OrganizationManagersInline(BaseTabularInline):
    """Inline for managers in an organization."""

    model = OrganizationManager
    verbose_name = _("manager")
    verbose_name_plural = _("managers")


class ManagedOrganizationsInline(BaseTabularInline):
    """Inline for organizations managed by a user."""

    model = OrganizationManager
    verbose_name = _("managed organization")
    verbose_name_plural = _("managed organizations")


class AuthorOrganizationsInline(BaseTabularInline):
    """Inline for organizations the user is an author of."""

    model = Authoring
    verbose_name = _("authoring organization")
    verbose_name_plural = _("authoring organizations")


class OrganizationAuthorsInline(BaseTabularInline):
    """Inline for authors in an organization."""

    model = Authoring
    verbose_name = _("author")
    verbose_name_plural = _("authors")


@admin.register(User, site=admin_site)
class UserAdmin(DefaultUserAdmin):
    """Admin class for the User model."""

    inlines = DefaultUserAdmin.inlines + [
        ManagedOrganizationsInline,
        AuthorOrganizationsInline,
    ]


class SiteAdminsInline(BaseTabularInline):
    """Inline for admins of a site."""

    model = SiteAdmin
    verbose_name = _("admin")
    verbose_name_plural = _("admins")


class SiteOrganizationsInline(BaseTabularInline):
    """Inline for organizations in a site."""

    model = SiteOrganization
    verbose_name = _("organization")
    verbose_name_plural = _("organizations")


class OrganizationSitesInline(BaseTabularInline):
    """Inline for sites for an organization."""

    model = SiteOrganization
    verbose_name = _("site")
    verbose_name_plural = _("sites")


@admin.register(ConsumerSite, site=admin_site)
class ConsumerSiteAdmin(BaseModelAdmin):
    """Admin class for the ConsumerSite model."""

    list_display = ("name",)
    inlines = [SiteAdminsInline, SiteOrganizationsInline]


@admin.register(Organization, site=admin_site)
class OrganizationAdmin(BaseModelAdmin):
    """Admin class for the Organization model."""

    list_display = ("name",)
    inlines = [
        OrganizationManagersInline,
        OrganizationSitesInline,
        OrganizationAuthorsInline,
    ]


class AudioTrackInline(BaseTabularInline):
    """Inline for audio tracks of a video."""

    model = AudioTrack


class SubtitleTrackInline(BaseTabularInline):
    """Inline for subtitle tracks of a video."""

    model = SubtitleTrack


class SignTrackInline(BaseTabularInline):
    """Inline for sign tracks of a video."""

    model = SignTrack


@admin.register(Video, site=admin_site)
class VideoAdmin(BaseModelAdmin):
    """Admin class for the Video model."""

    list_display = ("name", "author", "language")
    exclude = ("duplicated_from",)
    inlines = [AudioTrackInline, SubtitleTrackInline, SignTrackInline]


class PlaylistVideosInline(BaseTabularInline):
    """Inline for videos in a playlist."""

    model = PlaylistVideo
    verbose_name = _("video")
    verbose_name_plural = _("videos")


class PlaystlistAccessesInline(BaseTabularInline):
    """Inline for with right to write access to a playlist."""

    model = PlaylistAccess
    verbose_name = _("user access")
    verbose_name_plural = _("users accesses")


@admin.register(Playlist, site=admin_site)
class PlaylistAdmin(BaseModelAdmin):
    """Admin class for the Playlist model."""

    list_display = ("name", "organization", "author", "is_public")
    exclude = ("duplicated_from",)
    inlines = [PlaylistVideosInline, PlaystlistAccessesInline]
