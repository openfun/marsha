"""Tests for the Playlist API of the Marsha project."""
import uuid

from django.test import TestCase

from rest_framework_simplejwt.tokens import AccessToken

from .. import factories, models


class PlaylistAPITest(TestCase):
    """Test the API for playlist objects."""

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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

    def test_create_playlist_by_organization_administrator(self):
        """Organization administrators can create playlists."""
        user = factories.UserFactory()
        org = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR, organization=org, user=user
        )
        consumer_site = factories.ConsumerSiteFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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
        self.assertEqual(
            response.json(),
            {
                "consumer_site": str(consumer_site.id),
                "created_by": None,
                "duplicated_from": None,
                "id": str(models.Playlist.objects.first().id),
                "is_portable_to_playlist": False,
                "is_portable_to_consumer_site": False,
                "is_public": False,
                "lti_id": "playlist_twenty",
                "organization": str(org.id),
                "portable_to": [],
                "title": "Some playlist",
                "users": [],
            },
        )

    def test_retrieve_playlist_by_anonymous_user(self):
        """Anonymous users cannot retrieve playlists."""
        playlist = factories.PlaylistFactory()
        response = self.client.get(f"/api/playlists/{playlist.id}/")
        self.assertEqual(response.status_code, 401)

    def test_retrieve_playlist_by_random_logged_in_user(self):
        """Random logged-in users cannot retrieve playlists unrelated to them."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

        response = self.client.get(
            f"/api/playlists/{playlist.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_retrieve_playlist_by_playlist_admin(self):
        """Playlist administrators can retrieve playlists."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.ADMINISTRATOR
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

        response = self.client.get(
            f"/api/playlists/{playlist.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "consumer_site": str(playlist.consumer_site.id),
                "created_by": None,
                "duplicated_from": None,
                "id": str(playlist.id),
                "is_portable_to_consumer_site": False,
                "is_portable_to_playlist": True,
                "is_public": False,
                "lti_id": playlist.lti_id,
                "organization": None,
                "portable_to": [],
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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

        response = self.client.get(
            f"/api/playlists/{playlist.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "consumer_site": str(playlist.consumer_site.id),
                "created_by": None,
                "duplicated_from": None,
                "id": str(playlist.id),
                "is_portable_to_consumer_site": False,
                "is_portable_to_playlist": True,
                "is_public": False,
                "lti_id": playlist.lti_id,
                "organization": str(organization.id),
                "portable_to": [],
                "title": playlist.title,
                "users": [],
            },
        )

    def test_list_playlists_by_anonymous_user(self):
        """Anonymous users cannot make list requests for playlists."""
        factories.PlaylistFactory()
        response = self.client.get("/api/playlists/")
        self.assertEqual(response.status_code, 401)

    def test_list_playlists_by_random_logged_in_user(self):
        """
        Random logged-in users can make list requests.

        Will not receive playlists for organizations they are not a member of.
        """
        user = factories.UserFactory()
        factories.PlaylistFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

        response = self.client.get(
            "/api/playlists/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)
        self.assertEqual(response.json()["results"], [])

    def test_list_playlists_by_logged_in_user_with_organization_memberships(self):
        """Organization members get all playlists they have access to."""
        user = factories.UserFactory()

        org_1 = factories.OrganizationFactory()
        org_1.users.add(user)
        playlist_1 = factories.PlaylistFactory(
            lti_id="playlist#one", organization=org_1, title="First playlist"
        )

        org_2 = factories.OrganizationFactory()
        org_2.users.add(user)
        playlist_2 = factories.PlaylistFactory(
            lti_id="playlist#two", organization=org_2, title="Second playlist"
        )

        # User is not a member of this organization
        org_3 = factories.OrganizationFactory()
        factories.PlaylistFactory(organization=org_3)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

        response = self.client.get(
            "/api/playlists/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(
            response.json()["results"],
            [
                {
                    "consumer_site": str(playlist_1.consumer_site.id),
                    "created_by": None,
                    "duplicated_from": None,
                    "id": str(playlist_1.id),
                    "is_portable_to_consumer_site": False,
                    "is_portable_to_playlist": True,
                    "is_public": False,
                    "lti_id": "playlist#one",
                    "organization": str(org_1.id),
                    "portable_to": [],
                    "title": "First playlist",
                    "users": [],
                },
                {
                    "consumer_site": str(playlist_2.consumer_site.id),
                    "created_by": None,
                    "duplicated_from": None,
                    "id": str(playlist_2.id),
                    "is_portable_to_consumer_site": False,
                    "is_portable_to_playlist": True,
                    "is_public": False,
                    "lti_id": "playlist#two",
                    "organization": str(org_2.id),
                    "portable_to": [],
                    "title": "Second playlist",
                    "users": [],
                },
            ],
        )

    def test_list_playlists_for_organization_by_logged_in_user_with_organization_memberships(
        self,
    ):
        """
        Organization members.

        They can list all the playlists for a given organization of which
        they are a member.
        """
        user = factories.UserFactory()

        org_1 = factories.OrganizationFactory()
        org_1.users.add(user)
        playlist_1 = factories.PlaylistFactory(
            lti_id="playlist#eleven", organization=org_1, title="First playlist"
        )

        # User is a member of this organization, but it is not included in the request below
        org_2 = factories.OrganizationFactory()
        org_2.users.add(user)
        factories.PlaylistFactory(organization=org_2, title="Second playlist")

        # User is not a member of this organization
        org_3 = factories.OrganizationFactory()
        factories.PlaylistFactory(organization=org_3)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

        response = self.client.get(
            f"/api/playlists/?organization={str(org_1.id)}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(
            response.json()["results"],
            [
                {
                    "consumer_site": str(playlist_1.consumer_site.id),
                    "created_by": None,
                    "duplicated_from": None,
                    "id": str(playlist_1.id),
                    "is_portable_to_consumer_site": False,
                    "is_portable_to_playlist": True,
                    "is_public": False,
                    "lti_id": "playlist#eleven",
                    "organization": str(org_1.id),
                    "portable_to": [],
                    "title": "First playlist",
                    "users": [],
                },
            ],
        )

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

        response = self.client.delete(
            f"/api/playlists/{playlist.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.Playlist.objects.count(), 1)

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

        response = self.client.delete(
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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

        response = self.client.delete(
            f"/api/playlists/{playlist.id}/",
            {"title": "new playlist title"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        playlist.refresh_from_db()
        self.assertEqual(playlist.title, "existing title")
