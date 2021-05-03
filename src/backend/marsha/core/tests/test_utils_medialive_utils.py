"""Test medialive utils functions."""
from unittest import mock

from django.test import TestCase, override_settings

from botocore.stub import Stubber

from ..factories import VideoFactory
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
                        "PlaylistWindowSeconds": 1,
                        "ProgramDateTimeIntervalSeconds": 0,
                        "SegmentDurationSeconds": 5,
                    },
                    "Tags": {"environment": "test"},
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
    def test_create_mediapackage_harvest_job(self):
        """Should create a mediapackage harvest job."""
        VideoFactory(
            id="e19f1058-0bde-4f29-a5d8-e0b4ddf92b74",
            live_info={
                "medialive": {
                    "input": {"id": "medialive_input1"},
                    "channel": {"id": "medialive_channel1"},
                },
                "mediapackage": {
                    "endpoints": {
                        "hls": {"id": "mediapackage_endpoint1"},
                    },
                    "channel": {
                        "id": "test_e19f1058-0bde-4f29-a5d8-e0b4ddf92b74_1569309880"
                    },
                },
                "started_at": "1569309880",
                "ended_at": "1569310880",
            },
        )

        with Stubber(medialive_utils.mediapackage_client) as mediapackage_stubber:
            mediapackage_stubber.add_response(
                "create_harvest_job",
                expected_params={
                    "Id": "test_e19f1058-0bde-4f29-a5d8-e0b4ddf92b74_1569309880",
                    "StartTime": "1569309880",
                    "EndTime": "1569310880",
                    "OriginEndpointId": "mediapackage_endpoint1",
                    "S3Destination": {
                        "BucketName": "test-marsha-destination",
                        "ManifestKey": "e19f1058-0bde-4f29-a5d8-e0b4ddf92b74/cmaf/1569309880.m3u8",
                        "RoleArn": "mediapackage:role:arn",
                    },
                },
                service_response={},
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
