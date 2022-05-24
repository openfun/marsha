"""This management command prefetches Renater metadata."""
from django.core.management import BaseCommand

from marsha.account.social_utils.renater_parser import (
    update_renater_identity_providers_cache,
)


class Command(BaseCommand):
    """Call Renater's Shibboleth metadata cache updater."""

    help = "Fetch Renater's Shibboleth metadata and store it into cache."

    def handle(self, *args, **options):
        """Execute management command."""
        update_renater_identity_providers_cache()
