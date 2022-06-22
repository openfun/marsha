"""Defines the django app config for the ``{{cookiecutter.app_name}}`` app."""

from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class {{cookiecutter.app_name|capitalize}}Config(AppConfig):
    """Django app config for the ``{{cookiecutter.app_name}}`` app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "marsha.{{cookiecutter.app_name}}"
    verbose_name = _("{{cookiecutter.app_verbose_name}}")
