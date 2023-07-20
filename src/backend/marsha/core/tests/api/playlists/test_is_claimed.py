"""Tests for the Playlist is-claimed API of the Marsha project."""

from django.test import TestCase

from marsha.core import factories
from marsha.core.lti.user_association import clean_lti_user_id
from marsha.core.models import ADMINISTRATOR, INSTRUCTOR
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
)


class PlaylistIsClaimedAPITest(TestCase):
    """Test the API endpoint to check if a playlist is claimed."""

    maxDiff = None

    def test_playlist_is_claimed_anonymous(self):
        """Anonymous users cannot check if a playlist is claimed."""
        playlist = factories.PlaylistFactory()
        response = self.client.get(
            f"/api/playlists/{playlist.id}/is-claimed/",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 401)

    def test_playlist_is_claimed_student(self):
        """Random logged-in users cannot check if a playlist is claimed."""
        video = factories.VideoFactory()
        jwt_token = StudentLtiTokenFactory(resource=video.playlist)

        response = self.client.get(
            f"/api/playlists/{video.playlist.id}/is-claimed/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_playlist_is_claimed_LTI_administrator(self):
        """LTI administrators can check if a playlist is claimed."""
        video = factories.VideoFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video.playlist,
            roles=[ADMINISTRATOR],
        )

        response = self.client.get(
            f"/api/playlists/{video.playlist.id}/is-claimed/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"is_claimed": False})

    def test_playlist_is_claimed_LTI_instructor(self):
        """LTI instructors can check if a playlist is claimed."""
        video = factories.VideoFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video.playlist,
            roles=[INSTRUCTOR],
        )

        response = self.client.get(
            f"/api/playlists/{video.playlist.id}/is-claimed/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"is_claimed": False})

    def test_playlist_is_claimed_LTI_instructor_claimed(self):
        """LTI instructors can check if a playlist is claimed."""
        video = factories.VideoFactory(upload_state="pending")
        consumer_site = factories.ConsumerSiteFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video.playlist,
            roles=[INSTRUCTOR],
            consumer_site=str(consumer_site.id),
        )
        lti_user_association = factories.LtiUserAssociationFactory(
            consumer_site=consumer_site,
            lti_user_id=clean_lti_user_id(jwt_token.get("user").get("id")),
        )
        factories.PlaylistAccessFactory(
            playlist=video.playlist, user_id=lti_user_association.user.id
        )

        response = self.client.get(
            f"/api/playlists/{video.playlist.id}/is-claimed/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"is_claimed": True})
