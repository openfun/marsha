"""Tests for the Video stop live API of the Marsha project."""
from datetime import datetime, timedelta, timezone as baseTimezone
import json
import random
from unittest import mock

from django.test import TestCase, override_settings

from marsha.core import api, factories, models
from marsha.core.api import timezone
from marsha.core.defaults import (
    LIVE_CHOICES,
    PENDING,
    RAW,
    RUNNING,
    STATE_CHOICES,
    STOPPING,
)
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)
from marsha.core.utils.time_utils import to_timestamp


class VideoAPITest(TestCase):
    """Test the API of the video object."""

    maxDiff = None

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.some_organization = factories.OrganizationFactory()
        cls.some_video = factories.WebinarVideoFactory(
            playlist__organization=cls.some_organization,
            live_state=RUNNING,
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

    def assert_user_cannot_stop_live(self, user, video):
        """Assert the user cannot stop the live."""

        jwt_token = UserAccessTokenFactory(user=user)
        response = self.client.post(
            f"/api/videos/{video.pk}/stop-live/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    @override_settings(LIVE_CHAT_ENABLED=False)
    def assert_user_can_stop_live(self, user, video):
        """Assert the user can stop the live."""
        self.assertNotEqual(video.live_state, STOPPING)

        with mock.patch.object(api.video, "stop_live_channel"), mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups, mock.patch.object(
            api.video, "update_id3_tags"
        ) as mock_update_id3_tags:
            mock_update_id3_tags.assert_not_called()
            jwt_token = UserAccessTokenFactory(user=user)
            response = self.client.post(
                f"/api/videos/{video.id}/stop-live/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            mock_dispatch_video_to_groups.assert_called_once_with(video)

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(content["live_state"], STOPPING)

    def test_api_video_stop_live_anonymous_user(self):
        """Anonymous users are not allowed to stop a live."""
        video = factories.VideoFactory()

        response = self.client.post(f"/api/videos/{video.id}/stop-live/")

        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_stop_live_by_random_user(self):
        """Authenticated user without access cannot stop a live."""
        user = factories.UserFactory()

        self.assert_user_cannot_stop_live(user, self.some_video)

    def test_stop_live_by_organization_student(self):
        """Organization students cannot stop a live."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.some_organization,
            role=models.STUDENT,
        )

        self.assert_user_cannot_stop_live(organization_access.user, self.some_video)

    def test_stop_live_by_organization_instructor(self):
        """Organization instructors cannot stop a live."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.some_organization,
            role=models.INSTRUCTOR,
        )

        self.assert_user_cannot_stop_live(organization_access.user, self.some_video)

    def test_stop_live_by_organization_administrator(self):
        """Organization administrators can stop a live."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.some_organization,
            role=models.ADMINISTRATOR,
        )

        self.assert_user_can_stop_live(organization_access.user, self.some_video)

    def test_stop_live_by_consumer_site_any_role(self):
        """Consumer site roles cannot stop a live."""
        consumer_site_access = factories.ConsumerSiteAccessFactory(
            consumer_site=self.some_video.playlist.consumer_site,
        )

        self.assert_user_cannot_stop_live(consumer_site_access.user, self.some_video)

    def test_stop_live_by_playlist_student(self):
        """Playlist student cannot stop a live."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=models.STUDENT,
        )

        self.assert_user_cannot_stop_live(playlist_access.user, self.some_video)

    def test_stop_live_by_playlist_instructor(self):
        """Playlist instructor cannot stop a live."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=models.INSTRUCTOR,
        )

        self.assert_user_can_stop_live(playlist_access.user, self.some_video)

    def test_stop_live_by_playlist_admin(self):
        """Playlist administrator can stop a live."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=models.ADMINISTRATOR,
        )

        self.assert_user_can_stop_live(playlist_access.user, self.some_video)

    def test_api_video_instructor_stop_live_in_read_only(self):
        """An instructor with read_only set to true should not be able to stop a live."""
        video = factories.VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            permissions__can_update=False,
        )

        response = self.client.post(
            f"/api/videos/{video.id}/stop-live/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_video_student_stop_live(self):
        """A student should not be able to stop a live."""
        video = factories.VideoFactory()
        jwt_token = StudentLtiTokenFactory(resource=video)

        response = self.client.post(
            f"/api/videos/{video.id}/stop-live/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_video_stop_live_staff_or_user(self):
        """Users authenticated via a session should not be able to stop a live."""
        for user in [factories.UserFactory(), factories.UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            video = factories.VideoFactory()

            response = self.client.post(f"/api/videos/{video.id}/stop-live/")
            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )

    @override_settings(LIVE_CHAT_ENABLED=False)
    def test_api_video_instructor_stop_live(self):
        """An instructor should be able to stop a live."""
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            upload_state=PENDING,
            live_state=RUNNING,
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
            live_type=RAW,
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        # stop a live video,
        now = datetime(2021, 11, 16, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch.object(
            api.video, "stop_live_channel"
        ), mock.patch.object(api.video, "update_id3_tags"), mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.post(
                f"/api/videos/{video.id}/stop-live/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            mock_dispatch_video_to_groups.assert_called_once_with(video)
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "allow_recording": True,
                "can_edit": True,
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
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "recording_time": 0,
                "shared_live_medias": [],
                "live_state": STOPPING,
                "live_info": {
                    "medialive": {
                        "input": {
                            "endpoints": [
                                "https://live_endpoint1",
                                "https://live_endpoint2",
                            ],
                        }
                    },
                },
                "live_type": RAW,
                "xmpp": None,
                "tags": [],
                "license": None,
            },
        )

    def test_api_instructor_stop_non_live_video(self):
        """An instructor should not stop a video when not in live mode."""
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        # stop a live video,
        with mock.patch.object(
            api.video, "stop_live_channel"
        ) as mock_stop_live, mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.post(
                f"/api/videos/{video.id}/stop-live/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            mock_dispatch_video_to_groups.assert_not_called()
            mock_stop_live.assert_not_called()

        self.assertEqual(response.status_code, 400)

    def test_api_instructor_stop_non_running_live(self):
        """An instructor should not stop a video when not in live state."""
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=PENDING,
            live_state=random.choice([s[0] for s in LIVE_CHOICES if s[0] != "running"]),
            live_type=RAW,
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        # stop a live video,
        with mock.patch.object(
            api.video, "stop_live_channel"
        ) as mock_stop_live, mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.post(
                f"/api/videos/{video.id}/stop-live/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            mock_stop_live.assert_not_called()
            mock_dispatch_video_to_groups.assert_not_called()
        self.assertEqual(response.status_code, 400)

    @override_settings(LIVE_CHAT_ENABLED=False)
    def test_api_video_instructor_stop_live_recording_slice(self):
        """When a video is stopped during recording, recording should be stopped."""
        start = datetime(2021, 11, 16, tzinfo=baseTimezone.utc)
        stop = start + timedelta(minutes=10)
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            recording_slices=[{"start": to_timestamp(start)}],
            upload_state=PENDING,
            live_state=RUNNING,
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
            live_type=RAW,
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        # stop a live video,
        with mock.patch.object(timezone, "now", return_value=stop), mock.patch.object(
            api.video, "stop_live_channel"
        ), mock.patch.object(api.video, "update_id3_tags"), mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.post(
                f"/api/videos/{video.id}/stop-live/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            mock_dispatch_video_to_groups.assert_called_once_with(video)
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "allow_recording": True,
                "can_edit": True,
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
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "recording_time": 600,
                "shared_live_medias": [],
                "live_state": STOPPING,
                "live_info": {
                    "medialive": {
                        "input": {
                            "endpoints": [
                                "https://live_endpoint1",
                                "https://live_endpoint2",
                            ],
                        }
                    },
                },
                "live_type": RAW,
                "xmpp": None,
                "tags": [],
                "license": None,
            },
        )
        video.refresh_from_db()
        self.assertEqual(
            video.recording_slices,
            [
                {
                    "start": to_timestamp(start),
                    "stop": to_timestamp(stop),
                    "status": PENDING,
                }
            ],
        )
