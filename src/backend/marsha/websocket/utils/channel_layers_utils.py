"""Marsha module working with django channels layers."""

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from marsha.core.serializers import (
    SharedLiveMediaSerializer,
    ThumbnailSerializer,
    TimedTextTrackSerializer,
    VideoSerializer,
)
from marsha.websocket.defaults import VIDEO_ADMIN_ROOM_NAME, VIDEO_ROOM_NAME


def dispatch_video_to_groups(video):
    """Send the video to both simple and admin user."""
    dispatch_video(video, to_admin=False)
    dispatch_video(video, to_admin=True)


def dispatch_video(video, to_admin=False):
    """Send the video to users connected to the video consumer."""
    room_name = VIDEO_ADMIN_ROOM_NAME if to_admin else VIDEO_ROOM_NAME
    channel_layer = get_channel_layer()
    serialized_video = VideoSerializer(video, context={"is_admin": to_admin})
    async_to_sync(channel_layer.group_send)(
        room_name.format(video_id=str(video.id)),
        {"type": "video_updated", "video": serialized_video.data},
    )


def dispatch_thumbnail(thumbnail):
    """Send the thumbnail to admin users connected to the video consumer."""
    channel_layer = get_channel_layer()
    serialized_thumbnail = ThumbnailSerializer(thumbnail)
    async_to_sync(channel_layer.group_send)(
        VIDEO_ADMIN_ROOM_NAME.format(video_id=str(thumbnail.video_id)),
        {"type": "thumbnail_updated", "thumbnail": serialized_thumbnail.data},
    )


def dispatch_timed_text_track(timed_text_track):
    """Send the timed_text_track to admin users connected to the video consumer."""
    channel_layer = get_channel_layer()
    serialized_thumbnail = TimedTextTrackSerializer(timed_text_track)
    async_to_sync(channel_layer.group_send)(
        VIDEO_ADMIN_ROOM_NAME.format(video_id=str(timed_text_track.video_id)),
        {
            "type": "timed_text_track_updated",
            "timed_text_track": serialized_thumbnail.data,
        },
    )


def dispatch_shared_live_media(shared_live_media):
    """Send the shared_live_media to admin users connected to the video consumer."""
    channel_layer = get_channel_layer()
    serialized_shared_live_media = SharedLiveMediaSerializer(shared_live_media)
    async_to_sync(channel_layer.group_send)(
        VIDEO_ADMIN_ROOM_NAME.format(video_id=str(shared_live_media.video_id)),
        {
            "type": "shared_live_media_updated",
            "shared_live_media": serialized_shared_live_media.data,
        },
    )
