"""Handles user account deduplication logic."""

import logging

from django.contrib.auth import get_user_model
from django.db.models import Count

from marsha.account.utils.dedupe_accounts.dedupe_tracker import DedupeTracker


logger = logging.getLogger(__name__)


class UserDeduplicator:  # pylint: disable=too-many-public-methods
    """Handles user deduplication logic."""

    def __init__(self, dry_run=False):
        self.dry_run = dry_run
        self.tracker = DedupeTracker()

    @staticmethod
    def get_duplicate_emails(duplicate_email=None):
        """Get list of duplicate email addresses."""
        if duplicate_email:
            return [{"email": duplicate_email}]

        # pylint: disable=invalid-name
        User = get_user_model()

        return (
            User.objects.values("email")
            .annotate(count=Count("id"))
            .filter(count__gt=1)
            .order_by("email")
        )

    @staticmethod
    def parse_social_uid(social_auth):
        """Extract organization UID and account email from social auth UID."""
        if not social_auth:
            return None, None

        parts = social_auth.uid.split(":")
        organization_uid = parts[0]
        account_email = parts[1] if len(parts) > 1 else None
        return organization_uid, account_email

    def transfer_playlists(self, original_user, duplicate_user):
        """Transfer playlists from duplicate user to original user."""
        if not self.dry_run:
            for playlist_access in duplicate_user.playlist_accesses.all():
                playlist_access.playlist.created_by = original_user
                playlist_access.playlist.save()
                if playlist_access.playlist not in original_user.playlists.all():
                    playlist_access.user = original_user
                    playlist_access.save()
                else:
                    playlist_access.delete()

    def transfer_organizations(self, original_user, duplicate_user):
        """Transfer organizations from duplicate user to original user."""
        new_organizations = duplicate_user.organization_set.exclude(
            id__in=original_user.organization_set.values_list("id", flat=True)
        )

        if new_organizations:
            self.tracker.mark_transferred_orgs(original_user, new_organizations)

            if not self.dry_run:
                for organization_access in duplicate_user.organization_accesses.all():
                    if (
                        organization_access.organization
                        not in original_user.organization_set.all()
                    ):
                        organization_access.user = original_user
                        organization_access.save()

    def transfer_lti_associations(self, original_user, duplicate_user):
        """Transfer LTI associations from duplicate user to original user."""
        lti_count = duplicate_user.lti_user_associations.count()
        if lti_count > 0:
            self.tracker.mark_transferred_lti_association(
                original_user, duplicate_user.lti_user_associations
            )
            if not self.dry_run:
                duplicate_user.lti_user_associations.update(user=original_user)

    def transfer_lti_passports(self, original_user, duplicate_user):
        """Transfer LTI passports from duplicate user to original user."""
        count = duplicate_user.lti_passports.count()
        if count > 0:
            self.tracker.mark_transferred_lti_passports(original_user, count)
            if not self.dry_run:
                duplicate_user.lti_passports.update(created_by=original_user)

    def transfer_consumersite_accesses(self, original_user, duplicate_user):
        """Transfer consumer site accesses from duplicate user to original user."""
        new_accesses = duplicate_user.consumersite_accesses.exclude(
            consumer_site_id__in=original_user.consumersite_accesses.values_list(
                "consumer_site_id", flat=True
            )
        )
        count = new_accesses.count()
        if count > 0:
            self.tracker.mark_transferred_consumersite_accesses(original_user, count)
            if not self.dry_run:
                new_accesses.update(user=original_user)

        # Delete duplicate accesses (only if not dry run)
        if not self.dry_run:
            duplicate_user.consumersite_accesses.exclude(
                id__in=new_accesses.values_list("id", flat=True)
            ).delete()

    def transfer_playlist_accesses(self, original_user, duplicate_user):
        """Transfer playlist accesses from duplicate user to original user."""
        new_accesses = duplicate_user.playlist_accesses.exclude(
            playlist_id__in=original_user.playlist_accesses.values_list(
                "playlist_id", flat=True
            )
        )
        count = new_accesses.count()
        if count > 0:
            self.tracker.mark_transferred_playlist_accesses(original_user, count)
            if not self.dry_run:
                new_accesses.update(user=original_user)

        # Delete duplicate accesses (only if not dry run)
        if not self.dry_run:
            duplicate_user.playlist_accesses.exclude(
                id__in=new_accesses.values_list("id", flat=True)
            ).delete()

    def transfer_created_playlists(self, original_user, duplicate_user):
        """Transfer created playlists from duplicate user to original user."""
        count = duplicate_user.created_playlists.count()
        if count > 0:
            self.tracker.mark_transferred_created_playlists(original_user, count)
            if not self.dry_run:
                duplicate_user.created_playlists.update(created_by=original_user)

    def transfer_created_videos(self, original_user, duplicate_user):
        """Transfer created videos from duplicate user to original user."""
        count = duplicate_user.created_video.count()
        if count > 0:
            self.tracker.mark_transferred_created_videos(original_user, count)
            if not self.dry_run:
                duplicate_user.created_video.update(created_by=original_user)

    def transfer_created_documents(self, original_user, duplicate_user):
        """Transfer created documents from duplicate user to original user."""
        count = duplicate_user.created_document.count()
        if count > 0:
            self.tracker.mark_transferred_created_documents(original_user, count)
            if not self.dry_run:
                duplicate_user.created_document.update(created_by=original_user)

    def transfer_created_markdown_documents(self, original_user, duplicate_user):
        """Transfer created markdown documents from duplicate user to original user."""
        count = duplicate_user.created_markdowndocument.count()
        if count > 0:
            self.tracker.mark_transferred_created_markdown_documents(
                original_user, count
            )
            if not self.dry_run:
                duplicate_user.created_markdowndocument.update(created_by=original_user)

    def transfer_portability_requests(self, original_user, duplicate_user):
        """Transfer portability requests from duplicate user to original user."""
        count = (
            duplicate_user.portability_requests.count()
            + duplicate_user.actioned_portability_requests.count()
        )
        if count > 0:
            self.tracker.mark_transferred_portability_requests(original_user, count)
            if not self.dry_run:
                duplicate_user.portability_requests.update(from_user=original_user)
                duplicate_user.actioned_portability_requests.update(
                    updated_by_user=original_user
                )

    def process_relations(self, original_user, duplicate_user):
        """Process relations between users."""
        self.transfer_playlists(original_user, duplicate_user)
        self.transfer_organizations(original_user, duplicate_user)
        self.transfer_lti_associations(original_user, duplicate_user)
        self.transfer_lti_passports(original_user, duplicate_user)
        self.transfer_consumersite_accesses(original_user, duplicate_user)
        self.transfer_playlist_accesses(original_user, duplicate_user)
        self.transfer_created_playlists(original_user, duplicate_user)
        self.transfer_created_videos(original_user, duplicate_user)
        self.transfer_created_documents(original_user, duplicate_user)
        self.transfer_created_markdown_documents(original_user, duplicate_user)
        self.transfer_portability_requests(original_user, duplicate_user)

    def delete_user(self, user):
        """Delete a user."""
        self.tracker.mark_user_for_deletion(user.username)
        if not self.dry_run:
            user.delete()

    def delete_account(self, account):
        """Delete an account."""
        self.tracker.mark_account_for_deletion(account.uid)
        if not self.dry_run:
            account.delete()

    def add_social_auth(self, user, social_auth):
        """Add social auth to a user."""
        if not self.dry_run:
            user.social_auth.add(social_auth)

    def set_social_auth(self, user, social_auth):
        """Set social auth for a user."""
        if not self.dry_run:
            user.social_auth.set([social_auth])

    def handle_different_accounts(
        self, original_user, duplicate_user, original_social, new_social
    ):
        """Handle case where users have different account emails."""
        self.tracker.track_different_account_merge(
            original_user.email, original_social.uid, new_social.uid
        )

        self.add_social_auth(original_user, new_social)
        self.process_relations(original_user, duplicate_user)
        self.delete_user(duplicate_user)

    #  pylint: disable=too-many-arguments, too-many-positional-arguments
    def handle_same_account(
        self,
        original_user,
        duplicate_user,
        original_social,
        new_social,
        original_org_uid,
        new_org_uid,
    ):
        """Handle case where users have the same account email but different organizations."""
        if new_org_uid:
            self.tracker.track_organization_uid_migration(original_org_uid, new_org_uid)
        self.tracker.track_same_account_migration(
            original_user.email, original_social.uid, new_social.uid
        )

        self.delete_account(original_social)
        self.set_social_auth(original_user, new_social)
        self.process_relations(original_user, duplicate_user)
        self.delete_user(duplicate_user)

    def process_duplicate_user(self, original_user, duplicate_user):
        """Process a single duplicate user against the original."""
        original_social = original_user.social_auth.first()
        new_social = duplicate_user.social_auth.first()

        if not new_social:
            self.process_relations(original_user, duplicate_user)
            self.delete_user(duplicate_user)
            return

        original_org_uid, original_account_email = self.parse_social_uid(
            original_social
        )
        new_org_uid, new_account_email = self.parse_social_uid(new_social)

        if original_account_email != new_account_email:
            self.handle_different_accounts(
                original_user, duplicate_user, original_social, new_social
            )
        else:
            self.handle_same_account(
                original_user,
                duplicate_user,
                original_social,
                new_social,
                original_org_uid,
                new_org_uid,
            )

    def deduplicate(self, duplicate_email=None):
        """Execute the deduplication process."""
        User = get_user_model()  # pylint: disable=invalid-name
        duplicates = self.get_duplicate_emails(duplicate_email)

        processed = 0
        total = len(duplicates)

        for duplicate in duplicates:
            email = duplicate["email"]
            if not email:
                continue

            processed += 1
            print(f"Deduping {processed}/{total}", end="\r", flush=True)

            users = list(User.objects.filter(email=email).order_by("date_joined"))
            original_user, *duplicate_users = users

            for duplicate_user in duplicate_users:
                self.process_duplicate_user(original_user, duplicate_user)

        self.tracker.log_results(self.dry_run)
