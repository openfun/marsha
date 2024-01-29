"""Test medialive utils functions."""

from django.test import TestCase

from botocore.stub import Stubber

from marsha.core.utils import medialive_utils


# pylint: disable=too-many-lines


# pylint: disable=too-many-lines


class MediaLiveUtilsTestCase(TestCase):
    """Test medialive utils."""

    maxDiff = None

    def test_list_mediapackage_channels(self):
        """Should recursively get all mediapackage channels."""
        with Stubber(
            medialive_utils.mediapackage_client
        ) as mediapackage_client_stubber:
            mediapackage_client_stubber.add_response(
                "list_channels",
                service_response={"Channels": [{"Id": "1"}], "NextToken": "next_token"},
                expected_params={},
            )
            mediapackage_client_stubber.add_response(
                "list_channels",
                service_response={"Channels": [{"Id": "2"}]},
                expected_params={"NextToken": "next_token"},
            )
            channels = medialive_utils.list_mediapackage_channels()
            mediapackage_client_stubber.assert_no_pending_responses()
        self.assertEqual(channels, [{"Id": "1"}, {"Id": "2"}])

    def test_list_mediapackage_channel_harvest_jobs(self):
        """Should recursively get all harvest job related to a mediapackage channel."""
        with Stubber(
            medialive_utils.mediapackage_client
        ) as mediapackage_client_stubber:
            mediapackage_client_stubber.add_response(
                "list_harvest_jobs",
                service_response={
                    "HarvestJobs": [{"Id": "1"}],
                    "NextToken": "next_token",
                },
                expected_params={"IncludeChannelId": "1"},
            )
            mediapackage_client_stubber.add_response(
                "list_harvest_jobs",
                service_response={"HarvestJobs": [{"Id": "2"}]},
                expected_params={"IncludeChannelId": "1", "NextToken": "next_token"},
            )
            harvest_jobs = medialive_utils.list_mediapackage_channel_harvest_jobs("1")
            mediapackage_client_stubber.assert_no_pending_responses()
        self.assertEqual(harvest_jobs, [{"Id": "1"}, {"Id": "2"}])

    def test_list_mediapackage_channel_origin_endpoints(self):
        """Should recursively get all origin endpoints related to a mediapackage channel."""
        with Stubber(
            medialive_utils.mediapackage_client
        ) as mediapackage_client_stubber:
            mediapackage_client_stubber.add_response(
                "list_origin_endpoints",
                service_response={
                    "OriginEndpoints": [{"Id": "1"}],
                    "NextToken": "next_token",
                },
                expected_params={"ChannelId": "1"},
            )
            mediapackage_client_stubber.add_response(
                "list_origin_endpoints",
                service_response={"OriginEndpoints": [{"Id": "2"}]},
                expected_params={"ChannelId": "1", "NextToken": "next_token"},
            )
            origin_endpoints = (
                medialive_utils.list_mediapackage_channel_origin_endpoints("1")
            )
            mediapackage_client_stubber.assert_no_pending_responses()
        self.assertEqual(origin_endpoints, [{"Id": "1"}, {"Id": "2"}])

    def test_list_medialive_channels(self):
        """Should recursively get all medialive channels."""
        with Stubber(medialive_utils.medialive_client) as medialive_client_stubber:
            medialive_client_stubber.add_response(
                "list_channels",
                service_response={"Channels": [{"Id": "1"}], "NextToken": "next_token"},
                expected_params={},
            )
            medialive_client_stubber.add_response(
                "list_channels",
                service_response={"Channels": [{"Id": "2"}]},
                expected_params={"NextToken": "next_token"},
            )
            channels = medialive_utils.list_medialive_channels()
            medialive_client_stubber.assert_no_pending_responses()
        self.assertEqual(channels, [{"Id": "1"}, {"Id": "2"}])

    def test_list_indexed_medialive_channels(self):
        """Should recursively get all medialive channels and index them by their name."""
        with Stubber(medialive_utils.medialive_client) as medialive_client_stubber:
            medialive_client_stubber.add_response(
                "list_channels",
                service_response={
                    "Channels": [{"Id": "1", "Name": "A"}],
                    "NextToken": "next_token",
                },
                expected_params={},
            )
            medialive_client_stubber.add_response(
                "list_channels",
                service_response={"Channels": [{"Id": "2", "Name": "B"}]},
                expected_params={"NextToken": "next_token"},
            )
            channels = medialive_utils.list_indexed_medialive_channels()
            medialive_client_stubber.assert_no_pending_responses()
        self.assertEqual(
            channels, {"A": {"Id": "1", "Name": "A"}, "B": {"Id": "2", "Name": "B"}}
        )
