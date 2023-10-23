"""Tests for the livesession delete API."""

from marsha.core.factories import AnonymousLiveSessionFactory, LiveSessionFactory
from marsha.core.simple_jwt.factories import LiveSessionLtiTokenFactory
from marsha.core.tests.api.live_sessions.base import LiveSessionApiTestCase


class LiveSessionDeleteApiTest(LiveSessionApiTestCase):
    """Test the delete API of the liveSession object."""

    def _delete_url(self, video, live_session):
        """Return the url to use to delete a live session."""
        return f"/api/videos/{video.pk}/livesessions/{live_session.pk}/"

    def test_api_livesession_delete_anonymous(self):
        """An anonymous should not be able to delete a live session."""
        livesession = AnonymousLiveSessionFactory()
        response = self.client.delete(self._delete_url(livesession.video, livesession))
        self.assertEqual(response.status_code, 405)

    def test_api_livesession_delete_token_lti(self):
        """A user should not be able to delete a live session."""
        livesession = LiveSessionFactory(is_from_lti_connection=True)

        jwt_token = LiveSessionLtiTokenFactory(
            live_session=livesession,
            any_role=True,
            permissions__can_update=True,
        )

        response = self.client.delete(
            self._delete_url(livesession.video, livesession),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 405)
