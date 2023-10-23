"""Tests for the record slices harvesting states for a video API of the Marsha project."""
import json
import random

from django.test import TestCase, override_settings

from marsha.core.defaults import HARVESTED, PENDING
from marsha.core.factories import VideoFactory
from marsha.core.utils.api_utils import generate_hash


class RecordSlicesManifestAPITest(TestCase):
    """Test the API that allows to check each record slice harvest status."""

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_recording_slice_manifest(self):
        """Manifest should be set."""
        video = VideoFactory(
            recording_slices=[
                {
                    "status": HARVESTED,
                    "harvest_job_id": "harvest_job_id_1",
                    "manifest_key": "manifest_key_1.m3u8",
                },
                {
                    "status": PENDING,
                    "harvest_job_id": "harvest_job_id_2",
                },
                {
                    "status": PENDING,
                    "harvest_job_id": "harvest_job_id_3",
                },
            ],
        )

        data = {
            "video_id": str(video.pk),
            "harvest_job_id": "harvest_job_id_3",
            "manifest_key": "manifest_key_3.m3u8",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        response = self.client.post(
            "/api/recording-slices-manifest",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=signature,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
        video.refresh_from_db()
        self.assertEqual(
            video.recording_slices,
            [
                {
                    "status": HARVESTED,
                    "harvest_job_id": "harvest_job_id_1",
                    "manifest_key": "manifest_key_1.m3u8",
                },
                {
                    "status": PENDING,
                    "harvest_job_id": "harvest_job_id_2",
                },
                {
                    "status": HARVESTED,
                    "harvest_job_id": "harvest_job_id_3",
                    "manifest_key": "manifest_key_3.m3u8",
                },
            ],
        )

    @override_settings(
        UPDATE_STATE_SHARED_SECRETS=["previous secret", "current secret"]
    )
    def test_api_recording_slice_manifest_multiple_secrets(self):
        """Manifest should be set using any of the existing secrets."""
        video = VideoFactory(
            recording_slices=[
                {
                    "status": HARVESTED,
                    "harvest_job_id": "harvest_job_id_1",
                    "manifest_key": "manifest_key_1.m3u8",
                },
                {
                    "status": PENDING,
                    "harvest_job_id": "harvest_job_id_2",
                },
                {
                    "status": PENDING,
                    "harvest_job_id": "harvest_job_id_3",
                },
            ],
        )

        data = {
            "video_id": str(video.pk),
            "harvest_job_id": "harvest_job_id_3",
            "manifest_key": "manifest_key_3.m3u8",
        }
        signature = generate_hash(
            random.choice(["previous secret", "current secret"]),
            json.dumps(data).encode("utf-8"),
        )
        response = self.client.post(
            "/api/recording-slices-manifest",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=signature,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
        video.refresh_from_db()
        self.assertEqual(
            video.recording_slices,
            [
                {
                    "status": HARVESTED,
                    "harvest_job_id": "harvest_job_id_1",
                    "manifest_key": "manifest_key_1.m3u8",
                },
                {
                    "status": PENDING,
                    "harvest_job_id": "harvest_job_id_2",
                },
                {
                    "status": HARVESTED,
                    "harvest_job_id": "harvest_job_id_3",
                    "manifest_key": "manifest_key_3.m3u8",
                },
            ],
        )

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_recording_slice_manifest_unknown_video(self):
        """Trying to set the manifest on a recording slices of a video that does not exist."""
        data = {
            "video_id": "9f14ad28-dd35-49b1-a723-84d57884e4cb",
            "harvest_job_id": "harvest_job_id_3",
            "manifest_key": "manifest_key_3.m3u8",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        response = self.client.post(
            "/api/recording-slices-manifest",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=signature,
        )

        self.assertEqual(response.status_code, 404)

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_recording_slice_manifest_invalid_signature(self):
        """Trying to set the manifest of a recording slices with an unexpected signature."""
        video = VideoFactory(
            recording_slices=[
                {
                    "status": HARVESTED,
                    "harvest_job_id": "harvest_job_id_1",
                    "manifest_key": "manifest_key_1.m3u8",
                },
                {
                    "status": PENDING,
                    "harvest_job_id": "harvest_job_id_2",
                },
                {
                    "status": PENDING,
                    "harvest_job_id": "harvest_job_id_3",
                },
            ],
        )

        data = {
            "video_id": str(video.pk),
            "harvest_job_id": "harvest_job_id_3",
            "manifest_key": "manifest_key_3.m3u8",
        }
        signature = generate_hash("invalid secret", json.dumps(data).encode("utf-8"))
        response = self.client.post(
            "/api/recording-slices-manifest",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=signature,
        )

        self.assertEqual(response.status_code, 403)
        video.refresh_from_db()
        self.assertEqual(
            video.recording_slices,
            [
                {
                    "status": HARVESTED,
                    "harvest_job_id": "harvest_job_id_1",
                    "manifest_key": "manifest_key_1.m3u8",
                },
                {
                    "status": PENDING,
                    "harvest_job_id": "harvest_job_id_2",
                },
                {
                    "status": PENDING,
                    "harvest_job_id": "harvest_job_id_3",
                },
            ],
        )


class RecordSlicesStatesAPITest(TestCase):
    """Test the API that allows to check each record slice harvest status."""

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_recording_slices_states(self):
        """Main status should be pending if all slices are pending."""
        video = VideoFactory(
            recording_slices=[
                {"status": PENDING},
                {"status": PENDING},
                {"status": PENDING},
            ],
        )

        data = {"video_id": str(video.pk)}
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        response = self.client.post(
            "/api/recording-slices-state",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=signature,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "status": PENDING,
                "recording_slices": [
                    {"status": PENDING},
                    {"status": PENDING},
                    {"status": PENDING},
                ],
            },
        )

    @override_settings(
        UPDATE_STATE_SHARED_SECRETS=["previous secret", "current secret"]
    )
    def test_api_recording_slices_states_multiple_secrets(self):
        """Statuses should be sent using any of the existing secrets."""
        video = VideoFactory(recording_slices=[{"status": PENDING}])

        data = {"video_id": str(video.pk)}
        signature = generate_hash(
            random.choice(["previous secret", "current secret"]),
            json.dumps(data).encode("utf-8"),
        )
        response = self.client.post(
            "/api/recording-slices-state",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=signature,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "status": PENDING,
                "recording_slices": [{"status": PENDING}],
            },
        )

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_recording_slices_states_unknown_video(self):
        """Trying to get the recording slices status of a video that does not exist."""
        data = {"video_id": "9f14ad28-dd35-49b1-a723-84d57884e4cb"}
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        response = self.client.post(
            "/api/recording-slices-state",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=signature,
        )

        self.assertEqual(response.status_code, 404)

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_recording_slices_states_invalid_signature(self):
        """Trying to get the recording slices status of a video with an unexpected signature."""
        video = VideoFactory(recording_slices=[{"status": PENDING}])

        data = {"video_id": str(video.pk)}
        signature = generate_hash("invalid secret", json.dumps(data).encode("utf-8"))
        response = self.client.post(
            "/api/recording-slices-state",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=signature,
        )

        self.assertEqual(response.status_code, 403)
