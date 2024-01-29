"""Test medialive utils functions."""

from datetime import datetime, timezone
from io import StringIO
from unittest import mock

from django.core.management.base import OutputWrapper
from django.test import TestCase, override_settings

from botocore.stub import Stubber

from marsha.core.factories import VideoFactory
from marsha.core.utils import medialive_utils


# pylint: disable=too-many-lines


# pylint: disable=too-many-lines


class MediaLiveUtilsTestCase(TestCase):
    """Test medialive utils."""

    maxDiff = None

    def test_delete_aws_elemental_stack(self):
        """Should delete all resources used during a live."""
        video = VideoFactory(
            live_info={
                "medialive": {
                    "input": {"id": "medialive_input1"},
                    "channel": {"id": "medialive_channel1"},
                },
                "mediapackage": {
                    "endpoints": {
                        "hls": {"id": "mediapackage_endpoint1"},
                    },
                    "channel": {"id": "mediapackage_channel1"},
                },
            }
        )

        with Stubber(medialive_utils.medialive_client) as medialive_stubber:
            medialive_stubber.add_response(
                "delete_channel",
                expected_params={"ChannelId": "medialive_channel1"},
                service_response={},
            )
            medialive_stubber.add_response(
                "describe_input",
                expected_params={"InputId": "medialive_input1"},
                service_response={"State": "DETACHED"},
            )
            medialive_stubber.add_response(
                "delete_input",
                expected_params={"InputId": "medialive_input1"},
                service_response={},
            )

            medialive_utils.delete_aws_element_stack(video)
            medialive_stubber.assert_no_pending_responses()

    @override_settings(AWS_MEDIALIVE_INPUT_WAITER_DELAY=0)
    @override_settings(AWS_MEDIALIVE_INPUT_WAITER_MAX_ATTEMPTS=0)
    def test_delete_aws_elemental_stack_waiter_attempts_exceeded(self):
        """Medialive channel should be deleted and input waiter raised a WaiterError.
        The function should not fail but sentry should capture the exception."""
        video = VideoFactory(
            live_info={
                "medialive": {
                    "input": {"id": "medialive_input1"},
                    "channel": {"id": "medialive_channel1"},
                },
                "mediapackage": {
                    "endpoints": {
                        "hls": {"id": "mediapackage_endpoint1"},
                    },
                    "channel": {"id": "mediapackage_channel1"},
                },
            }
        )

        with Stubber(
            medialive_utils.medialive_client
        ) as medialive_stubber, mock.patch.object(
            medialive_utils.medialive_delete_utils, "capture_exception"
        ) as mock_capture_exception:
            medialive_stubber.add_response(
                "delete_channel",
                expected_params={"ChannelId": "medialive_channel1"},
                service_response={},
            )
            medialive_stubber.add_response(
                "describe_input",
                expected_params={"InputId": "medialive_input1"},
                service_response={"State": "ATTACHED"},
            )

            medialive_utils.delete_aws_element_stack(video)
            medialive_stubber.assert_no_pending_responses()
            mock_capture_exception.assert_called_once()

    def test_delete_mediapackage_channel(self):
        """Should delete a mediapackage channel and related enpoints."""
        with Stubber(
            medialive_utils.mediapackage_client
        ) as mediapackage_client_stubber:
            mediapackage_client_stubber.add_response(
                "list_origin_endpoints",
                service_response={"OriginEndpoints": [{"Id": "1"}, {"Id": "2"}]},
                expected_params={"ChannelId": "1"},
            )
            mediapackage_client_stubber.add_response(
                "delete_origin_endpoint",
                service_response={},
                expected_params={"Id": "1"},
            )
            mediapackage_client_stubber.add_response(
                "delete_origin_endpoint",
                service_response={},
                expected_params={"Id": "2"},
            )
            mediapackage_client_stubber.add_response(
                "delete_channel",
                service_response={},
                expected_params={"Id": "1"},
            )
            deleted_endpoints = medialive_utils.delete_mediapackage_channel("1")
            mediapackage_client_stubber.assert_no_pending_responses()
        self.assertEqual(deleted_endpoints, ["1", "2"])

    def test_delete_medialive_stack_on_running_channel(self):
        """Should stop the medialive channel then delete the stack."""
        out = StringIO()
        live_to_delete = {
            "Name": "dev-bar_99d60314-20f2-4847-84a4-d2f47bf7fe38_1629982356",
            "Tags": {"environment": "test"},
            "Id": "562345",
            "State": "Running",
            "InputAttachments": [
                {
                    "InputId": "876294",
                }
            ],
        }

        with mock.patch(
            "django.utils.timezone.now",
            return_value=datetime(2021, 8, 26, 13, 25, tzinfo=timezone.utc),
        ), Stubber(
            medialive_utils.medialive_client
        ) as mediapackage_client_stubber, mock.patch.object(
            medialive_utils.medialive_delete_utils, "delete_mediapackage_channel"
        ) as delete_mediapackage_channel_mock:
            mediapackage_client_stubber.add_response(
                "stop_channel",
                expected_params={"ChannelId": "562345"},
                service_response={},
            )
            mediapackage_client_stubber.add_response(
                "describe_channel",
                expected_params={"ChannelId": "562345"},
                service_response={"State": "IDLE"},
            )
            mediapackage_client_stubber.add_response(
                "delete_channel",
                expected_params={"ChannelId": "562345"},
                service_response={},
            )

            mediapackage_client_stubber.add_response(
                "describe_input",
                expected_params={"InputId": "876294"},
                service_response={"State": "DETACHED"},
            )
            mediapackage_client_stubber.add_response(
                "delete_input",
                expected_params={"InputId": "876294"},
                service_response={},
            )

            medialive_utils.delete_medialive_stack(live_to_delete, OutputWrapper(out))
            delete_mediapackage_channel_mock.assert_called_once_with(
                "dev-bar_99d60314-20f2-4847-84a4-d2f47bf7fe38_1629982356"
            )
        self.assertEqual(
            (
                "Cleaning stack with name "
                "dev-bar_99d60314-20f2-4847-84a4-d2f47bf7fe38_1629982356\n"
                "Medialive channel is running, we must stop it first.\n"
                "Stack with name "
                "dev-bar_99d60314-20f2-4847-84a4-d2f47bf7fe38_1629982356 deleted\n"
            ),
            out.getvalue(),
        )
        out.close()

    def test_delete_medialive_stack_on_stopped_channel(self):
        """Should delete a medialive stack directly."""
        out = StringIO()
        live_to_delete = {
            "Name": "dev-bar_99d60314-20f2-4847-84a4-d2f47bf7fe38_1629982356",
            "Tags": {"environment": "test"},
            "Id": "562345",
            "State": "STOPPED",
            "InputAttachments": [
                {
                    "InputId": "876294",
                }
            ],
        }

        with mock.patch(
            "django.utils.timezone.now",
            return_value=datetime(2021, 8, 26, 13, 25, tzinfo=timezone.utc),
        ), Stubber(
            medialive_utils.medialive_client
        ) as mediapackage_client_stubber, mock.patch.object(
            medialive_utils.medialive_delete_utils, "delete_mediapackage_channel"
        ) as delete_mediapackage_channel_mock:
            mediapackage_client_stubber.add_response(
                "delete_channel",
                expected_params={"ChannelId": "562345"},
                service_response={},
            )
            mediapackage_client_stubber.add_response(
                "describe_input",
                expected_params={"InputId": "876294"},
                service_response={"State": "DETACHED"},
            )
            mediapackage_client_stubber.add_response(
                "delete_input",
                expected_params={"InputId": "876294"},
                service_response={},
            )

            mediapackage_client_stubber.add_response(
                "delete_input",
                expected_params={"InputId": "876294"},
                service_response={},
            )

            medialive_utils.delete_medialive_stack(live_to_delete, OutputWrapper(out))
            delete_mediapackage_channel_mock.assert_called_once_with(
                "dev-bar_99d60314-20f2-4847-84a4-d2f47bf7fe38_1629982356"
            )
        self.assertEqual(
            (
                "Cleaning stack with name "
                "dev-bar_99d60314-20f2-4847-84a4-d2f47bf7fe38_1629982356\n"
                "Stack with name "
                "dev-bar_99d60314-20f2-4847-84a4-d2f47bf7fe38_1629982356 deleted\n"
            ),
            out.getvalue(),
        )
        out.close()
