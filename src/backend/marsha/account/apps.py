"""Defines the django app config for the ``account`` app."""

from django.apps import AppConfig
from django.core import checks as django_checks
from django.utils.translation import gettext_lazy as _

from marsha.account import checks


class AccountConfig(AppConfig):
    """Django app config for the ``account`` app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "marsha.account"
    verbose_name = _("Account")

    def ready(self):
        super().ready()
        django_checks.register(checks.teacher_role_setting_check, "account")
