"""Admin of the ``core`` app of the Marsha project."""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DefaultUserAdmin
from django.contrib.sites.models import Site
from django.urls import reverse
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from marsha.core.models import (
    AudioTrack,
    ConsumerSite,
    ConsumerSiteAccess,
    ConsumerSiteOrganization,
    ConsumerSitePortability,
    Document,
    LTIPassport,
    LtiUserAssociation,
    Organization,
    OrganizationAccess,
    Playlist,
    PlaylistAccess,
    PlaylistPortability,
    PortabilityRequest,
    SignTrack,
    SiteConfig,
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
        The function that Django admin must call with the object as argument to render the field
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
        linked_obj = getattr(obj, field_name)
        if linked_obj is None:
            return "-"
        app_label = linked_obj._meta.app_label
        model_name = linked_obj._meta.model_name
        view_name = f"admin:{app_label}_{model_name}_change"
        link_url = reverse(view_name, args=[linked_obj.id])
        return format_html('<a href="{}">{}</a>', link_url, linked_obj)

    _link_field.short_description = field_name
    return _link_field


class BaseFileAdmin(admin.ModelAdmin):
    """Base admin class for file model."""

    exclude = ("duplicated_from",)

    list_display = (
        "id",
        "title",
        link_field("playlist"),
        link_field("consumer_site"),
        "lti_id",
        "upload_state",
        "uploaded_on",
        "updated_on",
        "created_on",
    )
    list_select_related = ("playlist__consumer_site",)
    fields = (
        "id",
        "title",
        "description",
        "playlist",
        "lti_id",
        "upload_state",
        "created_by",
        "duplicated_from",
        "uploaded_on",
        "updated_on",
        "created_on",
    )
    readonly_fields = (
        "id",
        "created_by",
        "created_on",
        "duplicated_from",
        "upload_state",
        "uploaded_on",
        "updated_on",
    )
    list_filter = ("upload_state", "playlist__consumer_site__domain")
    search_fields = (
        "id",
        "lti_id",
        "playlist__consumer_site__domain",
        "playlist__consumer_site__name",
        "playlist__id",
        "playlist__lti_id",
        "playlist__title",
        "playlist__organization__name",
        "title",
    )


class BaseFileInline(admin.TabularInline):
    """Base tabular inline class used by file resources."""

    fields = (
        "id",
        "title",
        "playlist",
        "lti_id",
        "upload_state",
        "uploaded_on",
        "updated_on",
        "created_on",
    )
    readonly_fields = [
        "id",
        "created_by",
        "created_on",
        "duplicated_from",
        "upload_state",
        "uploaded_on",
        "updated_on",
    ]


class MarshaAdminSite(admin.AdminSite):
    """Admin site for Marsha."""

    site_title = _("{marsha_name} administration").format(marsha_name="Marsha")
    site_header = "Marsha"


class UserOrganizationsInline(admin.TabularInline):
    """Inline to display organizations to which a user has been granted access."""

    model = OrganizationAccess
    verbose_name = _("organization")
    verbose_name_plural = _("organizations")


@admin.register(User)
class UserAdmin(DefaultUserAdmin):
    """Admin class for the User model."""

    inlines = DefaultUserAdmin.inlines + (UserOrganizationsInline,)


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


class ConsumerSitePortabilityInline(admin.TabularInline):
    """Inline to display consumer sites to which a consumer site is automatically portable."""

    model = ConsumerSitePortability
    fk_name = "source_site"
    verbose_name = _("portable to")
    verbose_name_plural = _("portable to")


@admin.register(ConsumerSite)
class ConsumerSiteAdmin(admin.ModelAdmin):
    """Admin class for the ConsumerSite model."""

    list_display = ("id", "name", "domain", "created_on", "updated_on")
    search_fields = ("id", "name", "domain")
    inlines = [
        ConsumerSitePortabilityInline,
        ConsumerSiteUsersInline,
        ConsumerSiteOrganizationsInline,
    ]

    fields = (
        "id",
        "name",
        "domain",
        "created_on",
        "updated_on",
        "lrs_url",
        "lrs_auth_token",
        "lrs_xapi_version",
        "video_show_download_default",
        "inactive_resources",
        "inactive_features",
    )
    readonly_fields = ["id", "created_on", "updated_on"]


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


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    """Admin class for the Organization model."""

    list_display = ("name",)
    inlines = [OrganizationUsersInline, OrganizationConsumerSitesInline]


class AudioTrackInline(admin.TabularInline):
    """Inline for audio tracks of a video."""

    model = AudioTrack
    readonly_fields = ["upload_state", "uploaded_on"]


class TimedTextTrackInline(admin.TabularInline):
    """Inline for timed text tracks of a video."""

    model = TimedTextTrack
    readonly_fields = ["upload_state", "uploaded_on"]


class SignTrackInline(admin.TabularInline):
    """Inline for sign tracks of a video."""

    model = SignTrack
    readonly_fields = ["upload_state", "uploaded_on"]


@admin.register(Video)
class VideoAdmin(BaseFileAdmin):
    """Admin class for the Video model."""

    fields = BaseFileAdmin.fields + (
        "last_lti_url",
        "live_state",
        "live_type",
        "live_info",
        "recording_slices",
        "starting_at",
        "estimated_duration",
        "join_mode",
        "is_public",
        "retention_date",
        "tags",
        "license",
        "transcode_pipeline",
    )
    list_display = BaseFileAdmin.list_display + (
        "starting_at",
        "is_public",
    )
    readonly_fields = BaseFileAdmin.readonly_fields + (
        "live_state",
        "live_type",
        "recording_slices",
        "live_info",
        "join_mode",
        "transcode_pipeline",
    )
    inlines = [AudioTrackInline, TimedTextTrackInline, SignTrackInline]
    verbose_name = _("Video")


@admin.register(TimedTextTrack)
class TimedTextTrackAdmin(admin.ModelAdmin):
    """Admin class for the TimedTextTrack model."""

    fields = (
        "id",
        "mode",
        "extension",
        "process_pipeline",
        "video",
        "language",
        "uploaded_on",
        "upload_state",
        "created_on",
        "updated_on",
    )
    readonly_fields = (
        "id",
        "mode",
        "extension",
        "process_pipeline",
        "video",
        "language",
        "uploaded_on",
        "upload_state",
        "created_on",
        "updated_on",
    )


class VideosInline(BaseFileInline):
    """Inline for videos in a playlist."""

    model = Video
    verbose_name = _("video")
    verbose_name_plural = _("videos")


class PlaylistAccessesInline(admin.TabularInline):
    """Inline for with right to write access to a playlist."""

    model = PlaylistAccess
    verbose_name = _("user access")
    verbose_name_plural = _("users accesses")


class PlaylistPortabilityInline(admin.TabularInline):
    """Inline to display playlists to which a playlist is automatically portable."""

    model = PlaylistPortability
    fk_name = "source_playlist"
    verbose_name = _("portable to")
    verbose_name_plural = _("portable to")


@admin.register(Document)
class DocumentAdmin(BaseFileAdmin):
    """Admin class for the Document model."""

    fields = BaseFileAdmin.fields + ("is_public",)
    list_display = BaseFileAdmin.list_display + ("is_public",)
    verbose_name = _("Document")


class DocumentsInline(BaseFileInline):
    """Inline for documents in a playlist."""

    model = Document
    verbose_name = _("document")
    verbose_name_plural = _("documents")


@admin.register(Playlist)
class PlaylistAdmin(admin.ModelAdmin):
    """Admin class for the Playlist model."""

    exclude = ("duplicated_from",)
    inlines = [
        DocumentsInline,
        VideosInline,
        PlaylistAccessesInline,
        PlaylistPortabilityInline,
    ]

    list_display = (
        "id",
        "title",
        link_field("organization"),
        link_field("consumer_site"),
        "lti_id",
        "is_public",
        "is_portable_to_playlist",
        "is_portable_to_consumer_site",
        "is_claimable",
        "updated_on",
        "created_on",
    )
    list_select_related = ("consumer_site", "organization")
    fields = (
        "id",
        "title",
        "organization",
        "consumer_site",
        "lti_id",
        "is_public",
        "is_portable_to_playlist",
        "is_portable_to_consumer_site",
        "is_claimable",
        "created_by",
        "duplicated_from",
        "retention_duration",
        "updated_on",
        "created_on",
    )
    readonly_fields = [
        "id",
        "created_by",
        "created_on",
        "duplicated_from",
        "updated_on",
    ]
    list_filter = (
        "consumer_site__domain",
        "is_public",
        "is_portable_to_playlist",
        "is_portable_to_consumer_site",
    )
    search_fields = (
        "id",
        "consumer_site__domain",
        "consumer_site__name",
        "organization__name",
        "lti_id",
        "portable_to__title",
        "portable_to__lti_id",
        "portable_to__id",
        "title",
    )
    verbose_name = _("Playlist")


@admin.register(LTIPassport)
class LTIPassportAdmin(admin.ModelAdmin):
    """Admin class for the LTIPassport model."""

    list_display = (
        "oauth_consumer_key",
        link_field("consumer_site"),
        link_field("playlist"),
        "is_enabled",
        "updated_on",
        "created_on",
    )
    list_select_related = ("consumer_site", "playlist")
    fields = (
        "oauth_consumer_key",
        "shared_secret",
        "consumer_site",
        "playlist",
        "is_enabled",
        "updated_on",
        "created_on",
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


@admin.register(LtiUserAssociation)
class LtiUserAssociationAdmin(admin.ModelAdmin):
    """Admin class for the LTI user association model."""

    fields = ("lti_user_id", "consumer_site", "user", "created_on")
    list_display = (
        "lti_user_id",
        "consumer_site",
        "user",
        "created_on",
    )
    readonly_fields = ("created_on",)
    verbose_name = _("LTI user association")


@admin.register(PortabilityRequest)
class PortabilityRequestAdmin(admin.ModelAdmin):
    """Admin class for the PortabilityRequest model."""

    list_display = (
        "id",
        "for_playlist",
        "from_playlist",
        "from_lti_consumer_site",
        "from_lti_user_id",
        "from_user",
        "state",
    )
    search_fields = (
        "id",
        "for_playlist",
        "from_lti_consumer_site",
        "from_lti_user_id",
        "from_user",
    )
    list_filter = ("from_lti_consumer_site", "state")

    fields = (
        "for_playlist",
        "from_playlist",
        "from_lti_consumer_site",
        "from_lti_user_id",
        "from_user",
        "state",
        "updated_by_user",
    )
    readonly_fields = [
        "id",
    ]


class SiteConfigInline(admin.StackedInline):
    """Inline for sites with config fields."""

    model = SiteConfig
    can_delete = False
    verbose_name = _("Config field")
    verbose_name_plural = _("Config fields")


class SiteAdmin(admin.ModelAdmin):
    """Admin class for the CustomSite model."""

    list_display = ("name", "domain")
    search_fields = ("name", "domain")
    inlines = [
        SiteConfigInline,
    ]


# Unregister the original Site admin
admin.site.unregister(Site)
admin.site.register(Site, SiteAdmin)
