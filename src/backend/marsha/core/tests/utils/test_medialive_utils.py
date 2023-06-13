"""Test medialive utils functions."""
from datetime import datetime, timedelta, timezone as baseTimezone
import json
from unittest import mock

from django.test import TestCase, override_settings
from django.utils import timezone

from botocore.stub import Stubber
import responses

from marsha.core.defaults import PENDING, PROCESSING, RAW, RUNNING
from marsha.core.factories import SharedLiveMediaFactory, VideoFactory
from marsha.core.utils import medialive_utils
from marsha.core.utils.time_utils import to_timestamp


# pylint: disable=too-many-lines


# pylint: disable=too-many-lines


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
    @override_settings(LIVE_SEGMENT_DURATION_SECONDS=5)
    @override_settings(LIVE_PLAYLIST_WINDOW_SECONDS=1)
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
                expected_params={
                    "Id": f"test_{key}",
                    "Tags": {"environment": "test", "app": "marsha"},
                },
            )
            ssm_stubber.add_response(
                "put_parameter",
                service_response=ssm_response,
                expected_params={
                    "Name": "test_user1",
                    "Description": "video-key MediaPackage Primary Ingest Username",
                    "Value": "password1",
                    "Type": "String",
                    "Tags": [
                        {"Key": "environment", "Value": "test"},
                        {"Key": "app", "Value": "marsha"},
                    ],
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
                    "Tags": [
                        {"Key": "environment", "Value": "test"},
                        {"Key": "app", "Value": "marsha"},
                    ],
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
                        "PlaylistWindowSeconds": 1,
                        "ProgramDateTimeIntervalSeconds": 0,
                        "SegmentDurationSeconds": 5,
                    },
                    "Tags": {"environment": "test", "app": "marsha"},
                },
            )

            [
                channel,
                hls_endpoint,
            ] = medialive_utils.create_mediapackage_channel(key)

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
            medialive_utils.medialive_create_utils,
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
                    "Tags": {"environment": "test", "app": "marsha"},
                },
            )

            response = medialive_utils.create_medialive_input(key)
            medialive_stubber.assert_no_pending_responses()

        self.assertEqual(response, medialive_create_input_response)

    @override_settings(AWS_MEDIALIVE_ROLE_ARN="medialive:role:arn")
    @override_settings(AWS_BASE_NAME="test")
    @override_settings(LIVE_GOP_SIZE=1)
    @override_settings(LIVE_FRAMERATE_DENOMINATOR=1100)
    @override_settings(LIVE_FRAMERATE_NUMERATOR=30000)
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
                    "EncoderSettings": {
                        "AvailConfiguration": {
                            "AvailSettings": {
                                "Scte35SpliceInsert": {
                                    "NoRegionalBlackoutFlag": "FOLLOW",
                                    "WebDeliveryAllowedFlag": "FOLLOW",
                                }
                            }
                        },
                        "AudioDescriptions": [
                            {
                                "AudioSelectorName": "default",
                                "AudioTypeControl": "FOLLOW_INPUT",
                                "CodecSettings": {
                                    "AacSettings": {
                                        "Bitrate": 64000,
                                        "RawFormat": "NONE",
                                        "Spec": "MPEG4",
                                    }
                                },
                                "LanguageCodeControl": "FOLLOW_INPUT",
                                "Name": "audio_1_aac64",
                            },
                            {
                                "AudioSelectorName": "default",
                                "AudioTypeControl": "FOLLOW_INPUT",
                                "CodecSettings": {
                                    "AacSettings": {
                                        "Bitrate": 96000,
                                        "RawFormat": "NONE",
                                        "Spec": "MPEG4",
                                    }
                                },
                                "LanguageCodeControl": "FOLLOW_INPUT",
                                "Name": "audio_1_aac96",
                            },
                            {
                                "AudioSelectorName": "default",
                                "AudioTypeControl": "FOLLOW_INPUT",
                                "CodecSettings": {
                                    "AacSettings": {
                                        "Bitrate": 96000,
                                        "RawFormat": "NONE",
                                        "Spec": "MPEG4",
                                    }
                                },
                                "LanguageCodeControl": "FOLLOW_INPUT",
                                "Name": "audio_2_aac96",
                            },
                        ],
                        "OutputGroups": [
                            {
                                "Name": "TN2224",
                                "OutputGroupSettings": {
                                    "HlsGroupSettings": {
                                        "AdMarkers": ["ELEMENTAL_SCTE35"],
                                        "CaptionLanguageMappings": [],
                                        "CaptionLanguageSetting": "OMIT",
                                        "ClientCache": "ENABLED",
                                        "CodecSpecification": "RFC_4281",
                                        "Destination": {
                                            "DestinationRefId": "destination1"
                                        },
                                        "DirectoryStructure": "SINGLE_DIRECTORY",
                                        "HlsCdnSettings": {
                                            "HlsBasicPutSettings": {
                                                "ConnectionRetryInterval": 30,
                                                "FilecacheDuration": 300,
                                                "NumRetries": 5,
                                                "RestartDelay": 5,
                                            }
                                        },
                                        "HlsId3SegmentTagging": "ENABLED",
                                        "IndexNSegments": 15,
                                        "InputLossAction": "EMIT_OUTPUT",
                                        "IvInManifest": "INCLUDE",
                                        "IvSource": "FOLLOWS_SEGMENT_NUMBER",
                                        "KeepSegments": 21,
                                        "ManifestCompression": "NONE",
                                        "ManifestDurationFormat": "FLOATING_POINT",
                                        "Mode": "LIVE",
                                        "OutputSelection": "MANIFESTS_AND_SEGMENTS",
                                        "ProgramDateTime": "INCLUDE",
                                        "ProgramDateTimePeriod": 600,
                                        "SegmentLength": 1,
                                        "SegmentationMode": "USE_SEGMENT_DURATION",
                                        "SegmentsPerSubdirectory": 10000,
                                        "StreamInfResolution": "INCLUDE",
                                        "TimedMetadataId3Frame": "PRIV",
                                        "TimedMetadataId3Period": 10,
                                        "TsFileMode": "SEGMENTED_FILES",
                                    }
                                },
                                "Outputs": [
                                    {
                                        "AudioDescriptionNames": ["audio_1_aac96"],
                                        "CaptionDescriptionNames": [],
                                        "OutputSettings": {
                                            "HlsOutputSettings": {
                                                "HlsSettings": {
                                                    "StandardHlsSettings": {
                                                        "AudioRenditionSets": "PROGRAM_AUDIO",
                                                        "M3u8Settings": {
                                                            "AudioFramesPerPes": 4,
                                                            "AudioPids": "492-498",
                                                            "EcmPid": "8182",
                                                            "PcrControl": "PCR_EVERY_PES_PACKET",
                                                            "PmtPid": "480",
                                                            "ProgramNum": 1,
                                                            "Scte35Behavior": "PASSTHROUGH",
                                                            "Scte35Pid": "500",
                                                            "TimedMetadataPid": "502",
                                                            "TimedMetadataBehavior": "NO_PASSTH"
                                                            "ROUGH",
                                                            "VideoPid": "481",
                                                        },
                                                    }
                                                },
                                                "NameModifier": "_960x540_2000k",
                                            }
                                        },
                                        "VideoDescriptionName": "video_854_480",
                                    },
                                    {
                                        "AudioDescriptionNames": ["audio_2_aac96"],
                                        "CaptionDescriptionNames": [],
                                        "OutputSettings": {
                                            "HlsOutputSettings": {
                                                "HlsSettings": {
                                                    "StandardHlsSettings": {
                                                        "AudioRenditionSets": "PROGRAM_AUDIO",
                                                        "M3u8Settings": {
                                                            "AudioFramesPerPes": 4,
                                                            "AudioPids": "492-498",
                                                            "EcmPid": "8182",
                                                            "PcrControl": "PCR_EVERY_PES_PACKET",
                                                            "PmtPid": "480",
                                                            "ProgramNum": 1,
                                                            "Scte35Behavior": "PASSTHROUGH",
                                                            "Scte35Pid": "500",
                                                            "TimedMetadataPid": "502",
                                                            "TimedMetadataBehavior": "NO_PASSTH"
                                                            "ROUGH",
                                                            "VideoPid": "481",
                                                        },
                                                    }
                                                },
                                                "NameModifier": "_1280x720_3300k",
                                            }
                                        },
                                        "VideoDescriptionName": "video_1280_720",
                                    },
                                    {
                                        "AudioDescriptionNames": ["audio_1_aac64"],
                                        "CaptionDescriptionNames": [],
                                        "OutputSettings": {
                                            "HlsOutputSettings": {
                                                "HlsSettings": {
                                                    "StandardHlsSettings": {
                                                        "AudioRenditionSets": "PROGRAM_AUDIO",
                                                        "M3u8Settings": {
                                                            "AudioFramesPerPes": 4,
                                                            "AudioPids": "492-498",
                                                            "EcmPid": "8182",
                                                            "PcrControl": "PCR_EVERY_PES_PACKET",
                                                            "PmtPid": "480",
                                                            "ProgramNum": 1,
                                                            "Scte35Behavior": "PASSTHROUGH",
                                                            "Scte35Pid": "500",
                                                            "TimedMetadataPid": "502",
                                                            "TimedMetadataBehavior": "NO_PASSTH"
                                                            "ROUGH",
                                                            "VideoPid": "481",
                                                        },
                                                    }
                                                },
                                                "NameModifier": "_416x234_200k",
                                            }
                                        },
                                        "VideoDescriptionName": "video_426_240",
                                    },
                                ],
                            }
                        ],
                        "TimecodeConfig": {"Source": "SYSTEMCLOCK"},
                        "VideoDescriptions": [
                            {
                                "CodecSettings": {
                                    "H264Settings": {
                                        "AdaptiveQuantization": "HIGH",
                                        "Bitrate": 350000,
                                        "ColorMetadata": "INSERT",
                                        "EntropyEncoding": "CAVLC",
                                        "FlickerAq": "ENABLED",
                                        "FramerateControl": "SPECIFIED",
                                        "FramerateDenominator": 1100,
                                        "FramerateNumerator": 30000,
                                        "GopBReference": "DISABLED",
                                        "GopNumBFrames": 2,
                                        "GopSize": 1,
                                        "GopSizeUnits": "SECONDS",
                                        "Level": "H264_LEVEL_3",
                                        "LookAheadRateControl": "HIGH",
                                        "ParControl": "INITIALIZE_FROM_SOURCE",
                                        "Profile": "MAIN",
                                        "RateControlMode": "CBR",
                                        "SceneChangeDetect": "ENABLED",
                                        "SpatialAq": "ENABLED",
                                        "Syntax": "DEFAULT",
                                        "TemporalAq": "ENABLED",
                                        "TimecodeInsertion": "DISABLED",
                                        "NumRefFrames": 1,
                                        "AfdSignaling": "NONE",
                                    }
                                },
                                "Height": 240,
                                "Name": "video_426_240",
                                "ScalingBehavior": "DEFAULT",
                                "Width": 426,
                                "RespondToAfd": "NONE",
                                "Sharpness": 50,
                            },
                            {
                                "CodecSettings": {
                                    "H264Settings": {
                                        "AdaptiveQuantization": "HIGH",
                                        "Bitrate": 1000000,
                                        "ColorMetadata": "INSERT",
                                        "EntropyEncoding": "CABAC",
                                        "FlickerAq": "ENABLED",
                                        "FramerateControl": "SPECIFIED",
                                        "FramerateDenominator": 1100,
                                        "FramerateNumerator": 30000,
                                        "GopBReference": "ENABLED",
                                        "GopNumBFrames": 2,
                                        "GopSize": 1,
                                        "GopSizeUnits": "SECONDS",
                                        "Level": "H264_LEVEL_4_1",
                                        "LookAheadRateControl": "HIGH",
                                        "ParControl": "INITIALIZE_FROM_SOURCE",
                                        "Profile": "HIGH",
                                        "RateControlMode": "CBR",
                                        "SceneChangeDetect": "ENABLED",
                                        "SpatialAq": "ENABLED",
                                        "Syntax": "DEFAULT",
                                        "TemporalAq": "ENABLED",
                                        "TimecodeInsertion": "DISABLED",
                                        "NumRefFrames": 1,
                                        "AfdSignaling": "NONE",
                                    }
                                },
                                "Height": 480,
                                "Name": "video_854_480",
                                "ScalingBehavior": "DEFAULT",
                                "Width": 854,
                                "RespondToAfd": "NONE",
                                "Sharpness": 50,
                            },
                            {
                                "CodecSettings": {
                                    "H264Settings": {
                                        "AdaptiveQuantization": "HIGH",
                                        "Bitrate": 3300000,
                                        "ColorMetadata": "INSERT",
                                        "EntropyEncoding": "CABAC",
                                        "FlickerAq": "ENABLED",
                                        "FramerateControl": "SPECIFIED",
                                        "FramerateDenominator": 1100,
                                        "FramerateNumerator": 30000,
                                        "GopBReference": "ENABLED",
                                        "GopNumBFrames": 2,
                                        "GopSize": 1,
                                        "GopSizeUnits": "SECONDS",
                                        "Level": "H264_LEVEL_4_1",
                                        "LookAheadRateControl": "HIGH",
                                        "ParControl": "INITIALIZE_FROM_SOURCE",
                                        "Profile": "HIGH",
                                        "RateControlMode": "CBR",
                                        "SceneChangeDetect": "ENABLED",
                                        "SpatialAq": "ENABLED",
                                        "Syntax": "DEFAULT",
                                        "TemporalAq": "ENABLED",
                                        "TimecodeInsertion": "DISABLED",
                                        "NumRefFrames": 1,
                                        "AfdSignaling": "NONE",
                                    }
                                },
                                "Height": 720,
                                "Name": "video_1280_720",
                                "ScalingBehavior": "DEFAULT",
                                "Width": 1280,
                                "RespondToAfd": "NONE",
                                "Sharpness": 50,
                            },
                        ],
                    },
                    "Tags": {"environment": "test", "app": "marsha"},
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
            medialive_utils.medialive_create_utils, "create_mediapackage_channel"
        ) as mock_mediapackage_channel, mock.patch.object(
            medialive_utils.medialive_create_utils, "create_medialive_input"
        ) as mock_medialive_input, mock.patch.object(
            medialive_utils.medialive_create_utils, "create_medialive_channel"
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
                    "Id": "endpoint1",
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
                            "id": "endpoint1",
                            "url": "https://endpoint1/channel.m3u8",
                        },
                    },
                },
            },
        )

    @override_settings(AWS_MEDIAPACKAGE_HARVEST_JOB_ARN="mediapackage:role:arn")
    @responses.activate
    def test_create_mediapackage_harvest_job_no_slice(self):
        """Should not create a mediapackage harvest job without recording slice."""
        video = VideoFactory(
            id="e19f1058-0bde-4f29-a5d8-e0b4ddf92b74",
            live_info={
                "medialive": {
                    "input": {"id": "medialive_input1"},
                    "channel": {"id": "medialive_channel1"},
                },
                "mediapackage": {
                    "endpoints": {
                        "hls": {
                            "id": "mediapackage_endpoint1",
                            "url": "https://channel_endpoint1/live.m3u8",
                        },
                    },
                    "channel": {
                        "id": "test_e19f1058-0bde-4f29-a5d8-e0b4ddf92b74_1569309880"
                    },
                },
                "started_at": "1569309880",
                "stopped_at": "1569310880",
            },
        )
        responses.add(
            responses.GET,
            "https://channel_endpoint1/live.m3u8",
            status=200,
        )

        with Stubber(
            medialive_utils.mediapackage_client
        ) as mediapackage_client_stubber:
            medialive_utils.create_mediapackage_harvest_job(video)
            mediapackage_client_stubber.assert_no_pending_responses()

        video.refresh_from_db()
        self.assertEqual(video.recording_slices, [])

    @override_settings(AWS_MEDIAPACKAGE_HARVEST_JOB_ARN="mediapackage:role:arn")
    @responses.activate
    def test_create_mediapackage_harvest_job_single_slice(self):
        """Should create a mediapackage harvest job for a single ."""
        start = timezone.now()
        stop = start + timedelta(minutes=10)
        video = VideoFactory(
            id="e19f1058-0bde-4f29-a5d8-e0b4ddf92b74",
            recording_slices=[
                {
                    "start": to_timestamp(start),
                    "stop": to_timestamp(stop),
                    "status": PENDING,
                }
            ],
            live_info={
                "medialive": {
                    "input": {"id": "medialive_input1"},
                    "channel": {"id": "medialive_channel1"},
                },
                "mediapackage": {
                    "endpoints": {
                        "hls": {
                            "id": "mediapackage_endpoint1",
                            "url": "https://channel_endpoint1/live.m3u8",
                        },
                    },
                    "channel": {
                        "id": "test_e19f1058-0bde-4f29-a5d8-e0b4ddf92b74_1569309880"
                    },
                },
                "started_at": "1569309880",
                "stopped_at": "1569310880",
            },
        )
        responses.add(
            responses.GET,
            "https://channel_endpoint1/live.m3u8",
            status=200,
        )

        with mock.patch.object(timezone, "now", return_value=stop), Stubber(
            medialive_utils.mediapackage_client
        ) as mediapackage_client_stubber:
            mediapackage_client_stubber.add_response(
                "create_harvest_job",
                expected_params={
                    "Id": "test_e19f1058-0bde-4f29-a5d8-e0b4ddf92b74_1569309880_1",
                    "StartTime": to_timestamp(start),
                    "EndTime": to_timestamp(stop),
                    "OriginEndpointId": "mediapackage_endpoint1",
                    "S3Destination": {
                        "BucketName": "test-marsha-destination",
                        "ManifestKey": "e19f1058-0bde-4f29-a5d8-e0b4ddf92b74/cmaf/slice_1/"
                        "1569309880_1.m3u8",
                        "RoleArn": "mediapackage:role:arn",
                    },
                },
                service_response={
                    "Arn": "string",
                    "ChannelId": "medialive_channel1",
                    "CreatedAt": str(stop),
                    "EndTime": str(stop),
                    "Id": "harvest_job1",
                    "OriginEndpointId": "mediapackage_endpoint1",
                    "S3Destination": {
                        "BucketName": "test-marsha-destination",
                        "ManifestKey": "e19f1058-0bde-4f29-a5d8-e0b4ddf92b74/cmaf/slice_1/"
                        "1569309880_1.m3u8",
                        "RoleArn": "mediapackage:role:arn",
                    },
                    "StartTime": str(start),
                    "Status": "IN_PROGRESS",
                },
            )
            medialive_utils.create_mediapackage_harvest_job(video)
            mediapackage_client_stubber.assert_no_pending_responses()

        video.refresh_from_db()
        self.assertEqual(
            video.recording_slices,
            [
                {
                    "start": to_timestamp(start),
                    "stop": to_timestamp(stop),
                    "status": PROCESSING,
                    "harvest_job_id": "harvest_job1",
                    "manifest_key": "e19f1058-0bde-4f29-a5d8-e0b4ddf92b74/cmaf/"
                    "slice_1/1569309880_1.m3u8",
                    "harvested_directory": "slice_1",
                }
            ],
        )

    @override_settings(AWS_MEDIAPACKAGE_HARVEST_JOB_ARN="mediapackage:role:arn")
    @responses.activate
    def test_create_mediapackage_harvest_job_multiple_slices(self):
        """Should create a mediapackage harvest job for multiple slices."""
        now = timezone.now()
        start_1 = now - timedelta(minutes=45)
        stop_1 = start_1 + timedelta(minutes=10)

        start_2 = stop_1 + timedelta(minutes=5)
        stop_2 = start_2 + timedelta(minutes=10)

        start_3 = stop_2 + timedelta(minutes=5)
        stop_3 = start_3 + timedelta(minutes=10)
        video = VideoFactory(
            id="e19f1058-0bde-4f29-a5d8-e0b4ddf92b74",
            recording_slices=[
                {
                    "start": to_timestamp(start_1),
                    "stop": to_timestamp(stop_1),
                    "status": PENDING,
                },
                {
                    "start": to_timestamp(start_2),
                    "stop": to_timestamp(stop_2),
                    "status": PENDING,
                },
                {
                    "start": to_timestamp(start_3),
                    "stop": to_timestamp(stop_3),
                    "status": PENDING,
                },
            ],
            live_info={
                "medialive": {
                    "input": {"id": "medialive_input1"},
                    "channel": {"id": "medialive_channel1"},
                },
                "mediapackage": {
                    "endpoints": {
                        "hls": {
                            "id": "mediapackage_endpoint1",
                            "url": "https://channel_endpoint1/live.m3u8",
                        },
                    },
                    "channel": {
                        "id": "test_e19f1058-0bde-4f29-a5d8-e0b4ddf92b74_1569309880"
                    },
                },
                "started_at": "1569309880",
                "stopped_at": "1569310880",
            },
        )
        responses.add(
            responses.GET,
            "https://channel_endpoint1/live.m3u8",
            status=200,
        )

        with mock.patch.object(timezone, "now", return_value=now), Stubber(
            medialive_utils.mediapackage_client
        ) as mediapackage_client_stubber:
            mediapackage_client_stubber.add_response(
                "create_harvest_job",
                expected_params={
                    "Id": "test_e19f1058-0bde-4f29-a5d8-e0b4ddf92b74_1569309880_1",
                    "StartTime": to_timestamp(start_1),
                    "EndTime": to_timestamp(stop_1),
                    "OriginEndpointId": "mediapackage_endpoint1",
                    "S3Destination": {
                        "BucketName": "test-marsha-destination",
                        "ManifestKey": "e19f1058-0bde-4f29-a5d8-e0b4ddf92b74/cmaf/"
                        "slice_1/1569309880_1.m3u8",
                        "RoleArn": "mediapackage:role:arn",
                    },
                },
                service_response={
                    "Arn": "string",
                    "ChannelId": "medialive_channel1",
                    "CreatedAt": str(now),
                    "EndTime": str(stop_1),
                    "Id": "harvest_job1",
                    "OriginEndpointId": "mediapackage_endpoint1",
                    "S3Destination": {
                        "BucketName": "test-marsha-destination",
                        "ManifestKey": "e19f1058-0bde-4f29-a5d8-e0b4ddf92b74/cmaf/"
                        "slice_1/1569309880_1.m3u8",
                        "RoleArn": "mediapackage:role:arn",
                    },
                    "StartTime": str(start_1),
                    "Status": "IN_PROGRESS",
                },
            )
            mediapackage_client_stubber.add_response(
                "create_harvest_job",
                expected_params={
                    "Id": "test_e19f1058-0bde-4f29-a5d8-e0b4ddf92b74_1569309880_2",
                    "StartTime": to_timestamp(start_2),
                    "EndTime": to_timestamp(stop_2),
                    "OriginEndpointId": "mediapackage_endpoint1",
                    "S3Destination": {
                        "BucketName": "test-marsha-destination",
                        "ManifestKey": "e19f1058-0bde-4f29-a5d8-e0b4ddf92b74/cmaf/"
                        "slice_2/1569309880_2.m3u8",
                        "RoleArn": "mediapackage:role:arn",
                    },
                },
                service_response={
                    "Arn": "string",
                    "ChannelId": "medialive_channel1",
                    "CreatedAt": str(now),
                    "EndTime": str(stop_2),
                    "Id": "harvest_job2",
                    "OriginEndpointId": "mediapackage_endpoint1",
                    "S3Destination": {
                        "BucketName": "test-marsha-destination",
                        "ManifestKey": "e19f1058-0bde-4f29-a5d8-e0b4ddf92b74/cmaf/"
                        "slice_2/1569309880_2.m3u8",
                        "RoleArn": "mediapackage:role:arn",
                    },
                    "StartTime": str(start_2),
                    "Status": "IN_PROGRESS",
                },
            )
            mediapackage_client_stubber.add_response(
                "create_harvest_job",
                expected_params={
                    "Id": "test_e19f1058-0bde-4f29-a5d8-e0b4ddf92b74_1569309880_3",
                    "StartTime": to_timestamp(start_3),
                    "EndTime": to_timestamp(stop_3),
                    "OriginEndpointId": "mediapackage_endpoint1",
                    "S3Destination": {
                        "BucketName": "test-marsha-destination",
                        "ManifestKey": "e19f1058-0bde-4f29-a5d8-e0b4ddf92b74/cmaf/"
                        "slice_3/1569309880_3.m3u8",
                        "RoleArn": "mediapackage:role:arn",
                    },
                },
                service_response={
                    "Arn": "string",
                    "ChannelId": "medialive_channel1",
                    "CreatedAt": str(now),
                    "EndTime": str(stop_3),
                    "Id": "harvest_job3",
                    "OriginEndpointId": "mediapackage_endpoint1",
                    "S3Destination": {
                        "BucketName": "test-marsha-destination",
                        "ManifestKey": "e19f1058-0bde-4f29-a5d8-e0b4ddf92b74/cmaf/"
                        "slice_3/1569309880_3.m3u8",
                        "RoleArn": "mediapackage:role:arn",
                    },
                    "StartTime": str(start_3),
                    "Status": "IN_PROGRESS",
                },
            )
            medialive_utils.create_mediapackage_harvest_job(video)
            mediapackage_client_stubber.assert_no_pending_responses()

        video.refresh_from_db()
        self.assertEqual(
            video.recording_slices,
            [
                {
                    "start": to_timestamp(start_1),
                    "stop": to_timestamp(stop_1),
                    "status": PROCESSING,
                    "harvest_job_id": "harvest_job1",
                    "manifest_key": "e19f1058-0bde-4f29-a5d8-e0b4ddf92b74/cmaf/"
                    "slice_1/1569309880_1.m3u8",
                    "harvested_directory": "slice_1",
                },
                {
                    "start": to_timestamp(start_2),
                    "stop": to_timestamp(stop_2),
                    "status": PROCESSING,
                    "harvest_job_id": "harvest_job2",
                    "manifest_key": "e19f1058-0bde-4f29-a5d8-e0b4ddf92b74/cmaf/"
                    "slice_2/1569309880_2.m3u8",
                    "harvested_directory": "slice_2",
                },
                {
                    "start": to_timestamp(start_3),
                    "stop": to_timestamp(stop_3),
                    "status": PROCESSING,
                    "harvest_job_id": "harvest_job3",
                    "manifest_key": "e19f1058-0bde-4f29-a5d8-e0b4ddf92b74/cmaf/"
                    "slice_3/1569309880_3.m3u8",
                    "harvested_directory": "slice_3",
                },
            ],
        )

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

    def test_wait_medialive_channel_is_created(self):
        """Should call describe_channel while state is not IDLE."""
        with Stubber(medialive_utils.medialive_client) as medialive_stubber:
            medialive_stubber.add_response(
                "describe_channel",
                expected_params={"ChannelId": "medialive_channel1"},
                service_response={"State": "CREATING"},
            )

            medialive_stubber.add_response(
                "describe_channel",
                expected_params={"ChannelId": "medialive_channel1"},
                service_response={"State": "IDLE"},
            )

            medialive_utils.wait_medialive_channel_is_created("medialive_channel1")
            medialive_stubber.assert_no_pending_responses()

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

    def test_update_id3(self):
        """Should update id3 tags on a video channel."""
        shared_live_media = SharedLiveMediaFactory(nb_pages=5)

        video = VideoFactory(
            live_type=RAW,
            live_state=RUNNING,
            active_shared_live_media=shared_live_media,
            active_shared_live_media_page=3,
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
            },
        )

        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch("datetime.datetime") as mock_dt, Stubber(
            medialive_utils.medialive_client
        ) as mediapackage_client_stubber:
            mock_dt.now = mock.Mock(return_value=now)
            mediapackage_client_stubber.add_response(
                "batch_update_schedule",
                service_response={},
                expected_params={
                    "ChannelId": "medialive_channel1",
                    "Creates": {
                        "ScheduleActions": [
                            {
                                "ActionName": now.isoformat(),
                                "ScheduleActionStartSettings": {
                                    "ImmediateModeScheduleActionStartSettings": {}
                                },
                                "ScheduleActionSettings": {
                                    "HlsId3SegmentTaggingSettings": {
                                        "Tag": json.dumps(
                                            {
                                                "video": {
                                                    "active_shared_live_media": {
                                                        "id": str(shared_live_media.id)
                                                    },
                                                    "active_shared_live_media_page": 3,
                                                    "id": str(video.id),
                                                    "live_state": RUNNING,
                                                }
                                            }
                                        )
                                    }
                                },
                            }
                        ]
                    },
                },
            )
            medialive_utils.update_id3_tags(video)
            mediapackage_client_stubber.assert_no_pending_responses()
