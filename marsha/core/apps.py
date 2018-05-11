"""Defines the django app config for the ``core`` app."""

from django.apps import AppConfig
from django.utils.translation import ugettext_lazy as _


class CoreConfig(AppConfig):
    """Django app config for the ``core`` app."""

    name: str = "core"
    verbose_name: str = _("Core app of the Marsha project")
