"""Tests for the PortabilityRequest delete API."""
from django.test import TestCase

from marsha.core.factories import (
    NotPendingPortabilityRequestFactory,
    PendingPortabilityRequestFactory,
    PortabilityRequestFactory,
    UserFactory,
)
from marsha.core.models import PortabilityRequest
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    UserAccessTokenFactory,
)


class PortabilityRequestDeleteAPITest(TestCase):
    """Testcase for the PortabilityRequest destroy API."""

    maxDiff = None

    def test_delete_portability_request_by_anonymous_user(self):
        """Anonymous users cannot delete portability request."""
        portability_request = PortabilityRequestFactory()
        self.assertEqual(PortabilityRequest.objects.count(), 1)

        response = self.client.delete(
            f"/api/portability-requests/{portability_request.id}/"
        )

        self.assertEqual(response.status_code, 401)  # Unauthorized
        self.assertEqual(PortabilityRequest.objects.count(), 1)

    def test_delete_portability_request_by_random_lti_user(self):
        """LTI users cannot delete portability request."""
        portability_request = PortabilityRequestFactory()
        self.assertEqual(PortabilityRequest.objects.count(), 1)

        # Event the portability request "asker" cannot delete it from LTI
        jwt_token = InstructorOrAdminLtiTokenFactory(
            consumer_site=str(portability_request.from_lti_consumer_site.pk),
            port_to_playlist_id=str(portability_request.from_lti_consumer_site.pk),
            playlist=None,
            user__id=str(portability_request.from_lti_user_id),
        )

        response = self.client.delete(
            f"/api/portability-requests/{portability_request.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)  # Forbidden
        self.assertEqual(PortabilityRequest.objects.count(), 1)

    def test_delete_portability_request_by_random_logged_in_user(self):
        """Random logged-in users cannot delete portability request unrelated to them."""
        portability_request = PortabilityRequestFactory()
        self.assertEqual(PortabilityRequest.objects.count(), 1)
        jwt_token = UserAccessTokenFactory()

        response = self.client.delete(
            f"/api/portability-requests/{portability_request.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        # Note: the 404 is raised before the 403,
        # because permissions are checked after the object has been queried
        self.assertEqual(response.status_code, 404)  # Not Found
        self.assertEqual(PortabilityRequest.objects.count(), 1)

    def test_delete_portability_request_by_its_owner(self):
        """Creator of the portability request can delete it."""
        user = UserFactory()
        portability_request = PendingPortabilityRequestFactory(
            from_user=user,
        )
        self.assertEqual(PortabilityRequest.objects.count(), 1)
        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.delete(
            f"/api/portability-requests/{portability_request.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 204)  # No Content
        self.assertEqual(PortabilityRequest.objects.count(), 0)

    def test_delete_portability_request_by_its_owner_wrong_state(self):
        """Creator of the portability request cannot delete accepted/rejected requests."""
        user = UserFactory()
        portability_request = NotPendingPortabilityRequestFactory(
            from_user=user,
        )
        self.assertEqual(PortabilityRequest.objects.count(), 1)
        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.delete(
            f"/api/portability-requests/{portability_request.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 422)  # Unprocessable Entity
        self.assertEqual(PortabilityRequest.objects.count(), 1)
