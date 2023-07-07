"""Tests for the PortabilityRequest accept API."""
from django.test import TestCase

from marsha.core.factories import (
    ConsumerSiteAccessFactory,
    NotPendingPortabilityRequestFactory,
    OrganizationAccessFactory,
    PendingPortabilityRequestFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
    UserFactory,
)
from marsha.core.models import ADMINISTRATOR
from marsha.core.simple_jwt.factories import UserAccessTokenFactory


class PortabilityRequestAcceptAPITest(TestCase):
    """Test the "accept" API for portability request objects."""

    maxDiff = None

    def assertClientPostAcceptData(
        self, jwt_token, portability_request_pk, expected_result
    ):
        """Assert the API endpoint returns a 200 with the expected result."""
        response = self.client.post(
            f"/api/portability-requests/{portability_request_pk}/accept/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), expected_result)

    def test_accept_portability_request_by_anonymous_user(self):
        """Anonymous users cannot retrieve portability request."""
        portability_request = PendingPortabilityRequestFactory()

        response = self.client.post(
            f"/api/portability-requests/{portability_request.pk}/accept/"
        )
        self.assertEqual(response.status_code, 401)  # Unauthorized

    def test_accept_portability_request_by_random_logged_in_user(self):
        """Random logged-in users cannot retrieve portability request unrelated to them."""
        user = UserFactory()
        portability_request = PendingPortabilityRequestFactory()

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            f"/api/portability-requests/{portability_request.pk}/accept/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        # Note: the 404 is raised before the 403,
        # because permissions are checked after the object has been queried
        self.assertEqual(response.status_code, 404)  # Not Found

    def test_accept_portability_request_logged_in_user_with_created_portability_request(
        self,
    ):
        """Creator of the portability request cannot accept it."""
        user = UserFactory()
        portability_request = PendingPortabilityRequestFactory(from_user=user)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            f"/api/portability-requests/{portability_request.pk}/accept/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        # Note: the 404 is raised before the 403,
        # because permissions are checked after the object has been queried
        self.assertEqual(response.status_code, 404)  # Not Found

    def test_accept_portability_request_logged_in_user_with_owned_playlist(self):
        """Creator of the playlist can accept the associated portability request."""
        user = UserFactory()
        playlist_owned = PlaylistFactory(created_by=user)
        portability_request = PendingPortabilityRequestFactory(
            for_playlist=playlist_owned
        )

        jwt_token = UserAccessTokenFactory(user=user)

        self.assertClientPostAcceptData(
            jwt_token,
            portability_request.pk,
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
                "from_lti_consumer_site": {
                    "id": str(portability_request.from_lti_consumer_site.pk),
                    "domain": portability_request.from_lti_consumer_site.domain,
                    "name": portability_request.from_lti_consumer_site.name,
                },
                "from_lti_user_id": str(portability_request.from_lti_user_id),
                "from_playlist": {
                    "id": str(portability_request.from_playlist.pk),
                    "title": portability_request.from_playlist.title,
                    "lti_id": portability_request.from_playlist.lti_id,
                },
                "from_user": None,
                "state": "accepted",  # important
                "updated_by_user": None,
                "can_accept_or_reject": False,
            },
        )

    def test_accept_portability_request_logged_in_user_with_playlist_admin(self):
        """Administrator of the playlist can accept the associated portability request."""
        playlist_access_admin = PlaylistAccessFactory(
            role=ADMINISTRATOR,
        )
        playlist_with_admin = playlist_access_admin.playlist
        portability_request = PendingPortabilityRequestFactory(
            for_playlist=playlist_with_admin
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access_admin.user)

        self.assertClientPostAcceptData(
            jwt_token,
            portability_request.pk,
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
                "from_lti_consumer_site": {
                    "id": str(portability_request.from_lti_consumer_site.pk),
                    "domain": portability_request.from_lti_consumer_site.domain,
                    "name": portability_request.from_lti_consumer_site.name,
                },
                "from_lti_user_id": str(portability_request.from_lti_user_id),
                "from_playlist": {
                    "id": str(portability_request.from_playlist.pk),
                    "title": portability_request.from_playlist.title,
                    "lti_id": portability_request.from_playlist.lti_id,
                },
                "from_user": None,
                "state": "accepted",  # important
                "updated_by_user": None,
                "can_accept_or_reject": False,
            },
        )

    def test_accept_portability_request_logged_in_user_with_organization_admin(self):
        """Administrator of the organization can list the associated portability request."""
        organization_access_admin = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist_with_organization_admin = PlaylistFactory(
            organization=organization_access_admin.organization,
        )
        portability_request = PendingPortabilityRequestFactory(
            for_playlist=playlist_with_organization_admin
        )

        jwt_token = UserAccessTokenFactory(user=organization_access_admin.user)

        self.assertClientPostAcceptData(
            jwt_token,
            portability_request.pk,
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
                "from_lti_consumer_site": {
                    "id": str(portability_request.from_lti_consumer_site.pk),
                    "domain": portability_request.from_lti_consumer_site.domain,
                    "name": portability_request.from_lti_consumer_site.name,
                },
                "from_lti_user_id": str(portability_request.from_lti_user_id),
                "from_playlist": {
                    "id": str(portability_request.from_playlist.pk),
                    "title": portability_request.from_playlist.title,
                    "lti_id": portability_request.from_playlist.lti_id,
                },
                "from_user": None,
                "state": "accepted",  # important
                "updated_by_user": None,
                "can_accept_or_reject": False,
            },
        )

    def test_accept_portability_request_logged_in_user_with_consumer_site_admin(self):
        """Administrator of the consumer site can accept the associated portability request."""
        consumer_site_access_admin = ConsumerSiteAccessFactory(
            role=ADMINISTRATOR,
        )
        playlist_with_consumer_site_admin = PlaylistFactory(
            consumer_site=consumer_site_access_admin.consumer_site,
        )
        portability_request = PendingPortabilityRequestFactory(
            for_playlist=playlist_with_consumer_site_admin
        )

        jwt_token = UserAccessTokenFactory(user=consumer_site_access_admin.user)

        self.assertClientPostAcceptData(
            jwt_token,
            portability_request.pk,
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
                "from_lti_consumer_site": {
                    "id": str(portability_request.from_lti_consumer_site.pk),
                    "domain": portability_request.from_lti_consumer_site.domain,
                    "name": portability_request.from_lti_consumer_site.name,
                },
                "from_lti_user_id": str(portability_request.from_lti_user_id),
                "from_playlist": {
                    "id": str(portability_request.from_playlist.pk),
                    "title": portability_request.from_playlist.title,
                    "lti_id": portability_request.from_playlist.lti_id,
                },
                "from_user": None,
                "state": "accepted",  # important
                "updated_by_user": None,
                "can_accept_or_reject": False,
            },
        )

    def test_accept_portability_request_logged_in_user_with_playlist_admin_wrong_state(
        self,
    ):
        """
        Administrator of the playlist can't accept the associated portability request
        if it's not in the pending state.
        """
        playlist_access_admin = PlaylistAccessFactory(
            role=ADMINISTRATOR,
        )
        playlist_with_admin = playlist_access_admin.playlist
        portability_request = NotPendingPortabilityRequestFactory(
            for_playlist=playlist_with_admin,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access_admin.user)

        response = self.client.post(
            f"/api/portability-requests/{portability_request.pk}/accept/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 422)  # Unprocessable Entity
        self.assertEqual(response.json(), {"detail": 'Method "accept" not allowed.'})
