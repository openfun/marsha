"""Marsha storage modules."""

from django.conf import settings
from django.utils.module_loading import import_string


# pylint: disable=unused-import
from . import dummy, s3, filesystem  # noqa isort:skip


def get_initiate_backend():
    """Select and return the selected storage backend."""
    return import_string(settings.STORAGE_BACKEND)
