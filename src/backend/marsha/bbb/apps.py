"""Defines the django app config for the ``bbb`` app."""

from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class BbbConfig(AppConfig):
    """Django app config for the ``bbb`` app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "marsha.bbb"
    verbose_name = _("Big Blue Button")

    def ready(self):
        # Signals must be imported and connected once the app is ready.
        # Callbacks are connected thanks to the "receiver" decorator.
        # pylint: disable=import-outside-toplevel, unused-import
        import marsha.bbb.signals  # noqa
