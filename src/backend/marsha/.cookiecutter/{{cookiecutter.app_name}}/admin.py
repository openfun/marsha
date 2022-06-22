"""Admin of the ``{{cookiecutter.app_name}}`` app of the Marsha project."""

from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from marsha.core.admin import link_field

from .models import {{cookiecutter.model}}


@admin.register({{cookiecutter.model}})
class {{cookiecutter.model}}Admin(admin.ModelAdmin):
    """Admin class for the {{cookiecutter.model}} model."""

    verbose_name = _("{{cookiecutter.model}}")
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
