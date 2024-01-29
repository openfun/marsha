"""Tests for the PortabilityRequest update/partial update API."""

from django.test import TestCase

from marsha.core.factories import (
    PlaylistFactory,
    PortabilityRequestFactory,
    UserFactory,
)
from marsha.core.simple_jwt.factories import UserAccessTokenFactory


class PortabilityRequestUpdateAPITest(TestCase):
    """Test the update API for portability request objects."""

    def test_update_portability_request_by_anonymous_user(self):
        """Anonymous users cannot update portability request."""
        portability_request = PortabilityRequestFactory()

        response = self.client.put(
            f"/api/portability-requests/{portability_request.id}/",
            {"for_playlist": str(PlaylistFactory().pk)},
        )

        self.assertEqual(response.status_code, 401)  # Unauthorized

    def test_update_portability_request_by_random_logged_in_user(self):
        """Random logged-in users cannot update playlists unrelated to them."""
        portability_request = PortabilityRequestFactory()

        jwt_token = UserAccessTokenFactory()

        response = self.client.put(
            f"/api/portability-requests/{portability_request.id}/",
            {"for_playlist": str(PlaylistFactory().pk)},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)  # Forbidden

    def test_update_portability_request_by_its_owner(self):
        """Creator of the portability request cannot update it."""
        user = UserFactory()
        portability_request = PortabilityRequestFactory(
            from_user=user,
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.put(
            f"/api/portability-requests/{portability_request.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)  # Forbidden
