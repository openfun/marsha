"""Test the portability request utils module."""

from django.test import TestCase

from marsha.core.factories import (
    NotPendingPortabilityRequestFactory,
    PendingPortabilityRequestFactory,
)
from marsha.core.models import PlaylistPortability, PortabilityRequest
from marsha.core.utils.portability_request_utils import (
    PortabilityTransitionException,
    accept_portability_request,
    destroy_portability_request,
    reject_portability_request,
)


class PortabilityRequestUtilsTestCase(TestCase):
    """Test the portability request utils."""

    def test_accept_portability_request(self):
        """Test accepting a portability request."""
        pending_portability_request = PendingPortabilityRequestFactory()

        self.assertEqual(
            PlaylistPortability.objects.filter(
                source_playlist=pending_portability_request.for_playlist,
                target_playlist=pending_portability_request.from_playlist,
            ).count(),
            0,
        )

        accept_portability_request(pending_portability_request)
        self.assertEqual(pending_portability_request.state, "accepted")
        self.assertEqual(
            PlaylistPortability.objects.filter(
                source_playlist=pending_portability_request.for_playlist,
                target_playlist=pending_portability_request.from_playlist,
            ).count(),
            1,
        )

        not_pending_portability_request = NotPendingPortabilityRequestFactory()
        with self.assertRaises(PortabilityTransitionException):
            accept_portability_request(not_pending_portability_request)

    def test_reject_portability_request(self):
        """Test rejecting a portability request."""
        pending_portability_request = PendingPortabilityRequestFactory()

        self.assertEqual(
            PlaylistPortability.objects.filter(
                source_playlist=pending_portability_request.for_playlist,
                target_playlist=pending_portability_request.from_playlist,
            ).count(),
            0,
        )

        reject_portability_request(pending_portability_request)
        self.assertEqual(pending_portability_request.state, "rejected")
        self.assertEqual(
            PlaylistPortability.objects.filter(
                source_playlist=pending_portability_request.for_playlist,
                target_playlist=pending_portability_request.from_playlist,
            ).count(),
            0,
        )

        not_pending_portability_request = NotPendingPortabilityRequestFactory()
        with self.assertRaises(PortabilityTransitionException):
            reject_portability_request(not_pending_portability_request)

    def test_destroy_portability_request(self):
        """Test destroying a portability request."""
        pending_portability_request = PendingPortabilityRequestFactory()

        destroy_portability_request(pending_portability_request)
        self.assertFalse(
            PortabilityRequest.objects.filter(
                pk=pending_portability_request.pk,
            ).exists()
        )

        not_pending_portability_request = NotPendingPortabilityRequestFactory()
        with self.assertRaises(PortabilityTransitionException):
            destroy_portability_request(not_pending_portability_request)
