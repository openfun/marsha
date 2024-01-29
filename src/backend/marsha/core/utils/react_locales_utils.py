"""Helper matching a django locale to a React locale."""

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.utils.translation import to_locale


def react_locale(value):
    """
    Convert a language (simple ISO639-1 or full language with regions) to an ISO15897 locale.

    This locale is supported by the React frontend.
    """
    value_locale = to_locale(value)
    # pylint: disable=unsupported-membership-test
    if value_locale in settings.REACT_LOCALES:
        return value_locale
    # pylint: disable=not-an-iterable
    for locale in settings.REACT_LOCALES:
        if locale[:2] == value_locale:
            return locale
    raise ImproperlyConfigured(
        f"{value:s} does not correspond to any locale supported by the React frontend."
    )
