"""Tests for the `dedupe_accounts` management command."""

from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase

from social_django.models import UserSocialAuth

from marsha.core.factories import (
    LtiUserAssociationFactory,
    OrganizationAccessFactory,
    PlaylistAccessFactory,
)
from marsha.core.models import ADMINISTRATOR, LtiUserAssociation, OrganizationAccess


# pylint: disable=invalid-name
User = get_user_model()


class DedupeAccountsCommandTest(TestCase):
    """Test suite for dedupe_accounts command."""

    maxDiff = None

    def setUp(self):
        """
        Set up the test case.
        """
        self.stdout = StringIO()
        self.command_log_prefix = (
            "INFO:marsha.account.management.commands.dedupe_accounts:"
        )
        self.log_prefix = "INFO:marsha.account.utils.dedupe_accounts.dedupe_tracker:"

    @staticmethod
    def _add_social(user, uid="uid-xxx"):
        return UserSocialAuth.objects.create(user=user, uid=uid)

    def _build_expected_logs(
        self, expected_data, dry_run=False, include_command_prefix=False
    ):
        """Build expected log output from structured data."""
        logs = []

        if include_command_prefix:
            logs.append(f"{self.command_log_prefix}[DRY-RUN] No changes will be made.")

        # Header
        logs.extend(
            [
                f"{self.log_prefix}{'-' * 80}",
                f"{self.log_prefix}Deduping complete",
                f"{self.log_prefix}{'- ' * 40}",
            ]
        )

        # Define sections in order
        detail_sections = [
            ("organization UID migrations", "items"),
            ("same account migrations", "items"),
            ("different account merges", "items"),
            ("organizations transferred", "items"),
            ("LTI associations transferred", "items"),
            ("LTI passports transferred", "items"),
            ("consumer site accesses transferred", "items"),
            ("playlist accesses transferred", "items"),
            ("created playlists transferred", "items"),
            ("created videos transferred", "items"),
            ("created documents transferred", "items"),
            ("created markdown documents transferred", "items"),
            ("portability requests transferred", "items"),
            ("user accounts deleted", "items"),
            ("SSO accounts deleted", "items"),
        ]

        # Detail sections
        for section_name, _ in detail_sections:
            section_data = expected_data.get(section_name, {})
            count = section_data.get("count", 0)
            items = section_data.get("items", [])

            logs.append(f"{self.log_prefix}{count} {section_name}:")
            for item in items:
                logs.append(f"{self.log_prefix} - {item}")
            logs.append(f"{self.log_prefix}{'- ' * 40}")

        # Summary section
        logs.append(f"{self.log_prefix}Summary:")
        for section_name, _ in detail_sections:
            section_data = expected_data.get(section_name, {})
            count = section_data.get("count", 0)
            logs.append(f"{self.log_prefix} {count} {section_name}")

        if dry_run:
            logs.append(f"{self.log_prefix}[DRY-RUN] No changes made.")

        return logs

    def test_dedupe_accounts_dry_run(self):
        """
        With the --dry-run flag, no changes should be made.
        """
        playlist_access = PlaylistAccessFactory()
        original_user = playlist_access.user
        original_organization = OrganizationAccessFactory(user=original_user)
        original_lti_association = LtiUserAssociationFactory(user=original_user)
        original_social = self._add_social(
            original_user, uid=f"old-uid:{original_user.email}"
        )

        playlist_access_duplicate = PlaylistAccessFactory(
            user__email=original_user.email
        )
        duplicate_user = playlist_access_duplicate.user
        duplicate_organization = OrganizationAccessFactory(user=duplicate_user)
        duplicate_lti_association = LtiUserAssociationFactory(user=duplicate_user)
        duplicate_social = self._add_social(
            duplicate_user, uid=f"new-uid:{original_user.email}"
        )

        with self.assertLogs("marsha.account", "INFO") as logs:
            call_command("dedupe_accounts", "--dry-run", stdout=self.stdout)

        original_user.refresh_from_db()
        self.assertEqual(original_user.social_auth.first(), original_social)
        duplicate_user.refresh_from_db()
        self.assertEqual(duplicate_user.social_auth.first(), duplicate_social)
        self.assertTrue(
            original_user.playlists.filter(id=playlist_access.playlist.id).exists()
        )
        self.assertTrue(
            duplicate_user.playlists.filter(
                id=playlist_access_duplicate.playlist.id
            ).exists()
        )
        self.assertTrue(
            OrganizationAccess.objects.filter(
                id=original_organization.id, user=original_user
            ).exists()
        )
        self.assertTrue(
            OrganizationAccess.objects.filter(
                id=duplicate_organization.id, user=duplicate_user
            ).exists()
        )
        self.assertTrue(
            LtiUserAssociation.objects.filter(
                id=original_lti_association.id, user=original_user
            ).exists()
        )
        self.assertTrue(
            LtiUserAssociation.objects.filter(
                id=duplicate_lti_association.id, user=duplicate_user
            ).exists()
        )

        lti_sites = " + ".join(
            [
                original_lti_association.consumer_site.name,
                duplicate_lti_association.consumer_site.name,
            ]
        )

        expected_data = {
            "organization UID migrations": {
                "count": 1,
                "items": ["old-uid -> new-uid"],
            },
            "same account migrations": {
                "count": 1,
                "items": [
                    f"{original_user.email} -> {original_social.uid} -> {duplicate_social.uid}"
                ],
            },
            "organizations transferred": {
                "count": 1,
                "items": [
                    f"{original_user.email} : {original_organization.organization.name}"
                    f" + {duplicate_organization.organization.name}"
                ],
            },
            "LTI associations transferred": {
                "count": 1,
                "items": [f"{original_user.email} : {lti_sites}"],
            },
            "playlist accesses transferred": {
                "count": 1,
                "items": [f"{original_user.email} : 1"],
            },
            "user accounts deleted": {"count": 1, "items": [duplicate_user.username]},
            "SSO accounts deleted": {"count": 1, "items": [original_social.uid]},
        }

        self.assertListEqual(
            self._build_expected_logs(
                expected_data, dry_run=True, include_command_prefix=True
            ),
            logs.output,
        )

    def test_dedupe_accounts_1_duplicate(self):
        """
        Accounts with 2 duplicates should be transferred correctly.
        """
        playlist_access = PlaylistAccessFactory()
        user = playlist_access.user
        original_social = self._add_social(user, uid=f"old-uid:{user.email}")
        playlist_access_duplicate = PlaylistAccessFactory(user__email=user.email)
        duplicate_user = playlist_access_duplicate.user
        duplicate_social = self._add_social(duplicate_user, uid=f"new-uid:{user.email}")

        with self.assertLogs("marsha.account", "INFO") as logs:
            call_command("dedupe_accounts", stdout=self.stdout)

        user.refresh_from_db()
        self.assertTrue(user.social_auth.filter(id=duplicate_social.id).exists())
        self.assertTrue(
            user.playlists.filter(id=playlist_access_duplicate.playlist.id).exists()
        )
        self.assertFalse(UserSocialAuth.objects.filter(id=original_social.id).exists())
        self.assertFalse(User.objects.filter(id=duplicate_user.id).exists())

        expected_data = {
            "organization UID migrations": {
                "count": 1,
                "items": ["old-uid -> new-uid"],
            },
            "same account migrations": {
                "count": 1,
                "items": [
                    f"{user.email} -> {original_social.uid} -> {duplicate_social.uid}"
                ],
            },
            "user accounts deleted": {"count": 1, "items": [duplicate_user.username]},
            "SSO accounts deleted": {"count": 1, "items": [original_social.uid]},
        }

        self.assertListEqual(
            self._build_expected_logs(expected_data),
            logs.output,
        )

    def test_dedupe_accounts_2_duplicates(self):
        """
        Accounts with 3 duplicates should be transferred correctly.
        """
        playlist_access = PlaylistAccessFactory()
        user = playlist_access.user
        original_social = self._add_social(user, uid=f"old-uid:{user.email}")

        playlist_access_duplicate = PlaylistAccessFactory(user__email=user.email)
        duplicate_user_1 = playlist_access_duplicate.user
        duplicate_social_1 = self._add_social(
            duplicate_user_1, uid=f"new-uid:{user.email}"
        )

        playlist_access_duplicate_2 = PlaylistAccessFactory(user__email=user.email)
        duplicate_user_2 = playlist_access_duplicate_2.user
        duplicate_social_2 = self._add_social(
            duplicate_user_2, uid=f"new-uid-2:{user.email}"
        )

        with self.assertLogs("marsha.account", "INFO") as logs:
            call_command("dedupe_accounts", stdout=self.stdout)

        user.refresh_from_db()
        self.assertFalse(UserSocialAuth.objects.filter(id=original_social.id).exists())
        self.assertFalse(
            UserSocialAuth.objects.filter(id=duplicate_social_1.id).exists()
        )
        self.assertTrue(user.social_auth.filter(id=duplicate_social_2.id).exists())

        self.assertTrue(user.playlists.filter(id=playlist_access.playlist.id).exists())
        self.assertTrue(
            user.playlists.filter(id=playlist_access_duplicate.playlist.id).exists()
        )
        self.assertTrue(
            user.playlists.filter(id=playlist_access_duplicate_2.playlist.id).exists()
        )

        self.assertTrue(User.objects.filter(id=user.id).exists())
        self.assertFalse(User.objects.filter(id=duplicate_user_1.id).exists())
        self.assertFalse(User.objects.filter(id=duplicate_user_2.id).exists())

        expected_data = {
            "organization UID migrations": {
                "count": 1,
                "items": ["old-uid -> new-uid -> new-uid-2"],
            },
            "same account migrations": {
                "count": 1,
                "items": [
                    f"{user.email} -> {original_social.uid}"
                    f" -> {duplicate_social_1.uid} -> {duplicate_social_2.uid}"
                ],
            },
            "user accounts deleted": {
                "count": 2,
                "items": [duplicate_user_1.username, duplicate_user_2.username],
            },
            "SSO accounts deleted": {
                "count": 2,
                "items": [original_social.uid, duplicate_social_1.uid],
            },
        }

        self.assertListEqual(
            self._build_expected_logs(expected_data),
            logs.output,
        )

    # pylint: disable=too-many-locals,too-many-statements
    def test_dedupe_accounts_2_duplicates_2_skips(self):
        """
        Accounts with 3 duplicates should be transferred correctly.
        2 duplicates should be skipped.
        """
        playlist_access = PlaylistAccessFactory(
            user__email="user@example.com",
            user__username="user@example.com",
        )
        user = playlist_access.user
        original_social = self._add_social(user, uid=f"old-uid:{user.email}")
        original_orga = OrganizationAccessFactory(
            user=user, role=ADMINISTRATOR
        ).organization
        original_lti_association = LtiUserAssociationFactory(user=user)

        playlist_access_duplicate = PlaylistAccessFactory(
            user__email=user.email,
            user__username=f"{user.email}-1",
        )
        duplicate_user_1 = playlist_access_duplicate.user
        duplicate_social_1 = self._add_social(
            duplicate_user_1, uid=f"new-uid:{user.email}"
        )
        duplicate_orga_1 = OrganizationAccessFactory(
            user=duplicate_user_1, role=ADMINISTRATOR
        ).organization
        duplicate_lti_association_1 = LtiUserAssociationFactory(user=duplicate_user_1)

        playlist_access_duplicate_2 = PlaylistAccessFactory(
            user__email=user.email, user__username=f"{user.email}-2"
        )
        duplicate_user_2 = playlist_access_duplicate_2.user
        duplicate_social_2 = self._add_social(
            duplicate_user_2, uid=f"new-uid-2:{user.email}"
        )
        duplicate_orga_2 = OrganizationAccessFactory(
            user=duplicate_user_2, role=ADMINISTRATOR
        ).organization
        duplicate_lti_association_2 = LtiUserAssociationFactory(user=duplicate_user_2)

        playlist_access_skip = PlaylistAccessFactory(
            user__email=user.email, user__username=f"{user.email}-3"
        )
        skip_user_1 = playlist_access_skip.user
        kept_social_1 = self._add_social(skip_user_1, uid=f"new-uid:sk_{user.email}")
        kept_orga_1 = OrganizationAccessFactory(
            user=skip_user_1, role=ADMINISTRATOR
        ).organization
        kept_lti_association_1 = LtiUserAssociationFactory(user=skip_user_1)

        playlist_access_skip_2 = PlaylistAccessFactory(
            user__email=user.email, user__username=f"{user.email}-4"
        )
        skip_user_2 = playlist_access_skip_2.user
        kept_social_2 = self._add_social(skip_user_2, uid=f"new-uid-2:sk_{user.email}")
        kept_orga_2 = OrganizationAccessFactory(
            user=skip_user_2, role=ADMINISTRATOR
        ).organization
        kept_lti_association_2 = LtiUserAssociationFactory(user=skip_user_2)

        with self.assertLogs("marsha.account", "INFO") as logs:
            call_command("dedupe_accounts", stdout=self.stdout)

        user.refresh_from_db()
        self.assertFalse(UserSocialAuth.objects.filter(id=original_social.id).exists())
        self.assertFalse(
            UserSocialAuth.objects.filter(id=duplicate_social_1.id).exists()
        )
        self.assertTrue(
            user.social_auth.filter(id=duplicate_social_2.id).exists(),
            duplicate_social_2.uid,
        )

        self.assertTrue(user.playlists.filter(id=playlist_access.playlist.id).exists())
        self.assertTrue(
            user.playlists.filter(id=playlist_access_duplicate.playlist.id).exists()
        )
        self.assertTrue(
            user.playlists.filter(id=playlist_access_duplicate_2.playlist.id).exists()
        )
        self.assertTrue(
            user.playlists.filter(id=playlist_access_skip.playlist.id).exists()
        )
        self.assertTrue(
            user.playlists.filter(id=playlist_access_skip_2.playlist.id).exists()
        )

        self.assertTrue(User.objects.filter(id=user.id).exists())
        self.assertFalse(User.objects.filter(id=duplicate_user_1.id).exists())
        self.assertFalse(User.objects.filter(id=duplicate_user_2.id).exists())
        self.assertFalse(User.objects.filter(id=skip_user_1.id).exists())
        self.assertFalse(User.objects.filter(id=skip_user_2.id).exists())

        self.assertTrue(user.organization_set.filter(id=original_orga.id).exists())
        self.assertTrue(user.organization_set.filter(id=duplicate_orga_1.id).exists())
        self.assertTrue(user.organization_set.filter(id=duplicate_orga_2.id).exists())
        self.assertTrue(user.organization_set.filter(id=kept_orga_1.id).exists())
        self.assertTrue(user.organization_set.filter(id=kept_orga_2.id).exists())

        self.assertEqual(
            user.organization_accesses.get(organization=original_orga).role,
            ADMINISTRATOR,
        )
        self.assertEqual(
            user.organization_accesses.get(organization=duplicate_orga_1).role,
            ADMINISTRATOR,
        )
        self.assertEqual(
            user.organization_accesses.get(organization=duplicate_orga_2).role,
            ADMINISTRATOR,
        )
        self.assertEqual(
            user.organization_accesses.get(organization=kept_orga_1).role, ADMINISTRATOR
        )
        self.assertEqual(
            user.organization_accesses.get(organization=kept_orga_2).role, ADMINISTRATOR
        )

        self.assertEqual(original_lti_association.user, user)
        duplicate_lti_association_1.refresh_from_db()
        self.assertEqual(duplicate_lti_association_1.user, user)
        duplicate_lti_association_2.refresh_from_db()
        self.assertEqual(duplicate_lti_association_2.user, user)
        kept_lti_association_1.refresh_from_db()
        self.assertEqual(kept_lti_association_1.user, user)
        kept_lti_association_2.refresh_from_db()
        self.assertEqual(kept_lti_association_2.user, user)

        lti_sites = " + ".join(
            [
                original_lti_association.consumer_site.name,
                duplicate_lti_association_1.consumer_site.name,
                duplicate_lti_association_2.consumer_site.name,
                kept_lti_association_1.consumer_site.name,
                kept_lti_association_2.consumer_site.name,
            ]
        )

        expected_data = {
            "organization UID migrations": {
                "count": 1,
                "items": ["old-uid -> new-uid -> new-uid-2"],
            },
            "same account migrations": {
                "count": 1,
                "items": [
                    f"{user.email} -> {original_social.uid}"
                    f" -> {duplicate_social_1.uid} -> {duplicate_social_2.uid}"
                ],
            },
            "different account merges": {
                "count": 1,
                "items": [
                    f"{user.email} : {duplicate_social_2.uid}"
                    f" + {kept_social_1.uid} + {kept_social_2.uid}"
                ],
            },
            "organizations transferred": {
                "count": 1,
                "items": [
                    f"{user.email} : {original_orga.name} + {duplicate_orga_1.name}"
                    f" + {duplicate_orga_2.name} + {kept_orga_1.name} + {kept_orga_2.name}"
                ],
            },
            "LTI associations transferred": {
                "count": 1,
                "items": [f"{user.email} : {lti_sites}"],
            },
            "user accounts deleted": {
                "count": 4,
                "items": [
                    duplicate_user_1.username,
                    duplicate_user_2.username,
                    skip_user_1.username,
                    skip_user_2.username,
                ],
            },
            "SSO accounts deleted": {
                "count": 2,
                "items": [original_social.uid, duplicate_social_1.uid],
            },
        }

        self.assertListEqual(
            self._build_expected_logs(expected_data),
            logs.output,
        )
