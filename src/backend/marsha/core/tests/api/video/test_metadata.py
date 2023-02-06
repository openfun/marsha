"""Tests for the Video metadata API of the Marsha project."""
import json

from django.test import TestCase, override_settings

from marsha.core.factories import VideoFactory
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
)


class VideoMetadataAPITest(TestCase):
    """Test the metadata API of the video object."""

    maxDiff = None

    @override_settings(LIVE_SEGMENT_DURATION_SECONDS=4)
    def test_api_video_options_as_student(self):
        """A student can fetch the video options endpoint"""

        video = VideoFactory()
        jwt_token = StudentLtiTokenFactory(resource=video)
        response = self.client.options(
            "/api/videos/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        content = json.loads(response.content)
        self.assertEqual(
            content["actions"]["POST"]["license"]["choices"],
            [
                {"value": "CC_BY", "display_name": "Creative Common By Attribution"},
                {
                    "value": "CC_BY-SA",
                    "display_name": "Creative Common By Attribution Share Alike",
                },
                {
                    "value": "CC_BY-NC",
                    "display_name": "Creative Common By Attribution Non Commercial",
                },
                {
                    "value": "CC_BY-NC-SA",
                    "display_name": "Creative Common By Attribution Non Commercial Share Alike",
                },
                {
                    "value": "CC_BY-ND",
                    "display_name": "Creative Common By Attribution No Derivates",
                },
                {
                    "value": "CC_BY-NC-ND",
                    "display_name": "Creative Common By Attribution Non Commercial No Derivates",
                },
                {"value": "CC0", "display_name": "Public Domain Dedication "},
                {"value": "NO_CC", "display_name": "All rights reserved"},
            ],
        )
        self.assertEqual(content["live"]["segment_duration_seconds"], 4)

    @override_settings(LIVE_SEGMENT_DURATION_SECONDS=4)
    def test_api_video_options_as_instructor(self):
        """An instructor can fetch the video options endpoint"""

        video = VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            permissions__can_update=False,
        )

        response = self.client.options(
            "/api/videos/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        content = json.loads(response.content)
        self.assertEqual(
            content["actions"]["POST"]["license"]["choices"],
            [
                {"value": "CC_BY", "display_name": "Creative Common By Attribution"},
                {
                    "value": "CC_BY-SA",
                    "display_name": "Creative Common By Attribution Share Alike",
                },
                {
                    "value": "CC_BY-NC",
                    "display_name": "Creative Common By Attribution Non Commercial",
                },
                {
                    "value": "CC_BY-NC-SA",
                    "display_name": "Creative Common By Attribution Non Commercial Share Alike",
                },
                {
                    "value": "CC_BY-ND",
                    "display_name": "Creative Common By Attribution No Derivates",
                },
                {
                    "value": "CC_BY-NC-ND",
                    "display_name": "Creative Common By Attribution Non Commercial No Derivates",
                },
                {"value": "CC0", "display_name": "Public Domain Dedication "},
                {"value": "NO_CC", "display_name": "All rights reserved"},
            ],
        )
        self.assertEqual(content["live"]["segment_duration_seconds"], 4)

    def test_api_video_options_anonymous(self):
        """Anonymous user can't fetch the video options endpoint"""

        response = self.client.options("/api/videos/")

        self.assertEqual(response.status_code, 401)
