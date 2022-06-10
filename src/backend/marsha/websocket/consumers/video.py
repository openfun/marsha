"""Video consumer module"""
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from marsha.core.models import Thumbnail, TimedTextTrack, Video
from marsha.core.permissions import IsTokenAdmin, IsTokenInstructor
from marsha.core.services import live_session as LiveSessionServices
from marsha.websocket import defaults


class VideoConsumer(AsyncJsonWebsocketConsumer):
    """Video consumer."""

    room_group_name = None
    is_connected = False

    async def connect(self):
        """
        Manage connection to this consumer.
        During handshake it is not possible to close the websocket with a specific
        code. To do that we must accept first the connection and then close it with the code we
        want
        """
        try:
            await self._validate_token()
            await self._check_video_exists()
        except ConnectionRefusedError:
            await self.accept()
            return await self.close(code=4003)

        try:
            if not self._is_admin():
                live_session = await self.retrieve_live_session()
                await self.update_live_session_with_channel_name(
                    live_session=live_session
                )
        except ConnectionRefusedError:
            await self.accept()
            return await self.close(code=4003)

        self.room_group_name = self._get_room_name()
        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()
        self.is_connected = True

    async def _validate_token(self):
        """Validate that the resource_id in the token match the video_id in the url."""
        video_id = self.scope["url_route"]["kwargs"]["video_id"]
        token = self.scope["token"]
        if token.payload.get("resource_id") != video_id:
            raise ConnectionRefusedError()

    async def _check_video_exists(self):
        """Close the room if the video does not exists."""
        if not await self._video_exists():
            raise ConnectionRefusedError()

    @database_sync_to_async
    def _video_exists(self):
        """Return if a video exists in database or not."""
        return Video.objects.filter(
            pk=self.scope["url_route"]["kwargs"]["video_id"]
        ).exists()

    @database_sync_to_async
    def retrieve_live_session(self):
        """Guess a live_session from the token and create it id not present."""
        token = self.scope["token"]
        if LiveSessionServices.is_lti_token(token):
            live_session, _ = LiveSessionServices.get_livesession_from_lti(token)
        else:
            query_string = parse_qs(self.scope["query_string"])
            if b"anonymous_id" not in query_string:
                raise ConnectionRefusedError()
            live_session, _ = LiveSessionServices.get_livesession_from_anonymous_id(
                anonymous_id=query_string[b"anonymous_id"][0].decode("utf-8"),
                video_id=token.payload["resource_id"],
            )

        return live_session

    @database_sync_to_async
    def update_live_session_with_channel_name(self, live_session):
        """Update the live_session with the current channel_name."""
        live_session.channel_name = self.channel_name
        live_session.save()

    @database_sync_to_async
    def reset_live_session(self, live_session):
        """Reset to None the live_session channel_name."""
        live_session.channel_name = None
        live_session.save()

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
        # If connection was previously aborted nothing to do
        if not self.is_connected:
            return

        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        if not self._is_admin():
            live_session = await self.retrieve_live_session()
            await self.reset_live_session(live_session)

    async def video_updated(self, event):
        """Listener for the video_updated event."""
        message = {"type": Video.RESOURCE_NAME, "resource": event["video"]}
        await self.send_json(message)

    async def thumbnail_updated(self, event):
        """Listener for the thumbnail updated event."""
        message = {"type": Thumbnail.RESOURCE_NAME, "resource": event["thumbnail"]}
        await self.send_json(message)

    async def timed_text_track_updated(self, event):
        """Listener for the timed text track updated event."""
        message = {
            "type": TimedTextTrack.RESOURCE_NAME,
            "resource": event["timed_text_track"],
        }
        await self.send_json(message)
