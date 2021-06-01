"""Tests for the upload & processing state update API of the Marsha project."""
from datetime import datetime
import json
import random

from django.test import TestCase, override_settings

import pytz

from ..defaults import HARVESTED, PENDING, RAW, STOPPED
from ..factories import (
    DocumentFactory,
    ThumbnailFactory,
    TimedTextTrackFactory,
    VideoFactory,
)
from ..utils.api_utils import generate_hash


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
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        response = self.client.post(
            "/api/update-state",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=signature,
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
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        response = self.client.post(
            "/api/update-state",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=signature,
        )
        video.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(video.uploaded_on, None)
        self.assertEqual(video.upload_state, "processing")
        self.assertEqual(video.resolutions, None)

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_update_state_video_harvested(self):
        """Video `upload_state` to `harvested` should reset live state and live info."""
        video = VideoFactory(
            id="1c5a998a-5bb9-41ea-836e-22be0cdeb834",
            upload_state=PENDING,
            live_state=STOPPED,
            live_info={
                "medialive": {
                    "input": {
                        "id": "medialive_input_1",
                        "endpoints": [
                            "https://live_endpoint1",
                            "https://live_endpoint2",
                        ],
                    },
                    "channel": {"id": "medialive_channel_1"},
                },
                "mediapackage": {
                    "id": "mediapackage_channel_1",
                    "endpoints": {
                        "hls": {
                            "id": "endpoint1",
                            "url": "https://channel_endpoint1/live.m3u8",
                        },
                    },
                },
            },
            live_type=RAW,
        )
        data = {
            "extraParameters": {"resolutions": [240, 480, 720]},
            "key": "{video!s}/video/{video!s}/1533686400".format(video=video.pk),
            "state": "harvested",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        response = self.client.post(
            "/api/update-state",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=signature,
        )
        video.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(video.uploaded_on, datetime(2018, 8, 8, tzinfo=pytz.utc))
        self.assertEqual(video.upload_state, HARVESTED)
        self.assertEqual(video.resolutions, [240, 480, 720])
        self.assertIsNone(video.live_state)
        self.assertIsNone(video.live_info)

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
        signature = generate_hash(
            random.choice(["previous secret", "current secret"]),
            json.dumps(data).encode("utf-8"),
        )
        response = self.client.post(
            "/api/update-state",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=signature,
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
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        response = self.client.post(
            "/api/update-state",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=signature,
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
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        response = self.client.post(
            "/api/update-state",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=signature,
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
        signature = generate_hash("invalid secret", json.dumps(data).encode("utf-8"))
        response = self.client.post(
            "/api/update-state",
            data,
            content_type="application/json",
            # Expected signature: 51c2f6b3dbfaf7f1e675550e4c5bae3e729201c51544760d41e7d5c05fec6372
            HTTP_X_MARSHA_SIGNATURE=signature,
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
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        response = self.client.post(
            "/api/update-state",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=signature,
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
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        response = self.client.post(
            "/api/update-state",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=signature,
        )

        document.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(document.upload_state, "ready")
        self.assertEqual(document.extension, None)
        self.assertEqual(document.uploaded_on, datetime(2018, 8, 8, tzinfo=pytz.utc))

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_update_state_thumbnail(self):
        """Confirming the successful upload of a thumbnail."""
        thumbnail = ThumbnailFactory(
            id="d60d7971-5929-4f10-8e9c-06c5d15818ce",
            video__pk="a1a2224b-f7b0-48c2-b6f2-57fd7f863638",
        )

        data = {
            "extraParameters": {},
            "key": f"{thumbnail.video.pk}/thumbnail/{thumbnail.pk}/1533686400",
            "state": "ready",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        response = self.client.post(
            "/api/update-state",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=signature,
        )

        thumbnail.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(thumbnail.upload_state, "ready")
        self.assertEqual(thumbnail.uploaded_on, datetime(2018, 8, 8, tzinfo=pytz.utc))
