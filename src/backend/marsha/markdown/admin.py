"""Admin of the ``markdown`` app of the Marsha project."""

from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from parler.admin import TranslatableAdmin

from marsha.core.admin import link_field

from .models import MarkdownDocument


@admin.register(MarkdownDocument)
class MarkdownDocumentAdmin(TranslatableAdmin):
    """Admin class for the MarkdownDocument model."""

    verbose_name = _("Markdown document")
    list_display = (
        "pk",
        "title",
        link_field("playlist"),
        "lti_id",
        "is_draft",
    )
    list_select_related = ("playlist__consumer_site",)
    fields = (
        "pk",
        "is_draft",
        "playlist",
        "lti_id",
        "rendering_options",
        "title",
        "content",
        "rendered_content",
    )
    readonly_fields = [
        "pk",
    ]
    list_filter = ("playlist__consumer_site__domain",)
    search_fields = (
        "pk",
        "lti_id",
        "playlist__consumer_site__domain",
        "playlist__consumer_site__name",
        "playlist_id",
        "playlist__lti_id",
        "playlist__title",
        "playlist__organization__name",
        "title",
    )
