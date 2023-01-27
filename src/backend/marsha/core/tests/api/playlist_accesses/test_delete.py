"""Tests for the PlaylistAccess delete API of the Marsha project."""

from django.test import TestCase

from marsha.core import factories, models
from marsha.core.simple_jwt.factories import UserAccessTokenFactory


class PlaylistAccessDeleteAPITest(TestCase):
    """Test the delete API for playlist access objects."""

    maxDiff = None

    def assert_user_cant_delete_playlist_access(self, user, playlist_access):
        """Assert a user cannot delete a playlist access with a DELETE request."""
        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.delete(
            f"/api/playlist-accesses/{str(playlist_access.pk)}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_delete_playlist_access_by_anonymous_user(self):
        """Anonymous users cannot delete playlist access."""
        playlist_access_to_delete = factories.PlaylistAccessFactory()

        response = self.client.delete(
            f"/api/playlist-accesses/{str(playlist_access_to_delete.pk)}/",
        )

        self.assertEqual(response.status_code, 401)

    def test_delete_playlist_access_by_random_logged_in_user(self):
        """
        Random logged-in users.

        Cannot delete access for playlist they have no role in.
        """
        user = factories.UserFactory()
        playlist_access_to_delete = factories.PlaylistAccessFactory()

        self.assert_user_cant_delete_playlist_access(user, playlist_access_to_delete)

    def test_delete_playlist_access_by_organization_student(self):
        """Organization students cannot delete playlist access."""
        organization_access = factories.OrganizationAccessFactory(
            role=models.STUDENT,
        )
        playlist_access_to_delete = factories.PlaylistAccessFactory(
            playlist__organization=organization_access.organization,
        )

        self.assert_user_cant_delete_playlist_access(
            organization_access.user, playlist_access_to_delete
        )

    def test_delete_playlist_access_by_organization_instructor(self):
        """Organization instructors cannot delete playlist access."""
        organization_access = factories.OrganizationAccessFactory(
            role=models.INSTRUCTOR,
        )
        playlist_access_to_delete = factories.PlaylistAccessFactory(
            playlist__organization=organization_access.organization,
        )

        self.assert_user_cant_delete_playlist_access(
            organization_access.user, playlist_access_to_delete
        )

    def test_delete_playlist_access_by_organization_administrator(self):
        """Organization administrators can delete playlist access."""
        organization_access = factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR,
        )
        playlist_access_to_delete = factories.PlaylistAccessFactory(
            playlist__organization=organization_access.organization,
        )

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        self.assertEqual(models.PlaylistAccess.objects.count(), 1)

        response = self.client.delete(
            f"/api/playlist-accesses/{str(playlist_access_to_delete.pk)}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(models.PlaylistAccess.objects.count(), 0)

    def test_delete_playlist_access_by_consumer_site_any_role(self):
        """Consumer site roles cannot delete playlist access."""
        consumer_site_access = factories.ConsumerSiteAccessFactory()
        playlist_access_to_delete = factories.PlaylistAccessFactory(
            playlist__consumer_site=consumer_site_access.consumer_site,
        )

        self.assert_user_cant_delete_playlist_access(
            consumer_site_access.user, playlist_access_to_delete
        )

    def test_delete_playlist_access_by_playlist_student(self):
        """Playlist students cannot delete playlist access."""
        playlist_access = factories.PlaylistAccessFactory(
            role=models.STUDENT,
        )
        playlist_access_to_delete = factories.PlaylistAccessFactory(
            playlist=playlist_access.playlist,
        )

        self.assert_user_cant_delete_playlist_access(
            playlist_access.user, playlist_access_to_delete
        )

    def test_delete_playlist_access_by_playlist_instructor(self):
        """Playlist instructors cannot delete playlist access."""
        playlist_access = factories.PlaylistAccessFactory(
            role=models.INSTRUCTOR,
        )
        playlist_access_to_delete = factories.PlaylistAccessFactory(
            playlist=playlist_access.playlist,
        )

        self.assert_user_cant_delete_playlist_access(
            playlist_access.user, playlist_access_to_delete
        )

    def test_delete_playlist_access_by_playlist_administrator(self):
        """Playlist administrators can delete playlist access."""
        playlist_access = factories.PlaylistAccessFactory(
            role=models.ADMINISTRATOR,
        )
        playlist_access_to_delete = factories.PlaylistAccessFactory(
            playlist=playlist_access.playlist,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        self.assertEqual(models.PlaylistAccess.objects.count(), 2)

        response = self.client.delete(
            f"/api/playlist-accesses/{str(playlist_access_to_delete.pk)}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(models.PlaylistAccess.objects.count(), 1)

        self.assertFalse(
            models.PlaylistAccess.objects.exclude(
                pk=playlist_access.pk,
            ).exists()
        )
