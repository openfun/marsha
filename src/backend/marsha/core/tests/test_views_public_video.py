"""Test the public video view."""
from html import unescape
import json
import random
import re
import uuid

from django.test import TestCase

from rest_framework_simplejwt.tokens import AccessToken

from ..defaults import HARVESTED, STATE_CHOICES
from ..factories import VideoFactory


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument,too-many-lines


class VideoPublicViewTestCase(TestCase):
    """Test the public video view in the ``core`` app of the Marsha project."""

    maxDiff = None

    def test_video_publicly_accessible(self):
        """Validate to access to a public video."""
        video = VideoFactory(
            id="301b5f4f-b9f1-4a5f-897d-f8f1bf22c397",
            playlist__title="playlist-003",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            is_public=True,
            resolutions=[144, 240, 480, 720, 1080],
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] != HARVESTED]
            ),
            uploaded_on="2019-09-24 07:24:40+00",
        )

        response = self.client.get(f"/videos/{video.pk}")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = AccessToken(context.get("jwt"))

        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": False, "can_update": False},
        )

        self.assertEqual(
            context.get("resource"),
            {
                "active_stamp": "1569309880",
                "is_ready_to_show": True,
                "show_download": True,
                "description": video.description,
                "id": str(video.id),
                "upload_state": video.upload_state,
                "timed_text_tracks": [],
                "thumbnail": None,
                "title": video.title,
                "urls": {
                    "mp4": {
                        "144": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c397/"
                        "mp4/1569309880_144.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-003_1569309880.mp4",
                        "240": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c397/"
                        "mp4/1569309880_240.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-003_1569309880.mp4",
                        "480": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c397/"
                        "mp4/1569309880_480.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-003_1569309880.mp4",
                        "720": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c397/"
                        "mp4/1569309880_720.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-003_1569309880.mp4",
                        "1080": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c397/"
                        "mp4/1569309880_1080.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-003_1569309880.mp4",
                    },
                    "thumbnails": {
                        "144": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c397/"
                        "thumbnails/1569309880_144.0000000.jpg",
                        "240": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c397/"
                        "thumbnails/1569309880_240.0000000.jpg",
                        "480": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c397/"
                        "thumbnails/1569309880_480.0000000.jpg",
                        "720": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c397/"
                        "thumbnails/1569309880_720.0000000.jpg",
                        "1080": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c397/"
                        "thumbnails/1569309880_1080.0000000.jpg",
                    },
                    "manifests": {
                        "hls": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c397/"
                        "cmaf/1569309880.m3u8",
                    },
                    "previews": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c397/"
                    "previews/1569309880_100.jpg",
                },
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "playlist": {
                    "title": "playlist-003",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "live_state": None,
                "live_info": {},
                "xmpp": None,
            },
        )
        self.assertEqual(context.get("state"), "success")
        self.assertEqual(context.get("modelName"), "videos")

    def test_video_not_publicly_accessible(self):
        """Validate it is impossible to access to a non public video."""
        video = VideoFactory(
            id="301b5f4f-b9f1-4a5f-897d-f8f1bf22c396",
            playlist__title="playlist-003",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            is_public=False,
            resolutions=[144, 240, 480, 720, 1080],
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
            uploaded_on="2019-09-24 07:24:40+00",
        )

        response = self.client.get(f"/videos/{video.pk}")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))

        self.assertIsNone(context.get("resource"))
        self.assertEqual(context.get("state"), "error")
        self.assertEqual(context.get("modelName"), "videos")

    def test_video_not_existing(self):
        """Accessing a non existing video should return an error state."""
        response = self.client.get(f"/videos/{uuid.uuid4()}")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))

        self.assertIsNone(context.get("resource"))
        self.assertEqual(context.get("state"), "error")
        self.assertEqual(context.get("modelName"), "videos")
