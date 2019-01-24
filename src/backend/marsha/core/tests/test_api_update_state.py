"""Tests for the upload & processing state update API of the Marsha project."""
from datetime import datetime
import json

from django.test import TestCase, override_settings

import pytz

from ..factories import TimedTextTrackFactory, VideoFactory


# We don't enforce arguments documentation in tests
# pylint: disable=missing-param-doc,missing-type-doc,unused-argument


class UpdateStateAPITest(TestCase):
    """Test the API that allows to update video & timed text track objects' state."""

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_update_state_video(self):
        """Confirming the successful upload of a video using the sole existing secret."""
        video = VideoFactory(id="f87b5f26-da60-49f2-9d71-a816e68a207f")
        data = {
            "key": "{video!s}/video/{video!s}/1533686400".format(video=video.pk),
            "state": "ready",
            "signature": "a5b2027808061d1ed558be62bc8626c7af0aa516b0fd7852595d61e810a0b118",
        }
        response = self.client.post("/api/update-state", data)
        video.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(video.uploaded_on, datetime(2018, 8, 8, tzinfo=pytz.utc))
        self.assertEqual(video.upload_state, "ready")

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_update_state_video_processing(self):
        """Setting a video's `upload_state` to processing should not affect its `uploaded_on`."""
        video = VideoFactory(id="9eeef843-bc43-4e01-825d-658aa5bca49f")
        data = {
            "key": "{video!s}/video/{video!s}/1533686400".format(video=video.pk),
            "state": "processing",
            "signature": "581add41c12fb39d6144d90e9051b6d600df074effcb0fa33e15b97152d2aaba",
        }
        response = self.client.post("/api/update-state", data)
        video.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(video.uploaded_on, None)
        self.assertEqual(video.upload_state, "processing")

    @override_settings(
        UPDATE_STATE_SHARED_SECRETS=["previous secret", "current secret"]
    )
    def test_api_update_state_video_multiple_secrets(self):
        """Confirming the failed upload of a video using the any of the existing secrets."""
        video = VideoFactory(id="c804e019-c622-4b76-aa43-33f2317bdc7e")
        data = {
            "key": "{video!s}/video/{video!s}/1533686400".format(video=video.pk),
            "state": "error",
            # Signature generated using "current secret"
            "signature": "8ade282229856ef892e757b51e5644916812053682c8e7354cd6b90e81af8ada",
        }

        response = self.client.post("/api/update-state", data)
        video.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(video.uploaded_on, None)
        self.assertEqual(video.upload_state, "error")

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_update_state_timed_text_track(self):
        """Confirming the successful upload of a timed text track."""
        timed_text_track = TimedTextTrackFactory(
            id="673d4400-acab-454b-99eb-f7ef422af2cb",
            video__pk="a1a2224b-f7b0-48c2-b6f2-57fd7f863638",
        )
        data = {
            "key": "{!s}/timedtexttrack/{!s}/1533686400_fr_cc".format(
                timed_text_track.video.pk, timed_text_track.id
            ),
            "state": "ready",
            "signature": "7d3701b28d3bc7bcec1c846e1c932b9e79b4aff053ea9168898e2504e53ca03d",
        }

        response = self.client.post("/api/update-state", data)
        timed_text_track.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(
            timed_text_track.uploaded_on, datetime(2018, 8, 8, tzinfo=pytz.utc)
        )
        self.assertEqual(timed_text_track.upload_state, "ready")

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
            "key": "{video!s}/video/{video!s}/1533686400".format(video=video.pk),
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
        self.assertEqual(video.upload_state, "pending")

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_update_state_invalid_signature(self):
        """Trying to update the state of an upload with an unexpected signature."""
        video = VideoFactory(id="4b8cb66c-4de4-4112-8be4-470db992a19e")
        data = {
            "key": "{video!s}/video/{video!s}/1533686400".format(video=video.pk),
            "state": "ready",
            # Expected signature: cecaea9d8aed12e927f5c6861b0132375b96ff4e907fdc12e5f6629b719300e4
            "signature": "invalid signature",
        }

        response = self.client.post("/api/update-state", data)
        video.refresh_from_db()

        self.assertEqual(response.status_code, 403)
        self.assertIsNone(video.uploaded_on)
        self.assertEqual(video.upload_state, "pending")
