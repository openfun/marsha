"""Test endpoint to retrieve a video's transcript."""
from datetime import datetime, timezone

from django.test import TestCase, override_settings

import jwt
import responses

from marsha.core.defaults import JITSI, PROCESSING, RAW, READY, RUNNING
from marsha.core.factories import (
    OrganizationAccessFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
    UserFactory,
    VideoFactory,
)
from marsha.core.models.account import ADMINISTRATOR, STUDENT
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)


class VideoTranscriptTest(TestCase):
    """Test the API endpoint to retrieve a video's transcript."""

    def test_transcript_anonymous(self):
        """Anonymous users cannot retrieve a video's transcript."""
        video = VideoFactory()
        response = self.client.get(f"/api/videos/{video.id}/transcript/")
        self.assertEqual(response.status_code, 401)

    def test_transcript_student(self):
        """Student users cannot retrieve a video's transcript."""
        video = VideoFactory(live_state=RUNNING, live_type=JITSI)
        jwt_token = StudentLtiTokenFactory(playlist=video.playlist)

        response = self.client.get(
            f"/api/videos/{video.id}/transcript/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    @responses.activate
    def test_transcript_instructor(self):
        """Instructor users can retrieve a video's transcript."""
        resolutions = [144, 240, 480, 720, 1080]
        video = VideoFactory(
            uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc),
            upload_state=READY,
            resolutions=resolutions,
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        responses.post(
            "https://api.gladia.io/audio/text/video-transcription/",
            json={
                "is_webhook_reachable": True,
                "request_id": "G-5060cfe3",
                "webhook_url": "http://testserver/api/videos/183909c1-75c4-42fc-98b0-7928eb7287e7/timedtexttracks/95886992-0a7d-4589-b0ab-90b7f6b44be2/transcript-callback/",
            },
        )

        response = self.client.get(
            f"/api/videos/{video.id}/transcript/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(video.timedtexttracks.first().upload_state, PROCESSING)
