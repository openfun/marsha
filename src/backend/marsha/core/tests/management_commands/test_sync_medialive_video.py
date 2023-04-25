"""Test clean_aws_elemental_stack command."""
from datetime import datetime, timezone
from io import StringIO
from unittest import mock
import uuid

from django.core.management import call_command
from django.test import TestCase

from botocore.stub import Stubber

from marsha.core.defaults import IDLE, JITSI, RUNNING, STARTING, STOPPED, STOPPING
from marsha.core.factories import VideoFactory
from marsha.core.management.commands import sync_medialive_video
from marsha.core.utils import medialive_utils, time_utils


class TestSyncMedialiveVideoCommandTest(TestCase):
    """Test sync_medialive_video command."""

    maxDiff = None

    def createLive(self, live_id, state):
        """Create a live with specified id and state."""
        return VideoFactory(
            id=live_id,
            live_state=state,
            live_type=JITSI,
            starting_at=datetime(2022, 11, 4, 13, 25, tzinfo=timezone.utc),
            title="live two",
            live_info={
                "started_at": time_utils.to_timestamp(
                    datetime(2022, 10, 14, 13, 25, tzinfo=timezone.utc)
                ),
                "medialive": {
                    "channel": {
                        "arn": "arn:aws:medialive:eu-west-1:xxx:channel:2222222",
                        "id": "2222222",
                    },
                    "input": {
                        "endpoints": [
                            f"rtmp://x.x.x.x:1935/{live_id}_1667490961-primary",
                            f"rtmp://x.x.x.x:1935/{live_id}_1667490961-secondary",
                        ],
                        "id": "2222222",
                    },
                },
                "mediapackage": {
                    "channel": {"id": f"test_{live_id}_1667490961"},
                    "endpoints": {
                        "hls": {
                            "id": f"test_{live_id}_1667490961_hls",
                            "url": (
                                "https://xxx.mediapackage.eu-west-1.amazonaws.com/out/v1/xxx/"
                                f"test_{live_id}_1667490961_hls.m3u8",
                            ),
                        }
                    },
                },
            },
        )

    def test_sync_not_used_state_medialive_on_running_video(self):
        """Not used medialive states should do nothing."""
        # running lives.
        live1_id = uuid.uuid4()
        live1 = self.createLive(live1_id, RUNNING)
        live2_id = uuid.uuid4()
        live2 = self.createLive(live2_id, RUNNING)
        live3_id = uuid.uuid4()
        live3 = self.createLive(live3_id, RUNNING)
        live4_id = uuid.uuid4()
        live4 = self.createLive(live4_id, RUNNING)

        # Run command
        out = StringIO()
        with mock.patch(
            "django.utils.timezone.now",
            return_value=datetime(2022, 10, 14, 15, 25, tzinfo=timezone.utc),
        ), Stubber(
            medialive_utils.medialive_client
        ) as mediapackage_client_stubber, mock.patch.object(
            sync_medialive_video, "list_medialive_channels"
        ) as list_medialive_channels_mock:
            mediapackage_client_stubber.add_response(
                "batch_update_schedule",
                service_response={},
            )
            list_medialive_channels_mock.return_value = [
                {
                    "Name": f"test_{live1_id}_1667490961",
                    "Tags": {"environment": "test"},
                    "State": "Deleting",
                },
                {
                    "Name": f"test_{live2_id}_1667490961",
                    "Tags": {"environment": "test"},
                    "State": "Creating",
                },
                {
                    "Name": f"test_{live3_id}_1667490961",
                    "Tags": {"environment": "test"},
                    "State": "Recovering",
                },
                {
                    "Name": f"test_{live4_id}_1667490961",
                    "Tags": {"environment": "test"},
                    "State": "Updating",
                },
            ]

            call_command("sync_medialive_video", stdout=out)

            self.assertIn(f"Checking video {live1_id}", out.getvalue())
            self.assertIn(f"Checking video {live2_id}", out.getvalue())
            self.assertIn(f"Checking video {live3_id}", out.getvalue())
            self.assertIn(f"Checking video {live4_id}", out.getvalue())

            live1.refresh_from_db()
            live2.refresh_from_db()
            live3.refresh_from_db()
            live4.refresh_from_db()

            self.assertEqual(live1.live_state, RUNNING)
            self.assertEqual(live2.live_state, RUNNING)
            self.assertEqual(live3.live_state, RUNNING)
            self.assertEqual(live4.live_state, RUNNING)

        out.close()

    def test_sync_idle_medialive_on_stopped_video(self):
        """
        Video state STOPPED is equivalent to medialive channel state IDLE
        and should do nothing.
        """
        # stopped and idle lives should not change.
        live1_id = uuid.uuid4()
        live1 = self.createLive(live1_id, STOPPED)
        live2_id = uuid.uuid4()
        live2 = self.createLive(live2_id, IDLE)

        # Run command
        out = StringIO()
        with mock.patch(
            "django.utils.timezone.now",
            return_value=datetime(2022, 10, 14, 15, 25, tzinfo=timezone.utc),
        ), Stubber(
            medialive_utils.medialive_client
        ) as mediapackage_client_stubber, mock.patch.object(
            sync_medialive_video, "list_medialive_channels"
        ) as list_medialive_channels_mock:
            mediapackage_client_stubber.add_response(
                "batch_update_schedule",
                service_response={},
            )
            list_medialive_channels_mock.return_value = [
                {
                    "Name": f"test_{live1_id}_1667490961",
                    "Tags": {"environment": "test"},
                    "State": "Idle",
                },
                {
                    "Name": f"test_{live2_id}_1667490961",
                    "Tags": {"environment": "test"},
                    "State": "Idle",
                },
            ]

            call_command("sync_medialive_video", stdout=out)

            self.assertIn(f"Checking video {live1_id}", out.getvalue())
            self.assertIn(f"Checking video {live2_id}", out.getvalue())

            live1.refresh_from_db()
            live2.refresh_from_db()

            self.assertEqual(live1.live_state, STOPPED)
            self.assertEqual(live2.live_state, IDLE)

        out.close()

    def test_sync_idle_medialive_on_running_video(self):
        """Medialive channel is IDLE while video is RUNNING, should update video state."""
        # Running.
        live_id = uuid.uuid4()
        live = self.createLive(live_id, RUNNING)

        # Run command
        out = StringIO()
        with mock.patch(
            "django.utils.timezone.now",
            return_value=datetime(2022, 10, 14, 15, 25, tzinfo=timezone.utc),
        ), mock.patch.object(
            sync_medialive_video, "list_medialive_channels"
        ) as list_medialive_channels_mock:
            list_medialive_channels_mock.return_value = [
                {
                    "Name": f"test_{live_id}_1667490961",
                    "Tags": {"environment": "test"},
                    "State": "IDLE",
                },
            ]

            call_command("sync_medialive_video", stdout=out)

            self.assertIn(f"Checking video {live.id}", out.getvalue())

            live.refresh_from_db()

            self.assertEqual(live.live_state, STOPPED)
            self.assertEqual(
                live.live_info["started_at"],
                time_utils.to_timestamp(
                    datetime(2022, 10, 14, 13, 25, tzinfo=timezone.utc)
                ),
            )
            self.assertEqual(
                live.live_info["stopped_at"],
                time_utils.to_timestamp(
                    datetime(2022, 10, 14, 15, 25, tzinfo=timezone.utc)
                ),
            )

        out.close()

    def test_sync_running_medialive_on_starting_video(self):
        """Medialive channel is RUNNING while video is IDLE, should update video state."""

        # Running.
        live_id = uuid.uuid4()
        live = self.createLive(live_id, STARTING)

        # Run command
        out = StringIO()
        with mock.patch(
            "django.utils.timezone.now",
            return_value=datetime(2022, 10, 14, 15, 25, tzinfo=timezone.utc),
        ), Stubber(
            medialive_utils.medialive_client
        ) as mediapackage_client_stubber, mock.patch.object(
            sync_medialive_video, "list_medialive_channels"
        ) as list_medialive_channels_mock:
            mediapackage_client_stubber.add_response(
                "batch_update_schedule",
                service_response={},
            )
            list_medialive_channels_mock.return_value = [
                {
                    "Name": f"test_{live_id}_1667490961",
                    "Tags": {"environment": "test"},
                    "State": "RUNNING",
                },
            ]

            call_command("sync_medialive_video", stdout=out)

            self.assertIn(f"Checking video {live.id}", out.getvalue())

            live.refresh_from_db()

            self.assertEqual(live.live_state, RUNNING)
            self.assertEqual(
                live.live_info["started_at"],
                time_utils.to_timestamp(
                    datetime(2022, 10, 14, 15, 25, tzinfo=timezone.utc)
                ),
            )

        out.close()

    def test_sync_starting_medialive_on_idle_video(self):
        """Medialive channel is RUNNING while video is IDLE, should update video state."""

        # Running.
        live_id = uuid.uuid4()
        live = self.createLive(live_id, STOPPED)

        # Run command
        out = StringIO()
        with mock.patch(
            "django.utils.timezone.now",
            return_value=datetime(2022, 10, 14, 15, 25, tzinfo=timezone.utc),
        ), Stubber(
            medialive_utils.medialive_client
        ) as mediapackage_client_stubber, mock.patch.object(
            sync_medialive_video, "list_medialive_channels"
        ) as list_medialive_channels_mock:
            mediapackage_client_stubber.add_response(
                "batch_update_schedule",
                service_response={},
            )
            list_medialive_channels_mock.return_value = [
                {
                    "Name": f"test_{live_id}_1667490961",
                    "Tags": {"environment": "test"},
                    "State": "Starting",
                },
            ]

            call_command("sync_medialive_video", stdout=out)

            self.assertIn(f"Checking video {live.id}", out.getvalue())

            live.refresh_from_db()

            self.assertEqual(live.live_state, STARTING)

        out.close()

    def test_sync_stopping_medialive_on_running_video(self):
        """Medialive channel is STOPPING while video is RUNNING, should update video state."""

        # Running.
        live_id = uuid.uuid4()
        live = self.createLive(live_id, RUNNING)

        # Run command
        out = StringIO()
        with mock.patch(
            "django.utils.timezone.now",
            return_value=datetime(2022, 10, 14, 15, 25, tzinfo=timezone.utc),
        ), Stubber(
            medialive_utils.medialive_client
        ) as mediapackage_client_stubber, mock.patch.object(
            sync_medialive_video, "list_medialive_channels"
        ) as list_medialive_channels_mock:
            mediapackage_client_stubber.add_response(
                "batch_update_schedule",
                service_response={},
            )
            list_medialive_channels_mock.return_value = [
                {
                    "Name": f"test_{live_id}_1667490961",
                    "Tags": {"environment": "test"},
                    "State": "Stopping",
                },
            ]

            call_command("sync_medialive_video", stdout=out)

            self.assertIn(f"Checking video {live.id}", out.getvalue())

            live.refresh_from_db()

            self.assertEqual(live.live_state, STOPPING)

        out.close()

    def test_already_sync_medialives_and_videos(self):
        """Medialive channels are sync with video and should not be updated."""

        live1_id = uuid.uuid4()
        live1 = self.createLive(live1_id, RUNNING)
        live2_id = uuid.uuid4()
        live2 = self.createLive(live2_id, IDLE)
        live3_id = uuid.uuid4()
        live3 = self.createLive(live3_id, STARTING)
        live4_id = uuid.uuid4()
        live4 = self.createLive(live4_id, STOPPING)
        # Run command
        out = StringIO()
        with mock.patch(
            "django.utils.timezone.now",
            return_value=datetime(2022, 10, 14, 15, 25, tzinfo=timezone.utc),
        ), Stubber(
            medialive_utils.medialive_client
        ) as mediapackage_client_stubber, mock.patch.object(
            sync_medialive_video, "list_medialive_channels"
        ) as list_medialive_channels_mock:
            mediapackage_client_stubber.add_response(
                "batch_update_schedule",
                service_response={},
            )
            list_medialive_channels_mock.return_value = [
                {
                    "Name": f"test_{live1_id}_1667490961",
                    "Tags": {"environment": "test"},
                    "State": "Running",
                },
                {
                    "Name": f"test_{live2_id}_1667490961",
                    "Tags": {"environment": "test"},
                    "State": "Idle",
                },
                {
                    "Name": f"test_{live3_id}_1667490961",
                    "Tags": {"environment": "test"},
                    "State": "Starting",
                },
                {
                    "Name": f"test_{live4_id}_1667490961",
                    "Tags": {"environment": "test"},
                    "State": "Stopping",
                },
            ]

            call_command("sync_medialive_video", stdout=out)

            self.assertIn(f"Checking video {live1_id}", out.getvalue())
            self.assertIn(f"Checking video {live2_id}", out.getvalue())
            self.assertIn(f"Checking video {live3_id}", out.getvalue())
            self.assertIn(f"Checking video {live4_id}", out.getvalue())

            live1.refresh_from_db()
            live2.refresh_from_db()
            live3.refresh_from_db()
            live4.refresh_from_db()

            self.assertEqual(live1.live_state, RUNNING)
            self.assertEqual(live2.live_state, IDLE)
            self.assertEqual(live3.live_state, STARTING)
            self.assertEqual(live4.live_state, STOPPING)

        out.close()
