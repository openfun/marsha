"""Admin of the ``bbb`` app of the Marsha project."""

from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from marsha.core.admin import link_field

from .models import Classroom, ClassroomDocument, ClassroomSession


class ClassroomDocumentInline(admin.TabularInline):
    """Inline to display classroom documents from a classroom."""

    model = ClassroomDocument
    verbose_name = _("classroom document")
    verbose_name_plural = _("classroom documents")


@admin.register(Classroom)
class ClassroomAdmin(admin.ModelAdmin):
    """Admin class for the Classroom model."""

    verbose_name = _("Classroom")
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
        "recording_purpose",
        "retention_date",
    )
    inlines = (ClassroomDocumentInline,)
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


@admin.register(ClassroomSession)
class ClassroomSessionAdmin(admin.ModelAdmin):
    """Admin class for the ClassroomSession model."""


@admin.register(ClassroomDocument)
class ClassroomDocumentAdmin(admin.ModelAdmin):
    """Admin class for the ClassroomDocument model."""

    verbose_name = _("Classroom document")
    list_display = (
        "id",
        "filename",
        link_field("classroom"),
    )
    list_select_related = ("classroom__playlist__consumer_site",)
    fields = (
        "id",
        "filename",
        "classroom",
    )
    readonly_fields = [
        "id",
    ]
    list_filter = ("classroom__playlist__consumer_site__domain",)
    search_fields = (
        "id",
        "classroom__id",
        "classroom__lti_id",
        "classroom__title",
        "classroom__playlist__consumer_site__domain",
        "classroom__playlist__consumer_site__name",
        "classroom__playlist__id",
        "classroom__playlist__lti_id",
        "classroom__playlist__title",
        "classroom__playlist__organization__name",
        "filename",
    )
