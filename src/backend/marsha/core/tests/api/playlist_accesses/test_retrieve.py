"""Tests for the PlaylistAccess retrieve API of the Marsha project."""

from django.test import TestCase

from marsha.core import factories, models
from marsha.core.simple_jwt.factories import UserAccessTokenFactory


class PlaylistAccessRetrieveAPITest(TestCase):
    """Test the retrieve API for playlist access objects."""

    maxDiff = None

    def assert_user_cant_retrieve_playlist_access(self, user, playlist_access):
        """Assert a user cannot retrieve a playlist access with a GET request."""
        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/playlist-accesses/{str(playlist_access.pk)}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_retrieve_playlist_access_by_anonymous_user(self):
        """Anonymous users cannot retrieve playlist access."""
        playlist_access = factories.PlaylistAccessFactory()

        response = self.client.get(
            f"/api/playlist-accesses/{str(playlist_access.pk)}/",
        )
        self.assertEqual(response.status_code, 401)

    def test_retrieve_playlist_access_by_random_logged_in_user(self):
        """
        Random logged-in users.

        Cannot retrieve access for playlist they have no role in.
        """
        user = factories.UserFactory()
        playlist_access = factories.PlaylistAccessFactory()

        self.assert_user_cant_retrieve_playlist_access(user, playlist_access)

    def test_retrieve_playlist_access_by_organization_student(self):
        """Organization students cannot retrieve playlist access."""
        organization_access = factories.OrganizationAccessFactory(
            role=models.STUDENT,
        )
        playlist_access = factories.PlaylistAccessFactory(
            playlist__organization=organization_access.organization,
        )

        self.assert_user_cant_retrieve_playlist_access(
            organization_access.user, playlist_access
        )

    def test_retrieve_playlist_access_by_organization_instructor(self):
        """Organization instructors cannot retrieve playlist access."""
        organization_access = factories.OrganizationAccessFactory(
            role=models.INSTRUCTOR,
        )
        playlist_access = factories.PlaylistAccessFactory(
            playlist__organization=organization_access.organization,
        )

        self.assert_user_cant_retrieve_playlist_access(
            organization_access.user, playlist_access
        )

    def test_retrieve_playlist_access_by_organization_administrator(self):
        """Organization administrators can retrieve playlist access."""
        organization_access = factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR,
        )
        playlist_access = factories.PlaylistAccessFactory(
            playlist__organization=organization_access.organization,
            user=organization_access.user,
        )

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.get(
            f"/api/playlist-accesses/{str(playlist_access.pk)}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            response.json(),
            {
                "id": str(playlist_access.pk),
                "playlist": {
                    "id": str(playlist_access.playlist.pk),
                    "lti_id": playlist_access.playlist.lti_id,
                    "title": playlist_access.playlist.title,
                },
                "user": {
                    "id": str(playlist_access.user.pk),
                    "date_joined": playlist_access.user.date_joined.strftime(
                        "%Y-%m-%dT%H:%M:%S.%fZ"
                    ),
                    "email": playlist_access.user.email,
                    "full_name": playlist_access.user.get_full_name(),
                    "is_staff": False,
                    "is_superuser": False,
                    "organization_accesses": [
                        {
                            "organization": str(organization_access.organization.pk),
                            "organization_name": organization_access.organization.name,
                            "role": "administrator",
                            "user": str(playlist_access.user.pk),
                        }
                    ],
                },
                "role": playlist_access.role,
            },
        )

    def test_retrieve_playlist_access_by_consumer_site_any_role(self):
        """Consumer site roles cannot retrieve playlist access."""
        consumer_site_access = factories.ConsumerSiteAccessFactory()
        playlist_access = factories.PlaylistAccessFactory(
            playlist__consumer_site=consumer_site_access.consumer_site,
        )

        self.assert_user_cant_retrieve_playlist_access(
            consumer_site_access.user, playlist_access
        )

    def test_retrieve_playlist_access_by_playlist_student(self):
        """Playlist students cannot retrieve playlist access."""
        playlist_access = factories.PlaylistAccessFactory(
            role=models.STUDENT,
        )

        self.assert_user_cant_retrieve_playlist_access(
            playlist_access.user, playlist_access
        )

    def test_retrieve_playlist_access_by_playlist_instructor(self):
        """Playlist instructors cannot retrieve playlist access."""
        playlist_access = factories.PlaylistAccessFactory(
            role=models.INSTRUCTOR,
        )

        playlist_access_to_retrieve = factories.PlaylistAccessFactory(
            playlist=playlist_access.playlist,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        response = self.client.get(
            f"/api/playlist-accesses/{str(playlist_access_to_retrieve.pk)}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            response.json(),
            {
                "id": str(playlist_access_to_retrieve.pk),
                "playlist": {
                    "id": str(playlist_access_to_retrieve.playlist.pk),
                    "lti_id": playlist_access_to_retrieve.playlist.lti_id,
                    "title": playlist_access_to_retrieve.playlist.title,
                },
                "user": {
                    "id": str(playlist_access_to_retrieve.user.pk),
                    "date_joined": playlist_access_to_retrieve.user.date_joined.strftime(
                        "%Y-%m-%dT%H:%M:%S.%fZ"
                    ),
                    "email": playlist_access_to_retrieve.user.email,
                    "full_name": playlist_access_to_retrieve.user.get_full_name(),
                    "is_staff": False,
                    "is_superuser": False,
                    "organization_accesses": [],
                },
                "role": playlist_access_to_retrieve.role,
            },
        )

    def test_retrieve_playlist_access_by_playlist_administrator(self):
        """Playlist administrators can retrieve playlist access."""
        playlist_access = factories.PlaylistAccessFactory(
            role=models.ADMINISTRATOR,
        )

        playlist_access_to_retrieve = factories.PlaylistAccessFactory(
            playlist=playlist_access.playlist,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        response = self.client.get(
            f"/api/playlist-accesses/{str(playlist_access_to_retrieve.pk)}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            response.json(),
            {
                "id": str(playlist_access_to_retrieve.pk),
                "playlist": {
                    "id": str(playlist_access_to_retrieve.playlist.pk),
                    "lti_id": playlist_access_to_retrieve.playlist.lti_id,
                    "title": playlist_access_to_retrieve.playlist.title,
                },
                "user": {
                    "id": str(playlist_access_to_retrieve.user.pk),
                    "date_joined": playlist_access_to_retrieve.user.date_joined.strftime(
                        "%Y-%m-%dT%H:%M:%S.%fZ"
                    ),
                    "email": playlist_access_to_retrieve.user.email,
                    "full_name": playlist_access_to_retrieve.user.get_full_name(),
                    "is_staff": False,
                    "is_superuser": False,
                    "organization_accesses": [],
                },
                "role": playlist_access_to_retrieve.role,
            },
        )
