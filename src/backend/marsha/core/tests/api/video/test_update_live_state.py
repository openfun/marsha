"""Tests for the Video update live state API of the Marsha project."""
from datetime import datetime, timedelta, timezone as baseTimezone
import json
import random
from unittest import mock

from django.test import TestCase, override_settings

from marsha.core import api, factories
from marsha.core.api import timezone
from marsha.core.defaults import (
    HARVESTED,
    HARVESTING,
    IDLE,
    JITSI,
    LIVE_CHOICES,
    PENDING,
    RAW,
    RUNNING,
    STOPPED,
    STOPPING,
)
from marsha.core.utils.api_utils import generate_hash
from marsha.core.utils.time_utils import to_timestamp


class VideoUpdateLiveStateAPITest(TestCase):
    """Test the "update live state" API of the video object."""

    maxDiff = None

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_video_update_live_state(self):
        """Confirm update video live state."""
        # test works with or without a starting_at date
        # set microseconds to 0 to compare date surely as serializer truncate them
        starting_at = random.choice(
            [None, (timezone.now() + timedelta(hours=1)).replace(microsecond=0)]
        )
        video = factories.VideoFactory(
            id="a1a21411-bf2f-4926-b97f-3c48a124d528",
            upload_state=PENDING,
            live_state=IDLE,
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
            starting_at=starting_at,
        )
        data = {
            "logGroupName": "/aws/lambda/dev-test-marsha-medialive",
            "requestId": "7954d4d1-9dd3-47f4-9542-e7fd5f937fe6",
            "state": "running",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups, mock.patch.object(
            api.video, "update_id3_tags"
        ) as mock_update_id3_tags:
            mock_update_id3_tags.assert_not_called()
            response = self.client.patch(
                f"/api/videos/{video.id}/update-live-state/",
                data,
                content_type="application/json",
                HTTP_X_MARSHA_SIGNATURE=signature,
            )
            mock_dispatch_video_to_groups.assert_called_once_with(video)

        video.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(video.live_state, RUNNING)
        self.assertEqual(video.starting_at, starting_at)
        self.assertEqual(
            video.live_info,
            {
                "medialive": {
                    "input": {
                        "id": "medialive_input_1",
                        "endpoints": [
                            "https://live_endpoint1",
                            "https://live_endpoint2",
                        ],
                    },
                    "channel": {"id": "medialive_channel_1"},
                    "request_ids": ["7954d4d1-9dd3-47f4-9542-e7fd5f937fe6"],
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
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
                "started_at": "1533686400",
            },
        )

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_video_update_live_state_running_started_at_with_stopped_at(self):
        """Confirm started_at is updated and key stopped_at is deleted when the live
        is newly started."""
        video = factories.VideoFactory(
            id="a1a21411-bf2f-4926-b97f-3c48a124d528",
            upload_state=PENDING,
            live_state=IDLE,
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
                "started_at": to_timestamp(timezone.now() - timedelta(minutes=10)),
                "stopped_at": to_timestamp(timezone.now() + timedelta(minutes=10)),
            },
            live_type=RAW,
        )
        data = {
            "logGroupName": "/aws/lambda/dev-test-marsha-medialive",
            "requestId": "7954d4d1-9dd3-47f4-9542-e7fd5f937fe6",
            "state": "running",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        new_start = timezone.now() + timedelta(minutes=20)
        with mock.patch.object(timezone, "now", return_value=new_start), mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups, mock.patch.object(
            api.video, "update_id3_tags"
        ) as mock_update_id3_tags:
            mock_update_id3_tags.assert_not_called()
            response = self.client.patch(
                f"/api/videos/{video.id}/update-live-state/",
                data,
                content_type="application/json",
                HTTP_X_MARSHA_SIGNATURE=signature,
            )
            mock_dispatch_video_to_groups.assert_called_once_with(video)

        video.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(video.live_state, RUNNING)
        # started_at has been updated and key stopped_at has been deleted
        self.assertEqual(
            video.live_info,
            {
                "medialive": {
                    "input": {
                        "id": "medialive_input_1",
                        "endpoints": [
                            "https://live_endpoint1",
                            "https://live_endpoint2",
                        ],
                    },
                    "channel": {"id": "medialive_channel_1"},
                    "request_ids": ["7954d4d1-9dd3-47f4-9542-e7fd5f937fe6"],
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
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
                "started_at": to_timestamp(new_start),
            },
        )

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_video_update_live_state_stopped(self):
        """Receiving stopped event should stop the video."""
        # test works with or without a starting_at date
        # set microseconds to 0 to compare date surely as serializer truncate them
        starting_at = random.choice(
            [None, (timezone.now() + timedelta(hours=1)).replace(microsecond=0)]
        )

        video = factories.VideoFactory(
            id="a1a21411-bf2f-4926-b97f-3c48a124d528",
            upload_state=PENDING,
            live_state=STOPPING,
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
                    "request_ids": ["7954d4d1-9dd3-47f4-9542-e7fd5f937fe6"],
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
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
                "started_at": "1533686400",
            },
            live_type=RAW,
            starting_at=starting_at,
        )
        data = {
            "logGroupName": "/aws/lambda/dev-test-marsha-medialive",
            "requestId": "c31c7ce8-705d-4352-b7f0-e60f2bfa2845",
            "state": "stopped",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))

        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.patch(
                f"/api/videos/{video.id}/update-live-state/",
                data,
                content_type="application/json",
                HTTP_X_MARSHA_SIGNATURE=signature,
            )
            mock_dispatch_video_to_groups.assert_called_once_with(video)

        video.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(video.live_state, STOPPED)
        self.assertEqual(video.upload_state, PENDING)
        self.assertEqual(video.starting_at, starting_at)
        self.assertEqual(
            video.live_info,
            {
                "medialive": {
                    "input": {
                        "id": "medialive_input_1",
                        "endpoints": [
                            "https://live_endpoint1",
                            "https://live_endpoint2",
                        ],
                    },
                    "channel": {"id": "medialive_channel_1"},
                    "request_ids": [
                        "7954d4d1-9dd3-47f4-9542-e7fd5f937fe6",
                        "c31c7ce8-705d-4352-b7f0-e60f2bfa2845",
                    ],
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
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
                "started_at": "1533686400",
                "stopped_at": "1533686400",
            },
        )

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_video_update_live_state_harvested(self):
        """Receiving harvested event should reset live info."""
        # test works with or without a starting_at date
        # set microseconds to 0 to compare date surely as serializer truncate them
        starting_at = random.choice(
            [None, (timezone.now() + timedelta(hours=1)).replace(microsecond=0)]
        )

        video = factories.VideoFactory(
            id="a1a21411-bf2f-4926-b97f-3c48a124d528",
            upload_state=PENDING,
            live_state=HARVESTING,
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
                    "request_ids": ["7954d4d1-9dd3-47f4-9542-e7fd5f937fe6"],
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
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
                "started_at": "1533686400",
                "stopped_at": "1533686400",
            },
            live_type=JITSI,
            starting_at=starting_at,
        )
        data = {
            "logGroupName": "/aws/lambda/dev-test-marsha-medialive",
            "requestId": "c31c7ce8-705d-4352-b7f0-e60f2bfa2845",
            "state": "harvested",
            "extraParameters": {
                "resolutions": [240, 480, 720],
                "uploaded_on": "1533690000",
            },
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))

        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.patch(
                f"/api/videos/{video.id}/update-live-state/",
                data,
                content_type="application/json",
                HTTP_X_MARSHA_SIGNATURE=signature,
            )
            mock_dispatch_video_to_groups.assert_called_once_with(video)

        video.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
        self.assertEqual(video.live_state, HARVESTED)
        self.assertEqual(video.upload_state, PENDING)
        self.assertEqual(
            video.uploaded_on, datetime.fromtimestamp(1533690000, tz=baseTimezone.utc)
        )
        self.assertEqual(video.starting_at, starting_at)
        self.assertEqual(
            video.live_info,
            {
                "started_at": "1533686400",
                "stopped_at": "1533686400",
            },
        )
        self.assertEqual(video.resolutions, [240, 480, 720])

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_video_update_live_state_invalid_signature(self):
        """Live state update with an invalid signature should fails."""
        video = factories.VideoFactory(
            id="a1a21411-bf2f-4926-b97f-3c48a124d528",
            upload_state=PENDING,
            live_state=IDLE,
            live_type=RAW,
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
                    "request_ids": ["7954d4d1-9dd3-47f4-9542-e7fd5f937fe6"],
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
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
                "started_at": "1533686400",
            },
        )
        data = {
            "logGroupName": "/aws/lambda/dev-test-marsha-medialive",
            "requestId": "49010b0f-63f5-4d5b-9baa-6fc69bbce3eb",
            "state": "running",
        }
        signature = generate_hash("invalid secret", json.dumps(data).encode("utf-8"))
        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.patch(
                f"/api/videos/{video.id}/update-live-state/",
                data,
                content_type="application/json",
                HTTP_X_MARSHA_SIGNATURE=signature,
            )
            mock_dispatch_video_to_groups.assert_not_called()
        video.refresh_from_db()

        self.assertEqual(response.status_code, 403)
        self.assertEqual(video.live_state, IDLE)

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_video_update_live_state_invalid_state(self):
        """Live state update with an invalid state should fails."""
        video = factories.VideoFactory(
            id="a1a21411-bf2f-4926-b97f-3c48a124d528",
            upload_state=PENDING,
            live_state=IDLE,
            live_type=RAW,
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
                    "request_ids": ["7954d4d1-9dd3-47f4-9542-e7fd5f937fe6"],
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
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
                "started_at": "1533686400",
            },
        )
        invalid_state = random.choice(
            [s[0] for s in LIVE_CHOICES if s[0] not in [RUNNING, STOPPED, HARVESTED]]
        )
        data = {
            "logGroupName": "/aws/lambda/dev-test-marsha-medialive",
            "requestId": "49010b0f-63f5-4d5b-9baa-6fc69bbce3eb",
            "state": invalid_state,
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.patch(
                f"/api/videos/{video.id}/update-live-state/",
                data,
                content_type="application/json",
                HTTP_X_MARSHA_SIGNATURE=signature,
            )
            mock_dispatch_video_to_groups.assert_not_called()
        video.refresh_from_db()

        self.assertEqual(response.status_code, 400)
        self.assertEqual(video.live_state, IDLE)
        self.assertEqual(
            json.loads(response.content),
            {"state": [f'"{invalid_state}" is not a valid choice.']},
        )

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_video_update_live_state_unknown_video(self):
        """Live state update with an unknown video should fails."""
        data = {
            "logGroupName": "/aws/lambda/dev-test-marsha-medialive",
            "requestId": "49010b0f-63f5-4d5b-9baa-6fc69bbce3eb",
            "state": "running",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.patch(
                "/api/videos/9087c52d-cb87-4fd0-9b57-d9f28a0c69cb/update-live-state/",
                data,
                content_type="application/json",
                HTTP_X_MARSHA_SIGNATURE=signature,
            )
            mock_dispatch_video_to_groups.assert_not_called()

        self.assertEqual(response.status_code, 404)

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_video_update_live_already_saved_request_id(self):
        """Updating with an already saved request id should return a 200 earlier."""
        video = factories.VideoFactory(
            id="a1a21411-bf2f-4926-b97f-3c48a124d528",
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
                    "request_ids": ["7954d4d1-9dd3-47f4-9542-e7fd5f937fe6"],
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
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
                "started_at": "1533686400",
            },
            live_type=RAW,
        )
        data = {
            "logGroupName": "/aws/lambda/dev-test-marsha-medialive",
            "requestId": "7954d4d1-9dd3-47f4-9542-e7fd5f937fe6",
            "state": "stopped",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.patch(
                f"/api/videos/{video.id}/update-live-state/",
                data,
                content_type="application/json",
                HTTP_X_MARSHA_SIGNATURE=signature,
            )
            mock_dispatch_video_to_groups.assert_not_called()

        self.assertEqual(response.status_code, 200)
