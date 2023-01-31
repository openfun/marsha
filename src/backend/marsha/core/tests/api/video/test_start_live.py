"""Tests for the Video start live API of the Marsha project."""
from datetime import datetime, timedelta
import json
import random
from unittest import mock

from django.test import TestCase, override_settings

from boto3.exceptions import Boto3Error

from marsha.core import api, factories, models
from marsha.core.api import timezone
from marsha.core.defaults import (
    HARVESTED,
    IDLE,
    JITSI,
    LIVE_CHOICES,
    PENDING,
    RAW,
    READY,
    STARTING,
    STATE_CHOICES,
    STOPPED,
)
from marsha.core.factories import LiveSessionFactory
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    UserAccessTokenFactory,
)
from marsha.core.utils.time_utils import to_timestamp


class VideoStartLiveAPITest(TestCase):
    """Test the "start live" API of the video object."""

    maxDiff = None

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.some_organization = factories.OrganizationFactory()
        cls.some_video = factories.WebinarVideoFactory(
            playlist__organization=cls.some_organization,
        )

    def assert_user_cannot_start_live(self, user, video):
        """Assert the user cannot start the live."""

        jwt_token = UserAccessTokenFactory(user=user)
        response = self.client.post(
            f"/api/videos/{video.pk}/start-live/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    @override_settings(LIVE_CHAT_ENABLED=True)
    def assert_user_can_start_live(self, user, video):
        """Assert the user can start the live."""
        self.assertNotEqual(video.live_state, STARTING)

        with mock.patch.object(api.video, "start_live_channel"), mock.patch.object(
            api.video, "create_live_stream"
        ) as mock_create_live_stream, mock.patch.object(
            api.video, "wait_medialive_channel_is_created"
        ) as mock_wait_medialive_channel_is_created, mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode, mock.patch.object(
            api.video, "create_room"
        ) as mock_create_room, mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            mock_jwt_encode.return_value = "xmpp_jwt"
            mock_create_live_stream.return_value = {
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
            }
            jwt_token = UserAccessTokenFactory(user=user)
            response = self.client.post(
                f"/api/videos/{video.id}/start-live/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            mock_create_room.assert_called_with(video.id)
            mock_wait_medialive_channel_is_created.assert_called_with(
                "medialive_channel_1"
            )
            mock_dispatch_video_to_groups.assert_has_calls(
                [mock.call(video), mock.call(video)]
            )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(content["live_state"], STARTING)

    def test_start_live_by_anonymous_user(self):
        """Anonymous users cannot start a live."""
        response = self.client.post(f"/api/videos/{self.some_video.pk}/start-live/")

        self.assertEqual(response.status_code, 401)

    def test_start_live_by_random_user(self):
        """Authenticated user without access cannot start a live."""
        user = factories.UserFactory()

        self.assert_user_cannot_start_live(user, self.some_video)

    def test_start_live_by_organization_student(self):
        """Organization students cannot start a live."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.some_organization,
            role=models.STUDENT,
        )

        self.assert_user_cannot_start_live(organization_access.user, self.some_video)

    def test_start_live_by_organization_instructor(self):
        """Organization instructors cannot start a live."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.some_organization,
            role=models.INSTRUCTOR,
        )

        self.assert_user_cannot_start_live(organization_access.user, self.some_video)

    def test_start_live_by_organization_administrator(self):
        """Organization administrators can start a live."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.some_organization,
            role=models.ADMINISTRATOR,
        )

        self.assert_user_can_start_live(organization_access.user, self.some_video)

    def test_start_live_by_consumer_site_any_role(self):
        """Consumer site roles cannot start a live."""
        consumer_site_access = factories.ConsumerSiteAccessFactory(
            consumer_site=self.some_video.playlist.consumer_site,
        )

        self.assert_user_cannot_start_live(consumer_site_access.user, self.some_video)

    def test_start_live_by_playlist_student(self):
        """Playlist student cannot start a live."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=models.STUDENT,
        )

        self.assert_user_cannot_start_live(playlist_access.user, self.some_video)

    def test_start_live_by_playlist_instructor(self):
        """Playlist instructor cannot start a live."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=models.INSTRUCTOR,
        )

        self.assert_user_can_start_live(playlist_access.user, self.some_video)

    def test_start_live_by_playlist_admin(self):
        """Playlist administrator can start a live."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=models.ADMINISTRATOR,
        )

        self.assert_user_can_start_live(playlist_access.user, self.some_video)

    @override_settings(LIVE_CHAT_ENABLED=True)
    @override_settings(XMPP_BOSH_URL="https://xmpp-server.com/http-bind")
    @override_settings(XMPP_CONFERENCE_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_JWT_SHARED_SECRET="xmpp_shared_secret")
    def test_api_instructor_start_non_created_live(self):
        """AWS stack and chat room should be created if not existing yet."""
        video = factories.VideoFactory(
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            upload_state=PENDING,
            live_state=IDLE,
            live_type=JITSI,
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            user__id="56255f3807599c377bf0e5bf072359fd",
        )

        # start a live video,
        with mock.patch.object(api.video, "start_live_channel"), mock.patch.object(
            api.video, "create_live_stream"
        ) as mock_create_live_stream, mock.patch.object(
            api.video, "wait_medialive_channel_is_created"
        ) as mock_wait_medialive_channel_is_created, mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode, mock.patch.object(
            api.video, "create_room"
        ) as mock_create_room, mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            mock_jwt_encode.return_value = "xmpp_jwt"
            mock_create_live_stream.return_value = {
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
            }
            response = self.client.post(
                f"/api/videos/{video.id}/start-live/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            mock_create_room.assert_called_with(video.id)
            mock_wait_medialive_channel_is_created.assert_called_with(
                "medialive_channel_1"
            )
            mock_dispatch_video_to_groups.assert_has_calls(
                [mock.call(video), mock.call(video)]
            )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "allow_recording": True,
                "description": video.description,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": None,
                "is_public": False,
                "is_ready_to_show": True,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "starting_at": None,
                "upload_state": "pending",
                "thumbnail": None,
                "timed_text_tracks": [],
                "urls": {
                    "manifests": {
                        "hls": "https://channel_endpoint1/live.m3u8",
                    },
                    "mp4": {},
                    "thumbnails": {},
                },
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "recording_time": 0,
                "shared_live_medias": [],
                "live_state": "starting",
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
                        }
                    },
                },
                "live_type": JITSI,
                "xmpp": {
                    "bosh_url": "https://xmpp-server.com/http-bind?token=xmpp_jwt",
                    "converse_persistent_store": "localStorage",
                    "websocket_url": None,
                    "conference_url": f"{video.id}@conference.xmpp-server.com",
                    "jid": "conference.xmpp-server.com",
                },
                "tags": [],
                "license": None,
            },
        )

    @override_settings(LIVE_CHAT_ENABLED=True)
    @override_settings(XMPP_BOSH_URL="https://xmpp-server.com/http-bind")
    @override_settings(XMPP_CONFERENCE_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_CONVERSE_PERSISTENT_STORE="IndexedDB")
    @override_settings(XMPP_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_JWT_SHARED_SECRET="xmpp_shared_secret")
    def test_api_instructor_start_already_created_live(self):
        """AWS stack and chat room should not be created if already existing."""
        video = factories.VideoFactory(
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            upload_state=PENDING,
            live_state=IDLE,
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

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            user__id="56255f3807599c377bf0e5bf072359fd",
        )

        # start a live video,
        with mock.patch.object(api.video, "start_live_channel"), mock.patch.object(
            api.video, "create_live_stream"
        ) as mock_create_live_stream, mock.patch.object(
            api.video, "wait_medialive_channel_is_created"
        ), mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode, mock.patch.object(
            api.video, "create_room"
        ) as mock_create_room, mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            mock_jwt_encode.return_value = "xmpp_jwt"
            mock_create_live_stream.assert_not_called()
            mock_create_room.assert_not_called()

            response = self.client.post(
                f"/api/videos/{video.id}/start-live/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            mock_dispatch_video_to_groups.assert_has_calls(
                [mock.call(video), mock.call(video)]
            )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "allow_recording": True,
                "description": video.description,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": None,
                "is_public": False,
                "is_ready_to_show": True,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "starting_at": None,
                "upload_state": "pending",
                "thumbnail": None,
                "timed_text_tracks": [],
                "urls": {
                    "manifests": {
                        "hls": "https://channel_endpoint1/live.m3u8",
                    },
                    "mp4": {},
                    "thumbnails": {},
                },
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "recording_time": 0,
                "shared_live_medias": [],
                "live_state": "starting",
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
                        }
                    },
                },
                "live_type": JITSI,
                "xmpp": {
                    "bosh_url": "https://xmpp-server.com/http-bind?token=xmpp_jwt",
                    "converse_persistent_store": "IndexedDB",
                    "websocket_url": None,
                    "conference_url": f"{video.id}@conference.xmpp-server.com",
                    "jid": "conference.xmpp-server.com",
                },
                "tags": [],
                "license": None,
            },
        )

    @override_settings(LIVE_CHAT_ENABLED=True)
    @override_settings(XMPP_BOSH_URL="https://xmpp-server.com/http-bind")
    @override_settings(XMPP_CONFERENCE_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_CONVERSE_PERSISTENT_STORE="IndexedDB")
    @override_settings(XMPP_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_JWT_SHARED_SECRET="xmpp_shared_secret")
    def test_api_instructor_start_stopped_live(self):
        """AWS stack and chat room should not be created after stopped.

        Recording slices must be kept.
        """
        start = timezone.now()
        stop = start + timedelta(minutes=10)
        video = factories.VideoFactory(
            recording_slices=[
                {"start": to_timestamp(start), "stop": to_timestamp(stop)}
            ],
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            upload_state=PENDING,
            live_state=STOPPED,
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

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            user__id="56255f3807599c377bf0e5bf072359fd",
        )

        # start a live video,
        with mock.patch.object(api.video, "start_live_channel"), mock.patch.object(
            api.video, "create_live_stream"
        ) as mock_create_live_stream, mock.patch.object(
            api.video, "wait_medialive_channel_is_created"
        ), mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode, mock.patch.object(
            api.video, "create_room"
        ) as mock_create_room, mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            mock_jwt_encode.return_value = "xmpp_jwt"
            mock_create_live_stream.assert_not_called()
            mock_create_room.assert_not_called()

            response = self.client.post(
                f"/api/videos/{video.id}/start-live/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            mock_dispatch_video_to_groups.assert_has_calls(
                [mock.call(video), mock.call(video)]
            )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "allow_recording": True,
                "description": video.description,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": None,
                "is_public": False,
                "is_ready_to_show": True,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "starting_at": None,
                "upload_state": "pending",
                "thumbnail": None,
                "timed_text_tracks": [],
                "urls": {
                    "manifests": {
                        "hls": "https://channel_endpoint1/live.m3u8",
                    },
                    "mp4": {},
                    "thumbnails": {},
                },
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "recording_time": 600,
                "shared_live_medias": [],
                "live_state": "starting",
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
                        }
                    },
                },
                "live_type": JITSI,
                "xmpp": {
                    "bosh_url": "https://xmpp-server.com/http-bind?token=xmpp_jwt",
                    "converse_persistent_store": "IndexedDB",
                    "websocket_url": None,
                    "conference_url": f"{video.id}@conference.xmpp-server.com",
                    "jid": "conference.xmpp-server.com",
                },
                "tags": [],
                "license": None,
            },
        )
        self.assertEqual(
            video.recording_slices,
            [{"start": to_timestamp(start), "stop": to_timestamp(stop)}],
        )

    @override_settings(LIVE_CHAT_ENABLED=True)
    @override_settings(XMPP_BOSH_URL="https://xmpp-server.com/http-bind")
    @override_settings(XMPP_CONFERENCE_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_JWT_SHARED_SECRET="xmpp_shared_secret")
    def test_api_instructor_start_harvested_live(self):
        """AWS stack and chat room should be created after harvesting.

        Recording slices and resolutions should be deleted.
        """
        start = timezone.now()
        stop = start + timedelta(minutes=10)
        video = factories.VideoFactory(
            recording_slices=[
                {"start": to_timestamp(start), "stop": to_timestamp(stop)}
            ],
            resolutions=[240, 480, 720],
            upload_state=PENDING,
            live_state=HARVESTED,
            live_type=JITSI,
        )
        shared_live_media = factories.SharedLiveMediaFactory(
            video=video,
            extension="pdf",
            title="python structures",
            upload_state=READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=3,
        )
        shared_live_media_2 = factories.SharedLiveMediaFactory(
            nb_pages=None,
            upload_state=PENDING,
            video=video,
        )

        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email=None,
            is_registered=False,
            live_attendance={"key1": {"sound": "OFF", "tabs": "OFF"}},
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            lti_id="Maths",
            video=video,
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            user__id="56255f3807599c377bf0e5bf072359fd",
        )

        # start a live video,
        with mock.patch.object(api.video, "start_live_channel"), mock.patch.object(
            api.video, "create_live_stream"
        ) as mock_create_live_stream, mock.patch.object(
            api.video, "wait_medialive_channel_is_created"
        ) as mock_wait_medialive_channel_is_created, mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode, mock.patch.object(
            api.video, "create_room"
        ) as mock_create_room, mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            mock_jwt_encode.return_value = "xmpp_jwt"
            mock_create_live_stream.return_value = {
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
            }
            response = self.client.post(
                f"/api/videos/{video.id}/start-live/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            mock_create_room.assert_called_with(video.id)
            mock_wait_medialive_channel_is_created.assert_called_with(
                "medialive_channel_1"
            )
            mock_dispatch_video_to_groups.assert_has_calls(
                [mock.call(video), mock.call(video)]
            )

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            response.json(),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "allow_recording": True,
                "description": video.description,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": None,
                "is_public": False,
                "is_ready_to_show": True,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "starting_at": None,
                "upload_state": PENDING,
                "thumbnail": None,
                "timed_text_tracks": [],
                "urls": {
                    "manifests": {
                        "hls": "https://channel_endpoint1/live.m3u8",
                    },
                    "mp4": {},
                    "thumbnails": {},
                },
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": video.playlist.title,
                    "lti_id": video.playlist.lti_id,
                },
                "recording_time": 0,
                "shared_live_medias": [
                    {
                        "id": str(shared_live_media_2.id),
                        "active_stamp": None,
                        "filename": None,
                        "is_ready_to_show": False,
                        "nb_pages": None,
                        "show_download": True,
                        "title": None,
                        "upload_state": "pending",
                        "urls": None,
                        "video": str(video.id),
                    },
                    {
                        "id": str(shared_live_media.id),
                        "active_stamp": "1638230400",
                        "filename": "python-structures.pdf",
                        "is_ready_to_show": True,
                        "nb_pages": 3,
                        "show_download": True,
                        "title": "python structures",
                        "upload_state": "ready",
                        "urls": {
                            "pages": {
                                "1": (
                                    f"https://abc.cloudfront.net/{video.id}/"
                                    f"sharedlivemedia/{shared_live_media.id}/1638230400_1.svg"
                                ),
                                "2": (
                                    f"https://abc.cloudfront.net/{video.id}/"
                                    f"sharedlivemedia/{shared_live_media.id}/1638230400_2.svg"
                                ),
                                "3": (
                                    f"https://abc.cloudfront.net/{video.id}/"
                                    f"sharedlivemedia/{shared_live_media.id}/1638230400_3.svg"
                                ),
                            }
                        },
                        "video": str(video.id),
                    },
                ],
                "live_state": "starting",
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
                        }
                    },
                },
                "live_type": JITSI,
                "xmpp": {
                    "bosh_url": "https://xmpp-server.com/http-bind?token=xmpp_jwt",
                    "converse_persistent_store": "localStorage",
                    "websocket_url": None,
                    "conference_url": f"{video.id}@conference.xmpp-server.com",
                    "jid": "conference.xmpp-server.com",
                },
                "tags": [],
                "license": None,
            },
        )
        video.refresh_from_db()
        self.assertEqual(video.resolutions, None)
        self.assertEqual(video.recording_slices, [])
        livesession.refresh_from_db()
        self.assertEqual(livesession.live_attendance, None)

    def test_api_instructor_start_non_live_video(self):
        """An instructor should not start a video when not in live mode."""
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        # start a live video,
        with mock.patch.object(api.video, "start_live_channel"), mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.post(
                f"/api/videos/{video.id}/start-live/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            mock_dispatch_video_to_groups.assert_not_called()
        self.assertEqual(response.status_code, 400)

    def test_api_instructor_start_aws_raising_exception(self):
        """
        When creating or starting the AWS stack and this one fails, the live should be rollback
        to its original state (IDLE here) and dispatch in the websocket.
        """
        video = factories.VideoFactory(
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            upload_state=PENDING,
            live_state=IDLE,
            live_type=JITSI,
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            user__id="56255f3807599c377bf0e5bf072359fd",
        )

        # start a live video,
        with (
            mock.patch.object(api.video, "start_live_channel"),
            mock.patch.object(
                api.video, "create_live_stream"
            ) as mock_create_live_stream,
            mock.patch(
                "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
            ) as mock_dispatch_video_to_groups,
        ):
            mock_create_live_stream.side_effect = Boto3Error("bad request")
            # Must test live state precisely because
            # mock.call(video) is always equal to
            # mock_dispatch_video_to_groups.call_args_list[0] event with
            # different live_state, plus the video is an object reference,
            # which prevent any testing afterward
            mocked_live_state_calls = []
            mock_dispatch_video_to_groups.side_effect = (
                # We know the only argument is the video
                lambda *args: mocked_live_state_calls.append(args[0].live_state)
            )
            response = self.client.post(
                f"/api/videos/{video.id}/start-live/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

            self.assertEqual(len(mocked_live_state_calls), 2)
            self.assertEqual(mocked_live_state_calls[0], STARTING)
            self.assertEqual(mocked_live_state_calls[1], IDLE)

        self.assertEqual(response.status_code, 500)

        video.refresh_from_db()

        self.assertEqual(video.live_state, IDLE)

    def test_api_instructor_start_non_idle_or_stopped_live(self):
        """An instructor should not start a video its state is not IDLE or STOPPED."""
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=PENDING,
            live_state=random.choice(
                [s[0] for s in LIVE_CHOICES if s[0] not in [STOPPED, IDLE, HARVESTED]]
            ),
            live_type=RAW,
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            # start a live video,
            response = self.client.post(
                f"/api/videos/{video.id}/start-live/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            mock_dispatch_video_to_groups.assert_not_called()
        self.assertEqual(response.status_code, 400)
