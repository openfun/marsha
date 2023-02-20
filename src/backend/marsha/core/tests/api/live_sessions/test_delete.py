"""Tests for the livesession delete API."""
from django.test import TestCase

from marsha.core.factories import AnonymousLiveSessionFactory, LiveSessionFactory
from marsha.core.simple_jwt.factories import LiveSessionLtiTokenFactory


class LiveSessionDeleteApiTest(TestCase):
    """Test the delete API of the liveSession object."""

    maxDiff = None

    def test_api_livesession_delete_anonymous(self):
        """An anonymous should not be able to delete a livesession."""
        livesession = AnonymousLiveSessionFactory()
        response = self.client.delete(
            f"/api/livesession/{livesession.id}/",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_livesession_delete_token_lti(self):
        """A user should not be able to delete a livesession."""
        livesession = LiveSessionFactory(is_from_lti_connection=True)

        jwt_token = LiveSessionLtiTokenFactory(
            live_session=livesession,
            any_role=True,
            permissions__can_update=True,
        )

        response = self.client.delete(
            f"/api/livesession/{livesession.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)
