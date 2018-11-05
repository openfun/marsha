"""Provides a test-runner to avoid running django checks."""

from django.test.runner import DiscoverRunner


class NoCheckDiscoverRunner(DiscoverRunner):
    """A Django test runner that do not run checks."""

    def run_checks(self) -> None:
        """Do not run checks."""
        pass
