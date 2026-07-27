"""Tracks deduplication operations and their results."""

from dataclasses import dataclass, field
import logging
from typing import Dict, List


logger = logging.getLogger(__name__)


@dataclass
class DedupeTracker:  # pylint: disable=too-many-instance-attributes
    """Tracks deduplication operations and results."""

    deleted_sso_accounts: List[str] = field(default_factory=list)
    same_account_migrations: Dict[str, List[str]] = field(default_factory=dict)
    organization_uid_migrations: Dict[str, List[str]] = field(default_factory=dict)
    deleted_user_accounts: List[str] = field(default_factory=list)
    different_account_merges: Dict[str, List[str]] = field(default_factory=dict)
    transferred_organizations: Dict[str, List[str]] = field(default_factory=dict)
    transferred_lti_associations: Dict[str, List[str]] = field(default_factory=dict)
    transferred_lti_passports: Dict[str, int] = field(default_factory=dict)
    transferred_consumersite_accesses: Dict[str, int] = field(default_factory=dict)
    transferred_playlist_accesses: Dict[str, int] = field(default_factory=dict)
    transferred_created_playlists: Dict[str, int] = field(default_factory=dict)
    transferred_created_videos: Dict[str, int] = field(default_factory=dict)
    transferred_created_documents: Dict[str, int] = field(default_factory=dict)
    transferred_created_markdown_documents: Dict[str, int] = field(default_factory=dict)
    transferred_portability_requests: Dict[str, int] = field(default_factory=dict)

    def track_different_account_merge(self, email, original_uid, new_uid):
        """Track merge of accounts with different SSO account emails."""
        if email not in self.different_account_merges:
            self.different_account_merges[email] = [original_uid, new_uid]
        else:
            self.different_account_merges[email].append(new_uid)

    def track_same_account_migration(self, email, original_uid, new_uid):
        """Track migration of same SSO account email across organizations."""
        if email not in self.same_account_migrations:
            self.same_account_migrations[email] = [original_uid, new_uid]
        else:
            self.same_account_migrations[email].append(new_uid)

    def track_organization_uid_migration(self, original_org_uid, new_org_uid):
        """Track organization UID migrations."""
        for _, value in self.organization_uid_migrations.items():
            if original_org_uid in value:
                value.append(new_org_uid)
                return
        if original_org_uid not in self.organization_uid_migrations:
            self.organization_uid_migrations[original_org_uid] = [new_org_uid]
        elif new_org_uid != self.organization_uid_migrations[original_org_uid][-1]:
            self.organization_uid_migrations[original_org_uid].append(new_org_uid)

    def mark_user_for_deletion(self, username):
        """Mark a user for deletion."""
        self.deleted_user_accounts.append(username)

    def mark_account_for_deletion(self, uid):
        """Mark an account for deletion."""
        self.deleted_sso_accounts.append(uid)

    def get_or_init_transferred_orgs(self, user):
        """Get or initialize a transferred organizations list for a user."""
        if user.email not in self.transferred_organizations:
            self.transferred_organizations[user.email] = list(
                user.organization_set.all().values_list("name", flat=True)
            )
        return self.transferred_organizations[user.email]

    def mark_transferred_orgs(self, user, organizations):
        """Mark organizations transferred to a user."""
        transferred_orgs = self.get_or_init_transferred_orgs(user)
        for organization in organizations:
            transferred_orgs.append(organization.name)

    def get_or_init_transferred_lti_associations(self, user):
        """Get or initialize a transferred LTI associations list for a user."""
        if user.email not in self.transferred_lti_associations:
            self.transferred_lti_associations[user.email] = list(
                user.lti_user_associations.all().values_list(
                    "consumer_site__name", flat=True
                )
            )
        return self.transferred_lti_associations[user.email]

    def mark_transferred_lti_association(self, user, lti_user_associations):
        """Track LTI associations transferred from duplicate user to original user."""
        transferred_associations = self.get_or_init_transferred_lti_associations(user)
        transferred_associations.extend(
            lti_user_associations.values_list("consumer_site__name", flat=True)
        )

    def mark_transferred_lti_passports(self, user, count):
        """Track LTI passports transferred to a user."""
        if user.email not in self.transferred_lti_passports:
            self.transferred_lti_passports[user.email] = 0
        self.transferred_lti_passports[user.email] += count

    def mark_transferred_consumersite_accesses(self, user, count):
        """Track consumer site accesses transferred to a user."""
        if user.email not in self.transferred_consumersite_accesses:
            self.transferred_consumersite_accesses[user.email] = 0
        self.transferred_consumersite_accesses[user.email] += count

    def mark_transferred_playlist_accesses(self, user, count):
        """Track playlist accesses transferred to a user."""
        if user.email not in self.transferred_playlist_accesses:
            self.transferred_playlist_accesses[user.email] = 0
        self.transferred_playlist_accesses[user.email] += count

    def mark_transferred_created_playlists(self, user, count):
        """Track created playlists transferred to a user."""
        if user.email not in self.transferred_created_playlists:
            self.transferred_created_playlists[user.email] = 0
        self.transferred_created_playlists[user.email] += count

    def mark_transferred_created_videos(self, user, count):
        """Track created videos transferred to a user."""
        if user.email not in self.transferred_created_videos:
            self.transferred_created_videos[user.email] = 0
        self.transferred_created_videos[user.email] += count

    def mark_transferred_created_documents(self, user, count):
        """Track created documents transferred to a user."""
        if user.email not in self.transferred_created_documents:
            self.transferred_created_documents[user.email] = 0
        self.transferred_created_documents[user.email] += count

    def mark_transferred_created_markdown_documents(self, user, count):
        """Track created markdown documents transferred to a user."""
        if user.email not in self.transferred_created_markdown_documents:
            self.transferred_created_markdown_documents[user.email] = 0
        self.transferred_created_markdown_documents[user.email] += count

    def mark_transferred_portability_requests(self, user, count):
        """Track portability requests transferred to a user."""
        if user.email not in self.transferred_portability_requests:
            self.transferred_portability_requests[user.email] = 0
        self.transferred_portability_requests[user.email] += count

    def log_results(self, dry_run=False):
        """Log deduplication results."""
        logger.info("-" * 80)
        logger.info("Deduping complete")
        logger.info("- " * 40)

        # Sections with dict[str, List[str]] - key_sep and value_sep
        dict_list_sections = [
            (
                "organization UID migrations",
                self.organization_uid_migrations,
                "->",
                "->",
            ),
            ("same account migrations", self.same_account_migrations, "->", "->"),
            ("different account merges", self.different_account_merges, ":", "+"),
            ("organizations transferred", self.transferred_organizations, ":", "+"),
            (
                "LTI associations transferred",
                self.transferred_lti_associations,
                ":",
                "+",
            ),
        ]

        for title, data, key_sep, val_sep in dict_list_sections:
            logger.info("%d %s:", len(data), title)
            for key, values in data.items():
                logger.info(" - %s %s %s", key, key_sep, f" {val_sep} ".join(values))
            logger.info("- " * 40)

        # Sections with dict[str, int]
        dict_count_sections = [
            ("LTI passports transferred", self.transferred_lti_passports),
            (
                "consumer site accesses transferred",
                self.transferred_consumersite_accesses,
            ),
            ("playlist accesses transferred", self.transferred_playlist_accesses),
            ("created playlists transferred", self.transferred_created_playlists),
            ("created videos transferred", self.transferred_created_videos),
            ("created documents transferred", self.transferred_created_documents),
            (
                "created markdown documents transferred",
                self.transferred_created_markdown_documents,
            ),
            ("portability requests transferred", self.transferred_portability_requests),
        ]

        for title, data in dict_count_sections:
            logger.info("%d %s:", len(data), title)
            for key, count in data.items():
                logger.info(" - %s : %d", key, count)
            logger.info("- " * 40)

        # Sections with List[str]
        list_sections = [
            ("user accounts deleted", self.deleted_user_accounts),
            ("SSO accounts deleted", self.deleted_sso_accounts),
        ]

        for title, data in list_sections:
            logger.info("%d %s:", len(data), title)
            for item in data:
                logger.info(" - %s", item)
            logger.info("- " * 40)

        # Summary
        logger.info("Summary:")
        summary_sections = dict_list_sections + dict_count_sections + list_sections
        for title, data, *_ in summary_sections:
            logger.info(" %d %s", len(data), title)

        if dry_run:
            logger.info("[DRY-RUN] No changes made.")
