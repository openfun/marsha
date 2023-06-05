"""Tests for the PlaylistAccess update API of the Marsha project."""

from django.test import TestCase

from marsha.core import factories, models
from marsha.core.simple_jwt.factories import UserAccessTokenFactory


class PlaylistAccessUpdateAPITest(TestCase):
    """Test the update API for playlist access objects."""

    maxDiff = None

    def assert_user_cant_update_playlist_access(self, user, playlist_access):
        """Assert a user cannot update a playlist access with a PUT request."""
        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.put(
            f"/api/playlist-accesses/{str(playlist_access.pk)}/",
            {"role": models.INSTRUCTOR},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_update_playlist_access_by_anonymous_user(self):
        """Anonymous users cannot update playlist access."""
        playlist_access = factories.PlaylistAccessFactory()

        response = self.client.put(
            f"/api/playlist-accesses/{str(playlist_access.pk)}/",
            {"role": models.INSTRUCTOR},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)

    def test_update_playlist_access_by_random_logged_in_user(self):
        """
        Random logged-in users.

        Cannot update access for playlist they have no role in.
        """
        user = factories.UserFactory()
        playlist_access = factories.PlaylistAccessFactory()

        self.assert_user_cant_update_playlist_access(user, playlist_access)

    def test_update_playlist_access_by_organization_student(self):
        """Organization students cannot update playlist access."""
        organization_access = factories.OrganizationAccessFactory(
            role=models.STUDENT,
        )
        playlist_access = factories.PlaylistAccessFactory(
            playlist__organization=organization_access.organization,
        )

        self.assert_user_cant_update_playlist_access(
            organization_access.user, playlist_access
        )

    def test_update_playlist_access_by_organization_instructor(self):
        """Organization instructors cannot update playlist access."""
        organization_access = factories.OrganizationAccessFactory(
            role=models.INSTRUCTOR,
        )
        playlist_access = factories.PlaylistAccessFactory(
            playlist__organization=organization_access.organization,
        )

        self.assert_user_cant_update_playlist_access(
            organization_access.user, playlist_access
        )

    def test_update_playlist_access_by_organization_administrator(self):
        """Organization administrators can update playlist access."""
        organization_access = factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR,
        )
        playlist_access = factories.PlaylistAccessFactory(
            playlist__organization=organization_access.organization,
            user=organization_access.user,
            role=models.INSTRUCTOR,
        )

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.put(
            f"/api/playlist-accesses/{str(playlist_access.pk)}/",
            {"role": models.STUDENT},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
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
                            "inactive_features": [],
                            "inactive_resources": [],
                        }
                    ],
                },
                "role": models.STUDENT,
            },
        )

    def test_update_playlist_access_by_consumer_site_any_role(self):
        """Consumer site roles cannot update playlist access."""
        consumer_site_access = factories.ConsumerSiteAccessFactory()
        playlist_access = factories.PlaylistAccessFactory(
            playlist__consumer_site=consumer_site_access.consumer_site,
        )

        playlist_access_to_update = factories.PlaylistAccessFactory(
            playlist=playlist_access.playlist,
        )

        self.assert_user_cant_update_playlist_access(
            playlist_access.user, playlist_access_to_update
        )

    def test_update_playlist_access_by_playlist_student(self):
        """Playlist students cannot update playlist access."""
        playlist_access = factories.PlaylistAccessFactory(
            role=models.STUDENT,
        )

        playlist_access_to_update = factories.PlaylistAccessFactory(
            playlist=playlist_access.playlist,
        )

        self.assert_user_cant_update_playlist_access(
            playlist_access.user, playlist_access_to_update
        )

    def test_update_playlist_access_by_playlist_instructor(self):
        """Playlist instructors cannot update playlist access."""
        playlist_access = factories.PlaylistAccessFactory(
            role=models.INSTRUCTOR,
        )

        playlist_access_to_update = factories.PlaylistAccessFactory(
            playlist=playlist_access.playlist,
        )

        self.assert_user_cant_update_playlist_access(
            playlist_access.user, playlist_access_to_update
        )

    def test_update_playlist_access_by_playlist_administrator(self):
        """Playlist administrators can update playlist access."""
        playlist_access = factories.PlaylistAccessFactory(
            role=models.ADMINISTRATOR,
        )

        playlist_access_to_update = factories.PlaylistAccessFactory(
            role=models.INSTRUCTOR,
            playlist=playlist_access.playlist,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        response = self.client.put(
            f"/api/playlist-accesses/{str(playlist_access_to_update.pk)}/",
            {"role": models.STUDENT},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            response.json(),
            {
                "id": str(playlist_access_to_update.pk),
                "playlist": {
                    "id": str(playlist_access_to_update.playlist.pk),
                    "lti_id": playlist_access_to_update.playlist.lti_id,
                    "title": playlist_access_to_update.playlist.title,
                },
                "user": {
                    "id": str(playlist_access_to_update.user.pk),
                    "date_joined": playlist_access_to_update.user.date_joined.strftime(
                        "%Y-%m-%dT%H:%M:%S.%fZ"
                    ),
                    "email": playlist_access_to_update.user.email,
                    "full_name": playlist_access_to_update.user.get_full_name(),
                    "is_staff": False,
                    "is_superuser": False,
                    "organization_accesses": [],
                },
                "role": models.STUDENT,
            },
        )
