"""Tests for the upload & processing state update API of the Marsha project."""
from datetime import datetime
import json

from django.test import TestCase, override_settings

import pytz

from ..factories import SubtitleTrackFactory, VideoFactory


# We don't enforce arguments documentation in tests
# pylint: disable=missing-param-doc,missing-type-doc,unused-argument


class UpdateStateAPITest(TestCase):
    """Test the API that allows to update video & subtitle track objects' state."""

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_update_state_video(self):
        """Confirming the successful upload of a video using the sole existing secret."""
        video = VideoFactory(
            id="f87b5f26-da60-49f2-9d71-a816e68a207f",
            resource_id="831b1188-98f6-42a1-95e8-a7a76d259cdb",
        )
        data = {
            "key": "{!s}/video/{!s}/1533686400".format(video.resource_id, video.id),
            "state": "ready",
            "signature": "f0e4e0db808d413e3df727e293e55001208264a6d4a7f246d0b06bde7baa94ec",
        }

        response = self.client.post("/api/update-state", data)
        video.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(video.uploaded_on, datetime(2018, 8, 8, tzinfo=pytz.utc))
        self.assertEqual(video.state, "ready")

    @override_settings(
        UPDATE_STATE_SHARED_SECRETS=["previous secret", "current secret"]
    )
    def test_api_update_state_video_multiple_secrets(self):
        """Confirming the successful upload of a video using the any of the existing secrets."""
        video = VideoFactory(
            id="c804e019-c622-4b76-aa43-33f2317bdc7e",
            resource_id="761029ca-bc45-4f7f-b9ca-d5ea8e22b3ea",
        )
        data = {
            "key": "{!s}/video/{!s}/1533686400".format(video.resource_id, video.id),
            "state": "error",
            # Signature generated using "current secret"
            "signature": "39fe862afcaa1388a31277e3ace2d4aac84440b60f7426bb2c6d4e34046417a8",
        }

        response = self.client.post("/api/update-state", data)
        video.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(video.uploaded_on, datetime(2018, 8, 8, tzinfo=pytz.utc))
        self.assertEqual(video.state, "error")

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_update_state_subtitle_track(self):
        """Confirming the successful upload of a subtitle track."""
        subtitle_track = SubtitleTrackFactory(
            id="673d4400-acab-454b-99eb-f7ef422af2cb",
            video__resource_id="a1a2224b-f7b0-48c2-b6f2-57fd7f863638",
        )
        data = {
            "key": "{!s}/subtitletrack/{!s}/1533686400_fr_cc".format(
                subtitle_track.video.resource_id, subtitle_track.id
            ),
            "state": "ready",
            "signature": "afe34c3bd624d8064e8d4b92ac8eba3b690988c4b27e316320851ada8f8304fd",
        }

        response = self.client.post("/api/update-state", data)
        subtitle_track.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(
            subtitle_track.uploaded_on, datetime(2018, 8, 8, tzinfo=pytz.utc)
        )
        self.assertEqual(subtitle_track.state, "ready")

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_update_state_unknown_video(self):
        """Trying to update the state of a video that does not exist should return a 404."""
        data = {
            "key": "{!s}/video/{!s}/1533686400".format(
                "9f14ad28-dd35-49b1-a723-84d57884e4cb",
                "1ed1b113-2b87-42af-863a-11232f7bf88f",
            ),
            "state": "ready",
            "signature": "a4288e9bf1596841e943a4050e9f67e79632ebdcfabbee951d4a1bad680f5a70",
        }

        response = self.client.post("/api/update-state", data)

        self.assertEqual(response.status_code, 404)
        self.assertEqual(json.loads(response.content), {"success": False})

    def test_api_update_state_invalid_data(self):
        """Trying to update the state of an upload with invalid data should return a 400."""
        video = VideoFactory()
        data = {
            "key": "{!s}/video/{!s}/1533686400".format(video.resource_id, video.id),
            "state": "reedo",
            "signature": "123abc",
        }

        response = self.client.post("/api/update-state", data)
        video.refresh_from_db()

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content), {"state": ['"reedo" is not a valid choice.']}
        )
        self.assertIsNone(video.uploaded_on)
        self.assertEqual(video.state, "pending")

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_update_state_invalid_signature(self):
        """Trying to update the state of an upload with an unexpected signature."""
        video = VideoFactory(
            id="4b8cb66c-4de4-4112-8be4-470db992a19e",
            resource_id="8a94d39a-4730-4473-950c-1a3f21b35d0b",
        )
        data = {
            "key": "{!s}/video/{!s}/1533686400".format(video.resource_id, video.id),
            "state": "ready",
            # Expected signature: 5eda713bca2c51c25d2771da725e481317cfd54c53c7fbd90049a000dacab627
            "signature": "invalid signature",
        }

        response = self.client.post("/api/update-state", data)
        video.refresh_from_db()

        self.assertEqual(response.status_code, 403)
        self.assertIsNone(video.uploaded_on)
        self.assertEqual(video.state, "pending")
