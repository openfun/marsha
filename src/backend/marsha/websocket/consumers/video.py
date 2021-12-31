"""Video consumer module"""
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from marsha.core.models import Video
from marsha.core.permissions import IsTokenAdmin, IsTokenInstructor
from marsha.websocket import defaults


class VideoConsumer(AsyncJsonWebsocketConsumer):
    """Video consumer."""

    room_group_name = None

    async def connect(self):
        """Manage connection to this consumer."""
        await self._validate_token()
        await self._check_video_exists()
        self.room_group_name = self._get_room_name()

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()

    async def _validate_token(self):
        """Validate that the resource_id in the token match the video_id in the url."""
        video_id = self.scope["url_route"]["kwargs"]["video_id"]
        token = self.scope["token"]
        if token.payload.get("resource_id") != video_id:
            await self.close()

    async def _check_video_exists(self):
        """Close the room if the video does not exists."""
        if not await self._video_exists():
            await self.close()

    @database_sync_to_async
    def _video_exists(self):
        """Return if a video exists in database or not."""
        return Video.objects.filter(
            pk=self.scope["url_route"]["kwargs"]["video_id"]
        ).exists()

    def _is_admin(self):
        """Check if the connected user has admin persmissions."""
        token = self.scope["token"]
        return IsTokenInstructor().check_role(token) or IsTokenAdmin().check_role(token)

    def _get_room_name(self):
        """Generate the room name the user is connected on depending its permissions."""
        if self._is_admin():
            return defaults.VIDEO_ADMIN_ROOM_NAME.format(
                video_id=self.scope["url_route"]["kwargs"]["video_id"]
            )

        return defaults.VIDEO_ROOM_NAME.format(
            video_id=self.scope["url_route"]["kwargs"]["video_id"]
        )

    # pylint: disable=unused-argument
    async def disconnect(self, code):
        """Manage disconnection to this consumer."""
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # pylint: disable=unused-argument
    async def video_updated(self, event):
        """Listener for the video_updated event."""
        await self.send_json(event["video"])
