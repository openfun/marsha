"""Admin of the ``bbb`` app of the Marsha project."""

from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from marsha.core.admin import admin_site, link_field

from .models import Meeting


@admin.register(Meeting, site=admin_site)
class MeetingAdmin(admin.ModelAdmin):
    """Admin class for the Meeting model."""

    verbose_name = _("Meeting")
    list_display = (
        "id",
        "started",
        "title",
        link_field("playlist"),
        "lti_id",
    )
    list_select_related = ("playlist__consumer_site",)
    fields = (
        "id",
        "title",
        "playlist",
        "position",
        "lti_id",
        "started",
        "description",
        "welcome_text",
        "starting_at",
        "estimated_duration",
    )
    readonly_fields = [
        "id",
    ]
    list_filter = ("playlist__consumer_site__domain",)
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
