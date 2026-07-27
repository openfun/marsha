"""Tests for the UserDeduplicator class."""

from unittest.mock import Mock

from django.contrib.auth import get_user_model
from django.test import TestCase

from social_django.models import UserSocialAuth

from marsha.account.utils.dedupe_accounts import UserDeduplicator
from marsha.account.utils.dedupe_accounts.dedupe_tracker import DedupeTracker
from marsha.core.factories import (
    ConsumerSiteAccessFactory,
    ConsumerSiteFactory,
    ConsumerSiteLTIPassportFactory,
    DocumentFactory,
    LtiUserAssociationFactory,
    OrganizationAccessFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
    PortabilityRequestFactory,
    UserFactory,
    VideoFactory,
)
from marsha.core.models import ADMINISTRATOR, ConsumerSiteAccess, PlaylistAccess
from marsha.markdown.factories import MarkdownDocumentFactory


# pylint: disable=invalid-name
User = get_user_model()


class UserDeduplicatorTest(TestCase):
    """Test suite for UserDeduplicator class."""

    def setUp(self):
        """Set up test case."""
        self.deduplicator = UserDeduplicator(dry_run=False)

    def test_initialization(self):
        """Test deduplicator initializes correctly."""
        self.assertFalse(self.deduplicator.dry_run)
        self.assertIsInstance(self.deduplicator.tracker, DedupeTracker)

    def test_initialization_dry_run(self):
        """Test deduplicator initializes with dry_run."""
        deduplicator = UserDeduplicator(dry_run=True)
        self.assertTrue(deduplicator.dry_run)

    def test_get_duplicate_emails_with_specific_email(self):
        """Test get_duplicate_emails with specific email."""
        result = UserDeduplicator.get_duplicate_emails("test@example.com")

        self.assertEqual(result, [{"email": "test@example.com"}])

    def test_get_duplicate_emails_without_specific_email(self):
        """Test get_duplicate_emails queries duplicates."""
        PlaylistAccessFactory(user__email="dup@test.com")
        PlaylistAccessFactory(user__email="dup@test.com")
        PlaylistAccessFactory(user__email="unique@test.com")

        result = list(UserDeduplicator.get_duplicate_emails(None))

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["email"], "dup@test.com")

    def test_parse_social_uid_with_valid_uid(self):
        """Test parse_social_uid with valid format."""
        mock_social = Mock(uid="org-123:user@example.com")

        org_uid, account_email = UserDeduplicator.parse_social_uid(mock_social)

        self.assertEqual(org_uid, "org-123")
        self.assertEqual(account_email, "user@example.com")

    def test_parse_social_uid_with_no_colon(self):
        """Test parse_social_uid with uid without colon."""
        mock_social = Mock(uid="org-123")

        org_uid, account_email = UserDeduplicator.parse_social_uid(mock_social)

        self.assertEqual(org_uid, "org-123")
        self.assertIsNone(account_email)

    def test_parse_social_uid_with_none(self):
        """Test parse_social_uid with None."""
        org_uid, account_email = UserDeduplicator.parse_social_uid(None)

        self.assertIsNone(org_uid)
        self.assertIsNone(account_email)

    def test_merge_playlists_dry_run(self):
        """Test merge_playlists in dry run mode."""
        deduplicator = UserDeduplicator(dry_run=True)
        original_access = PlaylistAccessFactory()
        duplicate_access = PlaylistAccessFactory()

        deduplicator.transfer_playlists(original_access.user, duplicate_access.user)

        self.assertFalse(
            duplicate_access.user.playlists.filter(
                id=original_access.playlist.id
            ).exists()
        )

    def test_merge_playlists_regular_run(self):
        """Test merge_playlists in regular mode."""
        original_access = PlaylistAccessFactory()
        duplicate_access = PlaylistAccessFactory()

        self.deduplicator.transfer_playlists(
            original_access.user, duplicate_access.user
        )

        self.assertTrue(
            original_access.user.playlists.filter(
                id=original_access.playlist.id
            ).exists()
        )

    def test_merge_playlists_no_duplicates(self):
        """Test merge_playlists doesn't add duplicate playlists."""
        original_access = PlaylistAccessFactory()
        duplicate_access = PlaylistAccessFactory()
        duplicate_access.user.playlists.add(original_access.playlist)
        initial_count = duplicate_access.user.playlists.count()

        self.deduplicator.transfer_playlists(
            original_access.user, duplicate_access.user
        )

        self.assertEqual(original_access.user.playlists.count(), initial_count)

    def test_transfer_organizations_dry_run(self):
        """Test transfer_organizations in dry run mode."""
        deduplicator = UserDeduplicator(dry_run=True)
        original_org = OrganizationAccessFactory(role=ADMINISTRATOR)
        duplicate_org = OrganizationAccessFactory(role=ADMINISTRATOR)

        deduplicator.transfer_organizations(original_org.user, duplicate_org.user)

        original_org.refresh_from_db()
        self.assertEqual(original_org.user.id, original_org.user.id)

    def test_transfer_organizations_regular_run(self):
        """Test transfer_organizations in regular mode."""
        original_org = OrganizationAccessFactory(role=ADMINISTRATOR)
        duplicate_org = OrganizationAccessFactory(role=ADMINISTRATOR)

        self.deduplicator.transfer_organizations(original_org.user, duplicate_org.user)

        duplicate_org.refresh_from_db()
        self.assertEqual(original_org.user.id, duplicate_org.user.id)

    def test_transfer_organizations_no_duplicate_orgs(self):
        """Test transfer_organizations with no new organizations."""
        org_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        user = org_access.user

        self.deduplicator.transfer_organizations(user, user)

        self.assertEqual(self.deduplicator.tracker.transferred_organizations, {})

    def test_transfer_organizations_excludes_duplicate_orgs(self):
        """
        Test transfer_organizations doesn't transfer access
        to organizations user already has.
        """
        original_user = UserFactory()
        duplicate_user = UserFactory()
        # Create two different organizations
        org_access1 = OrganizationAccessFactory(user=original_user, role=ADMINISTRATOR)
        shared_org = org_access1.organization
        # Create access to the same organization for duplicate user
        org_access2 = OrganizationAccessFactory(
            user=duplicate_user, organization=shared_org, role=ADMINISTRATOR
        )
        # Create access to a different organization for duplicate user
        org_access3 = OrganizationAccessFactory(user=duplicate_user, role=ADMINISTRATOR)
        different_org = org_access3.organization

        # Verify setup: both users should have access to shared_org
        self.assertIn(shared_org, original_user.organization_set.all())
        self.assertIn(shared_org, duplicate_user.organization_set.all())
        self.assertIn(different_org, duplicate_user.organization_set.all())

        self.deduplicator.transfer_organizations(original_user, duplicate_user)

        # org_access2 should not be transferred (original user already has access to shared_org)
        org_access2.refresh_from_db()
        self.assertEqual(org_access2.user, duplicate_user)
        # org_access3 should be transferred (original user didn't have access to different_org)
        org_access3.refresh_from_db()
        self.assertEqual(org_access3.user, original_user)

    def test_transfer_lti_associations_dry_run(self):
        """Test transfer_lti_associations in dry run mode."""
        deduplicator = UserDeduplicator(dry_run=True)
        original_association = LtiUserAssociationFactory()
        duplicate_association = LtiUserAssociationFactory()
        user = original_association.user

        deduplicator.transfer_lti_associations(user, duplicate_association.user)

        # In dry run mode, no transfer should be made
        user.refresh_from_db()
        self.assertFalse(
            user.lti_user_associations.filter(id=duplicate_association.id).exists()
        )
        # But tracking should happen
        self.assertIn(user.email, deduplicator.tracker.transferred_lti_associations)
        transferred = deduplicator.tracker.transferred_lti_associations[user.email]
        self.assertEqual(len(transferred), 2)
        self.assertIn(original_association.consumer_site.name, transferred)
        self.assertIn(duplicate_association.consumer_site.name, transferred)

    def test_transfer_lti_associations_regular_run(self):
        """Test transfer_lti_associations in regular mode."""
        deduplicator = UserDeduplicator(dry_run=False)
        original_association = LtiUserAssociationFactory()
        duplicate_association = LtiUserAssociationFactory()
        user = original_association.user

        deduplicator.transfer_lti_associations(user, duplicate_association.user)

        # In regular mode, the transfer should be made
        user.refresh_from_db()
        self.assertTrue(
            user.lti_user_associations.filter(id=duplicate_association.id).exists()
        )
        # And tracking should happen
        self.assertIn(user.email, deduplicator.tracker.transferred_lti_associations)
        transferred = deduplicator.tracker.transferred_lti_associations[user.email]
        self.assertEqual(len(transferred), 2)
        self.assertIn(original_association.consumer_site.name, transferred)
        self.assertIn(duplicate_association.consumer_site.name, transferred)

    def test_transfer_lti_associations_no_associations(self):
        """Test transfer_lti_associations when duplicate user has no LTI associations."""
        original_access = PlaylistAccessFactory()
        duplicate_access = PlaylistAccessFactory()
        original_user = original_access.user
        duplicate_user = duplicate_access.user

        # Create mock empty LTI associations for duplicate user
        mock_lti = Mock()
        mock_lti.count.return_value = 0
        duplicate_user.lti_associations = mock_lti

        self.deduplicator.transfer_lti_associations(original_user, duplicate_user)

        # Should not call update or track when count is 0
        mock_lti.update.assert_not_called()
        self.assertNotIn(
            original_user.email, self.deduplicator.tracker.transferred_lti_associations
        )

    def test_transfer_lti_passports_regular_run(self):
        """Test transfer_lti_passports in regular mode."""
        original_user = UserFactory()
        duplicate_user = UserFactory()
        passport1 = ConsumerSiteLTIPassportFactory(created_by=duplicate_user)
        passport2 = ConsumerSiteLTIPassportFactory(created_by=duplicate_user)

        self.deduplicator.transfer_lti_passports(original_user, duplicate_user)

        passport1.refresh_from_db()
        passport2.refresh_from_db()
        self.assertEqual(passport1.created_by, original_user)
        self.assertEqual(passport2.created_by, original_user)
        self.assertEqual(
            self.deduplicator.tracker.transferred_lti_passports[original_user.email], 2
        )

    def test_transfer_lti_passports_dry_run(self):
        """Test transfer_lti_passports in dry run mode."""
        deduplicator = UserDeduplicator(dry_run=True)
        original_user = UserFactory()
        duplicate_user = UserFactory()
        passport = ConsumerSiteLTIPassportFactory(created_by=duplicate_user)

        deduplicator.transfer_lti_passports(original_user, duplicate_user)

        passport.refresh_from_db()
        self.assertEqual(passport.created_by, duplicate_user)
        self.assertEqual(
            deduplicator.tracker.transferred_lti_passports[original_user.email], 1
        )

    def test_transfer_lti_passports_no_passports(self):
        """Test transfer_lti_passports when duplicate user has no passports."""
        original_user = UserFactory()
        duplicate_user = UserFactory()

        self.deduplicator.transfer_lti_passports(original_user, duplicate_user)

        self.assertNotIn(
            original_user.email, self.deduplicator.tracker.transferred_lti_passports
        )

    def test_transfer_consumersite_accesses_regular_run(self):
        """Test transfer_consumersite_accesses in regular mode."""
        original_user = UserFactory()
        duplicate_user = UserFactory()
        consumer_site1 = ConsumerSiteFactory()
        consumer_site2 = ConsumerSiteFactory()
        ConsumerSiteAccessFactory(user=original_user, consumer_site=consumer_site1)
        access2 = ConsumerSiteAccessFactory(
            user=duplicate_user, consumer_site=consumer_site2
        )

        self.deduplicator.transfer_consumersite_accesses(original_user, duplicate_user)

        access2.refresh_from_db()
        self.assertEqual(access2.user, original_user)
        self.assertEqual(
            self.deduplicator.tracker.transferred_consumersite_accesses[
                original_user.email
            ],
            1,
        )

    def test_transfer_consumersite_accesses_with_duplicates(self):
        """Test transfer_consumersite_accesses excludes duplicate accesses."""
        original_user = UserFactory()
        duplicate_user = UserFactory()
        consumer_site = ConsumerSiteFactory()
        ConsumerSiteAccessFactory(user=original_user, consumer_site=consumer_site)
        duplicate_access = ConsumerSiteAccessFactory(
            user=duplicate_user, consumer_site=consumer_site
        )

        self.deduplicator.transfer_consumersite_accesses(original_user, duplicate_user)

        self.assertNotIn(
            original_user.email,
            self.deduplicator.tracker.transferred_consumersite_accesses,
        )
        self.assertFalse(
            ConsumerSiteAccess.objects.filter(id=duplicate_access.id).exists()
        )

    def test_transfer_consumersite_accesses_dry_run(self):
        """Test transfer_consumersite_accesses in dry run mode."""
        deduplicator = UserDeduplicator(dry_run=True)
        original_user = UserFactory()
        duplicate_user = UserFactory()
        access = ConsumerSiteAccessFactory(user=duplicate_user)

        deduplicator.transfer_consumersite_accesses(original_user, duplicate_user)

        access.refresh_from_db()
        self.assertEqual(access.user, duplicate_user)
        self.assertEqual(
            deduplicator.tracker.transferred_consumersite_accesses[original_user.email],
            1,
        )

    def test_transfer_playlist_accesses_regular_run(self):
        """Test transfer_playlist_accesses in regular mode."""
        original_user = UserFactory()
        duplicate_user = UserFactory()
        playlist1 = PlaylistFactory()
        playlist2 = PlaylistFactory()
        PlaylistAccessFactory(user=original_user, playlist=playlist1)
        access2 = PlaylistAccessFactory(user=duplicate_user, playlist=playlist2)

        self.deduplicator.transfer_playlist_accesses(original_user, duplicate_user)

        access2.refresh_from_db()
        self.assertEqual(access2.user, original_user)
        self.assertEqual(
            self.deduplicator.tracker.transferred_playlist_accesses[
                original_user.email
            ],
            1,
        )

    def test_transfer_playlist_accesses_with_duplicates(self):
        """Test transfer_playlist_accesses excludes duplicate accesses."""
        original_user = UserFactory()
        duplicate_user = UserFactory()
        playlist = PlaylistFactory()
        PlaylistAccessFactory(user=original_user, playlist=playlist)
        duplicate_access = PlaylistAccessFactory(user=duplicate_user, playlist=playlist)

        self.deduplicator.transfer_playlist_accesses(original_user, duplicate_user)

        self.assertNotIn(
            original_user.email,
            self.deduplicator.tracker.transferred_playlist_accesses,
        )
        self.assertFalse(PlaylistAccess.objects.filter(id=duplicate_access.id).exists())

    def test_transfer_playlist_accesses_dry_run(self):
        """Test transfer_playlist_accesses in dry run mode."""
        deduplicator = UserDeduplicator(dry_run=True)
        original_user = UserFactory()
        duplicate_user = UserFactory()
        access = PlaylistAccessFactory(user=duplicate_user)

        deduplicator.transfer_playlist_accesses(original_user, duplicate_user)

        access.refresh_from_db()
        self.assertEqual(access.user, duplicate_user)
        self.assertEqual(
            deduplicator.tracker.transferred_playlist_accesses[original_user.email], 1
        )

    def test_transfer_created_playlists_regular_run(self):
        """Test transfer_created_playlists in regular mode."""
        original_user = UserFactory()
        duplicate_user = UserFactory()
        playlist1 = PlaylistFactory(created_by=duplicate_user)
        playlist2 = PlaylistFactory(created_by=duplicate_user)

        self.deduplicator.transfer_created_playlists(original_user, duplicate_user)

        playlist1.refresh_from_db()
        playlist2.refresh_from_db()
        self.assertEqual(playlist1.created_by, original_user)
        self.assertEqual(playlist2.created_by, original_user)
        self.assertEqual(
            self.deduplicator.tracker.transferred_created_playlists[
                original_user.email
            ],
            2,
        )

    def test_transfer_created_playlists_dry_run(self):
        """Test transfer_created_playlists in dry run mode."""
        deduplicator = UserDeduplicator(dry_run=True)
        original_user = UserFactory()
        duplicate_user = UserFactory()
        playlist = PlaylistFactory(created_by=duplicate_user)

        deduplicator.transfer_created_playlists(original_user, duplicate_user)

        playlist.refresh_from_db()
        self.assertEqual(playlist.created_by, duplicate_user)
        self.assertEqual(
            deduplicator.tracker.transferred_created_playlists[original_user.email], 1
        )

    def test_transfer_created_videos_regular_run(self):
        """Test transfer_created_videos in regular mode."""
        original_user = UserFactory()
        duplicate_user = UserFactory()
        video1 = VideoFactory(created_by=duplicate_user)
        video2 = VideoFactory(created_by=duplicate_user)

        self.deduplicator.transfer_created_videos(original_user, duplicate_user)

        video1.refresh_from_db()
        video2.refresh_from_db()
        self.assertEqual(video1.created_by, original_user)
        self.assertEqual(video2.created_by, original_user)
        self.assertEqual(
            self.deduplicator.tracker.transferred_created_videos[original_user.email], 2
        )

    def test_transfer_created_videos_dry_run(self):
        """Test transfer_created_videos in dry run mode."""
        deduplicator = UserDeduplicator(dry_run=True)
        original_user = UserFactory()
        duplicate_user = UserFactory()
        video = VideoFactory(created_by=duplicate_user)

        deduplicator.transfer_created_videos(original_user, duplicate_user)

        video.refresh_from_db()
        self.assertEqual(video.created_by, duplicate_user)
        self.assertEqual(
            deduplicator.tracker.transferred_created_videos[original_user.email], 1
        )

    def test_transfer_created_documents_regular_run(self):
        """Test transfer_created_documents in regular mode."""
        original_user = UserFactory()
        duplicate_user = UserFactory()
        doc1 = DocumentFactory(created_by=duplicate_user)
        doc2 = DocumentFactory(created_by=duplicate_user)

        self.deduplicator.transfer_created_documents(original_user, duplicate_user)

        doc1.refresh_from_db()
        doc2.refresh_from_db()
        self.assertEqual(doc1.created_by, original_user)
        self.assertEqual(doc2.created_by, original_user)
        self.assertEqual(
            self.deduplicator.tracker.transferred_created_documents[
                original_user.email
            ],
            2,
        )

    def test_transfer_created_documents_dry_run(self):
        """Test transfer_created_documents in dry run mode."""
        deduplicator = UserDeduplicator(dry_run=True)
        original_user = UserFactory()
        duplicate_user = UserFactory()
        doc = DocumentFactory(created_by=duplicate_user)

        deduplicator.transfer_created_documents(original_user, duplicate_user)

        doc.refresh_from_db()
        self.assertEqual(doc.created_by, duplicate_user)
        self.assertEqual(
            deduplicator.tracker.transferred_created_documents[original_user.email], 1
        )

    def test_transfer_created_markdown_documents_regular_run(self):
        """Test transfer_created_markdown_documents in regular mode."""
        original_user = UserFactory()
        duplicate_user = UserFactory()
        md1 = MarkdownDocumentFactory(created_by=duplicate_user)
        md2 = MarkdownDocumentFactory(created_by=duplicate_user)

        self.deduplicator.transfer_created_markdown_documents(
            original_user, duplicate_user
        )

        md1.refresh_from_db()
        md2.refresh_from_db()
        self.assertEqual(md1.created_by, original_user)
        self.assertEqual(md2.created_by, original_user)
        self.assertEqual(
            self.deduplicator.tracker.transferred_created_markdown_documents[
                original_user.email
            ],
            2,
        )

    def test_transfer_created_markdown_documents_dry_run(self):
        """Test transfer_created_markdown_documents in dry run mode."""
        deduplicator = UserDeduplicator(dry_run=True)
        original_user = UserFactory()
        duplicate_user = UserFactory()
        md = MarkdownDocumentFactory(created_by=duplicate_user)

        deduplicator.transfer_created_markdown_documents(original_user, duplicate_user)

        md.refresh_from_db()
        self.assertEqual(md.created_by, duplicate_user)
        self.assertEqual(
            deduplicator.tracker.transferred_created_markdown_documents[
                original_user.email
            ],
            1,
        )

    def test_transfer_portability_requests_regular_run(self):
        """Test transfer_portability_requests in regular mode."""
        original_user = UserFactory()
        duplicate_user = UserFactory()
        req1 = PortabilityRequestFactory(from_user=duplicate_user)
        req2 = PortabilityRequestFactory(updated_by_user=duplicate_user)

        self.deduplicator.transfer_portability_requests(original_user, duplicate_user)

        req1.refresh_from_db()
        req2.refresh_from_db()
        self.assertEqual(req1.from_user, original_user)
        self.assertEqual(req2.updated_by_user, original_user)
        self.assertEqual(
            self.deduplicator.tracker.transferred_portability_requests[
                original_user.email
            ],
            2,
        )

    def test_transfer_portability_requests_dry_run(self):
        """Test transfer_portability_requests in dry run mode."""
        deduplicator = UserDeduplicator(dry_run=True)
        original_user = UserFactory()
        duplicate_user = UserFactory()
        req = PortabilityRequestFactory(from_user=duplicate_user)

        deduplicator.transfer_portability_requests(original_user, duplicate_user)

        req.refresh_from_db()
        self.assertEqual(req.from_user, duplicate_user)
        self.assertEqual(
            deduplicator.tracker.transferred_portability_requests[original_user.email],
            1,
        )

    def test_handle_different_accounts(self):
        """Test handle_different_accounts merges and deletes correctly."""
        original_access = PlaylistAccessFactory()
        duplicate_access = PlaylistAccessFactory()
        original_social = UserSocialAuth.objects.create(
            user=original_access.user, uid="org-1:original@test.com"
        )
        duplicate_social = UserSocialAuth.objects.create(
            user=duplicate_access.user, uid="org-1:duplicate@test.com"
        )

        self.deduplicator.handle_different_accounts(
            original_access.user,
            duplicate_access.user,
            original_social,
            duplicate_social,
        )

        self.assertIn(
            original_access.user.email,
            self.deduplicator.tracker.different_account_merges,
        )
        self.assertIn(
            duplicate_access.user.username,
            self.deduplicator.tracker.deleted_user_accounts,
        )
        self.assertFalse(User.objects.filter(id=duplicate_access.user.id).exists())
        self.assertTrue(
            original_access.user.social_auth.filter(id=original_social.id).exists()
        )
        self.assertTrue(
            original_access.user.social_auth.filter(id=duplicate_social.id).exists()
        )

    def test_handle_same_account(self):
        """Test handle_same_account updates social auth correctly."""
        original_access = PlaylistAccessFactory()
        duplicate_access = PlaylistAccessFactory(user__email=original_access.user.email)
        original_social = UserSocialAuth.objects.create(
            user=original_access.user, uid=f"org-1:{original_access.user.email}"
        )
        duplicate_social = UserSocialAuth.objects.create(
            user=duplicate_access.user, uid=f"org-2:{original_access.user.email}"
        )

        self.deduplicator.handle_same_account(
            original_access.user,
            duplicate_access.user,
            original_social,
            duplicate_social,
            "org-1",
            "org-2",
        )

        original_access.user.refresh_from_db()
        self.assertTrue(
            original_access.user.social_auth.filter(id=duplicate_social.id).exists()
        )
        self.assertFalse(UserSocialAuth.objects.filter(id=original_social.id).exists())
        self.assertFalse(User.objects.filter(id=duplicate_access.user.id).exists())

    def test_process_duplicate_user_no_social_auth(self):
        """Test process_duplicate_user with no social auth transfers relations and deletes user."""
        original_access = PlaylistAccessFactory()
        duplicate_access = PlaylistAccessFactory()
        duplicate_user_id = duplicate_access.user.id
        duplicate_username = duplicate_access.user.username

        self.deduplicator.process_duplicate_user(
            original_access.user, duplicate_access.user
        )

        # Duplicate user should be deleted
        self.assertFalse(User.objects.filter(id=duplicate_user_id).exists())
        # Duplicate's playlist access should be transferred to original user
        duplicate_access.refresh_from_db()
        self.assertEqual(duplicate_access.user, original_access.user)
        # User should be marked for deletion in tracker
        self.assertIn(
            duplicate_username,
            self.deduplicator.tracker.deleted_user_accounts,
        )

    def test_process_duplicate_user_different_accounts(self):
        """Test process_duplicate_user with different account emails."""
        original_access = PlaylistAccessFactory()
        duplicate_access = PlaylistAccessFactory()
        UserSocialAuth.objects.create(
            user=original_access.user, uid="org-1:original@test.com"
        )
        UserSocialAuth.objects.create(
            user=duplicate_access.user, uid="org-1:duplicate@test.com"
        )

        self.deduplicator.process_duplicate_user(
            original_access.user, duplicate_access.user
        )

        self.assertFalse(User.objects.filter(id=duplicate_access.user.id).exists())

    def test_process_duplicate_user_same_account(self):
        """Test process_duplicate_user with same account email."""
        email = "test@example.com"
        original_access = PlaylistAccessFactory(user__email=email)
        duplicate_access = PlaylistAccessFactory(user__email=email)
        UserSocialAuth.objects.create(user=original_access.user, uid=f"org-1:{email}")
        UserSocialAuth.objects.create(user=duplicate_access.user, uid=f"org-2:{email}")

        self.deduplicator.process_duplicate_user(
            original_access.user, duplicate_access.user
        )

        self.assertFalse(User.objects.filter(id=duplicate_access.user.id).exists())

    def test_deduplicate_skips_empty_emails(self):
        """Test deduplicate skips users with empty emails."""
        PlaylistAccessFactory(user__email="")
        PlaylistAccessFactory(user__email="")

        self.deduplicator.deduplicate(None)

        self.assertEqual(len(self.deduplicator.tracker.deleted_user_accounts), 0)

    def test_deduplicate_with_specific_email(self):
        """Test deduplicate with specific email."""
        email = "specific@test.com"
        access1 = PlaylistAccessFactory(user__email=email)
        access2 = PlaylistAccessFactory(user__email=email)
        UserSocialAuth.objects.create(user=access1.user, uid=f"org-1:{email}")
        UserSocialAuth.objects.create(user=access2.user, uid=f"org-2:{email}")

        self.deduplicator.deduplicate(email)

        self.assertEqual(len(self.deduplicator.tracker.deleted_user_accounts), 1)
