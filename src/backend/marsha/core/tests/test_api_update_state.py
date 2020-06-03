"""Tests for the upload & processing state update API of the Marsha project."""
from datetime import datetime
import json

from django.test import TestCase, override_settings

import pytz

from ..factories import DocumentFactory, TimedTextTrackFactory, VideoFactory


class UpdateStateAPITest(TestCase):
    """Test the API that allows to update video & timed text track objects' state."""

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_update_state_video(self):
        """Confirming the successful upload of a video using the sole existing secret."""
        video = VideoFactory(id="f87b5f26-da60-49f2-9d71-a816e68a207f")
        data = {
            "extraParameters": {"resolutions": [144, 240, 480]},
            "key": "{video!s}/video/{video!s}/1533686400".format(video=video.pk),
            "state": "ready",
        }
        response = self.client.post(
            "/api/update-state",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=(
                "4336d782e449fe7eae0b21bb621ef7da66fa1043ea1b1ea373d91f6c37a64606"
            ),
        )
        video.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(video.uploaded_on, datetime(2018, 8, 8, tzinfo=pytz.utc))
        self.assertEqual(video.upload_state, "ready")
        self.assertEqual(video.resolutions, [144, 240, 480])

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_update_state_video_processing(self):
        """Setting a video's `upload_state` to processing should not affect its `uploaded_on`."""
        video = VideoFactory(id="9eeef843-bc43-4e01-825d-658aa5bca49f")
        data = {
            "extraParameters": {},
            "key": "{video!s}/video/{video!s}/1533686400".format(video=video.pk),
            "state": "processing",
        }
        response = self.client.post(
            "/api/update-state",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=(
                "97ae90866e2699a0a6e4fcfd9f24bcc7aa0af39bfb95ca0d2a6fbf24e5dee108"
            ),
        )
        video.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(video.uploaded_on, None)
        self.assertEqual(video.upload_state, "processing")
        self.assertEqual(video.resolutions, None)

    @override_settings(
        UPDATE_STATE_SHARED_SECRETS=["previous secret", "current secret"]
    )
    def test_api_update_state_video_multiple_secrets(self):
        """Confirming the failed upload of a video using the any of the existing secrets."""
        video = VideoFactory(id="c804e019-c622-4b76-aa43-33f2317bdc7e")
        data = {
            "extraParameters": {},
            "key": "{video!s}/video/{video!s}/1533686400".format(video=video.pk),
            "state": "error",
        }

        response = self.client.post(
            "/api/update-state",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=(
                "b472ad5a2e7fb8246d8d5dd20e7bd92bf1b3e1f288f7071d3e09ada1892cbcca"
            ),
        )
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
            "extraParameters": {},
            "key": "{!s}/timedtexttrack/{!s}/1533686400_fr_cc".format(
                timed_text_track.video.pk, timed_text_track.id
            ),
            "state": "ready",
        }

        response = self.client.post(
            "/api/update-state",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=(
                "696e101c154911186763ec3d71f60bb16bcf4d444e810f8a5cdee2afcd997517"
            ),
        )
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
            "extraParameters": {},
            "key": "{!s}/video/{!s}/1533686400".format(
                "9f14ad28-dd35-49b1-a723-84d57884e4cb",
                "1ed1b113-2b87-42af-863a-11232f7bf88f",
            ),
            "state": "ready",
        }

        response = self.client.post(
            "/api/update-state",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=(
                "4fa1bd84afcc81fe35b6dbb6af7872deae7d025501adc8a3070fcbc1f803a7ea"
            ),
        )

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
            "extraParameters": {},
            "key": "{video!s}/video/{video!s}/1533686400".format(video=video.pk),
            "state": "ready",
        }

        response = self.client.post(
            "/api/update-state",
            data,
            content_type="application/json",
            # Expected signature: 51c2f6b3dbfaf7f1e675550e4c5bae3e729201c51544760d41e7d5c05fec6372
            HTTP_X_MARSHA_SIGNATURE="invalid signature",
        )
        video.refresh_from_db()

        self.assertEqual(response.status_code, 403)
        self.assertIsNone(video.uploaded_on)
        self.assertEqual(video.upload_state, "pending")

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_update_state_document_extension(self):
        """Try to update the document extension property."""
        document = DocumentFactory(
            id="663be0f9-38b0-4fd9-a5bb-f123d9b09ac6", extension="doc"
        )

        data = {
            "extraParameters": {},
            "key": "{doc!s}/document/{doc!s}/1533686400.pdf".format(doc=document.pk),
            "state": "ready",
        }

        response = self.client.post(
            "/api/update-state",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=(
                "dc2a02957f6859e89836dc6e0a0308f48d3c4a1e04d91723621b358ee8608cb9"
            ),
        )

        document.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(document.upload_state, "ready")
        self.assertEqual(document.extension, "pdf")
        self.assertEqual(document.uploaded_on, datetime(2018, 8, 8, tzinfo=pytz.utc))

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_update_state_document_without_extension(self):
        """Without extension the `extension` field should have None value."""
        document = DocumentFactory(
            id="663be0f9-38b0-4fd9-a5bb-f123d9b09ac6", extension="doc"
        )

        data = {
            "extraParameters": {},
            "key": "{doc!s}/document/{doc!s}/1533686400".format(doc=document.pk),
            "state": "ready",
        }

        response = self.client.post(
            "/api/update-state",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=(
                "70d2382a1adce903845d02b97a1f0bf7c772d68e1268d7e711137d2d7bea362e"
            ),
        )

        document.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(document.upload_state, "ready")
        self.assertEqual(document.extension, None)
        self.assertEqual(document.uploaded_on, datetime(2018, 8, 8, tzinfo=pytz.utc))
