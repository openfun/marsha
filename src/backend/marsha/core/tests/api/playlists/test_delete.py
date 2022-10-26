"""Tests for the Playlist delete API of the Marsha project."""
from django.test import TestCase

from marsha.core import factories, models
from marsha.core.simple_jwt.factories import UserAccessTokenFactory


class PlaylistDeleteAPITest(TestCase):
    """Test the delete API for playlist objects."""

    maxDiff = None

    def test_delete_playlist_by_anonymous_user(self):
        """Anonymous users cannot delete playlists."""
        playlist = factories.PlaylistFactory()
        self.assertEqual(models.Playlist.objects.count(), 1)

        response = self.client.delete(f"/api/playlists/{playlist.id}/")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(models.Playlist.objects.count(), 1)

    def test_delete_playlist_by_random_logged_in_user(self):
        """Random logged-in users cannot delete playlists unrelated to them."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        self.assertEqual(models.Playlist.objects.count(), 1)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.delete(
            f"/api/playlists/{playlist.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.Playlist.objects.count(), 1)

    def test_delete_playlist_by_playlist_admin(self):
        """Playlist administrators cannot delete playlists."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.ADMINISTRATOR
        )
        self.assertEqual(models.Playlist.objects.count(), 1)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.delete(
            f"/api/playlists/{playlist.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.Playlist.objects.count(), 1)
