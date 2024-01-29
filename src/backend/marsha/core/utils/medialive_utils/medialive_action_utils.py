"""Utils to create MediaLive configuration."""

import datetime
import json

from marsha.core.serializers import VideoId3TagsSerializer
from marsha.core.utils.medialive_utils.medialive_client_utils import medialive_client


def start_live_channel(channel_id):
    """Start an existing medialive channel."""
    medialive_client.start_channel(ChannelId=channel_id)


def stop_live_channel(channel_id):
    """Stop an existing medialive channel."""
    medialive_client.stop_channel(ChannelId=channel_id)


def update_id3_tags(video):
    """Update id3 tags to an existing medialive channel."""
    if (
        video.live_info is None
        or video.live_info.get("medialive") is None
        or video.get_medialive_channel() is None
        or not video.is_live
    ):
        return

    channel_id = video.get_medialive_channel().get("id")
    serialized_id3_video = VideoId3TagsSerializer(video)
    medialive_client.batch_update_schedule(
        ChannelId=channel_id,
        Creates={
            "ScheduleActions": [
                {
                    "ActionName": datetime.datetime.now().isoformat(),
                    "ScheduleActionStartSettings": {
                        "ImmediateModeScheduleActionStartSettings": {}
                    },
                    "ScheduleActionSettings": {
                        "HlsId3SegmentTaggingSettings": {
                            "Tag": json.dumps({"video": serialized_id3_video.data})
                        }
                    },
                }
            ]
        },
    )
