"""Tests for the TimedTextTrack options API of the Marsha project."""
import json
import random

from django.test import TestCase, override_settings

from marsha.core.factories import TimedTextTrackFactory
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
)


class TimedTextTrackOptionsAPITest(TestCase):
    """Test the options API of the timed text track object."""

    maxDiff = None

    @override_settings(ALL_LANGUAGES=(("af", "Afrikaans"), ("ast", "Asturian")))
    def test_api_timed_text_track_options_as_instructor(self):
        """The details of choices fields should be available via http options for an instructor."""
        timed_text_track = TimedTextTrackFactory(language="af")
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=timed_text_track.video,
            permissions__can_update=False,
        )

        response = self.client.options(
            "/api/timedtexttracks/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        content = json.loads(response.content)
        self.assertEqual(
            content["actions"]["POST"]["mode"]["choices"],
            [
                {"value": "st", "display_name": "Subtitle"},
                {"value": "ts", "display_name": "Transcript"},
                {"value": "cc", "display_name": "Closed captioning"},
            ],
        )
        self.assertEqual(
            content["actions"]["POST"]["language"]["choices"],
            [
                {"value": "af", "display_name": "Afrikaans"},
                {"value": "ast", "display_name": "Asturian"},
            ],
        )

    @override_settings(ALL_LANGUAGES=(("af", "Afrikaans"), ("ast", "Asturian")))
    def test_api_timed_text_track_options_as_student(self):
        """The details of choices fields should be available via http options for a student."""
        timed_text_track = TimedTextTrackFactory(language="af")
        jwt_token = StudentLtiTokenFactory(resource=timed_text_track.video)

        response = self.client.options(
            "/api/timedtexttracks/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        content = json.loads(response.content)
        self.assertEqual(
            content["actions"]["POST"]["mode"]["choices"],
            [
                {"value": "st", "display_name": "Subtitle"},
                {"value": "ts", "display_name": "Transcript"},
                {"value": "cc", "display_name": "Closed captioning"},
            ],
        )
        self.assertEqual(
            content["actions"]["POST"]["language"]["choices"],
            [
                {"value": "af", "display_name": "Afrikaans"},
                {"value": "ast", "display_name": "Asturian"},
            ],
        )

    @override_settings(ALL_LANGUAGES=(("af", "Afrikaans"), ("ast", "Asturian")))
    def test_api_timed_text_track_options_as_administrator(self):
        """The details of choices fields should be available via http options for an admin."""
        timed_text_track = TimedTextTrackFactory(language="af")
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=timed_text_track.video,
            permissions__can_update=False,
            roles=["administrator"],
        )

        response = self.client.options(
            "/api/timedtexttracks/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        content = json.loads(response.content)
        self.assertEqual(
            content["actions"]["POST"]["mode"]["choices"],
            [
                {"value": "st", "display_name": "Subtitle"},
                {"value": "ts", "display_name": "Transcript"},
                {"value": "cc", "display_name": "Closed captioning"},
            ],
        )
        self.assertEqual(
            content["actions"]["POST"]["language"]["choices"],
            [
                {"value": "af", "display_name": "Afrikaans"},
                {"value": "ast", "display_name": "Asturian"},
            ],
        )

    def test_api_timed_text_track_options_anonymous(self):
        """The details of choices fields should be available via http options for a student."""
        response = self.client.options("/api/timedtexttracks/")
        self.assertEqual(response.status_code, 401)

    @override_settings(SUBTITLE_SOURCE_MAX_SIZE=10)
    def test_api_timed_text_track_options_authentified(self):
        """An autheticated user can fetch the timed_text_track options endpoint"""
        timed_text_track = TimedTextTrackFactory(
            id="5c019027-1e1f-4d8c-9f83-c5e20edaad2b",
            video__pk="b8d40ed7-95b8-4848-98c9-50728dfee25d",
            language="fr",
            upload_state=random.choice(["ready", "error"]),
            mode="cc",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=timed_text_track.video)

        response = self.client.options(
            "/api/timedtexttracks/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["upload_max_size_bytes"], 10)
