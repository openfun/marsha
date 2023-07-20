"""Tests for the Playlist retrieve API of the Marsha project."""
from django.test import TestCase

from marsha.core import factories, models
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    UserAccessTokenFactory,
)


class PlaylistRetrieveAPITest(TestCase):
    """Test the retrieve API for playlist objects."""

    maxDiff = None

    def test_retrieve_playlist_by_anonymous_user(self):
        """Anonymous users cannot retrieve playlists."""
        playlist = factories.PlaylistFactory()
        response = self.client.get(f"/api/playlists/{playlist.id}/")
        self.assertEqual(response.status_code, 401)

    def test_retrieve_playlist_by_random_logged_in_user(self):
        """Random logged-in users cannot retrieve playlists unrelated to them."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/playlists/{playlist.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_retrieve_playlist_by_playlist_instructor(self):
        """Playlist instructors cannot retrieve playlists."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.INSTRUCTOR
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/playlists/{playlist.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)

    def test_retrieve_playlist_through_video_token_instructor(self):
        """Playlist instructors can retrieve playlists through video token."""
        video = factories.VideoFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video.playlist)

        response = self.client.get(
            f"/api/playlists/{video.playlist.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)

    def test_retrieve_playlist_through_document_token_instructor(self):
        """Playlist instructors can retrieve playlists through document token."""
        document = factories.DocumentFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=document.playlist)

        response = self.client.get(
            f"/api/playlists/{document.playlist.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)

    def test_retrieve_playlist_by_playlist_admin(self):
        """Playlist administrators can retrieve playlists."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.ADMINISTRATOR
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/playlists/{playlist.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "consumer_site": {
                    "id": str(playlist.consumer_site.id),
                    "domain": playlist.consumer_site.domain,
                    "name": playlist.consumer_site.name,
                },
                "created_by": None,
                "created_on": playlist.created_on.isoformat().replace("+00:00", "Z"),
                "duplicated_from": None,
                "id": str(playlist.id),
                "is_portable_to_consumer_site": False,
                "is_portable_to_playlist": True,
                "is_public": False,
                "lti_id": playlist.lti_id,
                "organization": None,
                "portable_to": [],
                "retention_duration": None,
                "title": playlist.title,
                "users": [str(user.id)],
            },
        )

    def test_retrieve_playlist_by_organization_admin(self):
        """Organization administrators can retrieve organization-related playlists."""
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.ADMINISTRATOR
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/playlists/{playlist.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "consumer_site": {
                    "id": str(playlist.consumer_site.id),
                    "domain": playlist.consumer_site.domain,
                    "name": playlist.consumer_site.name,
                },
                "created_by": None,
                "created_on": playlist.created_on.isoformat().replace("+00:00", "Z"),
                "duplicated_from": None,
                "id": str(playlist.id),
                "is_portable_to_consumer_site": False,
                "is_portable_to_playlist": True,
                "is_public": False,
                "lti_id": playlist.lti_id,
                "organization": {
                    "id": str(organization.id),
                    "name": organization.name,
                },
                "portable_to": [],
                "retention_duration": None,
                "title": playlist.title,
                "users": [],
            },
        )
