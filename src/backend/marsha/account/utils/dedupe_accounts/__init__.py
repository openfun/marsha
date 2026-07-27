"""Account deduplication utilities."""

from marsha.account.utils.dedupe_accounts.user_deduplicator import UserDeduplicator


def dedupe_accounts(duplicate_email=None, dry_run=False):
    """Deduplicate accounts."""
    deduplicator = UserDeduplicator(dry_run=dry_run)
    return deduplicator.deduplicate(duplicate_email)
