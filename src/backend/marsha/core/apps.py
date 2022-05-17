"""Defines the django app config for the ``core`` app."""

from django.apps import AppConfig
from django.contrib.admin.apps import AdminConfig
from django.utils.translation import gettext_lazy as _


class MarshaAdminConfig(AdminConfig):
    """Define the default Django admin site as the Marsha one."""

    default_site = "marsha.core.admin_site.MarshaAdminSite"


class CoreConfig(AppConfig):
    """Django app config for the ``core`` app."""

    name = "marsha.core"
    verbose_name = _("Marsha")
