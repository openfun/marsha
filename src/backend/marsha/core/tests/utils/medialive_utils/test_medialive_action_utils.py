"""Test medialive utils functions."""

from datetime import datetime, timezone as baseTimezone
import json
from unittest import mock

from django.test import TestCase

from botocore.stub import Stubber

from marsha.core.defaults import RAW, RUNNING
from marsha.core.factories import SharedLiveMediaFactory, VideoFactory
from marsha.core.utils import medialive_utils


# pylint: disable=too-many-lines


# pylint: disable=too-many-lines


class MediaLiveUtilsTestCase(TestCase):
    """Test medialive utils."""

    maxDiff = None

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
