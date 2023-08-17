"""Video consumer module"""
from urllib.parse import parse_qs

from django.db.models import Q

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from marsha.core.models import (
    ADMINISTRATOR,
    INSTRUCTOR,
    SharedLiveMedia,
    Thumbnail,
    TimedTextTrack,
    Video,
)
from marsha.core.permissions import IsTokenAdmin, IsTokenInstructor
from marsha.core.services import live_session as LiveSessionServices
from marsha.core.simple_jwt.tokens import PlaylistAccessToken, UserAccessToken
from marsha.websocket import defaults


class VideoConsumer(AsyncJsonWebsocketConsumer):
    """Video consumer."""

    room_group_name = None
    is_connected = False

    def __get_video_id(self):
        return self.scope["url_route"]["kwargs"]["video_id"]

    async def _check_permissions(self):
        """
        Check if the user has the required permissions.

        Raises:
            ConnectionRefusedError: if the user does not have the required permissions.
        """
        token = self.scope["token"]
        if token is None:
            raise ConnectionRefusedError()

        # Check permissions, MUST be the same as in the `retrieve` method
        # of the Video API view set.

        if isinstance(token, PlaylistAccessToken):
            # With LTI: anyone with a valid token for the video can access
            if not await self._has_access_to_video(token):
                raise ConnectionRefusedError()

        elif isinstance(token, UserAccessToken):
            # With standalone site, only playlist admin or organization admin can access
            if not await self._user_has_playlist_or_organization_admin_role(
                token.payload.get("user_id")
            ):
                raise ConnectionRefusedError()

        else:
            raise RuntimeError("This should not happen")

    @database_sync_to_async
    def _has_access_to_video(self, token):
        """Return if the user has access to the video."""
        return Video.objects.filter(
            pk=self.__get_video_id(), playlist_id=token.payload.get("resource_id")
        ).exists()

    async def connect(self):
        """
        Manage connection to this consumer.
        During handshake it is not possible to close the websocket with a specific
        code. To do that we must accept first the connection and then close it with the code we
        want
        """
        try:
            await self._check_permissions()
            await self._check_video_exists()
            if not await self._is_admin():
                live_session = await self.retrieve_live_session()
                await self.update_live_session_with_channel_name(
                    live_session=live_session
                )
        except ConnectionRefusedError:
            await self.accept()
            return await self.close(code=4003)

        self.room_group_name = await self._get_room_name()
        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()
        self.is_connected = True

    async def _check_video_exists(self):
        """Close the room if the video does not exists."""
        if not await self._video_exists():
            raise ConnectionRefusedError()

    @database_sync_to_async
    def _video_exists(self):
        """Return if a video exists in database or not."""
        return Video.objects.filter(pk=self.__get_video_id()).exists()

    @database_sync_to_async
    def _user_has_playlist_or_organization_admin_role(self, user_id):
        """Return if the user belongs to the video playlist admin or organization admin."""
        return Video.objects.filter(
            Q(pk=self.__get_video_id())
            & (
                Q(
                    playlist__user_accesses__user_id=user_id,
                    playlist__user_accesses__role__in=[ADMINISTRATOR, INSTRUCTOR],
                )
                | Q(
                    playlist__organization__user_accesses__user_id=user_id,
                    playlist__organization__user_accesses__role=ADMINISTRATOR,
                )
            )
        ).exists()

    @database_sync_to_async
    def retrieve_live_session(self):
        """Guess a live_session from the token and create it id not present."""
        token = self.scope["token"]
        if LiveSessionServices.is_lti_token(token):
            live_session, _ = LiveSessionServices.get_livesession_from_lti(
                token, self.__get_video_id()
            )
        else:
            query_string = parse_qs(self.scope["query_string"])
            if b"anonymous_id" not in query_string:
                raise ConnectionRefusedError()
            live_session, _ = LiveSessionServices.get_livesession_from_anonymous_id(
                anonymous_id=query_string[b"anonymous_id"][0].decode("utf-8"),
                video_id=self.__get_video_id(),
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

    async def _is_admin(self):
        """Check if the connected user has admin permissions."""
        token = self.scope["token"]
        if not token:
            return False

        if isinstance(token, PlaylistAccessToken):
            return IsTokenInstructor().check_role(token) or IsTokenAdmin().check_role(
                token
            )

        if isinstance(token, UserAccessToken):
            return await self._user_has_playlist_or_organization_admin_role(
                token.payload.get("user_id"),
            )

        raise RuntimeError("Should not be called please check the code.", type(token))

    async def _get_room_name(self):
        """Generate the room name the user is connected on depending its permissions."""
        if await self._is_admin():
            return defaults.VIDEO_ADMIN_ROOM_NAME.format(video_id=self.__get_video_id())

        return defaults.VIDEO_ROOM_NAME.format(video_id=self.__get_video_id())

    # pylint: disable=unused-argument
    async def disconnect(self, code):
        """Manage disconnection to this consumer."""
        # If connection was previously aborted nothing to do
        if not self.is_connected:
            return

        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        if not await self._is_admin():
            try:
                live_session = await self.retrieve_live_session()
                await self.reset_live_session(live_session)
            except ConnectionRefusedError:
                # No live session found, nothing to do
                pass

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

    async def shared_live_media_updated(self, event):
        """Listener for the shared_live_media updated event."""
        message = {
            "type": SharedLiveMedia.RESOURCE_NAME,
            "resource": event["shared_live_media"],
        }
        await self.send_json(message)
