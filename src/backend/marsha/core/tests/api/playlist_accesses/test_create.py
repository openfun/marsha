"""Tests for the PlaylistAccess create API of the Marsha project."""

from django.test import TestCase

from marsha.core import factories, models
from marsha.core.simple_jwt.factories import UserAccessTokenFactory


class PlaylistAccessCreateAPITest(TestCase):
    """Test the create API for playlist access objects."""

    maxDiff = None

    def assert_user_cant_create_playlist_access(self, playlist, user):
        """Assert a user cannot create a playlist access with a POST request."""
        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            "/api/playlist-accesses/",
            {
                "playlist": str(playlist.pk),
                "user": str(user.pk),
                "role": models.ADMINISTRATOR,
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_create_playlist_access_by_anonymous_user(self):
        """Anonymous users cannot create playlist access."""
        playlist = factories.PlaylistFactory()
        user = factories.UserFactory()

        response = self.client.post(
            "/api/playlist-accesses/",
            {
                "playlist": str(playlist.pk),
                "user": str(user.pk),
                "role": models.ADMINISTRATOR,
            },
        )
        self.assertEqual(response.status_code, 401)

    def test_create_playlist_access_by_random_logged_in_user(self):
        """
        Random logged-in users.

        Cannot create access for playlist they have no role in.
        """
        playlist = factories.PlaylistFactory()
        user = factories.UserFactory()

        self.assert_user_cant_create_playlist_access(playlist, user)

    def test_create_playlist_access_by_organization_student(self):
        """Organization students cannot create playlist access."""
        organization_access = factories.OrganizationAccessFactory(
            role=models.STUDENT,
        )
        playlist = factories.PlaylistFactory(
            organization=organization_access.organization,
        )

        self.assert_user_cant_create_playlist_access(playlist, organization_access.user)

    def test_create_playlist_access_by_organization_instructor(self):
        """Organization instructors cannot create playlist access."""
        organization_access = factories.OrganizationAccessFactory(
            role=models.INSTRUCTOR,
        )
        playlist = factories.PlaylistFactory(
            organization=organization_access.organization,
        )

        self.assert_user_cant_create_playlist_access(playlist, organization_access.user)

    def test_create_playlist_access_by_organization_administrator(self):
        """Organization administrators can create playlist access."""
        user = factories.UserFactory()
        organization_access = factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR,
            user=user,
        )
        playlist = factories.PlaylistFactory(
            organization=organization_access.organization,
        )

        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.PlaylistAccess.objects.count(), 0)

        response = self.client.post(
            "/api/playlist-accesses/",
            {
                "playlist": str(playlist.pk),
                "user": str(user.pk),
                "role": models.ADMINISTRATOR,
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(models.PlaylistAccess.objects.count(), 1)

        created_playlist_access = models.PlaylistAccess.objects.first()
        self.assertEqual(
            response.json(),
            {
                "id": str(created_playlist_access.pk),
                "playlist": {
                    "id": str(playlist.pk),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "user": {
                    "id": str(user.pk),
                    "date_joined": user.date_joined.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                    "email": user.email,
                    "full_name": user.get_full_name(),
                    "is_staff": False,
                    "is_superuser": False,
                    "organization_accesses": [
                        {
                            "organization": str(organization_access.organization.pk),
                            "organization_name": organization_access.organization.name,
                            "role": "administrator",
                            "user": str(user.pk),
                            "inactive_features": [],
                            "inactive_resources": [],
                        }
                    ],
                },
                "role": models.ADMINISTRATOR,
            },
        )

    def test_create_playlist_access_by_consumer_site_any_role(self):
        """Consumer site roles cannot create playlist access."""
        user = factories.UserFactory()
        consumer_site_access = factories.ConsumerSiteAccessFactory(
            user=user,
        )
        playlist = factories.PlaylistFactory(
            consumer_site=consumer_site_access.consumer_site,
        )

        self.assert_user_cant_create_playlist_access(playlist, user)

    def test_create_playlist_access_by_playlist_student(self):
        """Playlist students cannot create playlist access."""
        playlist_access = factories.PlaylistAccessFactory(
            role=models.STUDENT,
        )

        self.assert_user_cant_create_playlist_access(
            playlist_access.playlist, playlist_access.user
        )

    def test_create_playlist_access_by_playlist_instructor(self):
        """Playlist instructors cannot create playlist access."""
        playlist_access = factories.PlaylistAccessFactory(
            role=models.INSTRUCTOR,
        )

        self.assert_user_cant_create_playlist_access(
            playlist_access.playlist, playlist_access.user
        )

    def test_create_playlist_access_by_playlist_administrator(self):
        """Playlist administrators can create playlist access."""
        user = factories.UserFactory()
        playlist_access = factories.PlaylistAccessFactory(
            role=models.ADMINISTRATOR,
        )

        # The user with right is not the same as the user to create
        # access for.
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        self.assertEqual(models.PlaylistAccess.objects.count(), 1)

        response = self.client.post(
            "/api/playlist-accesses/",
            {
                "playlist": str(playlist_access.playlist.pk),
                "user": str(user.pk),
                "role": models.ADMINISTRATOR,
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(models.PlaylistAccess.objects.count(), 2)

        created_playlist_access = models.PlaylistAccess.objects.exclude(
            pk=playlist_access.pk,
        ).first()
        self.assertEqual(
            response.json(),
            {
                "id": str(created_playlist_access.pk),
                "playlist": {
                    "id": str(playlist_access.playlist.pk),
                    "lti_id": playlist_access.playlist.lti_id,
                    "title": playlist_access.playlist.title,
                },
                "user": {
                    "id": str(user.pk),
                    "date_joined": user.date_joined.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                    "email": user.email,
                    "full_name": user.get_full_name(),
                    "is_staff": False,
                    "is_superuser": False,
                    "organization_accesses": [],
                },
                "role": models.ADMINISTRATOR,
            },
        )
