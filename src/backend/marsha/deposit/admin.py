"""Admin of the ``deposit`` app of the Marsha project."""

from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from marsha.core.admin import link_field
from marsha.deposit.models import DepositedFile, FileDepository


class DepositedFilesInline(admin.TabularInline):
    """Inline to display deposited files from a file depository."""

    model = DepositedFile
    verbose_name = _("deposited file")
    verbose_name_plural = _("deposited files")


@admin.register(FileDepository)
class FileDepositoryAdmin(admin.ModelAdmin):
    """Admin class for the FileDepository model."""

    verbose_name = _("File depository")
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
    inlines = (DepositedFilesInline,)
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


@admin.register(DepositedFile)
class DepositedFileAdmin(admin.ModelAdmin):
    """Admin class for the DepositedFile model."""

    verbose_name = _("Deposited file")
    list_display = (
        "id",
        "filename",
        link_field("file_depository"),
        "extension",
    )
    list_select_related = ("file_depository__playlist__consumer_site",)
    fields = (
        "id",
        "filename",
        "file_depository",
        "extension",
    )
    readonly_fields = [
        "id",
    ]
    list_filter = ("file_depository__playlist__consumer_site__domain",)
    search_fields = (
        "id",
        "file_depository__id",
        "file_depository__lti_id",
        "file_depository__title",
        "file_depository__playlist__consumer_site__domain",
        "file_depository__playlist__consumer_site__name",
        "file_depository__playlist__id",
        "file_depository__playlist__lti_id",
        "file_depository__playlist__title",
        "file_depository__playlist__organization__name",
        "filename",
    )
