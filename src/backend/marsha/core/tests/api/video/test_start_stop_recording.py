"""Tests for the Video recording API of the Marsha project."""
from datetime import timedelta
import random
from unittest import mock

from django.test import TestCase, override_settings

from marsha.core.api import timezone
from marsha.core.defaults import JITSI, LIVE_CHOICES, PENDING, RUNNING
from marsha.core.factories import (
    ConsumerSiteAccessFactory,
    OrganizationAccessFactory,
    OrganizationFactory,
    PlaylistAccessFactory,
    UserFactory,
    VideoFactory,
    WebinarVideoFactory,
)
from marsha.core.models import ADMINISTRATOR, INSTRUCTOR, STUDENT
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)
from marsha.core.utils.time_utils import to_timestamp


class ApiVideoStartRecordingTestCase(TestCase):
    """Tests for the Video start recording API."""

    maxDiff = None

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.some_organization = OrganizationFactory()
        cls.some_video = WebinarVideoFactory(
            playlist__organization=cls.some_organization,
            live_state=RUNNING,
        )

    def assert_user_cannot_start_recording(self, user, video):
        """Assert the user cannot start the recording."""

        jwt_token = UserAccessTokenFactory(user=user)
        response = self.client.patch(
            f"/api/videos/{video.pk}/start-recording/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    @override_settings(LIVE_CHAT_ENABLED=True)
    def assert_user_can_start_recording(self, user, video):
        """Assert the user can start the recording."""
        self.assertEqual(video.recording_slices, [])

        with mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode, mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            mock_jwt_encode.return_value = "xmpp_jwt"

            jwt_token = UserAccessTokenFactory(user=user)
            response = self.client.patch(
                f"/api/videos/{video.id}/start-recording/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 200)
        mock_dispatch_video_to_groups.assert_called_once_with(video)

        video.refresh_from_db()

        self.assertLessEqual(
            video.recording_slices[0]["start"], to_timestamp(timezone.now())
        )

    def test_start_recording_by_random_user(self):
        """Authenticated user without access cannot start a recording."""
        user = UserFactory()

        self.assert_user_cannot_start_recording(user, self.some_video)

    def test_start_recording_by_organization_student(self):
        """Organization students cannot start a recording."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=STUDENT,
        )

        self.assert_user_cannot_start_recording(
            organization_access.user, self.some_video
        )

    def test_start_recording_by_organization_instructor(self):
        """Organization instructors cannot start a recording."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=INSTRUCTOR,
        )

        self.assert_user_cannot_start_recording(
            organization_access.user, self.some_video
        )

    def test_start_recording_by_organization_administrator(self):
        """Organization administrators can start a recording."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=ADMINISTRATOR,
        )

        self.assert_user_can_start_recording(organization_access.user, self.some_video)

    def test_start_recording_by_consumer_site_any_role(self):
        """Consumer site roles cannot start a recording."""
        consumer_site_access = ConsumerSiteAccessFactory(
            consumer_site=self.some_video.playlist.consumer_site,
        )

        self.assert_user_cannot_start_recording(
            consumer_site_access.user, self.some_video
        )

    def test_start_recording_by_playlist_student(self):
        """Playlist student cannot start a recording."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=STUDENT,
        )

        self.assert_user_cannot_start_recording(playlist_access.user, self.some_video)

    def test_start_recording_by_playlist_instructor(self):
        """Playlist instructor cannot start a recording."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=INSTRUCTOR,
        )

        self.assert_user_can_start_recording(playlist_access.user, self.some_video)

    def test_start_recording_by_playlist_admin(self):
        """Playlist administrator can start a recording."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=ADMINISTRATOR,
        )

        self.assert_user_can_start_recording(playlist_access.user, self.some_video)


