"""Admin of the ``page`` app of the Marsha project."""

from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import Page


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    """Admin class for the Page model."""

    verbose_name = _("Page")
    list_display = ("name", "slug", "is_published")
    prepopulated_fields = {"slug": ["name"]}
    fields = (
        "id",
        "name",
        "slug",
        "content",
        "is_published",
    )
    readonly_fields = [
        "id",
    ]
    search_fields = (
        "id",
        "name",
        "slug",
    )