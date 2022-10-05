"""Tests for the Playlist list API of the Marsha project."""
from django.test import TestCase

from marsha.core import factories
from marsha.core.simple_jwt.factories import UserAccessTokenFactory


class PlaylistListAPITest(TestCase):
    """Test the list API for playlist objects."""

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

        jwt_token = UserAccessTokenFactory(user=user)

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

        jwt_token = UserAccessTokenFactory(user=user)

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

        jwt_token = UserAccessTokenFactory(user=user)

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
