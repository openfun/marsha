"""Tests for the TimedTextTrack options API of the Marsha project."""
import random

from django.test import TestCase, override_settings

from marsha.core.factories import TimedTextTrackFactory, UserFactory
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)


@override_settings(
    ALL_LANGUAGES=(("af", "Afrikaans"), ("ast", "Asturian")),
    SUBTITLE_SOURCE_MAX_SIZE=10,
)
class TimedTextTrackOptionsAPITest(TestCase):
    """Test the options API of the timed text track object."""

    maxDiff = None

    def _options_url(self, video):
        """Return the url to use to create a live session."""
        return f"/api/videos/{video.id}/timedtexttracks/"

    def assert_jwt_can_query_options(self, jwt_token, track):
        """Assert the JWT can query the thumbnail options' endpoint."""

        response = self.client.options(
            self._options_url(track.video), HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )

        self.assertEqual(response.status_code, 200)

        response_data = response.json()

        self.assertEqual(response_data["upload_max_size_bytes"], 10)
        self.assertEqual(
            response_data["actions"]["POST"]["mode"]["choices"],
            [
                {"value": "st", "display_name": "Subtitle"},
                {"value": "ts", "display_name": "Transcript"},
                {"value": "cc", "display_name": "Closed captioning"},
            ],
        )
        self.assertEqual(
            response_data["actions"]["POST"]["language"]["choices"],
            [
                {"value": "af", "display_name": "Afrikaans"},
                {"value": "ast", "display_name": "Asturian"},
            ],
        )

    def test_options_query_by_random_user(self):
        """
        Authenticated user without access
        can query the thumbnail options' endpoint.
        """
        timed_text_track = TimedTextTrackFactory(language="af")
        user = UserFactory()
        jwt_token = UserAccessTokenFactory(user=user)
        self.assert_jwt_can_query_options(jwt_token, timed_text_track)

    def test_api_timed_text_track_options_as_instructor(self):
        """The details of choices fields should be available via http options for an instructor."""
        timed_text_track = TimedTextTrackFactory(language="af")
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=timed_text_track.video.playlist,
            permissions__can_update=False,
        )

        self.assert_jwt_can_query_options(jwt_token, timed_text_track)

    def test_api_timed_text_track_options_as_student(self):
        """The details of choices fields should be available via http options for a student."""
        timed_text_track = TimedTextTrackFactory(language="af")
        jwt_token = StudentLtiTokenFactory(resource=timed_text_track.video.playlist)

        self.assert_jwt_can_query_options(jwt_token, timed_text_track)

    def test_api_timed_text_track_options_as_administrator(self):
        """The details of choices fields should be available via http options for an admin."""
        timed_text_track = TimedTextTrackFactory(language="af")
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=timed_text_track.video.playlist,
            permissions__can_update=False,
            roles=["administrator"],
        )

        self.assert_jwt_can_query_options(jwt_token, timed_text_track)

    def test_api_timed_text_track_options_anonymous(self):
        """The details of choices fields should be available via http options for a student."""
        timed_text_track = TimedTextTrackFactory(language="af")
        response = self.client.options(self._options_url(timed_text_track))
        self.assertEqual(response.status_code, 401)

    def test_api_timed_text_track_options_authenticated(self):
        """An authenticated user can fetch the timed_text_track options endpoint"""
        timed_text_track = TimedTextTrackFactory(
            id="5c019027-1e1f-4d8c-9f83-c5e20edaad2b",
            video__pk="b8d40ed7-95b8-4848-98c9-50728dfee25d",
            language="ast",
            upload_state=random.choice(["ready", "error"]),
            mode="cc",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=timed_text_track.video.playlist
        )

        self.assert_jwt_can_query_options(jwt_token, timed_text_track)
