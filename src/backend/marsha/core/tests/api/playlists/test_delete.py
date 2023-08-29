"""Tests for the Playlist delete API of the Marsha project."""
from django.test import TestCase

from marsha.bbb.factories import ClassroomFactory
from marsha.core import factories, models
from marsha.core.simple_jwt.factories import UserAccessTokenFactory
from marsha.deposit.factories import FileDepositoryFactory
from marsha.markdown.factories import MarkdownDocumentFactory


class PlaylistDeleteAPITest(TestCase):
    """Test the delete API for playlist objects."""

    maxDiff = None

    def test_delete_playlist_by_anonymous_user(self):
        """Anonymous users cannot delete playlists."""
        playlist = factories.PlaylistFactory()
        response = self.client.delete(f"/api/playlists/{playlist.id}/")

        self.assertEqual(models.Playlist.objects.count(), 1)
        self.assertEqual(response.status_code, 401)
        self.assertEqual(models.Playlist.objects.count(), 1)

    def test_delete_playlist_by_random_logged_in_user(self):
        """Random logged-in users cannot delete playlists unrelated to them."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Playlist.objects.count(), 1)
        response = self.client.delete(
            f"/api/playlists/{playlist.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.Playlist.objects.count(), 1)

    def test_delete_playlist_by_playlist_admin(self):
        """Playlist administrators can delete empty playlists."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.ADMINISTRATOR
        )
        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Playlist.objects.count(), 1)
        response = self.client.delete(
            f"/api/playlists/{playlist.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(models.Playlist.objects.count(), 0)

    def test_delete_playlist_with_video_by_playlist_admin(self):
        """Playlist administrators cannot delete playlists with video."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.ADMINISTRATOR
        )
        factories.VideoFactory(playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Playlist.objects.count(), 1)
        response = self.client.delete(
            f"/api/playlists/{playlist.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), "Resources are still attached to playlist")
        self.assertEqual(models.Playlist.objects.count(), 1)

    def test_delete_playlist_with_documents_by_playlist_admin(self):
        """Playlist administrators cannot delete playlists with documents."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.ADMINISTRATOR
        )
        factories.DocumentFactory(playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Playlist.objects.count(), 1)
        response = self.client.delete(
            f"/api/playlists/{playlist.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), "Resources are still attached to playlist")
        self.assertEqual(models.Playlist.objects.count(), 1)

    def test_delete_playlist_with_classroom_by_playlist_admin(self):
        """Playlist administrators cannot delete playlists with classroom."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.ADMINISTRATOR
        )
        ClassroomFactory(playlist=playlist)

        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Playlist.objects.count(), 1)
        response = self.client.delete(
            f"/api/playlists/{playlist.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), "Resources are still attached to playlist")
        self.assertEqual(models.Playlist.objects.count(), 1)

    def test_delete_playlist_with_file_depository_by_playlist_admin(self):
        """Playlist administrators cannot delete playlists with file depository."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.ADMINISTRATOR
        )
        FileDepositoryFactory(playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Playlist.objects.count(), 1)
        response = self.client.delete(
            f"/api/playlists/{playlist.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), "Resources are still attached to playlist")
        self.assertEqual(models.Playlist.objects.count(), 1)

    def test_delete_playlist_with_markdown_document_by_playlist_admin(self):
        """Playlist administrators cannot delete playlists with Markdown document."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.ADMINISTRATOR
        )
        MarkdownDocumentFactory(playlist=playlist)

        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Playlist.objects.count(), 1)
        response = self.client.delete(
            f"/api/playlists/{playlist.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), "Resources are still attached to playlist")
        self.assertEqual(models.Playlist.objects.count(), 1)
