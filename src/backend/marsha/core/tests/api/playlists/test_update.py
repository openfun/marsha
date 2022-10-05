"""Tests for the Playlist update API of the Marsha project."""
import json

from django.test import TestCase

from marsha.core import factories, models
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    UserAccessTokenFactory,
)


class PlaylistUpdateAPITest(TestCase):
    """Test the update API for playlist objects."""

    def test_update_playlist_by_anonymous_user(self):
        """Anonymous users cannot update playlists."""
        playlist = factories.PlaylistFactory(title="existing title")
        response = self.client.put(
            f"/api/playlists/{playlist.id}/", {"title": "new playlist title"}
        )

        self.assertEqual(response.status_code, 401)
        playlist.refresh_from_db()
        self.assertEqual(playlist.title, "existing title")

    def test_update_playlist_by_random_logged_in_user(self):
        """Random logged-in users cannot update playlists unrelated to them."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory(title="existing title")

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.put(
            f"/api/playlists/{playlist.id}/",
            {"title": "new playlist title"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        playlist.refresh_from_db()
        self.assertEqual(playlist.title, "existing title")

    def test_update_playlist_by_playlist_admin(self):
        """Playlist administrators cannot update playlists."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory(title="existing title")
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.ADMINISTRATOR
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.put(
            f"/api/playlists/{playlist.id}/",
            {"title": "new playlist title"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        playlist.refresh_from_db()
        self.assertEqual(playlist.title, "existing title")

    def test_update_playlist_through_video_token_instructor(self):
        """Playlist instructors or admins can update playlists through video token."""
        video = factories.VideoFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        response = self.client.get(
            f"/api/playlists/{video.playlist.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        data["title"] = "new playlist title"

        response = self.client.put(
            f"/api/playlists/{video.playlist.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        video.playlist.refresh_from_db()
        self.assertEqual(video.playlist.title, "new playlist title")

    def test_update_playlist_through_document_token_instructor(self):
        """Playlist instructors or admins can update playlists with document token."""
        document = factories.DocumentFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=document)

        response = self.client.get(
            f"/api/playlists/{document.playlist.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        data["title"] = "new playlist title"

        response = self.client.put(
            f"/api/playlists/{document.playlist.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        document.playlist.refresh_from_db()
        self.assertEqual(document.playlist.title, "new playlist title")

    def test_partial_update_playlist_through_video_token_instructor(self):
        """Playlist instructors or admins can partially update playlists."""
        video = factories.VideoFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        response = self.client.patch(
            f"/api/playlists/{video.playlist.id}/",
            json.dumps({"title": "new playlist title"}),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        video.playlist.refresh_from_db()
        self.assertEqual(video.playlist.title, "new playlist title")
