"""Test send_vod_convert_reminders command."""
from datetime import datetime, timedelta
from io import StringIO
from unittest import mock

from django.core import mail
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from marsha.core.defaults import HARVESTED, IDLE, JITSI, RUNNING, STOPPED
from marsha.core.factories import VideoFactory
from marsha.core.management.commands import send_vod_convert_reminders
from marsha.core.utils.time_utils import to_timestamp


# pylint: disable=too-many-locals


class SendVodConvertRemindersCommandTest(TestCase):
    """Test send_vod_convert_reminders command."""

    maxDiff = None

    def test_send_vod_convert_reminders(self):
        """Test send_vod_convert_reminders command."""
        expiration_reminder_date = datetime(2022, 11, 1, 15, 00, tzinfo=timezone.utc)

        start = timezone.now() - timedelta(minutes=20)
        stop = start + timedelta(minutes=10)

        # first live not started yet, should not be reminded.
        live1 = VideoFactory(
            live_state=IDLE,
            live_type=JITSI,
            starting_at=expiration_reminder_date - timedelta(days=1),
            title="live one",
            live_info=None,  # live has never been started
            recording_slices=[
                {"start": to_timestamp(start), "stop": to_timestamp(stop)}
            ],
        )
        # medialive channels not in the same AWS_BASE_NAME environment
        medialive_channel_1 = {
            "Id": "111111",
            "Name": f"foo_{live1.id}_1667490961",
            "Tags": {"environment": "foo"},
            "State": "IDLE",
        }

        # Second live, started but still running, should not be reminded
        live2 = VideoFactory(
            live_state=RUNNING,
            live_type=JITSI,
            starting_at=expiration_reminder_date - timedelta(days=1),
            title="live two",
            live_info={},
            recording_slices=[
                {"start": to_timestamp(start), "stop": to_timestamp(stop)}
            ],
        )
        medialive_channel_2 = {
            "Id": "2222222",
            "Name": f"test_{live2.id}_1667490961",
            "Tags": {"environment": "test"},
            "State": "RUNNING",
        }

        # Third live, started and stopped soon. Should not be reminded
        live3 = VideoFactory(
            live_state=STOPPED,
            live_type=JITSI,
            starting_at=expiration_reminder_date + timedelta(days=1),
            title="live three",
            live_info={
                "started_at": to_timestamp(
                    expiration_reminder_date + timedelta(days=1)
                ),
                "live_stopped_with_email": "user@example.com",
            },
            recording_slices=[
                {"start": to_timestamp(start), "stop": to_timestamp(stop)}
            ],
        )
        medialive_channel_3 = {
            "Id": "3333333",
            "Name": f"test_{live3.id}_1667490961",
            "Tags": {"environment": "test"},
            "State": "IDLE",
        }

        # Fourth live, started and stopped, without starting_at, but expired. Should be reminded.
        live4 = VideoFactory(
            live_state=STOPPED,
            live_type=JITSI,
            starting_at=None,
            title="live four",
            live_info={
                "started_at": to_timestamp(
                    expiration_reminder_date - timedelta(days=1)
                ),
                "live_stopped_with_email": "user@example.com",
            },
            recording_slices=[
                {"start": to_timestamp(start), "stop": to_timestamp(stop)}
            ],
        )
        medialive_channel_4 = {
            "Id": "4444444",
            "Name": f"test_{live4.id}_1667490961",
            "Tags": {"environment": "test"},
            "State": "IDLE",
        }

        # Fifth live, started and stopped, with starting_at, but expired. Should be reminded.
        live5 = VideoFactory(
            live_state=STOPPED,
            live_type=JITSI,
            starting_at=expiration_reminder_date - timedelta(days=1),
            title="live five",
            live_info={
                "started_at": to_timestamp(
                    expiration_reminder_date - timedelta(days=1)
                ),
                "live_stopped_with_email": "user@example.com",
            },
            recording_slices=[
                {"start": to_timestamp(start), "stop": to_timestamp(stop)}
            ],
        )
        medialive_channel_5 = {
            "Id": "5555555",
            "Name": f"test_{live5.id}_1667490961",
            "Tags": {"environment": "test"},
            "State": "IDLE",
        }

        # Sixth live, started and stopped, with expired starting_at, but no recording slices.
        # Should not be reminded.
        live6 = VideoFactory(
            live_state=STOPPED,
            live_type=JITSI,
            starting_at=expiration_reminder_date - timedelta(days=1),
            title="live six",
            live_info={
                "started_at": to_timestamp(
                    expiration_reminder_date - timedelta(days=1)
                ),
                "live_stopped_with_email": "user@example.com",
            },
            recording_slices=[],
        )
        medialive_channel_6 = {
            "Id": "5555555",
            "Name": f"test_{live6.id}_1667490961",
            "Tags": {"environment": "test"},
            "State": "IDLE",
        }

        # Seventh live, started and stopped, with expired starting_at and recording slices, but
        # already harvested. Should not be reminded.
        live7 = VideoFactory(
            live_state=HARVESTED,
            live_type=JITSI,
            starting_at=expiration_reminder_date - timedelta(days=1),
            title="live seven",
            live_info={
                "started_at": to_timestamp(
                    expiration_reminder_date - timedelta(days=1)
                ),
                "live_stopped_with_email": "user@example.com",
            },
            recording_slices=[
                {"start": to_timestamp(start), "stop": to_timestamp(stop)}
            ],
        )
        medialive_channel_7 = {
            "Id": "5555555",
            "Name": f"test_{live7.id}_1667490961",
            "Tags": {"environment": "test"},
            "State": "IDLE",
        }

        # Run command
        out = StringIO()
        with mock.patch.object(
            send_vod_convert_reminders,
            "generate_expiration_reminder_date",
            return_value=expiration_reminder_date,
        ), mock.patch.object(
            send_vod_convert_reminders, "list_medialive_channels"
        ) as list_medialive_channels_mock:
            list_medialive_channels_mock.return_value = [
                medialive_channel_1,
                medialive_channel_2,
                medialive_channel_3,
                medialive_channel_4,
                medialive_channel_5,
                medialive_channel_6,
                medialive_channel_7,
            ]

            call_command("send_vod_convert_reminders", stdout=out)

            # check email has been sent
            self.assertEqual(len(mail.outbox), 2)
            self.assertEqual(
                mail.outbox[0].subject,
                f"Live Stream will be deleted soon - {live4.title}",
            )
            self.assertEqual(
                mail.outbox[1].subject,
                f"Live Stream will be deleted soon - {live5.title}",
            )

        out.close()
