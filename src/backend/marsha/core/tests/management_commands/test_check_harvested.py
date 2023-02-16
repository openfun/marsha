"""Tests for check_harvested command."""
from datetime import timedelta
from io import StringIO
from unittest import mock

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from botocore.stub import Stubber

from marsha.core.defaults import DELETED, HARVESTED, JITSI, PENDING
from marsha.core.factories import VideoFactory
from marsha.core.management.commands import check_harvested


class CheckWaitingLiveToVodTest(TestCase):
    """Test check_harvested command."""

    def test_check_harvested_no_video_to_process(self):
        """Command should do nothing when there is no video to process."""
        out = StringIO()
        with Stubber(check_harvested.s3_client) as s3_client_stubber:
            call_command("check_harvested", stdout=out)
            s3_client_stubber.assert_no_pending_responses()

        self.assertEqual("", out.getvalue())
        out.close()

    def test_check_harvested_video_to_process_and_expired(self):
        """Command should delete objects related to an expired video."""
        now = timezone.now()
        video = VideoFactory(
            id="9847c1c9-88a1-4afa-bce6-8a9d3ddd4e5b",
            live_state=HARVESTED,
            live_type=JITSI,
            upload_state=PENDING,
            starting_at=now,
        )

        out = StringIO()
        with Stubber(check_harvested.s3_client) as s3_client_stubber, mock.patch(
            "marsha.core.management.commands.check_harvested.generate_expired_date"
        ) as generate_expired_date_mock:
            s3_client_stubber.add_response(
                "list_objects_v2",
                service_response={
                    "Contents": [
                        {"Key": "object_key_1"},
                        {"Key": "object_key_2"},
                        {"Key": "object_key_3"},
                    ],
                    "KeyCount": 3,
                    "IsTruncated": False,
                },
                expected_params={
                    "Bucket": "test-marsha-destination",
                    "Prefix": "9847c1c9-88a1-4afa-bce6-8a9d3ddd4e5b",
                },
            )

            s3_client_stubber.add_response(
                "delete_objects",
                service_response={},
                expected_params={
                    "Bucket": "test-marsha-destination",
                    "Delete": {
                        "Objects": [
                            {"Key": "object_key_1"},
                            {"Key": "object_key_2"},
                            {"Key": "object_key_3"},
                        ],
                    },
                },
            )

            generate_expired_date_mock.return_value = now + timedelta(days=1)

            call_command("check_harvested", stdout=out)
            s3_client_stubber.assert_no_pending_responses()

        video.refresh_from_db()
        self.assertEqual(video.upload_state, DELETED)
        self.assertIn(
            "Processing video 9847c1c9-88a1-4afa-bce6-8a9d3ddd4e5b", out.getvalue()
        )
        out.close()

    def test_check_harvested_video_to_process_not_expired(self):
        """Command should do nothing when there is no video expired."""
        now = timezone.now()
        VideoFactory(
            id="9847c1c9-88a1-4afa-bce6-8a9d3ddd4e5b",
            live_state=HARVESTED,
            live_type=JITSI,
            upload_state=PENDING,
            starting_at=now,
        )
        out = StringIO()
        with Stubber(check_harvested.s3_client) as s3_client_stubber, mock.patch(
            "marsha.core.management.commands.check_harvested.generate_expired_date"
        ) as generate_expired_date_mock:
            generate_expired_date_mock.return_value = now - timedelta(days=1)
            call_command("check_harvested", stdout=out)
            s3_client_stubber.assert_no_pending_responses()

        self.assertEqual("", out.getvalue())
        out.close()

    def test_check_harvested_video_to_process_scheduled_not_expired(self):
        """Command should do nothing when there is no video expired."""
        now = timezone.now()
        VideoFactory(
            id="9847c1c9-88a1-4afa-bce6-8a9d3ddd4e5b",
            live_state=HARVESTED,
            live_type=JITSI,
            upload_state=PENDING,
            starting_at=now + timedelta(days=2),
            uploaded_on=now - timedelta(days=3),
        )
        out = StringIO()
        with Stubber(check_harvested.s3_client) as s3_client_stubber, mock.patch(
            "marsha.core.management.commands.check_harvested.generate_expired_date"
        ) as generate_expired_date_mock:
            generate_expired_date_mock.return_value = now + timedelta(days=1)
            call_command("check_harvested", stdout=out)
            s3_client_stubber.assert_no_pending_responses()

        self.assertEqual("", out.getvalue())
        out.close()
