"""Admin of the ``core`` app of the Marsha project."""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DefaultUserAdmin
from django.urls import reverse
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from marsha.core.models import (
    AudioTrack,
    ConsumerSite,
    ConsumerSiteAccess,
    ConsumerSiteOrganization,
    LTIPassport,
    Organization,
    OrganizationAccess,
    Playlist,
    PlaylistAccess,
    SignTrack,
    TimedTextTrack,
    User,
    Video,
)


def link_field(field_name):
    """Convert a foreign key value into a clickable link. # noqa

    Parameters
    ----------
    field_name: Type[string]
        If `field_name` is "name", link text will be str(obj.name) and link will be the admin
        url for obj.name.id:change.

    Returns
    -------
    function
        The function that Django admin must call with the object as arguement to render the field
        as a link.

    """

    def _link_field(obj):
        """Render a link in Django admin for foreign key fields.

        The link replaces the string representation of the linked object that is rendered
        by Django by default for foreign keys.

        Parameters
        ----------
        obj: Type[models.Model]
            The instance of Django model for which we want to render the field `field_name`.

        Returns
        -------
        string
            The html representing the link to the object admin change view.

        """
        app_label = obj._meta.app_label
        linked_obj = getattr(obj, field_name)
        if linked_obj is None:
            return "-"
        model_name = linked_obj._meta.model_name
        view_name = f"admin:{app_label}_{model_name}_change"
        link_url = reverse(view_name, args=[linked_obj.id])
        return format_html('<a href="{}">{}</a>', link_url, linked_obj)

    _link_field.short_description = field_name
    return _link_field


class MarshaAdminSite(admin.AdminSite):
    """Admin site for Marsha."""

    site_title = _("{marsha_name} administration").format(marsha_name="Marsha")
    site_header = "Marsha"


admin_site = MarshaAdminSite(name="admin")


class UserOrganizationsInline(admin.TabularInline):
    """Inline to display organizations to which a user has been granted access."""

    model = OrganizationAccess
    verbose_name = _("organization")
    verbose_name_plural = _("organizations")


@admin.register(User, site=admin_site)
class UserAdmin(DefaultUserAdmin):
    """Admin class for the User model."""

    inlines = DefaultUserAdmin.inlines + [UserOrganizationsInline]


class ConsumerSiteUsersInline(admin.TabularInline):
    """Inline to display users who have been granted access to a consumer site."""

    model = ConsumerSiteAccess
    verbose_name = _("user")
    verbose_name_plural = _("users")


class ConsumerSiteOrganizationsInline(admin.TabularInline):
    """Inline to display organizations for a consumer site."""

    model = ConsumerSiteOrganization
    verbose_name = _("organization")
    verbose_name_plural = _("organizations")


@admin.register(ConsumerSite, site=admin_site)
class ConsumerSiteAdmin(admin.ModelAdmin):
    """Admin class for the ConsumerSite model."""

    list_display = ("name", "domain", "created_on", "updated_on")
    search_fields = ("name", "domain")
    inlines = [ConsumerSiteUsersInline, ConsumerSiteOrganizationsInline]


class OrganizationUsersInline(admin.TabularInline):
    """Inline to display users who have been granted access to an organization."""

    model = OrganizationAccess
    verbose_name = _("user")
    verbose_name_plural = _("users")


class OrganizationConsumerSitesInline(admin.TabularInline):
    """Inline to display consumer sites for an organization."""

    model = ConsumerSiteOrganization
    verbose_name = _("consumer site")
    verbose_name_plural = _("consumer sites")


@admin.register(Organization, site=admin_site)
class OrganizationAdmin(admin.ModelAdmin):
    """Admin class for the Organization model."""

    list_display = ("name",)
    inlines = [OrganizationUsersInline, OrganizationConsumerSitesInline]


class AudioTrackInline(admin.TabularInline):
    """Inline for audio tracks of a video."""

    model = AudioTrack


class TimedTextTrackInline(admin.TabularInline):
    """Inline for timed text tracks of a video."""

    model = TimedTextTrack


class SignTrackInline(admin.TabularInline):
    """Inline for sign tracks of a video."""

    model = SignTrack


@admin.register(Video, site=admin_site)
class VideoAdmin(admin.ModelAdmin):
    """Admin class for the Video model."""

    list_display = ("title", "created_by", "language")
    exclude = ("duplicated_from",)
    inlines = [AudioTrackInline, TimedTextTrackInline, SignTrackInline]


class VideosInline(admin.TabularInline):
    """Inline for videos in a playlist."""

    model = Video
    verbose_name = _("video")
    verbose_name_plural = _("videos")


class PlaylistAccessesInline(admin.TabularInline):
    """Inline for with right to write access to a playlist."""

    model = PlaylistAccess
    verbose_name = _("user access")
    verbose_name_plural = _("users accesses")


@admin.register(Playlist, site=admin_site)
class PlaylistAdmin(admin.ModelAdmin):
    """Admin class for the Playlist model."""

    list_display = ("title", "organization", "created_by", "is_public")
    exclude = ("duplicated_from",)
    inlines = [VideosInline, PlaylistAccessesInline]


@admin.register(LTIPassport, site=admin_site)
class LTIPassportAdmin(admin.ModelAdmin):
    """Admin class for the LTIPassport model."""

    list_display = (
        "oauth_consumer_key",
        link_field("consumer_site"),
        link_field("playlist"),
        "is_enabled",
        "created_on",
        "updated_on",
    )
    fields = (
        "oauth_consumer_key",
        "shared_secret",
        "consumer_site",
        "playlist",
        "is_enabled",
        "created_on",
        "updated_on",
    )
    readonly_fields = [
        "created_on",
        "oauth_consumer_key",
        "shared_secret",
        "updated_on",
    ]
    list_filter = ("is_enabled",)
    search_fields = (
        "oauth_consumer_key",
        "consumer_site__name",
        "consumer_site__domain",
        "playlist__title",
    )
    verbose_name = _("LTI passport")
