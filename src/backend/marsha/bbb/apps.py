"""Defines the django app config for the ``bbb`` app."""

from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class BbbConfig(AppConfig):
    """Django app config for the ``bbb`` app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "marsha.bbb"
    verbose_name = _("Big Blue Button")
