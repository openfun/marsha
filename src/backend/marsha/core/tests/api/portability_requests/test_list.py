"""Tests for the PortabilityRequest list API."""
import datetime

from django.test import TestCase
from django.utils import timezone

from marsha.core.factories import (
    ConsumerSiteAccessFactory,
    OrganizationAccessFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
    PortabilityRequestFactory,
    UserFactory,
)
from marsha.core.models import ADMINISTRATOR, PortabilityRequestState
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    UserAccessTokenFactory,
)


class PortabilityRequestListAPITest(TestCase):
    """Test the list API for portability request objects."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        PortabilityRequestFactory.create_batch(3)  # should never be returned

    def assertClientGetResults(self, jwt_token, expected_results, query_params=None):
        """Assert the API endpoint returns a 200 with the expected result."""
        response = self.client.get(
            f"/api/portability-requests/{query_params or ''}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], len(expected_results))
        self.assertEqual(response.json()["results"], expected_results)

    def test_list_portability_request_by_anonymous_user(self):
        """Anonymous users cannot make list requests for portability request."""
        response = self.client.get("/api/portability-requests/")
        self.assertEqual(response.status_code, 401)  # Unauthorized

    def test_list_portability_request_by_random_logged_in_user(self):
        """
        Random logged-in users can make list requests.

        Will not receive portability requests they are not concerned with.
        """
        jwt_token = UserAccessTokenFactory()

        self.assertClientGetResults(jwt_token, [])

    def test_list_portability_request_by_random_lti_user(self):
        """LTI users cannot list portability request."""
        portability_request = PortabilityRequestFactory()

        # Event the portability request "asker" cannot delete it from LTI
        jwt_token = InstructorOrAdminLtiTokenFactory(
            consumer_site=str(portability_request.from_lti_consumer_site.pk),
            port_to_playlist_id=str(portability_request.from_lti_consumer_site.pk),
            playlist=None,
            user__id=str(portability_request.from_lti_user_id),
        )

        response = self.client.get(
            "/api/portability-requests/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)  # Forbidden

    def test_list_portability_request_logged_in_user_with_created_portability_request(
        self,
    ):
        """Creator of the portability request can list it."""
        user = UserFactory()
        portability_request = PortabilityRequestFactory(from_user=user)

        jwt_token = UserAccessTokenFactory(user=user)

        self.assertClientGetResults(
            jwt_token,
            [
                {
                    "created_on": portability_request.created_on.isoformat().replace(
                        "+00:00", "Z"
                    ),
                    "id": str(portability_request.pk),
                    "for_playlist": {
                        "id": str(portability_request.for_playlist.pk),
                        "title": portability_request.for_playlist.title,
                        "lti_id": portability_request.for_playlist.lti_id,
                    },
                    "from_playlist": {
                        "id": str(portability_request.from_playlist.pk),
                        "title": portability_request.from_playlist.title,
                        "lti_id": portability_request.from_playlist.lti_id,
                    },
                    "from_lti_consumer_site": {
                        "id": str(portability_request.from_lti_consumer_site.pk),
                        "domain": portability_request.from_lti_consumer_site.domain,
                        "name": portability_request.from_lti_consumer_site.name,
                    },
                    "from_lti_user_id": str(portability_request.from_lti_user_id),
                    "from_user": {
                        "id": str(user.pk),  # important
                        "date_joined": user.date_joined.strftime(
                            "%Y-%m-%dT%H:%M:%S.%fZ"
                        ),
                        "email": user.email,
                        "full_name": user.get_full_name(),
                        "is_staff": False,
                        "is_superuser": False,
                        "organization_accesses": [],
                    },
                    "state": portability_request.state,
                    "updated_by_user": None,
                    "can_accept_or_reject": False,  # important
                }
            ],
        )

    def test_list_portability_request_logged_in_user_with_owned_playlist(self):
        """Creator of the playlist can list the associated portability request."""
        user = UserFactory()
        playlist_owned = PlaylistFactory(created_by=user)
        portability_request = PortabilityRequestFactory(for_playlist=playlist_owned)

        jwt_token = UserAccessTokenFactory(user=user)

        self.assertClientGetResults(
            jwt_token,
            [
                {
                    "created_on": portability_request.created_on.isoformat().replace(
                        "+00:00", "Z"
                    ),
                    "id": str(portability_request.pk),
                    "for_playlist": {
                        "id": str(playlist_owned.pk),  # important
                        "title": playlist_owned.title,
                        "lti_id": playlist_owned.lti_id,
                    },
                    "from_playlist": {
                        "id": str(portability_request.from_playlist.pk),
                        "title": portability_request.from_playlist.title,
                        "lti_id": portability_request.from_playlist.lti_id,
                    },
                    "from_lti_consumer_site": {
                        "id": str(portability_request.from_lti_consumer_site.pk),
                        "domain": portability_request.from_lti_consumer_site.domain,
                        "name": portability_request.from_lti_consumer_site.name,
                    },
                    "from_lti_user_id": str(portability_request.from_lti_user_id),
                    "from_user": None,
                    "state": portability_request.state,
                    "updated_by_user": None,
                    "can_accept_or_reject": portability_request.state == "pending",
                }
            ],
        )

    def test_list_portability_request_logged_in_user_with_playlist_admin(self):
        """Administrator of the playlist can list the associated portability request."""
        playlist_access_admin = PlaylistAccessFactory(
            role=ADMINISTRATOR,
        )
        playlist_with_admin = playlist_access_admin.playlist
        portability_request = PortabilityRequestFactory(
            for_playlist=playlist_with_admin
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access_admin.user)

        self.assertClientGetResults(
            jwt_token,
            [
                {
                    "created_on": portability_request.created_on.isoformat().replace(
                        "+00:00", "Z"
                    ),
                    "id": str(portability_request.pk),
                    "for_playlist": {
                        "id": str(playlist_with_admin.pk),  # important
                        "title": playlist_with_admin.title,
                        "lti_id": playlist_with_admin.lti_id,
                    },
                    "from_playlist": {
                        "id": str(portability_request.from_playlist.pk),
                        "title": portability_request.from_playlist.title,
                        "lti_id": portability_request.from_playlist.lti_id,
                    },
                    "from_lti_consumer_site": {
                        "id": str(portability_request.from_lti_consumer_site.pk),
                        "domain": portability_request.from_lti_consumer_site.domain,
                        "name": portability_request.from_lti_consumer_site.name,
                    },
                    "from_lti_user_id": str(portability_request.from_lti_user_id),
                    "from_user": None,
                    "state": portability_request.state,
                    "updated_by_user": None,
                    "can_accept_or_reject": portability_request.state == "pending",
                }
            ],
        )

    def test_list_portability_request_logged_in_user_with_organization_admin(self):
        """Administrator of the organization can list the associated portability request."""
        organization_access_admin = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist_with_organization_admin = PlaylistFactory(
            organization=organization_access_admin.organization,
        )
        portability_request = PortabilityRequestFactory(
            for_playlist=playlist_with_organization_admin
        )

        jwt_token = UserAccessTokenFactory(user=organization_access_admin.user)

        self.assertClientGetResults(
            jwt_token,
            [
                {
                    "created_on": portability_request.created_on.isoformat().replace(
                        "+00:00", "Z"
                    ),
                    "id": str(portability_request.pk),
                    "for_playlist": {
                        "id": str(playlist_with_organization_admin.pk),  # important
                        "title": playlist_with_organization_admin.title,
                        "lti_id": playlist_with_organization_admin.lti_id,
                    },
                    "from_playlist": {
                        "id": str(portability_request.from_playlist.pk),
                        "title": portability_request.from_playlist.title,
                        "lti_id": portability_request.from_playlist.lti_id,
                    },
                    "from_lti_consumer_site": {
                        "id": str(portability_request.from_lti_consumer_site.pk),
                        "domain": portability_request.from_lti_consumer_site.domain,
                        "name": portability_request.from_lti_consumer_site.name,
                    },
                    "from_lti_user_id": str(portability_request.from_lti_user_id),
                    "from_user": None,
                    "state": portability_request.state,
                    "updated_by_user": None,
                    "can_accept_or_reject": portability_request.state == "pending",
                }
            ],
        )

    def test_list_portability_request_logged_in_user_with_consumer_site_admin(self):
        """Administrator of the consumer site can list the associated portability request."""
        consumer_site_access_admin = ConsumerSiteAccessFactory(
            role=ADMINISTRATOR,
        )
        playlist_with_consumer_site_admin = PlaylistFactory(
            consumer_site=consumer_site_access_admin.consumer_site,
        )
        portability_request = PortabilityRequestFactory(
            for_playlist=playlist_with_consumer_site_admin
        )

        jwt_token = UserAccessTokenFactory(user=consumer_site_access_admin.user)

        self.assertClientGetResults(
            jwt_token,
            [
                {
                    "created_on": portability_request.created_on.isoformat().replace(
                        "+00:00", "Z"
                    ),
                    "id": str(portability_request.pk),
                    "for_playlist": {
                        "id": str(playlist_with_consumer_site_admin.pk),  # important
                        "title": playlist_with_consumer_site_admin.title,
                        "lti_id": playlist_with_consumer_site_admin.lti_id,
                    },
                    "from_playlist": {
                        "id": str(portability_request.from_playlist.pk),
                        "title": portability_request.from_playlist.title,
                        "lti_id": portability_request.from_playlist.lti_id,
                    },
                    "from_lti_consumer_site": {
                        "id": str(portability_request.from_lti_consumer_site.pk),
                        "domain": portability_request.from_lti_consumer_site.domain,
                        "name": portability_request.from_lti_consumer_site.name,
                    },
                    "from_lti_user_id": str(portability_request.from_lti_user_id),
                    "from_user": None,
                    "state": portability_request.state,
                    "updated_by_user": None,
                    "can_accept_or_reject": portability_request.state == "pending",
                }
            ],
        )

    def test_list_portability_request_sort_on_created_on(self):
        """Test sorting on created_on field."""
        user = UserFactory()
        playlist_owned = PlaylistFactory(created_by=user)

        now = timezone.now()
        yesterday = now - datetime.timedelta(days=1)
        tomorrow = now + datetime.timedelta(days=1)

        expected_results = [
            {
                "created_on": portability_request.created_on.isoformat().replace(
                    "+00:00", "Z"
                ),
                "id": str(portability_request.pk),
                "for_playlist": {
                    "id": str(portability_request.for_playlist.pk),  # important
                    "title": portability_request.for_playlist.title,
                    "lti_id": portability_request.for_playlist.lti_id,
                },
                "from_playlist": {
                    "id": str(portability_request.from_playlist.pk),
                    "title": portability_request.from_playlist.title,
                    "lti_id": portability_request.from_playlist.lti_id,
                },
                "from_lti_consumer_site": {
                    "id": str(portability_request.from_lti_consumer_site.pk),
                    "domain": portability_request.from_lti_consumer_site.domain,
                    "name": portability_request.from_lti_consumer_site.name,
                },
                "from_lti_user_id": str(portability_request.from_lti_user_id),
                "from_user": None,
                "state": portability_request.state,
                "updated_by_user": None,
                "can_accept_or_reject": portability_request.state == "pending",
            }
            for portability_request in (
                PortabilityRequestFactory(
                    for_playlist=playlist_owned, created_on=yesterday
                ),
                PortabilityRequestFactory(for_playlist=playlist_owned, created_on=now),
                PortabilityRequestFactory(
                    for_playlist=playlist_owned, created_on=tomorrow
                ),
            )
        ]

        jwt_token = UserAccessTokenFactory(user=user)

        self.assertClientGetResults(
            jwt_token,
            expected_results,
            query_params="?ordering=created_on",
        )

        expected_results.reverse()
        self.assertClientGetResults(
            jwt_token,
            expected_results,
            query_params="?ordering=-created_on",
        )

    def test_list_portability_request_filter_on_state(self):
        """Test filtering on state field."""
        user = UserFactory()
        playlist_owned = PlaylistFactory(created_by=user)

        pending = PortabilityRequestFactory(
            for_playlist=playlist_owned, state=PortabilityRequestState.PENDING.value
        )
        PortabilityRequestFactory(
            for_playlist=playlist_owned, state=PortabilityRequestState.ACCEPTED.value
        )
        PortabilityRequestFactory(
            for_playlist=playlist_owned, state=PortabilityRequestState.REJECTED.value
        )

        jwt_token = UserAccessTokenFactory(user=user)

        self.assertClientGetResults(
            jwt_token,
            [
                {
                    "created_on": pending.created_on.isoformat().replace("+00:00", "Z"),
                    "id": str(pending.pk),
                    "for_playlist": {
                        "id": str(pending.for_playlist.pk),  # important
                        "title": pending.for_playlist.title,
                        "lti_id": pending.for_playlist.lti_id,
                    },
                    "from_playlist": {
                        "id": str(pending.from_playlist.pk),
                        "title": pending.from_playlist.title,
                        "lti_id": pending.from_playlist.lti_id,
                    },
                    "from_lti_consumer_site": {
                        "id": str(pending.from_lti_consumer_site.pk),
                        "domain": pending.from_lti_consumer_site.domain,
                        "name": pending.from_lti_consumer_site.name,
                    },
                    "from_lti_user_id": str(pending.from_lti_user_id),
                    "from_user": None,
                    "state": "pending",
                    "updated_by_user": None,
                    "can_accept_or_reject": True,
                },
            ],
            query_params="?state=pending",
        )

    def test_list_portability_request_filter_on_for_playlist_id(self):
        """Test filtering on "for_playlist" field."""
        user = UserFactory()
        playlist_owned = PlaylistFactory(created_by=user)

        linked_portability_request = PortabilityRequestFactory(
            for_playlist=playlist_owned
        )
        PortabilityRequestFactory.create_batch(  # other portability requests
            2,
            for_playlist=PlaylistFactory(created_by=user),
        )

        jwt_token = UserAccessTokenFactory(user=user)

        self.assertClientGetResults(
            jwt_token,
            [
                {
                    "created_on": linked_portability_request.created_on.isoformat().replace(
                        "+00:00", "Z"
                    ),
                    "id": str(linked_portability_request.pk),
                    "for_playlist": {
                        "id": str(
                            linked_portability_request.for_playlist.pk
                        ),  # important
                        "title": linked_portability_request.for_playlist.title,
                        "lti_id": linked_portability_request.for_playlist.lti_id,
                    },
                    "from_playlist": {
                        "id": str(linked_portability_request.from_playlist.pk),
                        "title": linked_portability_request.from_playlist.title,
                        "lti_id": linked_portability_request.from_playlist.lti_id,
                    },
                    "from_lti_consumer_site": {
                        "id": str(linked_portability_request.from_lti_consumer_site.pk),
                        "domain": linked_portability_request.from_lti_consumer_site.domain,
                        "name": linked_portability_request.from_lti_consumer_site.name,
                    },
                    "from_lti_user_id": str(
                        linked_portability_request.from_lti_user_id
                    ),
                    "from_user": None,
                    "state": linked_portability_request.state,
                    "updated_by_user": None,
                    "can_accept_or_reject": linked_portability_request.state
                    == "pending",
                },
            ],
            query_params=f"?for_playlist_id={playlist_owned.pk}",
        )
