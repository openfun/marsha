"""Command to dedupe accounts."""

import logging

from django.core.management.base import BaseCommand

from marsha.account.utils.dedupe_accounts import dedupe_accounts


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """Command to dedupe accounts."""

    help = "Merge duplicate SAML accounts created with the same email"

    def add_arguments(self, parser):
        """Add arguments to the command."""
        parser.add_argument("--email", type=str, help="Email to dedupe")
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        """Handle command."""
        dry_run = options["dry_run"]
        if dry_run:
            logger.info("[DRY-RUN] No changes will be made.")

        dedupe_accounts(options["email"], dry_run)
