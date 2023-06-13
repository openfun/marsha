"""Module dedicated to sentry filtering functions"""
from urllib.parse import urlparse

from django.conf import settings

from dockerflow.django.middleware import DockerflowMiddleware


def _match_dockerflow_urls(url):
    """Check if the sentry url path matches dockerflow urls."""
    for pattern, _ in DockerflowMiddleware.viewpatterns:
        if pattern.match(url):
            return True

    return False


def filter_transactions(event, hint):  # pylint: disable=unused-argument
    """Filter transactions for Sentry."""
    event_url = event.get("request", {}).get("url")
    if not event_url:
        return event

    url = urlparse(event_url)

    if settings.SENTRY_IGNORE_HEALTH_CHECKS and _match_dockerflow_urls(url.path):
        return None

    return event
