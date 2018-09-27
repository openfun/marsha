"""Tests for the upload confirmation API of the Marsha project."""
from datetime import datetime
import json
from uuid import uuid4

from django.test import TestCase

import pytz

from ..factories import SubtitleTrackFactory, VideoFactory


# We don't enforce arguments documentation in tests
# pylint: disable=missing-param-doc,missing-type-doc,unused-argument


class UploadConfirmAPITest(TestCase):
    """Test the API that allows to confirm uploads of video and subtitle track objects."""

    def test_api_upload_confirm_video(self):
        """Confirming the successful upload of a video."""
        video = VideoFactory()
        data = {
            "key": "{!s}/video/{!s}/1533686400".format(video.resource_id, video.id),
            "state": "ready",
            "signature": "123abc",
        }

        response = self.client.post("/api/upload-confirm", data)
        video.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(video.uploaded_on, datetime(2018, 8, 8, tzinfo=pytz.utc))
        self.assertEqual(video.state, "ready")

    def test_api_upload_confirm_subtitle_track(self):
        """Confirming the successful upload of a subtitle track."""
        subtitle_track = SubtitleTrackFactory()
        data = {
            "key": "{!s}/subtitletrack/{!s}/1533686400_fr_cc".format(
                subtitle_track.video.resource_id, subtitle_track.id
            ),
            "state": "ready",
            "signature": "123abc",
        }

        response = self.client.post("/api/upload-confirm", data)
        subtitle_track.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(
            subtitle_track.uploaded_on, datetime(2018, 8, 8, tzinfo=pytz.utc)
        )
        self.assertEqual(subtitle_track.state, "ready")

    def test_api_upload_confirm_unknown_video(self):
        """Trying to confirm a video that does not exist should return a 404."""
        data = {
            "key": "{!s}/video/{!s}/1533686400".format(uuid4(), uuid4()),
            "state": "ready",
            "signature": "123abc",
        }

        response = self.client.post("/api/upload-confirm", data)

        self.assertEqual(response.status_code, 404)
        self.assertEqual(json.loads(response.content), {"success": False})

    def test_api_upload_confirm_invalid_data(self):
        """Trying to confirm an upload with invalid data (invalid state) should return a 400."""
        video = VideoFactory()
        data = {
            "key": "{!s}/video/{!s}/1533686400".format(video.resource_id, video.id),
            "state": "reedo",
            "signature": "123abc",
        }

        response = self.client.post("/api/upload-confirm", data)
        video.refresh_from_db()

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content), {"state": ['"reedo" is not a valid choice.']}
        )
        self.assertIsNone(video.uploaded_on)
        self.assertEqual(video.state, "pending")
