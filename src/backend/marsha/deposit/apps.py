"""Defines the django app config for the ``deposit`` app."""

from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class DepositConfig(AppConfig):
    """Django app config for the ``deposit`` app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "marsha.deposit"
    verbose_name = _("File depository")
