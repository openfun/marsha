"""Tests for the `dedupe_accounts` management command."""

from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase

from social_django.models import UserSocialAuth

from marsha.core.factories import PlaylistAccessFactory


class DedupeAccountsCommandTest(TestCase):
    """Test suite for dedupe_accounts command."""

    maxDiff = None

    def setUp(self):
        """
        Set up the test case.
        """
        self.stdout = StringIO()
        self.log_prefix = "INFO:marsha.account.management.commands.dedupe_accounts:"

    @staticmethod
    def _add_social(user, uid="uid-xxx"):
        return UserSocialAuth.objects.create(user=user, uid=uid)

    def test_dedupe_accounts_dry_run(self):
        """
        With the --dry-run flag, no changes should be made.
        """
        playlist_access = PlaylistAccessFactory()
        user = playlist_access.user
        old_social = self._add_social(user, uid=f"old-uid:{user.email}")
        playlist_access_duplicate = PlaylistAccessFactory(user__email=user.email)
        duplicate_user = playlist_access_duplicate.user
        new_social = self._add_social(duplicate_user, uid=f"new-uid:{user.email}")

        with self.assertLogs("marsha.account", "INFO") as logs:
            call_command("dedupe_accounts", "--dry-run", stdout=self.stdout)

        user.refresh_from_db()
        self.assertEqual(user.social_auth.first(), old_social)
        duplicate_user.refresh_from_db()
        self.assertEqual(duplicate_user.social_auth.first(), new_social)

        self.assertListEqual(
            [
                f"{self.log_prefix}[DRY-RUN] No changes will be made.",
                f"{self.log_prefix}Deduping {user.email}",
                f"{self.log_prefix}{"-" * 80}",
                f"{self.log_prefix}Deduping complete. 1 SSO accounts deleted, 1 users deleted",
                f"{self.log_prefix}{"- " * 40}",
                f"{self.log_prefix}0 accounts skipped:",
                f"{self.log_prefix}{"- " * 40}",
                f"{self.log_prefix}1 organizations impacted:",
                f"{self.log_prefix} - old-uid -> new-uid",
                f"{self.log_prefix}{"- " * 40}",
                f"{self.log_prefix}1 users impacted:",
                f"{self.log_prefix} - {user.email} -> {old_social.uid} -> {new_social.uid}",
                f"{self.log_prefix}{"- " * 40}",
                f"{self.log_prefix}Summary:",
                f"{self.log_prefix} 1 organizations impacted",
                f"{self.log_prefix} 1 users processed",
                f"{self.log_prefix} 1 users deleted",
                f"{self.log_prefix} 1 SSO accounts deleted",
                f"{self.log_prefix}[DRY-RUN] No changes made.",
            ],
            logs.output,
        )

    def test_dedupe_accounts_1_duplicate(self):
        """
        Accounts with 2 duplicates should be merged correctly.
        """
        playlist_access = PlaylistAccessFactory()
        user = playlist_access.user
        old_social = self._add_social(user, uid=f"old-uid:{user.email}")
        playlist_access_duplicate = PlaylistAccessFactory(user__email=user.email)
        duplicate_user = playlist_access_duplicate.user
        new_social = self._add_social(duplicate_user, uid=f"new-uid:{user.email}")

        with self.assertLogs("marsha.account", "INFO") as logs:
            call_command("dedupe_accounts", stdout=self.stdout)

        user.refresh_from_db()
        self.assertTrue(user.social_auth.filter(id=new_social.id).exists())
        self.assertTrue(
            user.playlists.filter(
                id__in=duplicate_user.playlists.values_list("id", flat=True)
            ).exists()
        )
        self.assertFalse(UserSocialAuth.objects.filter(id=old_social.id).exists())
        self.assertFalse(get_user_model().objects.filter(id=duplicate_user.id).exists())

        self.assertListEqual(
            [
                f"{self.log_prefix}Deduping {user.email}",
                f"{self.log_prefix}{"-" * 80}",
                f"{self.log_prefix}Deduping complete. 1 SSO accounts deleted, 1 users deleted",
                f"{self.log_prefix}{"- " * 40}",
                f"{self.log_prefix}0 accounts skipped:",
                f"{self.log_prefix}{"- " * 40}",
                f"{self.log_prefix}1 organizations impacted:",
                f"{self.log_prefix} - old-uid -> new-uid",
                f"{self.log_prefix}{"- " * 40}",
                f"{self.log_prefix}1 users impacted:",
                f"{self.log_prefix} - {user.email} -> {old_social.uid} -> {new_social.uid}",
                f"{self.log_prefix}{"- " * 40}",
                f"{self.log_prefix}Summary:",
                f"{self.log_prefix} 1 organizations impacted",
                f"{self.log_prefix} 1 users processed",
                f"{self.log_prefix} 1 users deleted",
                f"{self.log_prefix} 1 SSO accounts deleted",
            ],
            logs.output,
        )

    def test_dedupe_accounts_2_duplicates(self):
        """
        Accounts with 3 duplicates should be merged correctly.
        """
        playlist_access = PlaylistAccessFactory()
        user = playlist_access.user
        old_social = self._add_social(user, uid=f"old-uid:{user.email}")

        playlist_access_duplicate = PlaylistAccessFactory(user__email=user.email)
        duplicate_user_1 = playlist_access_duplicate.user
        new_social_1 = self._add_social(duplicate_user_1, uid=f"new-uid:{user.email}")

        playlist_access_duplicate_2 = PlaylistAccessFactory(user__email=user.email)
        duplicate_user_2 = playlist_access_duplicate_2.user
        new_social_2 = self._add_social(duplicate_user_2, uid=f"new-uid-2:{user.email}")

        with self.assertLogs("marsha.account", "INFO") as logs:
            call_command("dedupe_accounts", stdout=self.stdout)

        user.refresh_from_db()
        self.assertFalse(UserSocialAuth.objects.filter(id=old_social.id).exists())
        self.assertFalse(UserSocialAuth.objects.filter(id=new_social_1.id).exists())
        self.assertTrue(user.social_auth.filter(id=new_social_2.id).exists())

        self.assertTrue(user.playlists.filter(id=playlist_access.playlist.id).exists())
        self.assertTrue(
            user.playlists.filter(id=playlist_access_duplicate.playlist.id).exists()
        )
        self.assertTrue(
            user.playlists.filter(id=playlist_access_duplicate_2.playlist.id).exists()
        )

        self.assertTrue(get_user_model().objects.filter(id=user.id).exists())
        self.assertFalse(
            get_user_model().objects.filter(id=duplicate_user_1.id).exists()
        )
        self.assertFalse(
            get_user_model().objects.filter(id=duplicate_user_2.id).exists()
        )

        self.assertListEqual(
            [
                f"{self.log_prefix}Deduping {user.email}",
                f"{self.log_prefix}{"-" * 80}",
                f"{self.log_prefix}Deduping complete. 2 SSO accounts deleted, 2 users deleted",
                f"{self.log_prefix}{"- " * 40}",
                f"{self.log_prefix}0 accounts skipped:",
                f"{self.log_prefix}{"- " * 40}",
                f"{self.log_prefix}1 organizations impacted:",
                f"{self.log_prefix} - old-uid -> new-uid -> new-uid-2",
                f"{self.log_prefix}{"- " * 40}",
                f"{self.log_prefix}1 users impacted:",
                f"{self.log_prefix} - {user.email} -> {old_social.uid}"
                f" -> {new_social_1.uid} -> {new_social_2.uid}",
                f"{self.log_prefix}{"- " * 40}",
                f"{self.log_prefix}Summary:",
                f"{self.log_prefix} 1 organizations impacted",
                f"{self.log_prefix} 1 users processed",
                f"{self.log_prefix} 2 users deleted",
                f"{self.log_prefix} 2 SSO accounts deleted",
            ],
            logs.output,
        )

    def test_dedupe_accounts_2_duplicates_2_skips(self):
        """
        Accounts with 3 duplicates should be merged correctly.
        2 duplicates should be skipped.
        """
        playlist_access = PlaylistAccessFactory(user__email="user@example.com")
        user = playlist_access.user
        old_social = self._add_social(user, uid=f"old-uid:{user.email}")

        playlist_access_duplicate = PlaylistAccessFactory(user__email=user.email)
        duplicate_user_1 = playlist_access_duplicate.user
        new_social_1 = self._add_social(duplicate_user_1, uid=f"new-uid:{user.email}")

        playlist_access_duplicate_2 = PlaylistAccessFactory(user__email=user.email)
        duplicate_user_2 = playlist_access_duplicate_2.user
        new_social_2 = self._add_social(duplicate_user_2, uid=f"new-uid-2:{user.email}")

        playlist_access_skip = PlaylistAccessFactory(user__email=user.email)
        skip_user_1 = playlist_access_skip.user
        kept_social_1 = self._add_social(skip_user_1, uid=f"new-uid:sk_{user.email}")

        playlist_access_skip_2 = PlaylistAccessFactory(user__email=user.email)
        skip_user_2 = playlist_access_skip_2.user
        kept_social_2 = self._add_social(skip_user_2, uid=f"new-uid-2:sk_{user.email}")

        with self.assertLogs("marsha.account", "INFO") as logs:
            call_command("dedupe_accounts", stdout=self.stdout)

        user.refresh_from_db()
        self.assertFalse(UserSocialAuth.objects.filter(id=old_social.id).exists())
        self.assertFalse(UserSocialAuth.objects.filter(id=new_social_1.id).exists())
        self.assertTrue(user.social_auth.filter(id=new_social_2.id).exists())

        self.assertTrue(user.playlists.filter(id=playlist_access.playlist.id).exists())
        self.assertTrue(
            user.playlists.filter(id=playlist_access_duplicate.playlist.id).exists()
        )
        self.assertTrue(
            user.playlists.filter(id=playlist_access_duplicate_2.playlist.id).exists()
        )
        self.assertFalse(
            user.playlists.filter(id=playlist_access_skip.playlist.id).exists()
        )
        self.assertFalse(
            user.playlists.filter(id=playlist_access_skip_2.playlist.id).exists()
        )

        self.assertTrue(get_user_model().objects.filter(id=user.id).exists())
        self.assertFalse(
            get_user_model().objects.filter(id=duplicate_user_1.id).exists()
        )
        self.assertFalse(
            get_user_model().objects.filter(id=duplicate_user_2.id).exists()
        )
        self.assertTrue(get_user_model().objects.filter(id=skip_user_1.id).exists())
        self.assertTrue(get_user_model().objects.filter(id=skip_user_2.id).exists())

        self.assertListEqual(
            [
                f"{self.log_prefix}Deduping {user.email}",
                f"{self.log_prefix}{"-" * 80}",
                f"{self.log_prefix}Deduping complete. 2 SSO accounts deleted, 2 users deleted",
                f"{self.log_prefix}{"- " * 40}",
                f"{self.log_prefix}2 accounts skipped:",
                f"{self.log_prefix} - {user.email} | {old_social.uid} | {kept_social_1.uid}"
                f" | 0.5714285714285714 | 0.9142857142857143",
                f"{self.log_prefix} - {user.email} | {old_social.uid} | {kept_social_2.uid}"
                f" | 0.5 | 0.9142857142857143",
                f"{self.log_prefix}{"- " * 40}",
                f"{self.log_prefix}1 organizations impacted:",
                f"{self.log_prefix} - old-uid -> new-uid -> new-uid-2",
                f"{self.log_prefix}{"- " * 40}",
                f"{self.log_prefix}1 users impacted:",
                f"{self.log_prefix} - {user.email} -> {old_social.uid}"
                f" -> {new_social_1.uid} -> {new_social_2.uid}",
                f"{self.log_prefix}{"- " * 40}",
                f"{self.log_prefix}Summary:",
                f"{self.log_prefix} 1 organizations impacted",
                f"{self.log_prefix} 1 users processed",
                f"{self.log_prefix} 2 users deleted",
                f"{self.log_prefix} 2 SSO accounts deleted",
            ],
            logs.output,
        )
