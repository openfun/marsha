"""Defines the django app config for the ``websocket`` app."""

from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class WebsocketConfig(AppConfig):
    """Django app config for the ``websocket`` app."""

    name = "marsha.websocket"
    verbose_name = _("Marsha websockets")
