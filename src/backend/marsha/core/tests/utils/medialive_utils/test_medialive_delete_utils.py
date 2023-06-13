"""Test medialive utils functions."""
from unittest import mock

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
    def test_delete_aws_elemental_stack_waiter_attemps_exceeded(self):
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
