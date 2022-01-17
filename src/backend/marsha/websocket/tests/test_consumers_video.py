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
from marsha.core.factories import VideoFactory
from marsha.core.serializers import VideoSerializer
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

    async def test_connect_matching_video(self):
        """A connection with url params matching jwt resource_id should succeed."""
        video = await self._get_video()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["permissions"] = {"can_update": False}

        communicator = WebsocketCommunicator(
            base_application,
            f"ws/video/{video.id}/?jwt={jwt_token}",
        )

        connected, _ = await communicator.connect()

        self.assertTrue(connected)

        await communicator.disconnect()

    async def test_connect_no_matching_video(self):
        """Connection with a video not matching the one in the token should be refused."""
        video = await self._get_video()
        other_video = await self._get_video()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["permissions"] = {"can_update": False}

        communicator = WebsocketCommunicator(
            base_application,
            f"ws/video/{other_video.id}/?jwt={jwt_token}",
        )

        connected, _ = await communicator.connect()

        self.assertFalse(connected)

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

        self.assertFalse(connected)

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
                "type": "video",
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
                    "is_scheduled": False,
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
                    "playlist": {
                        "id": str(video.playlist.id),
                        "title": video.playlist.title,
                        "lti_id": video.playlist.lti_id,
                    },
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
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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
                "type": "video",
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
                    "is_scheduled": False,
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
                    "playlist": {
                        "id": str(video.playlist.id),
                        "title": video.playlist.title,
                        "lti_id": video.playlist.lti_id,
                    },
                    "live_info": {
                        "jitsi": {
                            "config_overwrite": {},
                            "domain": "meet.jit.si",
                            "external_api_url": "https://meet.jit.si/external_api.js",
                            "interface_config_overwrite": {},
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
