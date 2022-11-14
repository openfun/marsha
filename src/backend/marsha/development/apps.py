"""Defines the django app config for the ``core`` app."""

from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class DevelopmentConfig(AppConfig):
    """Django app config for the ``development`` app."""

    name = "marsha.development"
    verbose_name = _("Marsha Development")