class ApiVideoStopRecordingTestCase(TestCase):
    """Tests for the Video stop recording API."""

    maxDiff = None

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.some_organization = OrganizationFactory()
        cls.some_video = WebinarVideoFactory(
            playlist__organization=cls.some_organization,
            live_state=RUNNING,
            recording_slices=[
                {"start": to_timestamp(timezone.now() - timedelta(minutes=10))}
            ],
        )

    def assert_user_cannot_stop_recording(self, user, video):
        """Assert the user cannot stop the recording."""

        jwt_token = UserAccessTokenFactory(user=user)
        response = self.client.patch(
            f"/api/videos/{video.pk}/stop-recording/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    @override_settings(LIVE_CHAT_ENABLED=True)
    def assert_user_can_stop_recording(self, user, video):
        """Assert the user can stop the recording."""
        self.assertIsNone(video.recording_slices[-1].get("stop"))

        with mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode, mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            mock_jwt_encode.return_value = "xmpp_jwt"

            jwt_token = UserAccessTokenFactory(user=user)
            response = self.client.patch(
                f"/api/videos/{video.id}/stop-recording/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 200)
        mock_dispatch_video_to_groups.assert_called_once_with(video)

        video.refresh_from_db()

        self.assertLessEqual(
            video.recording_slices[-1]["stop"], to_timestamp(timezone.now())
        )

    def test_stop_recording_by_random_user(self):
        """Authenticated user without access cannot stop a recording."""
        user = UserFactory()

        self.assert_user_cannot_stop_recording(user, self.some_video)

    def test_stop_recording_by_organization_student(self):
        """Organization students cannot stop a recording."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=STUDENT,
        )

        self.assert_user_cannot_stop_recording(
            organization_access.user, self.some_video
        )

    def test_stop_recording_by_organization_instructor(self):
        """Organization instructors cannot stop a recording."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=INSTRUCTOR,
        )

        self.assert_user_cannot_stop_recording(
            organization_access.user, self.some_video
        )

    def test_stop_recording_by_organization_administrator(self):
        """Organization administrators can stop a recording."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=ADMINISTRATOR,
        )

        self.assert_user_can_stop_recording(organization_access.user, self.some_video)

    def test_stop_recording_by_consumer_site_any_role(self):
        """Consumer site roles cannot stop a recording."""
        consumer_site_access = ConsumerSiteAccessFactory(
            consumer_site=self.some_video.playlist.consumer_site,
        )

        self.assert_user_cannot_stop_recording(
            consumer_site_access.user, self.some_video
        )

    def test_stop_recording_by_playlist_student(self):
        """Playlist student cannot stop a recording."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=STUDENT,
        )

        self.assert_user_cannot_stop_recording(playlist_access.user, self.some_video)

    def test_stop_recording_by_playlist_instructor(self):
        """Playlist instructor cannot stop a recording."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=INSTRUCTOR,
        )

        self.assert_user_can_stop_recording(playlist_access.user, self.some_video)

    def test_stop_recording_by_playlist_admin(self):
        """Playlist administrator can stop a recording."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=ADMINISTRATOR,
        )

        self.assert_user_can_stop_recording(playlist_access.user, self.some_video)


