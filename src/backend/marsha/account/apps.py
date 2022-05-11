"""Defines the django app config for the ``account`` app."""

from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class AccountConfig(AppConfig):
    """Django app config for the ``account`` app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "marsha.account"
    verbose_name = _("Account")
