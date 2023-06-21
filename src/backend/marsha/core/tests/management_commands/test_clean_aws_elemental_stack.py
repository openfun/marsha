"""Test clean_aws_elemental_stack command."""
from datetime import datetime, timezone
from io import StringIO
from unittest import mock
import uuid

from django.core.management import call_command
from django.test import TestCase

from marsha.core.defaults import DELETED, ENDED, IDLE, JITSI, RUNNING, STOPPED
from marsha.core.factories import VideoFactory
from marsha.core.management.commands import clean_aws_elemental_stack
from marsha.core.utils import time_utils


class CleanAwsElementalStackCommandTest(TestCase):
    """Test clean_aws_elemental_stack command."""

    maxDiff = None

    def test_clean_aws_elemental_stack(self):
        """Test clean_aws_elemental_stack command."""
        # first live not started yet, should not be updated.
        live1 = VideoFactory(
            live_state=IDLE,
            live_type=JITSI,
            starting_at=datetime(2022, 12, 25, 13, 25, tzinfo=timezone.utc),
            title="live one",
            live_info=None,  # live has never been started
        )

        # Second live, started but still running, should not be updated
        live2_id = uuid.uuid4()
        live2 = VideoFactory(
            id=live2_id,
            live_state=RUNNING,
            live_type=JITSI,
            starting_at=datetime(2022, 11, 4, 13, 25, tzinfo=timezone.utc),
            title="live two",
            live_info={
                "medialive": {
                    "channel": {
                        "arn": "arn:aws:medialive:eu-west-1:xxx:channel:2222222",
                        "id": "2222222",
                    },
                    "input": {
                        "endpoints": [
                            f"rtmp://x.x.x.x:1935/{live2_id}_1667490961-primary",
                            f"rtmp://x.x.x.x:1935/{live2_id}_1667490961-secondary",
                        ],
                        "id": "2222222",
                    },
                },
                "mediapackage": {
                    "channel": {"id": f"test_{live2_id}_1667490961"},
                    "endpoints": {
                        "hls": {
                            "id": f"test_{live2_id}_1667490961_hls",
                            "url": (
                                "https://xxx.mediapackage.eu-west-1.amazonaws.com/out/v1/xxx/"
                                f"test_{live2_id}_1667490961_hls.m3u8",
                            ),
                        }
                    },
                },
            },
        )

        # Third live, started and stopped soon. Should not be updated
        live3_id = uuid.uuid4()
        live3 = VideoFactory(
            id=live3_id,
            live_state=STOPPED,
            live_type=JITSI,
            starting_at=datetime(2022, 11, 4, 13, 25, tzinfo=timezone.utc),
            title="live three",
            live_info={
                "medialive": {
                    "channel": {
                        "arn": "arn:aws:medialive:eu-west-1:xxx:channel:3333333",
                        "id": "3333333",
                    },
                    "input": {
                        "endpoints": [
                            f"rtmp://x.x.x.x:1935/{live3_id}_1667490961-primary",
                            f"rtmp://x.x.x.x:1935/{live3_id}_1667490961-secondary",
                        ],
                        "id": "3333333",
                    },
                },
                "mediapackage": {
                    "channel": {"id": f"test_{live3_id}_1667490961"},
                    "endpoints": {
                        "hls": {
                            "id": f"test_{live3_id}_1667490961_hls",
                            "url": (
                                "https://xxx.mediapackage.eu-west-1.amazonaws.com/out/v1/xxx/"
                                f"test_{live3_id}_1667490961_hls.m3u8"
                            ),
                        }
                    },
                },
                "started_at": time_utils.to_timestamp(
                    datetime(2022, 11, 4, 13, 25, tzinfo=timezone.utc)
                ),
                "stopped_at": time_utils.to_timestamp(
                    datetime(2022, 11, 4, 15, 25, tzinfo=timezone.utc)
                ),
            },
        )

        # Fourth live, started and stopped, without starting_at, but expired. Should be cleaned.
        live4_id = uuid.uuid4()
        live4 = VideoFactory(
            id=live4_id,
            live_state=STOPPED,
            live_type=JITSI,
            starting_at=None,
            title="live four",
            live_info={
                "medialive": {
                    "channel": {
                        "arn": "arn:aws:medialive:eu-west-1:xxx:channel:4444444",
                        "id": "4444444",
                    },
                    "input": {
                        "endpoints": [
                            f"rtmp://x.x.x.x:1935/{live4_id}_1667490961-primary",
                            f"rtmp://x.x.x.x:1935/{live4_id}_1667490961-secondary",
                        ],
                        "id": "4444444",
                    },
                },
                "mediapackage": {
                    "channel": {"id": f"test_{live4_id}_1667490961"},
                    "endpoints": {
                        "hls": {
                            "id": f"test_{live4_id}_1667490961_hls",
                            "url": (
                                "https://xxx.mediapackage.eu-west-1.amazonaws.com/out/v1/xxx/"
                                f"test_{live4_id}_1667490961_hls.m3u8"
                            ),
                        }
                    },
                },
                "started_at": time_utils.to_timestamp(
                    datetime(2022, 10, 14, 13, 25, tzinfo=timezone.utc)
                ),
                "stopped_at": time_utils.to_timestamp(
                    datetime(2022, 10, 14, 15, 25, tzinfo=timezone.utc)
                ),
            },
        )

        # Fifth live, started and stopped, with starting_at, but expired. Should be clean
        live5_id = uuid.uuid4()
        live5 = VideoFactory(
            id=live5_id,
            live_state=STOPPED,
            live_type=JITSI,
            starting_at=datetime(2022, 10, 14, 13, 25, tzinfo=timezone.utc),
            title="live five",
            live_info={
                "medialive": {
                    "channel": {
                        "arn": "arn:aws:medialive:eu-west-1:xxx:channel:4444444",
                        "id": "5555555",
                    },
                    "input": {
                        "endpoints": [
                            f"rtmp://x.x.x.x:1935/{live5_id}_1667490961-primary",
                            f"rtmp://x.x.x.x:1935/{live5_id}_1667490961-secondary",
                        ],
                        "id": "5555555",
                    },
                },
                "mediapackage": {
                    "channel": {"id": f"test_{live5_id}_1667490961"},
                    "endpoints": {
                        "hls": {
                            "id": f"test_{live5_id}_1667490961_hls",
                            "url": (
                                "https://xxx.mediapackage.eu-west-1.amazonaws.com/out/v1/xxx/"
                                f"test_{live5_id}_1667490961_hls.m3u8"
                            ),
                        }
                    },
                },
                "started_at": time_utils.to_timestamp(
                    datetime(2022, 10, 14, 13, 25, tzinfo=timezone.utc)
                ),
                "stopped_at": time_utils.to_timestamp(
                    datetime(2022, 10, 14, 15, 25, tzinfo=timezone.utc)
                ),
            },
        )

        # Run command
        out = StringIO()
        with mock.patch.object(
            clean_aws_elemental_stack,
            "generate_expired_date",
            return_value=datetime(2022, 11, 1, 15, 00, tzinfo=timezone.utc),
        ), mock.patch.object(
            clean_aws_elemental_stack, "list_medialive_channels"
        ) as list_medialive_channels_mock, mock.patch.object(
            clean_aws_elemental_stack, "delete_medialive_stack"
        ) as delete_medialive_stack_mock:
            # live 4
            live4_do_delete = {
                "Id": "4444444",
                "Name": f"test_{live4_id}_1667490961",
                "Tags": {"environment": "test"},
                "State": "IDLE",
            }
            # live 5
            live5_to_delete = {
                "Id": "5555555",
                "Name": f"test_{live5_id}_1667490961",
                "Tags": {"environment": "test"},
                "State": "IDLE",
            }
            list_medialive_channels_mock.return_value = [
                # medialive channels not in the same AWS_BASE_NAME environment
                {
                    "Id": "111111",
                    "Name": f"foo_{uuid.uuid4()}_1667490961",
                    "Tags": {"environment": "foo"},
                    "State": "IDLE",
                },
                # live 2
                {
                    "Id": "2222222",
                    "Name": f"test_{live2_id}_1667490961",
                    "Tags": {"environment": "test"},
                    "State": "RUNNING",
                },
                # live 3
                {
                    "Id": "3333333",
                    "Name": f"test_{live3_id}_1667490961",
                    "Tags": {"environment": "test"},
                    "State": "IDLE",
                },
                live4_do_delete,
                live5_to_delete,
            ]

            call_command("clean_aws_elemental_stack", stdout=out)
            delete_medialive_stack_mock.assert_any_call(live4_do_delete, mock.ANY)
            delete_medialive_stack_mock.assert_any_call(live5_to_delete, mock.ANY)
            self.assertEqual(delete_medialive_stack_mock.call_count, 2)

            self.assertNotIn(f"Checking video {live1.id}", out.getvalue())
            self.assertNotIn(f"Checking video {live2.id}", out.getvalue())
            self.assertIn(f"Checking video {live3.id}", out.getvalue())
            self.assertIn(f"Checking video {live4.id}", out.getvalue())
            self.assertIn(f"Checking video {live5.id}", out.getvalue())

            # Refresh all video from db
            live1.refresh_from_db()
            live2.refresh_from_db()
            live3.refresh_from_db()
            live4.refresh_from_db()
            live5.refresh_from_db()

            # Live 1, 2 and 3 should not have been updated
            self.assertEqual(live1.live_state, IDLE)
            self.assertEqual(live2.live_state, RUNNING)
            self.assertEqual(live3.live_state, STOPPED)

            # Live 4 and 5 should have been updated
            self.assertEqual(live4.live_state, ENDED)
            self.assertEqual(live4.upload_state, DELETED)
            self.assertEqual(
                live4.live_info,
                {
                    "started_at": time_utils.to_timestamp(
                        datetime(2022, 10, 14, 13, 25, tzinfo=timezone.utc)
                    ),
                    "stopped_at": time_utils.to_timestamp(
                        datetime(2022, 10, 14, 15, 25, tzinfo=timezone.utc)
                    ),
                },
            )

            self.assertEqual(live5.live_state, ENDED)
            self.assertEqual(live5.upload_state, DELETED)
            self.assertEqual(
                live5.live_info,
                {
                    "started_at": time_utils.to_timestamp(
                        datetime(2022, 10, 14, 13, 25, tzinfo=timezone.utc)
                    ),
                    "stopped_at": time_utils.to_timestamp(
                        datetime(2022, 10, 14, 15, 25, tzinfo=timezone.utc)
                    ),
                },
            )

        out.close()

    def test_clean_aws_elemental_stack_with_live_referenced_by_two_medialive_channels(
        self,
    ):
        """
        When list_medialive_channels contains medialive channels pointing to the
        same live, the command should delete channels not referenced by the live.
        """

        # Create live
        live_id = uuid.uuid4()
        live = VideoFactory(
            id=live_id,
            live_state=STOPPED,
            live_type=JITSI,
            live_info={
                "medialive": {
                    "channel": {"id": "Channel2_Id"},
                    "endpoints": {
                        "hls": {
                            "id": f"test_{live_id}_1667490961_hls",
                            "url": (
                                "https://xxx.medialive.eu-west-1.amazonaws.com/out/v1/xxx/"
                                f"test_{live_id}_1667490961_hls.m3u8"
                            ),
                        }
                    },
                },
                "mediapackage": {
                    "channel": {"id": f"test_{live_id}_1667490961"},
                    "endpoints": {
                        "hls": {
                            "id": f"test_{live_id}_1667490961_hls",
                            "url": (
                                "https://xxx.mediapackage.eu-west-1.amazonaws.com/out/v1/xxx/"
                                f"test_{live_id}_1667490961_hls.m3u8"
                            ),
                        }
                    },
                },
                "started_at": time_utils.to_timestamp(
                    datetime(2022, 10, 14, 13, 25, tzinfo=timezone.utc)
                ),
                "stopped_at": time_utils.to_timestamp(
                    datetime(2022, 10, 14, 15, 25, tzinfo=timezone.utc)
                ),
            },
        )

        # Run command
        out = StringIO()
        with mock.patch.object(
            clean_aws_elemental_stack, "list_medialive_channels"
        ) as list_medialive_channels_mock, mock.patch.object(
            clean_aws_elemental_stack, "delete_medialive_stack"
        ) as delete_medialive_stack_mock:
            live_to_delete = {
                "Name": f"test_{live_id}_1667490961",
                "Tags": {"environment": "test"},
                "State": "IDLE",
                "Id": "99d60314-20f2-4847-84a4-d2f47bf7fe38",
                "InputAttachments": [
                    {
                        "InputId": "99d60314-20f2-4847-84a4-d2f47bf7fe38",
                    }
                ],
            }
            list_medialive_channels_mock.return_value = [
                live_to_delete,
            ]

            call_command("clean_aws_elemental_stack", stdout=out)
            delete_medialive_stack_mock.assert_any_call(live_to_delete, mock.ANY)
            self.assertEqual(delete_medialive_stack_mock.call_count, 1)

            self.assertIn(f"Checking video {live.id}", out.getvalue())
            self.assertIn(
                f"The video {live.id} is not attached to the channel {live_to_delete['Name']}",
                out.getvalue(),
            )

        out.close()

    def test_clean_aws_elemental_stack_with_medialive_channel_with_no_live_attached_to_channel(
        self,
    ):
        """
        When list_medialive_channels has a channel with no live corresponding to it,
        the command should delete this channel by calling delete_medialive_stack.
        """

        # Run command
        out = StringIO()
        with mock.patch.object(
            clean_aws_elemental_stack, "list_medialive_channels"
        ) as list_medialive_channels_mock, mock.patch.object(
            clean_aws_elemental_stack, "delete_medialive_stack"
        ) as delete_medialive_stack_mock:
            live_to_delete = {
                "Name": "test_99d60314-20f2-4847-84a4-d2f47bf7fe38_1667490961",
                "Tags": {"environment": "test"},
                "State": "IDLE",
                "Id": "99d60314-20f2-4847-84a4-d2f47bf7fe38",
                "InputAttachments": [
                    {
                        "InputId": "99d60314-20f2-4847-84a4-d2f47bf7fe38",
                    }
                ],
            }
            list_medialive_channels_mock.return_value = [
                live_to_delete,
            ]

            call_command("clean_aws_elemental_stack", stdout=out)
            delete_medialive_stack_mock.assert_any_call(live_to_delete, mock.ANY)
            self.assertEqual(delete_medialive_stack_mock.call_count, 1)
            self.assertIn(
                "Channel test_99d60314-20f2-4847-84a4-d2f47bf7fe38_1667490961 is attached "
                "to a video 99d60314-20f2-4847-84a4-d2f47bf7fe38 that does not exist\n",
                out.getvalue(),
            )
