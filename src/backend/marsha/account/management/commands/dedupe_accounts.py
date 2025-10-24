"""Command to dedupe accounts."""

from difflib import SequenceMatcher
import logging
from typing import Any

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Count


logger = logging.getLogger(__name__)


# pylint: disable=too-many-locals
def dedupe_accounts(
    options: dict[str, Any],
) -> tuple[list[Any], dict[Any, Any], dict[Any, Any], list[Any], list[Any]]:
    """Deduplicate accounts."""
    # pylint: disable=invalid-name
    User = get_user_model()

    if options["email"]:
        duplicates = [{"email": options["email"]}]
    else:
        duplicates = (
            User.objects.values("email")
            .annotate(count=Count("id"))
            .filter(count__gt=1)
            .order_by("email")
        )

    accounts_to_delete = []
    duped_users = {}
    organizations = {}
    skipped_accounts = []
    users_to_delete = []
    for dup in duplicates:
        email = dup["email"]
        if not email:
            continue

        logger.info("Deduping %s", email)

        users = list(User.objects.filter(email=email).order_by("date_joined"))
        original_user, *duplicate_users = users
        original_social = original_user.social_auth.first()

        for duplicate_user in duplicate_users:
            new_social = duplicate_user.social_auth.first()
            if not new_social:
                continue

            old_account_email = original_social.uid.split(":")[1]
            new_account_email = new_social.uid.split(":")[1]

            old_organization_uid = original_social.uid.split(":")[0]
            new_organization_uid = new_social.uid.split(":")[0]

            account_email_ratio = SequenceMatcher(
                None, old_account_email, new_account_email
            ).ratio()
            organization_ratio = SequenceMatcher(
                None, old_organization_uid, new_organization_uid
            ).ratio()

            if old_account_email != new_account_email:
                skipped_accounts.append(
                    [
                        email,
                        [
                            original_social.uid,
                            new_social.uid,
                            str(organization_ratio),
                            str(account_email_ratio),
                        ],
                    ]
                )
                continue

            if old_organization_uid not in organizations:
                organizations[old_organization_uid] = [new_organization_uid]
            else:
                if new_organization_uid not in organizations[old_organization_uid]:
                    organizations[old_organization_uid].append(new_organization_uid)

            if original_user.email not in duped_users:
                duped_users[original_user.email] = [original_social.uid, new_social.uid]
            else:
                duped_users[original_user.email].append(new_social.uid)
            users_to_delete.append(duplicate_user.email)
            accounts_to_delete.append(original_social.uid)

            if not options["dry_run"]:
                with transaction.atomic():
                    original_user.social_auth.first().delete()
                    original_user.social_auth.set([new_social])
                    for playlist in duplicate_user.playlists.exclude(
                        id__in=original_user.playlists.values_list("id", flat=True)
                    ):
                        original_user.playlists.add(playlist)
                    duplicate_user.delete()

    return (
        accounts_to_delete,
        duped_users,
        organizations,
        skipped_accounts,
        users_to_delete,
    )


class Command(BaseCommand):
    """Command to dedupe accounts."""

    help = "Merge duplicate SAML accounts created with the same email"

    def add_arguments(self, parser):
        """Add arguments to the command."""
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument(
            "--email", type=str, help="Email to dedupe (for testing purposes)"
        )

    def handle(self, *args, **options):
        """Handle command."""
        if options["dry_run"]:
            logger.info("[DRY-RUN] No changes will be made.")

        (
            accounts_to_delete,
            duped_users,
            organizations,
            skipped_accounts,
            users_to_delete,
        ) = dedupe_accounts(options)

        logger.info("-" * 80)
        logger.info(
            "Deduping complete. %d SSO accounts deleted, %d users deleted",
            len(accounts_to_delete),
            len(users_to_delete),
        )
        logger.info("- " * 40)

        logger.info("%d accounts skipped:", len(skipped_accounts))
        for email, accounts in skipped_accounts:
            logger.info(" - %s | %s", email, " | ".join(accounts))
        logger.info("- " * 40)

        logger.info("%d organizations impacted:", len(organizations))
        for org_id, new_orgs in organizations.items():
            logger.info(" - %s -> %s", org_id, " -> ".join(new_orgs))
        logger.info("- " * 40)

        logger.info("%d users impacted:", len(duped_users))
        for email, accounts in duped_users.items():
            logger.info(" - %s -> %s", email, " -> ".join(accounts))
        logger.info("- " * 40)

        logger.info("Summary:")
        logger.info(" %d organizations impacted", len(organizations))
        logger.info(" %d users processed", len(duped_users))
        logger.info(" %d users deleted", len(users_to_delete))
        logger.info(" %d SSO accounts deleted", len(accounts_to_delete))

        if options["dry_run"]:
            logger.info("[DRY-RUN] No changes made.")
