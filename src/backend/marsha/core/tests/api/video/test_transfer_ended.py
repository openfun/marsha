"""Tests for the Video transfer ended API of the Marsha project."""

import json
from unittest import mock

from django.test import TestCase, override_settings

from marsha.core import factories
from marsha.core.defaults import PEERTUBE_PIPELINE, PROCESSING
from marsha.core.utils.api_utils import generate_hash


class VideoTransferEndedAPITest(TestCase):
    """Test the "transfer-ended" API of the video object."""

    maxDiff = None

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.some_organization = factories.OrganizationFactory()
        cls.some_video = factories.VideoFactory(
            playlist__organization=cls.some_organization,
            transcode_pipeline=PEERTUBE_PIPELINE,
        )

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    @override_settings(TRANSCODING_CALLBACK_DOMAIN="http://testserver")
    def test_transfer_ended(self):
        """Test the "transfer ended" API of the video object."""

        data = {
            "file_key": f"tmp/{self.some_video.pk}/video/4564565456",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))

        with (
            mock.patch(
                "marsha.websocket.utils.channel_layers_utils.dispatch_video"
            ) as mock_dispatch_video,
            mock.patch(
                "marsha.core.api.video.launch_video_transcoding.delay"
            ) as mock_launch_video_transcoding,
        ):
            response = self.client.post(
                f"/api/videos/{self.some_video.id}/transfer-ended/",
                data,
                content_type="application/json",
                HTTP_X_MARSHA_SIGNATURE=signature,
            )
            mock_launch_video_transcoding.assert_called_once_with(
                video_pk=str(self.some_video.pk),
                stamp="4564565456",
                domain="http://testserver",
            )
            mock_dispatch_video.assert_called_once_with(self.some_video, to_admin=True)

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(content["upload_state"], PROCESSING)

    def test_transfer_ended_with_invalid_signature(self):
        """Test that the transfer cannot be ended with an invalid signature."""

        data = {
            "file_key": f"tmp/{self.some_video.pk}/video/4564565456",
        }
        signature = generate_hash("invalid secret", json.dumps(data).encode("utf-8"))

        response = self.client.post(
            f"/api/videos/{self.some_video.pk}/transfer-ended/",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=signature,
        )

        self.assertEqual(response.status_code, 403)

    def test_transfer_ended_with_wrong_body(self):
        """Test that the transfer cannot be ended with a wrong body."""
        data = {
            "file_key": f"tmp/{self.some_video.pk}/video/4564565456",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))

        response = self.client.post(
            f"/api/videos/{self.some_video.pk}/transfer-ended/",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=signature,
        )

        self.assertEqual(response.status_code, 403)

    def test_transfer_ended_with_forged_path(self):
        """Test the "transfer ended" API of the video object."""
        video = self.some_video

        data = {
            "file_key": f"tmp/{video.pk}/crafted/4564565456",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))

        response = self.client.post(
            f"/api/videos/{self.some_video.pk}/transfer-ended/",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=signature,
        )

        self.assertEqual(response.status_code, 400)

    def test_transfer_ended_with_forged_stamp(self):
        """Test the "transfer ended" API of the video object."""
        video = self.some_video

        data = {
            "file_key": f"tmp/{video.pk}/video/crafted_stamp",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))

        response = self.client.post(
            f"/api/videos/{self.some_video.pk}/transfer-ended/",
            data,
            HTTP_X_MARSHA_SIGNATURE=signature,
        )

        self.assertEqual(response.status_code, 400)
