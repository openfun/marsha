"""Marsha module working with django channels layers."""
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from marsha.core.serializers import VideoSerializer
from marsha.websocket.defaults import VIDEO_ADMIN_ROOM_NAME, VIDEO_ROOM_NAME


def dispatch_video_to_groups(video):
    """Send the video to both simple and admin user."""
    dispatch_video_to_simple_group(video)
    dispatch_video_to_admin_group(video)


def dispatch_video_to_simple_group(video):
    """Send the video to simple users connected to the video consumer."""
    channel_layer = get_channel_layer()

    serialized_video = VideoSerializer(video, context={"is_admin": False})
    async_to_sync(channel_layer.group_send)(
        VIDEO_ROOM_NAME.format(video_id=str(video.id)),
        {"type": "video_updated", "video": serialized_video.data},
    )


def dispatch_video_to_admin_group(video):
    """Send the video to admin users connected to the video consumer."""
    channel_layer = get_channel_layer()

    serialized_video = VideoSerializer(video, context={"is_admin": True})
    async_to_sync(channel_layer.group_send)(
        VIDEO_ADMIN_ROOM_NAME.format(video_id=str(video.id)),
        {"type": "video_updated", "video": serialized_video.data},
    )
