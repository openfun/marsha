"""Tests for the DedupeTracker class."""

from django.test import TestCase

from marsha.account.utils.dedupe_accounts.dedupe_tracker import DedupeTracker
from marsha.core.factories import (
    LtiUserAssociationFactory,
    OrganizationAccessFactory,
    UserFactory,
)
from marsha.core.models import ADMINISTRATOR, LtiUserAssociation


class DedupeTrackerTest(TestCase):
    """Test suite for DedupeTracker class."""

    def setUp(self):
        """Set up test case."""
        self.tracker = DedupeTracker()

    def test_initialization(self):
        """Test tracker initializes with empty collections."""
        self.assertEqual(self.tracker.deleted_sso_accounts, [])
        self.assertEqual(self.tracker.same_account_migrations, {})
        self.assertEqual(self.tracker.organization_uid_migrations, {})
        self.assertEqual(self.tracker.deleted_user_accounts, [])
        self.assertEqual(self.tracker.different_account_merges, {})
        self.assertEqual(self.tracker.transferred_organizations, {})
        self.assertEqual(self.tracker.transferred_lti_associations, {})
        self.assertEqual(self.tracker.transferred_lti_passports, {})
        self.assertEqual(self.tracker.transferred_consumersite_accesses, {})
        self.assertEqual(self.tracker.transferred_playlist_accesses, {})
        self.assertEqual(self.tracker.transferred_created_playlists, {})
        self.assertEqual(self.tracker.transferred_created_videos, {})
        self.assertEqual(self.tracker.transferred_created_documents, {})
        self.assertEqual(self.tracker.transferred_created_markdown_documents, {})
        self.assertEqual(self.tracker.transferred_portability_requests, {})

    def test_track_merged_account_first_entry(self):
        """Test tracking merged account creates new entry."""
        self.tracker.track_different_account_merge(
            "user@test.com", "original-uid", "new-uid"
        )

        self.assertEqual(
            self.tracker.different_account_merges["user@test.com"],
            ["original-uid", "new-uid"],
        )

    def test_track_merged_account_append(self):
        """Test tracking merged account appends to existing entry."""
        self.tracker.track_different_account_merge("user@test.com", "uid-1", "uid-2")
        self.tracker.track_different_account_merge("user@test.com", "uid-1", "uid-3")

        self.assertEqual(
            self.tracker.different_account_merges["user@test.com"],
            ["uid-1", "uid-2", "uid-3"],
        )

    def test_track_duplicate_account_first_entry(self):
        """Test tracking duplicate account creates new entry."""
        self.tracker.track_same_account_migration(
            "user@test.com", "original-uid", "new-uid"
        )

        self.assertEqual(
            self.tracker.same_account_migrations["user@test.com"],
            ["original-uid", "new-uid"],
        )

    def test_track_duplicate_account_append(self):
        """Test tracking duplicate account appends to existing entry."""
        self.tracker.track_same_account_migration("user@test.com", "uid-1", "uid-2")
        self.tracker.track_same_account_migration("user@test.com", "uid-1", "uid-3")

        self.assertEqual(
            self.tracker.same_account_migrations["user@test.com"],
            ["uid-1", "uid-2", "uid-3"],
        )

    def test_track_organization_duplicate_first_entry(self):
        """Test tracking organization duplicate creates new entry."""
        self.tracker.track_organization_uid_migration("old-org-uid", "new-org-uid")

        self.assertEqual(
            self.tracker.organization_uid_migrations["old-org-uid"], ["new-org-uid"]
        )

    def test_track_organization_duplicate_append(self):
        """Test tracking organization duplicate appends new UIDs."""
        self.tracker.track_organization_uid_migration("old-org-uid", "new-org-uid-1")
        self.tracker.track_organization_uid_migration("old-org-uid", "new-org-uid-2")

        self.assertEqual(
            self.tracker.organization_uid_migrations["old-org-uid"],
            ["new-org-uid-1", "new-org-uid-2"],
        )

    def test_track_organization_duplicate_no_duplicates(self):
        """Test tracking organization duplicate doesn't add duplicates."""
        self.tracker.track_organization_uid_migration("old-org-uid", "new-org-uid")
        self.tracker.track_organization_uid_migration("old-org-uid", "new-org-uid")

        self.assertEqual(
            self.tracker.organization_uid_migrations["old-org-uid"], ["new-org-uid"]
        )

    def test_track_organization_duplicate_no_consecutive_duplicates(self):
        """Test tracking organization duplicate doesn't add consecutive duplicates."""
        self.tracker.track_organization_uid_migration("old-org-uid", "new-org-uid-1")
        self.tracker.track_organization_uid_migration("old-org-uid", "new-org-uid-2")
        self.tracker.track_organization_uid_migration("old-org-uid", "new-org-uid-2")
        self.tracker.track_organization_uid_migration("old-org-uid", "new-org-uid-3")
        self.tracker.track_organization_uid_migration("old-org-uid", "new-org-uid-2")

        self.assertEqual(
            self.tracker.organization_uid_migrations["old-org-uid"],
            ["new-org-uid-1", "new-org-uid-2", "new-org-uid-3", "new-org-uid-2"],
        )

    def test_mark_user_for_deletion(self):
        """Test marking user for deletion."""
        self.tracker.mark_user_for_deletion("user1")
        self.tracker.mark_user_for_deletion("user2")

        self.assertEqual(self.tracker.deleted_user_accounts, ["user1", "user2"])

    def test_mark_account_for_deletion(self):
        """Test marking account for deletion."""
        self.tracker.mark_account_for_deletion("account-uid-1")
        self.tracker.mark_account_for_deletion("account-uid-2")

        self.assertEqual(
            self.tracker.deleted_sso_accounts, ["account-uid-1", "account-uid-2"]
        )

    def test_get_or_init_transferred_orgs_creates_new(self):
        """Test get_or_init_transferred_orgs creates new entry."""
        access_1 = OrganizationAccessFactory(role=ADMINISTRATOR)
        access_2 = OrganizationAccessFactory(role=ADMINISTRATOR)
        user = access_1.user
        OrganizationAccessFactory(
            user=user, organization=access_2.organization, role=ADMINISTRATOR
        )

        result = self.tracker.get_or_init_transferred_orgs(user)

        self.assertIn(access_1.organization.name, result)
        self.assertIn(access_2.organization.name, result)
        self.assertEqual(self.tracker.transferred_organizations[user.email], result)

    def test_get_or_init_transferred_orgs_returns_existing(self):
        """Test get_or_init_transferred_orgs returns existing entry."""
        access = OrganizationAccessFactory(role=ADMINISTRATOR)
        user = access.user
        self.tracker.transferred_organizations[user.email] = [access.organization.name]

        result = self.tracker.get_or_init_transferred_orgs(user)

        self.assertEqual(result, [access.organization.name])

    def test_mark_transferred_orgs_first_time(self):
        """Test mark_transferred_orgs creates new entry and adds organizations."""
        access_1 = OrganizationAccessFactory(role=ADMINISTRATOR)
        access_2 = OrganizationAccessFactory(role=ADMINISTRATOR)
        user = access_1.user
        OrganizationAccessFactory(
            user=user, organization=access_2.organization, role=ADMINISTRATOR
        )

        # Create organizations to transfer
        duplicate_org_access_1 = OrganizationAccessFactory(role=ADMINISTRATOR)
        duplicate_org_access_2 = OrganizationAccessFactory(role=ADMINISTRATOR)
        organizations_to_transfer = [
            duplicate_org_access_1.organization,
            duplicate_org_access_2.organization,
        ]

        self.tracker.mark_transferred_orgs(user, organizations_to_transfer)

        self.assertIn(user.email, self.tracker.transferred_organizations)
        transferred = self.tracker.transferred_organizations[user.email]
        # Should include original orgs plus transferred ones
        self.assertIn(access_1.organization.name, transferred)
        self.assertIn(access_2.organization.name, transferred)
        self.assertIn(duplicate_org_access_1.organization.name, transferred)
        self.assertIn(duplicate_org_access_2.organization.name, transferred)

    def test_mark_transferred_orgs_appends_to_existing(self):
        """Test mark_transferred_orgs appends to existing entry."""
        access = OrganizationAccessFactory(role=ADMINISTRATOR)
        user = access.user

        # Pre-populate with one organization
        self.tracker.transferred_organizations[user.email] = [access.organization.name]

        # Add more organizations
        duplicate_org_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        organizations_to_transfer = [duplicate_org_access.organization]

        self.tracker.mark_transferred_orgs(user, organizations_to_transfer)

        transferred = self.tracker.transferred_organizations[user.email]
        self.assertEqual(len(transferred), 2)
        self.assertIn(access.organization.name, transferred)
        self.assertIn(duplicate_org_access.organization.name, transferred)

    def test_mark_transferred_orgs_empty_list(self):
        """Test mark_transferred_orgs with empty list."""
        access = OrganizationAccessFactory(role=ADMINISTRATOR)
        user = access.user

        self.tracker.mark_transferred_orgs(user, [])

        self.assertIn(user.email, self.tracker.transferred_organizations)
        # Should only have the user's existing organization
        transferred = self.tracker.transferred_organizations[user.email]
        self.assertEqual(len(transferred), 1)
        self.assertIn(access.organization.name, transferred)

    def test_get_or_init_transferred_lti_associations_creates_new(self):
        """Test get_or_init_transferred_lti_associations creates new entry."""
        lti_association_1 = LtiUserAssociationFactory()
        lti_association_2 = LtiUserAssociationFactory()
        user = lti_association_1.user
        LtiUserAssociationFactory(
            user=user, consumer_site=lti_association_2.consumer_site
        )

        result = self.tracker.get_or_init_transferred_lti_associations(user)

        self.assertIn(lti_association_1.consumer_site.name, result)
        self.assertIn(lti_association_2.consumer_site.name, result)
        self.assertEqual(self.tracker.transferred_lti_associations[user.email], result)

    def test_get_or_init_transferred_lti_associations_returns_existing(self):
        """Test get_or_init_transferred_lti_associations returns existing entry."""
        lti_association = LtiUserAssociationFactory()
        user = lti_association.user
        self.tracker.transferred_lti_associations[user.email] = [
            lti_association.consumer_site.name
        ]

        result = self.tracker.get_or_init_transferred_lti_associations(user)

        self.assertEqual(result, [lti_association.consumer_site.name])

    def test_mark_transferred_lti_association_first_time(self):
        """Test mark_transferred_lti_association creates new entry and adds associations."""
        lti_association_1 = LtiUserAssociationFactory()
        lti_association_2 = LtiUserAssociationFactory()
        user = lti_association_1.user
        LtiUserAssociationFactory(
            user=user, consumer_site=lti_association_2.consumer_site
        )

        # Create LTI associations to transfer
        duplicate_lti_association_1 = LtiUserAssociationFactory()
        duplicate_lti_association_2 = LtiUserAssociationFactory()
        lti_associations_to_transfer = LtiUserAssociation.objects.filter(
            id__in=[duplicate_lti_association_1.id, duplicate_lti_association_2.id]
        )

        self.tracker.mark_transferred_lti_association(
            user, lti_associations_to_transfer
        )

        self.assertIn(user.email, self.tracker.transferred_lti_associations)
        transferred = self.tracker.transferred_lti_associations[user.email]
        # Should include original associations plus transferred ones
        self.assertIn(lti_association_1.consumer_site.name, transferred)
        self.assertIn(lti_association_2.consumer_site.name, transferred)
        self.assertIn(duplicate_lti_association_1.consumer_site.name, transferred)
        self.assertIn(duplicate_lti_association_2.consumer_site.name, transferred)

    def test_mark_transferred_lti_association_appends_to_existing(self):
        """Test mark_transferred_lti_association appends to existing entry."""
        lti_association = LtiUserAssociationFactory()
        user = lti_association.user

        # Pre-populate with one association
        self.tracker.transferred_lti_associations[user.email] = [
            lti_association.consumer_site.name
        ]

        # Add more associations
        duplicate_lti_association = LtiUserAssociationFactory()
        lti_associations_to_transfer = LtiUserAssociation.objects.filter(
            id=duplicate_lti_association.id
        )

        self.tracker.mark_transferred_lti_association(
            user, lti_associations_to_transfer
        )

        transferred = self.tracker.transferred_lti_associations[user.email]
        self.assertEqual(len(transferred), 2)
        self.assertIn(lti_association.consumer_site.name, transferred)
        self.assertIn(duplicate_lti_association.consumer_site.name, transferred)

    def test_mark_transferred_lti_association_empty_queryset(self):
        """Test mark_transferred_lti_association with empty queryset."""
        lti_association = LtiUserAssociationFactory()
        user = lti_association.user

        # Empty queryset
        empty_queryset = LtiUserAssociation.objects.none()

        self.tracker.mark_transferred_lti_association(user, empty_queryset)

        self.assertIn(user.email, self.tracker.transferred_lti_associations)
        # Should only have the user's existing association
        transferred = self.tracker.transferred_lti_associations[user.email]
        self.assertEqual(len(transferred), 1)
        self.assertIn(lti_association.consumer_site.name, transferred)

    def test_mark_transferred_lti_passports_first_time(self):
        """Test mark_transferred_lti_passports creates new entry."""
        user = UserFactory()
        self.tracker.mark_transferred_lti_passports(user, 3)

        self.assertEqual(self.tracker.transferred_lti_passports[user.email], 3)

    def test_mark_transferred_lti_passports_accumulates(self):
        """Test mark_transferred_lti_passports accumulates counts."""
        user = UserFactory()
        self.tracker.mark_transferred_lti_passports(user, 2)
        self.tracker.mark_transferred_lti_passports(user, 3)

        self.assertEqual(self.tracker.transferred_lti_passports[user.email], 5)

    def test_mark_transferred_consumersite_accesses_first_time(self):
        """Test mark_transferred_consumersite_accesses creates new entry."""
        user = UserFactory()
        self.tracker.mark_transferred_consumersite_accesses(user, 2)

        self.assertEqual(self.tracker.transferred_consumersite_accesses[user.email], 2)

    def test_mark_transferred_consumersite_accesses_accumulates(self):
        """Test mark_transferred_consumersite_accesses accumulates counts."""
        user = UserFactory()
        self.tracker.mark_transferred_consumersite_accesses(user, 1)
        self.tracker.mark_transferred_consumersite_accesses(user, 2)

        self.assertEqual(self.tracker.transferred_consumersite_accesses[user.email], 3)

    def test_mark_transferred_playlist_accesses_first_time(self):
        """Test mark_transferred_playlist_accesses creates new entry."""
        user = UserFactory()
        self.tracker.mark_transferred_playlist_accesses(user, 4)

        self.assertEqual(self.tracker.transferred_playlist_accesses[user.email], 4)

    def test_mark_transferred_playlist_accesses_accumulates(self):
        """Test mark_transferred_playlist_accesses accumulates counts."""
        user = UserFactory()
        self.tracker.mark_transferred_playlist_accesses(user, 2)
        self.tracker.mark_transferred_playlist_accesses(user, 1)

        self.assertEqual(self.tracker.transferred_playlist_accesses[user.email], 3)

    def test_mark_transferred_created_playlists_first_time(self):
        """Test mark_transferred_created_playlists creates new entry."""
        user = UserFactory()
        self.tracker.mark_transferred_created_playlists(user, 5)

        self.assertEqual(self.tracker.transferred_created_playlists[user.email], 5)

    def test_mark_transferred_created_playlists_accumulates(self):
        """Test mark_transferred_created_playlists accumulates counts."""
        user = UserFactory()
        self.tracker.mark_transferred_created_playlists(user, 3)
        self.tracker.mark_transferred_created_playlists(user, 2)

        self.assertEqual(self.tracker.transferred_created_playlists[user.email], 5)

    def test_mark_transferred_created_videos_first_time(self):
        """Test mark_transferred_created_videos creates new entry."""
        user = UserFactory()
        self.tracker.mark_transferred_created_videos(user, 10)

        self.assertEqual(self.tracker.transferred_created_videos[user.email], 10)

    def test_mark_transferred_created_videos_accumulates(self):
        """Test mark_transferred_created_videos accumulates counts."""
        user = UserFactory()
        self.tracker.mark_transferred_created_videos(user, 7)
        self.tracker.mark_transferred_created_videos(user, 3)

        self.assertEqual(self.tracker.transferred_created_videos[user.email], 10)

    def test_mark_transferred_created_documents_first_time(self):
        """Test mark_transferred_created_documents creates new entry."""
        user = UserFactory()
        self.tracker.mark_transferred_created_documents(user, 6)

        self.assertEqual(self.tracker.transferred_created_documents[user.email], 6)

    def test_mark_transferred_created_documents_accumulates(self):
        """Test mark_transferred_created_documents accumulates counts."""
        user = UserFactory()
        self.tracker.mark_transferred_created_documents(user, 4)
        self.tracker.mark_transferred_created_documents(user, 2)

        self.assertEqual(self.tracker.transferred_created_documents[user.email], 6)

    def test_mark_transferred_created_markdown_documents_first_time(self):
        """Test mark_transferred_created_markdown_documents creates new entry."""
        user = UserFactory()
        self.tracker.mark_transferred_created_markdown_documents(user, 3)

        self.assertEqual(
            self.tracker.transferred_created_markdown_documents[user.email], 3
        )

    def test_mark_transferred_created_markdown_documents_accumulates(self):
        """Test mark_transferred_created_markdown_documents accumulates counts."""
        user = UserFactory()
        self.tracker.mark_transferred_created_markdown_documents(user, 1)
        self.tracker.mark_transferred_created_markdown_documents(user, 2)

        self.assertEqual(
            self.tracker.transferred_created_markdown_documents[user.email], 3
        )

    def test_mark_transferred_portability_requests_first_time(self):
        """Test mark_transferred_portability_requests creates new entry."""
        user = UserFactory()
        self.tracker.mark_transferred_portability_requests(user, 2)

        self.assertEqual(self.tracker.transferred_portability_requests[user.email], 2)

    def test_mark_transferred_portability_requests_accumulates(self):
        """Test mark_transferred_portability_requests accumulates counts."""
        user = UserFactory()
        self.tracker.mark_transferred_portability_requests(user, 1)
        self.tracker.mark_transferred_portability_requests(user, 3)

        self.assertEqual(self.tracker.transferred_portability_requests[user.email], 4)
