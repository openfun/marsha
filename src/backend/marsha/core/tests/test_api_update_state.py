"""Tests for the upload & processing state update API of the Marsha project."""

from datetime import datetime, timezone
import json
import random
from unittest import mock

from django.test import TestCase, override_settings

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from marsha.bbb.factories import ClassroomDocumentFactory
from marsha.core.defaults import COPYING, ERROR, INFECTED, READY, SCANNING
from marsha.core.factories import (
    DocumentFactory,
    SharedLiveMediaFactory,
    ThumbnailFactory,
    TimedTextTrackFactory,
    VideoFactory,
)
from marsha.core.utils.api_utils import generate_hash
from marsha.deposit.factories import DepositedFileFactory
from marsha.websocket.defaults import VIDEO_ADMIN_ROOM_NAME, VIDEO_ROOM_NAME
from marsha.websocket.utils import channel_layers_utils


class UpdateStateAPITest(TestCase):
    """Test the API that allows to update video & timed text track objects' state."""

    def tearDown(self):
        super().tearDown()
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.flush)()

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_update_state_video(self):
        """Confirming the successful upload of a video using the sole existing secret."""
        video = VideoFactory(id="f87b5f26-da60-49f2-9d71-a816e68a207f")
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_add)(
            VIDEO_ROOM_NAME.format(video_id=str(video.id)), "test_channel"
        )
        async_to_sync(channel_layer.group_add)(
            VIDEO_ADMIN_ROOM_NAME.format(video_id=str(video.id)), "test_channel_admin"
        )
        data = {
            "extraParameters": {"resolutions": [144, 240, 480]},
            "key": f"{video.pk}/video/{video.pk}/1533686400",
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
        self.assertEqual(video.uploaded_on, datetime(2018, 8, 8, tzinfo=timezone.utc))
        self.assertEqual(video.upload_state, "ready")
        self.assertEqual(video.resolutions, [144, 240, 480])
        message = async_to_sync(channel_layer.receive)("test_channel")
        self.assertEqual(message["type"], "video_updated")
        message = async_to_sync(channel_layer.receive)("test_channel_admin")
        self.assertEqual(message["type"], "video_updated")

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_update_state_video_processing(self):
        """Setting a video's `upload_state` to processing should not affect its `uploaded_on`."""
        video = VideoFactory(id="9eeef843-bc43-4e01-825d-658aa5bca49f")
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_add)(
            VIDEO_ROOM_NAME.format(video_id=str(video.id)), "test_channel"
        )
        async_to_sync(channel_layer.group_add)(
            VIDEO_ADMIN_ROOM_NAME.format(video_id=str(video.id)), "test_channel_admin"
        )
        data = {
            "extraParameters": {},
            "key": f"{video.pk}/video/{video.pk}/1533686400",
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
        message = async_to_sync(channel_layer.receive)("test_channel")
        self.assertEqual(message["type"], "video_updated")
        message = async_to_sync(channel_layer.receive)("test_channel_admin")
        self.assertEqual(message["type"], "video_updated")

    @override_settings(
        UPDATE_STATE_SHARED_SECRETS=["previous secret", "current secret"]
    )
    def test_api_update_state_video_multiple_secrets(self):
        """Confirming the failed upload of a video using the any of the existing secrets."""
        video = VideoFactory(id="c804e019-c622-4b76-aa43-33f2317bdc7e")
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_add)(
            VIDEO_ROOM_NAME.format(video_id=str(video.id)), "test_channel"
        )
        async_to_sync(channel_layer.group_add)(
            VIDEO_ADMIN_ROOM_NAME.format(video_id=str(video.id)), "test_channel_admin"
        )
        data = {
            "extraParameters": {},
            "key": f"{video.pk}/video/{video.pk}/1533686400",
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
        message = async_to_sync(channel_layer.receive)("test_channel")
        self.assertEqual(message["type"], "video_updated")
        message = async_to_sync(channel_layer.receive)("test_channel_admin")
        self.assertEqual(message["type"], "video_updated")

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_update_state_timed_text_track(self):
        """Confirming the successful upload of a timed text track."""
        timed_text_track = TimedTextTrackFactory(
            id="673d4400-acab-454b-99eb-f7ef422af2cb",
            video__pk="a1a2224b-f7b0-48c2-b6f2-57fd7f863638",
        )
        data = {
            "extraParameters": {},
            "key": (
                f"{timed_text_track.video.pk}/timedtexttrack/{timed_text_track.id}/"
                "1533686400_fr_cc"
            ),
            "state": "ready",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        with mock.patch.object(
            channel_layers_utils, "dispatch_video"
        ) as mock_dispatch_video, mock.patch.object(
            channel_layers_utils, "dispatch_timed_text_track"
        ) as mock_dispatch_timed_text_track:
            response = self.client.post(
                "/api/update-state",
                data,
                content_type="application/json",
                HTTP_X_MARSHA_SIGNATURE=signature,
            )
            mock_dispatch_video.assert_called_once_with(
                timed_text_track.video, to_admin=True
            )
            mock_dispatch_timed_text_track.assert_called_once_with(timed_text_track)
        timed_text_track.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(
            timed_text_track.uploaded_on, datetime(2018, 8, 8, tzinfo=timezone.utc)
        )
        self.assertEqual(timed_text_track.upload_state, "ready")

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_update_state_unknown_video(self):
        """Trying to update the state of a video that does not exist should return a 404."""
        data = {
            "extraParameters": {},
            "key": (
                "9f14ad28-dd35-49b1-a723-84d57884e4cb/video/1ed1b113-2b87-42af-863a-11232f7bf88f"
                "/1533686400"
            ),
            "state": "ready",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.post(
                "/api/update-state",
                data,
                content_type="application/json",
                HTTP_X_MARSHA_SIGNATURE=signature,
            )
            mock_dispatch_video_to_groups.assert_not_called()

        self.assertEqual(response.status_code, 404)
        self.assertEqual(json.loads(response.content), {"success": False})

    def test_api_update_state_invalid_data(self):
        """Trying to update the state of an upload with invalid data should return a 400."""
        video = VideoFactory()
        data = {
            "key": f"{video.pk}/video/{video.pk}/1533686400",
            "state": "reedo",
            "signature": "123abc",
        }

        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.post("/api/update-state", data)
            mock_dispatch_video_to_groups.assert_not_called()

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
            "key": f"{video.pk}/video/{video.pk}/1533686400",
            "state": "ready",
        }
        signature = generate_hash("invalid secret", json.dumps(data).encode("utf-8"))
        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.post(
                "/api/update-state",
                data,
                content_type="application/json",
                # Expected signature:
                # 51c2f6b3dbfaf7f1e675550e4c5bae3e729201c51544760d41e7d5c05fec6372
                HTTP_X_MARSHA_SIGNATURE=signature,
            )
            mock_dispatch_video_to_groups.assert_not_called()

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
            "key": f"{document.pk}/document/{document.pk}/1533686400.pdf",
            "state": "ready",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.post(
                "/api/update-state",
                data,
                content_type="application/json",
                HTTP_X_MARSHA_SIGNATURE=signature,
            )
            mock_dispatch_video_to_groups.assert_not_called()

        document.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(document.upload_state, "ready")
        self.assertEqual(document.extension, "pdf")
        self.assertEqual(
            document.uploaded_on, datetime(2018, 8, 8, tzinfo=timezone.utc)
        )

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_update_state_document_without_extension(self):
        """Without extension the `extension` field should have None value."""
        document = DocumentFactory(
            id="663be0f9-38b0-4fd9-a5bb-f123d9b09ac6", extension="doc"
        )

        data = {
            "extraParameters": {},
            "key": f"{document.pk}/document/{document.pk}/1533686400",
            "state": "ready",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.post(
                "/api/update-state",
                data,
                content_type="application/json",
                HTTP_X_MARSHA_SIGNATURE=signature,
            )
            mock_dispatch_video_to_groups.assert_not_called()

        document.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(document.upload_state, "ready")
        self.assertEqual(document.extension, None)
        self.assertEqual(
            document.uploaded_on, datetime(2018, 8, 8, tzinfo=timezone.utc)
        )

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
        with mock.patch.object(
            channel_layers_utils, "dispatch_video"
        ) as mock_dispatch_video, mock.patch.object(
            channel_layers_utils, "dispatch_thumbnail"
        ) as mock_dispatch_thumbnail:
            response = self.client.post(
                "/api/update-state",
                data,
                content_type="application/json",
                HTTP_X_MARSHA_SIGNATURE=signature,
            )
            mock_dispatch_video.assert_called_once_with(thumbnail.video, to_admin=True)
            mock_dispatch_thumbnail.assert_called_once_with(thumbnail)

        thumbnail.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(thumbnail.upload_state, "ready")
        self.assertEqual(
            thumbnail.uploaded_on, datetime(2018, 8, 8, tzinfo=timezone.utc)
        )

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_update_state_shared_live_media(self):
        """Confirming the successful upload of a shared live media."""
        shared_live_media = SharedLiveMediaFactory(
            id="d60d7971-5929-4f10-8e9c-06c5d15818ce",
            video__pk="a1a2224b-f7b0-48c2-b6f2-57fd7f863638",
        )

        data = {
            "extraParameters": {"nbPages": 3, "extension": "pdf"},
            "key": f"{shared_live_media.video.pk}/sharedlivemedia/{shared_live_media.pk}/"
            "1533686400.pdf",
            "state": "ready",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        with mock.patch.object(
            channel_layers_utils, "dispatch_video"
        ) as mock_dispatch_video, mock.patch.object(
            channel_layers_utils, "dispatch_shared_live_media"
        ) as mock_dispatch_shared_live_media:
            response = self.client.post(
                "/api/update-state",
                data,
                content_type="application/json",
                HTTP_X_MARSHA_SIGNATURE=signature,
            )
            mock_dispatch_video.assert_called_once_with(
                shared_live_media.video, to_admin=True
            )
            mock_dispatch_shared_live_media.assert_called_once_with(shared_live_media)

        shared_live_media.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(shared_live_media.upload_state, "ready")
        self.assertEqual(
            shared_live_media.uploaded_on, datetime(2018, 8, 8, tzinfo=timezone.utc)
        )
        self.assertEqual(shared_live_media.nb_pages, 3)
        self.assertEqual(shared_live_media.extension, "pdf")

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_update_state_deposited_file(self):
        """Confirming the successful upload of a shared live media."""
        deposited_file = DepositedFileFactory(
            id="d60d7971-5929-4f10-8e9c-06c5d15818ce",
            file_depository__pk="a1a2224b-f7b0-48c2-b6f2-57fd7f863638",
        )

        for state in (SCANNING, INFECTED, COPYING, READY, ERROR):
            data = {
                "extraParameters": {"extension": "pdf"},
                "key": f"{deposited_file.file_depository.pk}/depositedfile/{deposited_file.pk}/"
                "1533686400.pdf",
                "state": state,
            }
            signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
            response = self.client.post(
                "/api/update-state",
                data,
                content_type="application/json",
                HTTP_X_MARSHA_SIGNATURE=signature,
            )

            self.assertEqual(response.status_code, 200)

            deposited_file.refresh_from_db()
            self.assertEqual(deposited_file.upload_state, state)

            if state == READY:
                self.assertEqual(
                    deposited_file.uploaded_on,
                    datetime(2018, 8, 8, tzinfo=timezone.utc),
                )
                self.assertEqual(deposited_file.extension, "pdf")

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_update_state_classroom_document(self):
        """Confirming the successful upload of a classroom document."""
        classroom_document = ClassroomDocumentFactory(
            id="d60d7971-5929-4f10-8e9c-06c5d15818ce",
            classroom__pk="a1a2224b-f7b0-48c2-b6f2-57fd7f863638",
        )

        for state in (READY, ERROR):
            data = {
                "extraParameters": {},
                "key": f"{classroom_document.classroom.pk}/classroomdocument/"
                f"{classroom_document.pk}/1533686400.pdf",
                "state": state,
            }
            signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
            response = self.client.post(
                "/api/update-state",
                data,
                content_type="application/json",
                HTTP_X_MARSHA_SIGNATURE=signature,
            )

            self.assertEqual(response.status_code, 200)

            classroom_document.refresh_from_db()
            self.assertEqual(classroom_document.upload_state, state)

            if state == READY:
                self.assertEqual(
                    classroom_document.uploaded_on,
                    datetime(2018, 8, 8, tzinfo=timezone.utc),
                )