class TestApiVideoRecording(TestCase):
    """Tests for the Video recording API of the Marsha project."""

    maxDiff = None

    def test_api_video_recording_start_anonymous(self):
        """An anonymous user can not start a video recording."""

        video = VideoFactory()

        response = self.client.patch(f"/api/videos/{video.id}/start-recording/")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.json(), {"detail": "Authentication credentials were not provided."}
        )

    def test_api_video_recording_stop_anonymous(self):
        """An anonymous user can not stop a video recording."""

        video = VideoFactory()

        response = self.client.patch(f"/api/videos/{video.id}/stop-recording/")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.json(), {"detail": "Authentication credentials were not provided."}
        )

    def test_api_video_recording_start_student(self):
        """A student user can not start a video recording."""

        video = VideoFactory()

        jwt_token = StudentLtiTokenFactory(
            resource=video,
            context_id=str(video.playlist.lti_id),
            consumer_site=str(video.playlist.consumer_site.id),
        )

        response = self.client.patch(
            f"/api/videos/{video.id}/start-recording/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.json(),
            {"detail": "You do not have permission to perform this action."},
        )

    def test_api_video_recording_stop_student(self):
        """A student user can not stop a video recording."""

        video = VideoFactory()

        jwt_token = StudentLtiTokenFactory(
            resource=video,
            context_id=str(video.playlist.lti_id),
            consumer_site=str(video.playlist.consumer_site.id),
        )

        response = self.client.patch(
            f"/api/videos/{video.id}/stop-recording/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.json(),
            {"detail": "You do not have permission to perform this action."},
        )

    def test_api_video_recording_start_staff_or_user(self):
        """Users authenticated via a session can not start a video recording."""
        video = VideoFactory()
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            response = self.client.patch(f"/api/videos/{video.id}/start-recording/")
            self.assertEqual(response.status_code, 401)
            self.assertEqual(
                response.json(),
                {"detail": "Authentication credentials were not provided."},
            )

    def test_api_video_recording_stop_staff_or_user(self):
        """Users authenticated via a session can not stop a video recording."""
        video = VideoFactory()
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            response = self.client.patch(f"/api/videos/{video.id}/stop-recording/")
            self.assertEqual(response.status_code, 401)
            self.assertEqual(
                response.json(),
                {"detail": "Authentication credentials were not provided."},
            )

    @override_settings(LIVE_CHAT_ENABLED=True)
    @override_settings(XMPP_BOSH_URL="https://xmpp-server.com/http-bind")
    @override_settings(XMPP_CONFERENCE_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_JWT_SHARED_SECRET="xmpp_shared_secret")
    def test_api_video_recording_start_instructor(self):
        """An instructor can start a video recording."""

        video = VideoFactory(
            allow_recording=True,
            upload_state=PENDING,
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
        self.assertEqual(video.recording_slices, [])

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            user__id="56255f3807599c377bf0e5bf072359fd",
        )

        now = timezone.now()
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode, mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            mock_jwt_encode.return_value = "xmpp_jwt"
            response = self.client.patch(
                f"/api/videos/{video.id}/start-recording/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        video.refresh_from_db()

        mock_dispatch_video_to_groups.assert_called_once_with(video)
        self.assertEqual(response.status_code, 200)

        content = response.json()
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
                "is_live": True,
                "title": video.title,
                "active_stamp": None,
                "is_public": False,
                "is_ready_to_show": True,
                "is_recording": True,
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
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": str(video.playlist.title),
                    "lti_id": str(video.playlist.lti_id),
                },
                "recording_time": 0,
                "shared_live_medias": [],
                "live_state": "running",
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
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "xmpp": {
                    "bosh_url": "https://xmpp-server.com/http-bind?token=xmpp_jwt",
                    "conference_url": f"{video.id}@conference.xmpp-server.com",
                    "converse_persistent_store": "localStorage",
                    "jid": "conference.xmpp-server.com",
                    "websocket_url": None,
                },
                "tags": [],
                "license": None,
            },
        )

    @override_settings(LIVE_CHAT_ENABLED=True)
    @override_settings(XMPP_BOSH_URL="https://xmpp-server.com/http-bind")
    @override_settings(XMPP_CONFERENCE_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_JWT_SHARED_SECRET="xmpp_shared_secret")
    def test_api_video_recording_start_not_allowed(self):
        """An instructor cannot start a recording on a not allowed video."""

        video = VideoFactory(
            allow_recording=False,
            upload_state=PENDING,
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
        self.assertEqual(video.recording_slices, [])

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            user__id="56255f3807599c377bf0e5bf072359fd",
        )

        now = timezone.now()
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode, mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            mock_jwt_encode.return_value = "xmpp_jwt"
            response = self.client.patch(
                f"/api/videos/{video.id}/start-recording/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        video.refresh_from_db()

        mock_dispatch_video_to_groups.assert_not_called()

        self.assertEqual(response.status_code, 400)

        content = response.json()
        self.assertEqual(
            content,
            {"detail": "Recording is not allowed for this video."},
        )

    @override_settings(LIVE_CHAT_ENABLED=True)
    @override_settings(XMPP_BOSH_URL="https://xmpp-server.com/http-bind")
    @override_settings(XMPP_CONFERENCE_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_JWT_SHARED_SECRET="xmpp_shared_secret")
    def test_api_video_recording_start_live_not_running(self):
        """An instructor cannot start a recording on a not running live."""

        video = VideoFactory(
            allow_recording=True,
            upload_state=PENDING,
            live_state=random.choice([s[0] for s in LIVE_CHOICES if s[0] != "running"]),
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
        self.assertEqual(video.recording_slices, [])

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            user__id="56255f3807599c377bf0e5bf072359fd",
        )

        now = timezone.now()
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode, mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            mock_jwt_encode.return_value = "xmpp_jwt"
            response = self.client.patch(
                f"/api/videos/{video.id}/start-recording/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        video.refresh_from_db()

        mock_dispatch_video_to_groups.assert_not_called()

        self.assertEqual(response.status_code, 400)

        content = response.json()
        self.assertEqual(
            content,
            {"detail": "Live is not running."},
        )

    @override_settings(LIVE_CHAT_ENABLED=True)
    @override_settings(XMPP_BOSH_URL="https://xmpp-server.com/http-bind")
    @override_settings(XMPP_CONFERENCE_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_JWT_SHARED_SECRET="xmpp_shared_secret")
    def test_api_video_recording_stop_instructor_started_slice(self):
        """An instructor can stop a video recording."""

        start = timezone.now()
        stop = start + timedelta(minutes=10)
        video = VideoFactory(
            recording_slices=[{"start": to_timestamp(start)}],
            upload_state=PENDING,
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
        self.assertEqual(video.recording_slices, [{"start": to_timestamp(start)}])

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            user__id="56255f3807599c377bf0e5bf072359fd",
        )

        with mock.patch.object(timezone, "now", return_value=stop), mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode, mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            mock_jwt_encode.return_value = "xmpp_jwt"
            response = self.client.patch(
                f"/api/videos/{video.id}/stop-recording/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 200)

        video.refresh_from_db()

        mock_dispatch_video_to_groups.assert_called_once_with(video)

        content = response.json()
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
                "is_live": True,
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
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": str(video.playlist.title),
                    "lti_id": str(video.playlist.lti_id),
                },
                "recording_time": 600,
                "shared_live_medias": [],
                "live_state": "running",
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
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "xmpp": {
                    "bosh_url": "https://xmpp-server.com/http-bind?token=xmpp_jwt",
                    "conference_url": f"{video.id}@conference.xmpp-server.com",
                    "converse_persistent_store": "localStorage",
                    "jid": "conference.xmpp-server.com",
                    "websocket_url": None,
                },
                "tags": [],
                "license": None,
            },
        )
