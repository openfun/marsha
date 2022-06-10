"""Test for video consumers."""
import json
import random
from uuid import uuid4

from django.test import TransactionTestCase

from asgiref.sync import sync_to_async
from channels.layers import get_channel_layer
from channels.testing import WebsocketCommunicator
from rest_framework_simplejwt.tokens import AccessToken

from marsha.core.defaults import JITSI, RUNNING
from marsha.core.factories import (
    LiveSessionFactory,
    ThumbnailFactory,
    TimedTextTrackFactory,
    VideoFactory,
)
from marsha.core.models.account import NONE
from marsha.core.serializers import (
    ThumbnailSerializer,
    TimedTextTrackSerializer,
    VideoSerializer,
)
from marsha.websocket.application import base_application
from marsha.websocket.defaults import VIDEO_ADMIN_ROOM_NAME, VIDEO_ROOM_NAME


class VideoConsumerTest(TransactionTestCase):
    """Test for the video consumer."""

    maxDiff = None

    @sync_to_async
    def _get_video(self, **kwargs):
        """Create a video using VideoFactory"""
        return VideoFactory(**kwargs)

    @sync_to_async
    def _get_serializer_data(self, video, context):
        serializer = VideoSerializer(video, context=context)
        return serializer.data

    @sync_to_async
    def _get_thumbnail(self, **kwargs):
        """Create a thumbnail using ThumbnailFactory."""
        return ThumbnailFactory(**kwargs)

    @sync_to_async
    def _get_thumbnail_serializer_data(self, thumbnail, context={}):
        """Serialize thumbnail model and return the serialized data."""
        serializer = ThumbnailSerializer(thumbnail, context=context)
        return serializer.data

    @sync_to_async
    def _get_timed_text_track(self, **kwargs):
        """Create a timed_text_track using TimedTextTrackFactory"""
        return TimedTextTrackFactory(**kwargs)

    @sync_to_async
    def _get_timed_text_track_serializer_data(self, thumbnail, context={}):
        """Serialize timed text track model and return the serialized data."""
        serializer = TimedTextTrackSerializer(thumbnail, context=context)
        return serializer.data

    @sync_to_async
    def _get_live_session(self, **kwargs):
        """Create a live_session using LiveSessionFactory."""
        return LiveSessionFactory(**kwargs)

    async def test_connect_matching_video_student(self):
        """A connection with url params matching jwt resource_id should succeed."""
        video = await self._get_video()
        live_session = await self._get_live_session(
            video=video,
            consumer_site=video.consumer_site,
            lti_id="Maths",
            lti_user_id="444444",
        )

        self.assertIsNone(live_session.channel_name)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["consumer_site"] = str(video.consumer_site.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["permissions"] = {"can_update": False}
        jwt_token.payload["user"] = {
            "id": "444444",
        }

        communicator = WebsocketCommunicator(
            base_application,
            f"ws/video/{video.id}/?jwt={jwt_token}",
        )

        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        # Channel name has been set in the live_session
        await sync_to_async(live_session.refresh_from_db)()
        self.assertIsNotNone(live_session.channel_name)

        await communicator.disconnect()

        # Channel name has been removed from the live_session
        await sync_to_async(live_session.refresh_from_db)()
        self.assertIsNone(live_session.channel_name)

    async def test_connect_matching_video_anonymous(self):
        """A connection with url params matching jwt resource_id should succeed."""
        anonymous_id = uuid4()
        video = await self._get_video()
        live_session = await self._get_live_session(
            video=video, anonymous_id=anonymous_id
        )

        self.assertIsNone(live_session.channel_name)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [NONE]

        communicator = WebsocketCommunicator(
            base_application,
            f"ws/video/{video.id}/?jwt={jwt_token}&anonymous_id={anonymous_id}",
        )

        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        # Channel name has been set in the live_session
        await sync_to_async(live_session.refresh_from_db)()
        self.assertIsNotNone(live_session.channel_name)

        await communicator.disconnect()

        # Channel name has been removed from the live_session
        await sync_to_async(live_session.refresh_from_db)()
        self.assertIsNone(live_session.channel_name)

    async def test_connect_matching_video_admin(self):
        """A connection with url params matching jwt resource_id should succeed."""
        video = await self._get_video()
        live_session = await self._get_live_session(
            video=video,
            consumer_site=video.consumer_site,
            lti_id="Maths",
            lti_user_id="55555",
        )

        self.assertIsNone(live_session.channel_name)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["consumer_site"] = str(video.consumer_site.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        jwt_token.payload["user"] = {
            "id": "55555",
        }

        communicator = WebsocketCommunicator(
            base_application,
            f"ws/video/{video.id}/?jwt={jwt_token}",
        )

        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        # Live session should not be updated
        await sync_to_async(live_session.refresh_from_db)()
        self.assertIsNone(live_session.channel_name)

        await communicator.disconnect()

        # Channel name has been removed from the live_session
        await sync_to_async(live_session.refresh_from_db)()
        self.assertIsNone(live_session.channel_name)

    async def test_connect_no_matching_video(self):
        """Connection with a video not matching the one in the token should be refused."""
        video = await self._get_video()
        other_video = await self._get_video()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["consumer_site"] = str(video.consumer_site.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["permissions"] = {"can_update": False}
        jwt_token.payload["user"] = {
            "id": "444444",
        }

        communicator = WebsocketCommunicator(
            base_application,
            f"ws/video/{other_video.id}/?jwt={jwt_token}",
        )

        connected, _ = await communicator.connect()

        self.assertTrue(connected)

        response = await communicator.receive_output()

        self.assertEqual(response["type"], "websocket.close")
        self.assertEqual(response["code"], 4003)

        await communicator.disconnect()

    async def test_connect_video_not_existing(self):
        """Connection with a non-existent video should be refused."""
        video_id = uuid4()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video_id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["permissions"] = {"can_update": False}

        communicator = WebsocketCommunicator(
            base_application,
            f"ws/video/{video_id}/?jwt={jwt_token}",
        )

        connected, _ = await communicator.connect()

        self.assertTrue(connected)

        response = await communicator.receive_output()

        self.assertEqual(response["type"], "websocket.close")
        self.assertEqual(response["code"], 4003)

        await communicator.disconnect()

    async def test_video_update_channel_layer(self):
        """Messages sent on the admin channel should not be received by a regular user."""
        video = await self._get_video(
            live_state=RUNNING,
            live_type=JITSI,
            live_info={
                "medialive": {
                    "input": {
                        "id": "medialive_input_1",
                        "endpoints": [
                            "https://live_endpoint1",
                            "https://live_endpoint2",
                        ],
                    },
                    "channel": {"id": "medialive_channel_1"},
                },
                "mediapackage": {
                    "id": "mediapackage_channel_1",
                    "endpoints": {
                        "hls": {
                            "id": "endpoint1",
                            "url": "https://channel_endpoint1/live.m3u8",
                        },
                    },
                },
            },
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["consumer_site"] = str(video.consumer_site.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["permissions"] = {"can_update": False}
        jwt_token.payload["user"] = {
            "id": "444444",
        }

        communicator = WebsocketCommunicator(
            base_application,
            f"ws/video/{video.id}/?jwt={jwt_token}",
        )

        connected, _ = await communicator.connect()

        self.assertTrue(connected)

        channel_layer = get_channel_layer()

        await channel_layer.group_send(
            VIDEO_ROOM_NAME.format(video_id=str(video.id)),
            {
                "type": "video_updated",
                "video": await self._get_serializer_data(video, {"is_admin": False}),
            },
        )

        response = await communicator.receive_from()
        self.assertEqual(
            json.loads(response),
            {
                "type": "videos",
                "resource": {
                    "active_shared_live_media": None,
                    "active_shared_live_media_page": None,
                    "active_stamp": None,
                    "allow_recording": True,
                    "description": video.description,
                    "estimated_duration": None,
                    "has_chat": True,
                    "has_live_media": True,
                    "has_transcript": False,
                    "id": str(video.id),
                    "is_public": False,
                    "is_ready_to_show": True,
                    "is_recording": False,
                    "is_scheduled": False,
                    "join_mode": "approval",
                    "timed_text_tracks": [],
                    "thumbnail": None,
                    "title": video.title,
                    "upload_state": "pending",
                    "urls": {
                        "manifests": {"hls": "https://channel_endpoint1/live.m3u8"},
                        "mp4": {},
                        "thumbnails": {},
                    },
                    "show_download": True,
                    "should_use_subtitle_as_transcript": False,
                    "starting_at": None,
                    "participants_asking_to_join": [],
                    "participants_in_discussion": [],
                    "playlist": {
                        "id": str(video.playlist.id),
                        "title": video.playlist.title,
                        "lti_id": video.playlist.lti_id,
                    },
                    "recording_time": 0,
                    "live_info": {},
                    "live_state": RUNNING,
                    "live_type": JITSI,
                    "xmpp": None,
                    "shared_live_medias": [],
                },
            },
        )

        await channel_layer.group_send(
            VIDEO_ADMIN_ROOM_NAME.format(video_id=str(video.id)),
            {
                "type": "video_updated",
                "video": await self._get_serializer_data(video, {"is_admin": True}),
            },
        )

        self.assertTrue(await communicator.receive_nothing())

        await communicator.disconnect()

    async def test_video_update_instructor_channel_layer(self):
        """Admin user should receive message only from the admin channel."""
        video = await self._get_video(
            live_state=RUNNING,
            live_type=JITSI,
            live_info={
                "medialive": {
                    "input": {
                        "id": "medialive_input_1",
                        "endpoints": [
                            "https://live_endpoint1",
                            "https://live_endpoint2",
                        ],
                    },
                    "channel": {"id": "medialive_channel_1"},
                },
                "mediapackage": {
                    "id": "mediapackage_channel_1",
                    "endpoints": {
                        "hls": {
                            "id": "endpoint1",
                            "url": "https://channel_endpoint1/live.m3u8",
                        },
                    },
                },
            },
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["consumer_site"] = str(video.consumer_site.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        jwt_token.payload["user"] = {
            "id": "444444",
        }

        communicator = WebsocketCommunicator(
            base_application,
            f"ws/video/{video.id}/?jwt={jwt_token}",
        )

        connected, _ = await communicator.connect()

        self.assertTrue(connected)

        channel_layer = get_channel_layer()

        await channel_layer.group_send(
            VIDEO_ROOM_NAME.format(video_id=str(video.id)),
            {
                "type": "video_updated",
                "video": await self._get_serializer_data(video, {"is_admin": False}),
            },
        )

        self.assertTrue(await communicator.receive_nothing())

        await channel_layer.group_send(
            VIDEO_ADMIN_ROOM_NAME.format(video_id=str(video.id)),
            {
                "type": "video_updated",
                "video": await self._get_serializer_data(video, {"is_admin": True}),
            },
        )

        response = await communicator.receive_from()
        self.assertEqual(
            json.loads(response),
            {
                "type": "videos",
                "resource": {
                    "active_shared_live_media": None,
                    "active_shared_live_media_page": None,
                    "active_stamp": None,
                    "allow_recording": True,
                    "description": video.description,
                    "estimated_duration": None,
                    "has_chat": True,
                    "has_live_media": True,
                    "has_transcript": False,
                    "id": str(video.id),
                    "is_public": False,
                    "is_ready_to_show": True,
                    "is_recording": False,
                    "is_scheduled": False,
                    "join_mode": "approval",
                    "timed_text_tracks": [],
                    "thumbnail": None,
                    "title": video.title,
                    "upload_state": "pending",
                    "urls": {
                        "manifests": {"hls": "https://channel_endpoint1/live.m3u8"},
                        "mp4": {},
                        "thumbnails": {},
                    },
                    "show_download": True,
                    "should_use_subtitle_as_transcript": False,
                    "starting_at": None,
                    "participants_asking_to_join": [],
                    "participants_in_discussion": [],
                    "playlist": {
                        "id": str(video.playlist.id),
                        "title": video.playlist.title,
                        "lti_id": video.playlist.lti_id,
                    },
                    "recording_time": 0,
                    "live_info": {
                        "jitsi": {
                            "config_overwrite": {},
                            "domain": "meet.jit.si",
                            "external_api_url": "https://meet.jit.si/external_api.js",
                            "interface_config_overwrite": {},
                            "room_name": str(video.pk),
                        },
                        "medialive": {
                            "input": {
                                "endpoints": [
                                    "https://live_endpoint1",
                                    "https://live_endpoint2",
                                ],
                            },
                        },
                    },
                    "live_state": RUNNING,
                    "live_type": JITSI,
                    "xmpp": None,
                    "shared_live_medias": [],
                },
            },
        )

        await communicator.disconnect()

    async def test_thumbnail_update_channel_layer(self):
        """Message received on thumbnail_updated event."""
        thumbnail = await self._get_thumbnail()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(thumbnail.video_id)
        jwt_token.payload["consumer_site"] = str(thumbnail.video.consumer_site.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["permissions"] = {"can_update": False}
        jwt_token.payload["user"] = {
            "id": "444444",
        }

        communicator = WebsocketCommunicator(
            base_application,
            f"ws/video/{thumbnail.video_id}/?jwt={jwt_token}",
        )

        connected, _ = await communicator.connect()

        self.assertTrue(connected)

        channel_layer = get_channel_layer()

        await channel_layer.group_send(
            VIDEO_ROOM_NAME.format(video_id=str(thumbnail.video_id)),
            {
                "type": "thumbnail_updated",
                "thumbnail": await self._get_thumbnail_serializer_data(thumbnail),
            },
        )

        response = await communicator.receive_from()
        self.assertEqual(
            json.loads(response),
            {
                "type": "thumbnails",
                "resource": {
                    "active_stamp": None,
                    "id": str(thumbnail.id),
                    "is_ready_to_show": False,
                    "upload_state": "pending",
                    "urls": None,
                    "video": str(thumbnail.video_id),
                },
            },
        )

    async def test_timed_text_track_update_channel_layer(self):
        """Message received on timed_text_track_updated event."""
        timed_text_track = await self._get_timed_text_track()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(timed_text_track.video_id)
        jwt_token.payload["consumer_site"] = str(
            timed_text_track.video.consumer_site.id
        )
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["permissions"] = {"can_update": False}
        jwt_token.payload["user"] = {
            "id": "444444",
        }

        communicator = WebsocketCommunicator(
            base_application,
            f"ws/video/{timed_text_track.video_id}/?jwt={jwt_token}",
        )

        connected, _ = await communicator.connect()

        self.assertTrue(connected)

        channel_layer = get_channel_layer()

        await channel_layer.group_send(
            VIDEO_ROOM_NAME.format(video_id=str(timed_text_track.video_id)),
            {
                "type": "timed_text_track_updated",
                "timed_text_track": await self._get_timed_text_track_serializer_data(
                    timed_text_track
                ),
            },
        )

        response = await communicator.receive_from()
        self.assertEqual(
            json.loads(response),
            {
                "type": "timedtexttracks",
                "resource": {
                    "active_stamp": None,
                    "id": str(timed_text_track.id),
                    "is_ready_to_show": False,
                    "language": timed_text_track.language,
                    "mode": timed_text_track.mode,
                    "source_url": None,
                    "upload_state": "pending",
                    "url": None,
                    "video": str(timed_text_track.video_id),
                },
            },
        )
