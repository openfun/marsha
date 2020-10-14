"""Test medialive utils functions."""
from unittest import mock

from django.test import TestCase, override_settings

from botocore.stub import ANY, Stubber

from ..utils import medialive_utils


class MediaLiveUtilsTestCase(TestCase):
    """Test medialive utils."""

    maxDiff = None

    def test_get_or_create_input_security_group_create_one(self):
        """Create a security group when no group already exists."""
        list_security_group_response = {"InputSecurityGroups": []}

        created_security_group_response = {
            "SecurityGroup": {
                "Arn": "string",
                "Id": "security_id",
                "Inputs": ["string"],
                "State": "IDLE",
                "Tags": {"marsha_live": "1"},
                "WhitelistRules": [{"Cidr": "0.0.0.0/0"}],
            }
        }

        with Stubber(medialive_utils.medialive_client) as medialive_stubber:
            medialive_stubber.add_response(
                "list_input_security_groups",
                service_response=list_security_group_response,
                expected_params={},
            )
            medialive_stubber.add_response(
                "create_input_security_group",
                service_response=created_security_group_response,
                expected_params={
                    "WhitelistRules": [{"Cidr": "0.0.0.0/0"}],
                    "Tags": {"marsha_live": "1"},
                },
            )

            security_group_id = medialive_utils.get_or_create_input_security_group()

            medialive_stubber.assert_no_pending_responses()

        self.assertEqual("security_id", security_group_id)

    def test_get_or_create_input_security_group_no_matching_tag(self):
        """Create a security group when no matching tag."""
        list_security_group_response = {
            "InputSecurityGroups": [
                {
                    "Arn": "string",
                    "Id": "no_tag_security_group",
                    "Inputs": ["string"],
                    "State": "IDLE",
                    "Tags": {},
                    "WhitelistRules": [{"Cidr": "0.0.0.0/0"}],
                }
            ]
        }

        created_security_group_response = {
            "SecurityGroup": {
                "Arn": "string",
                "Id": "security_id",
                "Inputs": ["string"],
                "State": "IDLE",
                "Tags": {"marsha_live": "1"},
                "WhitelistRules": [{"Cidr": "0.0.0.0/0"}],
            }
        }

        with Stubber(medialive_utils.medialive_client) as medialive_stubber:
            medialive_stubber.add_response(
                "list_input_security_groups",
                service_response=list_security_group_response,
                expected_params={},
            )
            medialive_stubber.add_response(
                "create_input_security_group",
                service_response=created_security_group_response,
                expected_params={
                    "WhitelistRules": [{"Cidr": "0.0.0.0/0"}],
                    "Tags": {"marsha_live": "1"},
                },
            )

            security_group_id = medialive_utils.get_or_create_input_security_group()

            medialive_stubber.assert_no_pending_responses()

        self.assertEqual("security_id", security_group_id)

    def test_get_or_create_input_security_group_matching_tag(self):
        """Return an existing input security group matching marsha_live tag."""
        list_security_group_response = {
            "InputSecurityGroups": [
                {
                    "Arn": "string",
                    "Id": "tagged_security_group",
                    "Inputs": ["string"],
                    "State": "IDLE",
                    "Tags": {"marsha_live": "1"},
                    "WhitelistRules": [{"Cidr": "0.0.0.0/0"}],
                }
            ]
        }

        with Stubber(medialive_utils.medialive_client) as medialive_stubber:
            medialive_stubber.add_response(
                "list_input_security_groups",
                service_response=list_security_group_response,
                expected_params={},
            )

            security_group_id = medialive_utils.get_or_create_input_security_group()

            medialive_stubber.assert_no_pending_responses()

        self.assertEqual("tagged_security_group", security_group_id)

    @override_settings(AWS_BASE_NAME="test")
    def test_create_mediapackage_channel(self):
        """Create an AWS mediapackage channel."""
        key = "video-key"

        ssm_response = {"Version": 1, "Tier": "Standard"}
        mediapackage_create_channel_response = {
            "Id": f"test_{key}",
            "HlsIngest": {
                "IngestEndpoints": [
                    {
                        "Id": "ingest1",
                        "Password": "password1",
                        "Url": "https://endpoint1/channel",
                        "Username": "user1",
                    },
                    {
                        "Id": "ingest2",
                        "Password": "password2",
                        "Url": "https://endpoint2/channel",
                        "Username": "user2",
                    },
                ]
            },
        }
        mediapackage_create_hls_origin_endpoint_response = {
            "ChannelId": "channel1",
            "Url": "https://endpoint1/channel.m3u8",
            "Id": "enpoint1",
        }
        with Stubber(
            medialive_utils.mediapackage_client
        ) as mediapackage_stubber, Stubber(medialive_utils.ssm_client) as ssm_stubber:
            mediapackage_stubber.add_response(
                "create_channel",
                service_response=mediapackage_create_channel_response,
                expected_params={"Id": f"test_{key}", "Tags": {"environment": "test"}},
            )
            ssm_stubber.add_response(
                "put_parameter",
                service_response=ssm_response,
                expected_params={
                    "Name": "test_user1",
                    "Description": "video-key MediaPackage Primary Ingest Username",
                    "Value": "password1",
                    "Type": "String",
                    "Tags": [{"Key": "environment", "Value": "test"}],
                },
            )
            ssm_stubber.add_response(
                "put_parameter",
                service_response=ssm_response,
                expected_params={
                    "Name": "test_user2",
                    "Description": "video-key MediaPackage Secondary Ingest Username",
                    "Value": "password2",
                    "Type": "String",
                    "Tags": [{"Key": "environment", "Value": "test"}],
                },
            )
            mediapackage_stubber.add_response(
                "create_origin_endpoint",
                service_response=mediapackage_create_hls_origin_endpoint_response,
                expected_params={
                    "ChannelId": f"test_{key}",
                    "Id": "test_video-key_hls",
                    "ManifestName": "test_video-key_hls",
                    "StartoverWindowSeconds": 86400,
                    "TimeDelaySeconds": 0,
                    "HlsPackage": {
                        "AdMarkers": "PASSTHROUGH",
                        "IncludeIframeOnlyStream": False,
                        "PlaylistType": "EVENT",
                        "PlaylistWindowSeconds": 5,
                        "ProgramDateTimeIntervalSeconds": 0,
                        "SegmentDurationSeconds": 1,
                    },
                    "Tags": {"environment": "test"},
                },
            )

            [channel, hls_endpoint] = medialive_utils.create_mediapackage_channel(key)

            mediapackage_stubber.assert_no_pending_responses()
            ssm_stubber.assert_no_pending_responses()

        self.assertEqual(channel, mediapackage_create_channel_response)
        self.assertEqual(hls_endpoint, mediapackage_create_hls_origin_endpoint_response)

    @override_settings(AWS_BASE_NAME="test")
    def test_create_medialive_input(self):
        """Create and return an AWS medialive input."""
        key = "video-key"

        medialive_create_input_response = {
            "Input": {
                "Id": "input1",
                "Destinations": [
                    {"Url": "rtmp://destination1/video-key-primary"},
                    {"Url": "rtmp://destination2/video-key-secondary"},
                ],
            },
        }

        with Stubber(
            medialive_utils.medialive_client
        ) as medialive_stubber, mock.patch.object(
            medialive_utils,
            "get_or_create_input_security_group",
            return_value="security_group_1",
        ):
            medialive_stubber.add_response(
                "create_input",
                service_response=medialive_create_input_response,
                expected_params={
                    "InputSecurityGroups": ["security_group_1"],
                    "Name": f"test_{key}",
                    "Type": "RTMP_PUSH",
                    "Destinations": [
                        {"StreamName": "video-key-primary"},
                        {"StreamName": "video-key-secondary"},
                    ],
                    "Tags": {"environment": "test"},
                },
            )

            response = medialive_utils.create_medialive_input(key)
            medialive_stubber.assert_no_pending_responses()

        self.assertEqual(response, medialive_create_input_response)

    @override_settings(AWS_MEDIALIVE_ROLE_ARN="medialive:role:arn")
    @override_settings(AWS_BASE_NAME="test")
    def test_create_medialive_channel(self):
        """Create an AWS medialive channel."""
        key = "video-key"

        medialive_input = {
            "Input": {"Id": "input1"},
        }
        mediapackage_channel = {
            "Id": "channel1",
            "HlsIngest": {
                "IngestEndpoints": [
                    {
                        "Id": "ingest1",
                        "Password": "password1",
                        "Url": "https://endpoint1/channel",
                        "Username": "user1",
                    },
                    {
                        "Id": "ingest2",
                        "Password": "password2",
                        "Url": "https://endpoint2/channel",
                        "Username": "user2",
                    },
                ]
            },
        }
        medialive_channel_response = {"Channel": {"Id": "medialive_channel1"}}

        with Stubber(medialive_utils.medialive_client) as medialive_stubber:
            medialive_stubber.add_response(
                "create_channel",
                service_response=medialive_channel_response,
                expected_params={
                    "InputSpecification": {
                        "Codec": "AVC",
                        "Resolution": "HD",
                        "MaximumBitrate": "MAX_10_MBPS",
                    },
                    "InputAttachments": [{"InputId": "input1"}],
                    "Destinations": [
                        {
                            "Id": "destination1",
                            "Settings": [
                                {
                                    "PasswordParam": "test_user1",
                                    "Url": "https://endpoint1/channel",
                                    "Username": "user1",
                                },
                                {
                                    "PasswordParam": "test_user2",
                                    "Url": "https://endpoint2/channel",
                                    "Username": "user2",
                                },
                            ],
                        }
                    ],
                    "Name": f"test_{key}",
                    "RoleArn": "medialive:role:arn",
                    "EncoderSettings": ANY,
                    "Tags": {"environment": "test"},
                },
            )

            response = medialive_utils.create_medialive_channel(
                key, medialive_input, mediapackage_channel
            )
            medialive_stubber.assert_no_pending_responses()

        self.assertEqual(medialive_channel_response, response)

    def test_create_live_stream(self):
        """Should create all AWS medialive stack."""
        key = "video-key"

        with mock.patch.object(
            medialive_utils, "create_mediapackage_channel"
        ) as mock_mediapackage_channel, mock.patch.object(
            medialive_utils, "create_medialive_input"
        ) as mock_medialive_input, mock.patch.object(
            medialive_utils, "create_medialive_channel"
        ) as mock_medialive_channel:
            mock_mediapackage_channel.return_value = [
                {
                    "Id": "channel1",
                    "HlsIngest": {
                        "IngestEndpoints": [
                            {
                                "Id": "ingest1",
                                "Password": "password1",
                                "Url": "https://endpoint1/channel",
                                "Username": "user1",
                            },
                            {
                                "Id": "ingest2",
                                "Password": "password2",
                                "Url": "https://endpoint2/channel",
                                "Username": "user2",
                            },
                        ]
                    },
                },
                {
                    "ChannelId": "channel1",
                    "Url": "https://endpoint1/channel.m3u8",
                    "Id": "enpoint1",
                },
            ]
            mock_medialive_input.return_value = {
                "Input": {
                    "Id": "input1",
                    "Destinations": [
                        {"Url": "rtmp://destination1/video-key-primary"},
                        {"Url": "rtmp://destination2/video-key-secondary"},
                    ],
                },
            }
            mock_medialive_channel.return_value = {
                "Channel": {
                    "Arn": "/aws/lambda/dev-test-marsha-medialive",
                    "Id": "medialive_channel1",
                }
            }

            response = medialive_utils.create_live_stream(key)

        self.assertEqual(
            response,
            {
                "medialive": {
                    "input": {
                        "id": "input1",
                        "endpoints": [
                            "rtmp://destination1/video-key-primary",
                            "rtmp://destination2/video-key-secondary",
                        ],
                    },
                    "channel": {
                        "arn": "/aws/lambda/dev-test-marsha-medialive",
                        "id": "medialive_channel1",
                    },
                },
                "mediapackage": {
                    "channel": {"id": "channel1"},
                    "endpoints": {
                        "hls": {
                            "id": "enpoint1",
                            "url": "https://endpoint1/channel.m3u8",
                        },
                    },
                },
            },
        )
