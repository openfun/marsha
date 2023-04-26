"""Defines the django app config for the ``page`` app."""

from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class PageConfig(AppConfig):
    """Django app config for the ``page`` app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "marsha.page"
    verbose_name = _("Pages")
