"""Defines the django app config for the ``markdown`` app."""

from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class MarkdownConfig(AppConfig):
    """Django app config for the ``markdown`` app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "marsha.markdown"
    verbose_name = _("Markdown")
