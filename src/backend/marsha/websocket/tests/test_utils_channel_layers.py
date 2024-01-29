"""Module testing utils channel_layers"""

from django.test import TestCase

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from marsha.core.factories import (
    SharedLiveMediaFactory,
    ThumbnailFactory,
    TimedTextTrackFactory,
    VideoFactory,
)
from marsha.core.serializers import (
    SharedLiveMediaSerializer,
    ThumbnailSerializer,
    TimedTextTrackSerializer,
    VideoSerializer,
)
from marsha.websocket.defaults import VIDEO_ADMIN_ROOM_NAME, VIDEO_ROOM_NAME
from marsha.websocket.utils import channel_layers_utils


class ChannelLayersUtilsTest(TestCase):
    """Test channel layers utils."""

    maxDiff = None

    def tearDown(self):
        super().tearDown()
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.flush)()

    def test_send_video_to_simple_user(self):
        """A message containing serialized video is dispatched to the regular group."""
        video = VideoFactory()

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_add)(
            VIDEO_ROOM_NAME.format(video_id=str(video.id)), "test_channel"
        )

        channel_layers_utils.dispatch_video(video, to_admin=False)

        message = async_to_sync(channel_layer.receive)("test_channel")
        self.assertEqual(message["type"], "video_updated")
        self.assertEqual(
            message["video"], VideoSerializer(video, context={"is_admin": False}).data
        )

    def test_send_video_to_admin_user(self):
        """A message containing serialized video is dispatched to the admin group."""
        video = VideoFactory()

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_add)(
            VIDEO_ADMIN_ROOM_NAME.format(video_id=str(video.id)), "test_channel"
        )

        channel_layers_utils.dispatch_video(video, to_admin=True)

        message = async_to_sync(channel_layer.receive)("test_channel")
        self.assertEqual(message["type"], "video_updated")
        self.assertEqual(
            message["video"], VideoSerializer(video, context={"is_admin": True}).data
        )

    def test_dispatch_thumbnail(self):
        """A message containing serialized thumbnail is dispatched to the admin group."""
        thumbnail = ThumbnailFactory()
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_add)(
            VIDEO_ADMIN_ROOM_NAME.format(video_id=str(thumbnail.video.id)),
            "test_channel",
        )

        channel_layers_utils.dispatch_thumbnail(thumbnail)

        message = async_to_sync(channel_layer.receive)("test_channel")
        self.assertEqual(message["type"], "thumbnail_updated")
        self.assertEqual(message["thumbnail"], ThumbnailSerializer(thumbnail).data)

    def test_dispatch_timed_text_track(self):
        """A message containing serialized timed_text_track is dispatched to the admin group."""
        timed_text_track = TimedTextTrackFactory()
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_add)(
            VIDEO_ADMIN_ROOM_NAME.format(video_id=str(timed_text_track.video.id)),
            "test_channel",
        )

        channel_layers_utils.dispatch_timed_text_track(timed_text_track)

        message = async_to_sync(channel_layer.receive)("test_channel")
        self.assertEqual(message["type"], "timed_text_track_updated")
        self.assertEqual(
            message["timed_text_track"], TimedTextTrackSerializer(timed_text_track).data
        )

    def test_dispatch_shared_live_media(self):
        """A message containing serialized shared_live_media is dispatched to the admin group."""
        shared_live_media = SharedLiveMediaFactory()
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_add)(
            VIDEO_ADMIN_ROOM_NAME.format(video_id=str(shared_live_media.video.id)),
            "test_channel",
        )

        channel_layers_utils.dispatch_shared_live_media(shared_live_media)

        message = async_to_sync(channel_layer.receive)("test_channel")
        self.assertEqual(message["type"], "shared_live_media_updated")
        self.assertEqual(
            message["shared_live_media"],
            SharedLiveMediaSerializer(shared_live_media).data,
        )
