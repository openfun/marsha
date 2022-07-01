"""Admin of the ``deposit`` app of the Marsha project."""

from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from marsha.core.admin import link_field

from .models import FileDepository


@admin.register(FileDepository)
class FileDepositoryAdmin(admin.ModelAdmin):
    """Admin class for the FileDepository model."""

    verbose_name = _("FileDepository")
    list_display = (
        "id",
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
        "description",
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
