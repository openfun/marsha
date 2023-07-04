"""Tests for the Playlist create API of the Marsha project."""
import uuid

from django.test import TestCase

from marsha.core import factories, models
from marsha.core.models import ADMINISTRATOR
from marsha.core.simple_jwt.factories import UserAccessTokenFactory


class PlaylistCreateAPITest(TestCase):
    """Test the create API for playlist objects."""

    maxDiff = None

    def test_create_playlist_by_anonymous_user(self):
        """Anonymous users cannot create playlists."""
        org = factories.OrganizationFactory()
        consumer_site = factories.ConsumerSiteFactory()
        response = self.client.post(
            "/api/playlists/",
            {
                "consumer_site": str(consumer_site.id),
                "lti_id": "playlist_twenty",
                "organization": str(org.id),
                "title": "Some playlist",
            },
        )
        self.assertEqual(response.status_code, 401)

    def test_create_playlist_by_random_logged_in_user(self):
        """
        Random logged-in users.

        Cannot create playlists for organizations they have no role in.
        """
        user = factories.UserFactory()
        org = factories.OrganizationFactory()
        consumer_site = factories.ConsumerSiteFactory()

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            "/api/playlists/",
            {
                "consumer_site": str(consumer_site.id),
                "lti_id": "playlist_twenty",
                "organization": str(org.id),
                "title": "Some playlist",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_create_playlist_by_random_logged_in_user_for_nonexistent_organization(
        self,
    ):
        """
        Fails to create a playlist.

        Attempts to create a playlist for an organization that does not exist result in
        an error response.
        """
        user = factories.UserFactory()
        random_uuid = uuid.uuid4()
        consumer_site = factories.ConsumerSiteFactory()

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            "/api/playlists/",
            {
                "consumer_site": str(consumer_site.id),
                "lti_id": "playlist_twenty",
                "organization": random_uuid,
                "title": "Some playlist",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_create_playlist_by_organization_instructor(self):
        """Organization instructors cannot create playlists."""
        user = factories.UserFactory()
        org = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.INSTRUCTOR, organization=org, user=user
        )
        consumer_site = factories.ConsumerSiteFactory()

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            "/api/playlists/",
            {
                "consumer_site": str(consumer_site.id),
                "lti_id": "playlist_twenty",
                "organization": str(org.id),
                "title": "Some playlist",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)

        created_playlist = models.Playlist.objects.first()
        self.assertEqual(
            response.json(),
            {
                "consumer_site": {
                    "id": str(consumer_site.id),
                    "domain": consumer_site.domain,
                    "name": consumer_site.name,
                },
                "created_by": str(user.id),
                "created_on": created_playlist.created_on.isoformat().replace(
                    "+00:00", "Z"
                ),
                "duplicated_from": None,
                "id": str(created_playlist.id),
                "is_portable_to_playlist": False,
                "is_portable_to_consumer_site": False,
                "is_public": False,
                "lti_id": "playlist_twenty",
                "organization": {
                    "id": str(org.id),
                    "name": org.name,
                },
                "portable_to": [],
                "retention_duration": None,
                "title": "Some playlist",
                "users": [str(user.id)],
            },
        )

        created_permission = models.PlaylistAccess.objects.first()
        self.assertEqual(created_permission.user, user)
        self.assertEqual(created_permission.playlist, created_playlist)
        self.assertEqual(created_permission.role, ADMINISTRATOR)

    def test_create_playlist_by_organization_administrator(self):
        """Organization administrators can create playlists."""
        user = factories.UserFactory()
        org = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR, organization=org, user=user
        )
        consumer_site = factories.ConsumerSiteFactory()

        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Playlist.objects.count(), 0)

        response = self.client.post(
            "/api/playlists/",
            {
                "consumer_site": str(consumer_site.id),
                "lti_id": "playlist_twenty",
                "organization": str(org.id),
                "title": "Some playlist",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(models.Playlist.objects.count(), 1)

        self.assertEqual(response.status_code, 201)
        created_playlist = models.Playlist.objects.first()
        self.assertEqual(
            response.json(),
            {
                "consumer_site": {
                    "id": str(consumer_site.id),
                    "domain": consumer_site.domain,
                    "name": consumer_site.name,
                },
                "created_by": str(user.id),
                "created_on": created_playlist.created_on.isoformat().replace(
                    "+00:00", "Z"
                ),
                "duplicated_from": None,
                "id": str(created_playlist.id),
                "is_portable_to_playlist": False,
                "is_portable_to_consumer_site": False,
                "is_public": False,
                "lti_id": "playlist_twenty",
                "organization": {
                    "id": str(org.id),
                    "name": org.name,
                },
                "portable_to": [],
                "retention_duration": None,
                "title": "Some playlist",
                "users": [str(user.id)],
            },
        )

        created_permission = models.PlaylistAccess.objects.first()
        self.assertEqual(created_permission.user, user)
        self.assertEqual(created_permission.playlist, created_playlist)
        self.assertEqual(created_permission.role, ADMINISTRATOR)
