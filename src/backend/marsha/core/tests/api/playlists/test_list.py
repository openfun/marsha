"""Tests for the Playlist list API of the Marsha project."""

from django.test import TestCase

from marsha.core import factories, models
from marsha.core.simple_jwt.factories import UserAccessTokenFactory


class PlaylistListAPITest(TestCase):
    """Test the list API for playlist objects."""

    maxDiff = None

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
        """Organization administrator get all playlists they have access to."""
        user = factories.UserFactory()

        org_1 = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            user=user, organization=org_1, role=models.ADMINISTRATOR
        )
        playlist_1 = factories.PlaylistFactory(
            lti_id="playlist#one", organization=org_1, title="First playlist"
        )

        org_2 = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            user=user, organization=org_2, role=models.ADMINISTRATOR
        )
        playlist_2 = factories.PlaylistFactory(
            lti_id="playlist#two", organization=org_2, title="Second playlist"
        )

        # User is not a member of this organization
        org_3 = factories.OrganizationFactory()
        factories.PlaylistFactory(organization=org_3)

        # User is member but as instructor of this organization
        org_4 = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            user=user, organization=org_4, role=models.INSTRUCTOR
        )
        factories.PlaylistFactory(organization=org_4)

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
                    "consumer_site": {
                        "id": str(playlist_2.consumer_site.id),
                        "domain": playlist_2.consumer_site.domain,
                        "name": playlist_2.consumer_site.name,
                    },
                    "created_by": None,
                    "created_on": playlist_2.created_on.isoformat().replace(
                        "+00:00", "Z"
                    ),
                    "duplicated_from": None,
                    "id": str(playlist_2.id),
                    "is_portable_to_consumer_site": False,
                    "is_portable_to_playlist": True,
                    "is_public": False,
                    "is_claimable": True,
                    "lti_id": "playlist#two",
                    "organization": {
                        "id": str(org_2.id),
                        "name": org_2.name,
                    },
                    "portable_to": [],
                    "retention_duration": None,
                    "title": "Second playlist",
                    "users": [],
                    "can_edit": True,
                },
                {
                    "consumer_site": {
                        "id": str(playlist_1.consumer_site.id),
                        "domain": playlist_1.consumer_site.domain,
                        "name": playlist_1.consumer_site.name,
                    },
                    "created_by": None,
                    "created_on": playlist_1.created_on.isoformat().replace(
                        "+00:00", "Z"
                    ),
                    "duplicated_from": None,
                    "id": str(playlist_1.id),
                    "is_portable_to_consumer_site": False,
                    "is_portable_to_playlist": True,
                    "is_public": False,
                    "is_claimable": True,
                    "lti_id": "playlist#one",
                    "organization": {
                        "id": str(org_1.id),
                        "name": org_1.name,
                    },
                    "portable_to": [],
                    "retention_duration": None,
                    "title": "First playlist",
                    "users": [],
                    "can_edit": True,
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
        factories.OrganizationAccessFactory(
            user=user, organization=org_1, role=models.ADMINISTRATOR
        )
        playlist_1 = factories.PlaylistFactory(
            lti_id="playlist#eleven", organization=org_1, title="First playlist"
        )

        # User is a member of this organization, but it is not included in the request below
        org_2 = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            user=user, organization=org_2, role=models.ADMINISTRATOR
        )
        factories.PlaylistFactory(organization=org_2, title="Second playlist")

        # User is not a member of this organization
        org_3 = factories.OrganizationFactory()
        factories.PlaylistFactory(organization=org_3)

        # User is member but as instructor of this organization
        org_4 = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            user=user, organization=org_4, role=models.INSTRUCTOR
        )
        factories.PlaylistFactory(organization=org_4)

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
                    "consumer_site": {
                        "id": str(playlist_1.consumer_site.id),
                        "domain": playlist_1.consumer_site.domain,
                        "name": playlist_1.consumer_site.name,
                    },
                    "created_by": None,
                    "created_on": playlist_1.created_on.isoformat().replace(
                        "+00:00", "Z"
                    ),
                    "duplicated_from": None,
                    "id": str(playlist_1.id),
                    "is_portable_to_consumer_site": False,
                    "is_portable_to_playlist": True,
                    "is_public": False,
                    "is_claimable": True,
                    "lti_id": "playlist#eleven",
                    "organization": {
                        "id": str(org_1.id),
                        "name": org_1.name,
                    },
                    "portable_to": [],
                    "retention_duration": None,
                    "title": "First playlist",
                    "users": [],
                    "can_edit": True,
                },
            ],
        )

    def test_list_playlist_user_access_administrator_or_instructor(self):
        """
        A user can list all the playlist he has ADMINISTRATOR or INSTRUCTOR role
        no matter the organization role.
        """
        user = factories.UserFactory()

        # In this org, the user is not a member but he has access to this playlist.
        org_1 = factories.OrganizationFactory()
        playlist_1 = factories.PlaylistFactory(
            lti_id="playlist#one", organization=org_1, title="First playlist"
        )
        factories.PlaylistAccessFactory(
            playlist=playlist_1, user=user, role=models.ADMINISTRATOR
        )
        # user has no access on this playlist
        factories.PlaylistFactory(
            lti_id="playlist#two", organization=org_1, title="Second playlist"
        )

        # In this org, the user is not a member but he has access to this playlist.
        org_2 = factories.OrganizationFactory()
        playlist_3 = factories.PlaylistFactory(
            lti_id="playlist#three", organization=org_2, title="Third playlist"
        )
        factories.PlaylistAccessFactory(
            playlist=playlist_3, user=user, role=models.ADMINISTRATOR
        )

        # Orphan playlist, not in an organization, the user has access to it.
        playlist_4 = factories.PlaylistFactory(
            lti_id="playlist#four", title="Fourth playlist"
        )
        factories.PlaylistAccessFactory(
            playlist=playlist_4, user=user, role=models.ADMINISTRATOR
        )

        playlist_5 = factories.PlaylistFactory(
            lti_id="playlist#five", title="Fifth playlist"
        )
        factories.PlaylistAccessFactory(
            playlist=playlist_5, user=user, role=models.INSTRUCTOR
        )

        # User has instructor role to this playlist and can access it.

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            "/api/playlists/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 4)
        self.assertEqual(
            response.json()["results"],
            [
                {
                    "consumer_site": {
                        "id": str(playlist_5.consumer_site.id),
                        "domain": playlist_5.consumer_site.domain,
                        "name": playlist_5.consumer_site.name,
                    },
                    "created_by": None,
                    "created_on": playlist_5.created_on.isoformat().replace(
                        "+00:00", "Z"
                    ),
                    "duplicated_from": None,
                    "id": str(playlist_5.id),
                    "is_portable_to_consumer_site": False,
                    "is_portable_to_playlist": True,
                    "is_public": False,
                    "is_claimable": True,
                    "lti_id": "playlist#five",
                    "organization": None,
                    "portable_to": [],
                    "retention_duration": None,
                    "title": "Fifth playlist",
                    "users": [str(user.id)],
                    "can_edit": True,
                },
                {
                    "consumer_site": {
                        "id": str(playlist_4.consumer_site.id),
                        "domain": playlist_4.consumer_site.domain,
                        "name": playlist_4.consumer_site.name,
                    },
                    "created_by": None,
                    "created_on": playlist_4.created_on.isoformat().replace(
                        "+00:00", "Z"
                    ),
                    "duplicated_from": None,
                    "id": str(playlist_4.id),
                    "is_portable_to_consumer_site": False,
                    "is_portable_to_playlist": True,
                    "is_public": False,
                    "is_claimable": True,
                    "lti_id": "playlist#four",
                    "organization": None,
                    "portable_to": [],
                    "retention_duration": None,
                    "title": "Fourth playlist",
                    "users": [str(user.id)],
                    "can_edit": True,
                },
                {
                    "consumer_site": {
                        "id": str(playlist_3.consumer_site.id),
                        "domain": playlist_3.consumer_site.domain,
                        "name": playlist_3.consumer_site.name,
                    },
                    "created_by": None,
                    "created_on": playlist_3.created_on.isoformat().replace(
                        "+00:00", "Z"
                    ),
                    "duplicated_from": None,
                    "id": str(playlist_3.id),
                    "is_portable_to_consumer_site": False,
                    "is_portable_to_playlist": True,
                    "is_public": False,
                    "is_claimable": True,
                    "lti_id": "playlist#three",
                    "organization": {
                        "id": str(org_2.id),
                        "name": org_2.name,
                    },
                    "portable_to": [],
                    "retention_duration": None,
                    "title": "Third playlist",
                    "users": [str(user.id)],
                    "can_edit": True,
                },
                {
                    "consumer_site": {
                        "id": str(playlist_1.consumer_site.id),
                        "domain": playlist_1.consumer_site.domain,
                        "name": playlist_1.consumer_site.name,
                    },
                    "created_by": None,
                    "created_on": playlist_1.created_on.isoformat().replace(
                        "+00:00", "Z"
                    ),
                    "duplicated_from": None,
                    "id": str(playlist_1.id),
                    "is_portable_to_consumer_site": False,
                    "is_portable_to_playlist": True,
                    "is_public": False,
                    "is_claimable": True,
                    "lti_id": "playlist#one",
                    "organization": {
                        "id": str(org_1.id),
                        "name": org_1.name,
                    },
                    "portable_to": [],
                    "retention_duration": None,
                    "title": "First playlist",
                    "users": [str(user.id)],
                    "can_edit": True,
                },
            ],
        )

    def test_list_playlist_not_duplicated(self):
        """
        When several users have administrator role on a playlist,
        the playlist must be returned only once.
        """
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()

        playlist = factories.PlaylistFactory(
            organization=organization,
        )
        factories.PlaylistAccessFactory(
            playlist=playlist,
            user=user,
            role=models.ADMINISTRATOR,
        )
        factories.PlaylistAccessFactory.create_batch(
            3,
            playlist=playlist,
            role=models.ADMINISTRATOR,
        )
        factories.OrganizationAccessFactory(
            organization=organization,
            user=user,
            role=models.ADMINISTRATOR,
        )
        factories.OrganizationAccessFactory.create_batch(
            3,
            organization=organization,
            role=models.ADMINISTRATOR,
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            "/api/playlists/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["id"], str(playlist.id))

    def test_list_playlist_ordering_created_on(self):
        """
        A user can list playlist ordering them on created_on
        """
        user = factories.UserFactory()

        # In this org, the user is not a member but he has access to this playlist.
        org_1 = factories.OrganizationFactory()
        playlist_1 = factories.PlaylistFactory(
            lti_id="playlist#one", organization=org_1, title="First playlist"
        )
        factories.PlaylistAccessFactory(
            playlist=playlist_1, user=user, role=models.ADMINISTRATOR
        )
        # user has no access on this playlist
        factories.PlaylistFactory(
            lti_id="playlist#two", organization=org_1, title="Second playlist"
        )

        # In this org, the user is not a member but he has access to this playlist.
        org_2 = factories.OrganizationFactory()
        playlist_3 = factories.PlaylistFactory(
            lti_id="playlist#three", organization=org_2, title="Third playlist"
        )
        factories.PlaylistAccessFactory(
            playlist=playlist_3, user=user, role=models.ADMINISTRATOR
        )

        # Orphan playlist, not in an organization, the use has access to.
        playlist_4 = factories.PlaylistFactory(
            lti_id="playlist#four", title="Fourth playlist"
        )
        factories.PlaylistAccessFactory(
            playlist=playlist_4, user=user, role=models.ADMINISTRATOR
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            "/api/playlists/?ordering=created_on",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 3)
        self.assertEqual(
            response.json()["results"],
            [
                {
                    "consumer_site": {
                        "id": str(playlist_1.consumer_site.id),
                        "domain": playlist_1.consumer_site.domain,
                        "name": playlist_1.consumer_site.name,
                    },
                    "created_by": None,
                    "created_on": playlist_1.created_on.isoformat().replace(
                        "+00:00", "Z"
                    ),
                    "duplicated_from": None,
                    "id": str(playlist_1.id),
                    "is_portable_to_consumer_site": False,
                    "is_portable_to_playlist": True,
                    "is_public": False,
                    "is_claimable": True,
                    "lti_id": "playlist#one",
                    "organization": {
                        "id": str(org_1.id),
                        "name": org_1.name,
                    },
                    "portable_to": [],
                    "retention_duration": None,
                    "title": "First playlist",
                    "users": [str(user.id)],
                    "can_edit": True,
                },
                {
                    "consumer_site": {
                        "id": str(playlist_3.consumer_site.id),
                        "domain": playlist_3.consumer_site.domain,
                        "name": playlist_3.consumer_site.name,
                    },
                    "created_by": None,
                    "created_on": playlist_3.created_on.isoformat().replace(
                        "+00:00", "Z"
                    ),
                    "duplicated_from": None,
                    "id": str(playlist_3.id),
                    "is_portable_to_consumer_site": False,
                    "is_portable_to_playlist": True,
                    "is_public": False,
                    "is_claimable": True,
                    "lti_id": "playlist#three",
                    "organization": {
                        "id": str(org_2.id),
                        "name": org_2.name,
                    },
                    "portable_to": [],
                    "retention_duration": None,
                    "title": "Third playlist",
                    "users": [str(user.id)],
                    "can_edit": True,
                },
                {
                    "consumer_site": {
                        "id": str(playlist_4.consumer_site.id),
                        "domain": playlist_4.consumer_site.domain,
                        "name": playlist_4.consumer_site.name,
                    },
                    "created_by": None,
                    "created_on": playlist_4.created_on.isoformat().replace(
                        "+00:00", "Z"
                    ),
                    "duplicated_from": None,
                    "id": str(playlist_4.id),
                    "is_portable_to_consumer_site": False,
                    "is_portable_to_playlist": True,
                    "is_public": False,
                    "is_claimable": True,
                    "lti_id": "playlist#four",
                    "organization": None,
                    "portable_to": [],
                    "retention_duration": None,
                    "title": "Fourth playlist",
                    "users": [str(user.id)],
                    "can_edit": True,
                },
            ],
        )
