"""Tests for the Video initiate live API of the Marsha project."""
from datetime import datetime
import json
from unittest import mock

from django.test import TestCase, override_settings

from marsha.core import factories
from marsha.core.api import timezone
from marsha.core.defaults import JITSI
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    PlaylistLtiTokenFactory,
    StudentLtiTokenFactory,
)


class VideoInitiateLiveAPITest(TestCase):
    """Test the "initiate live" API of the video object."""

    maxDiff = None

    def test_api_video_initiate_live_anonymous_user(self):
        """Anonymous users are not allowed to initiate a live."""
        video = factories.VideoFactory()

        response = self.client.post(f"/api/videos/{video.id}/initiate-live/")

        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_video_instructor_initiate_live_in_read_only(self):
        """An instructor with read_only set to true should not be able to initiate a live."""
        video = factories.VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            permissions__can_update=False,
        )

        response = self.client.post(
            f"/api/videos/{video.id}/initiate-live/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_video_student_initiate_live(self):
        """A student should not be able to initiate a live."""
        video = factories.VideoFactory()
        jwt_token = StudentLtiTokenFactory(resource=video)

        response = self.client.post(
            f"/api/videos/{video.id}/initiate-live/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_video_initiate_live_staff_or_user(self):
        """Users authenticated via a session should not be able to initiate a live."""
        for user in [factories.UserFactory(), factories.UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            video = factories.VideoFactory()

            response = self.client.post(f"/api/videos/{video.id}/initiate-live/")
            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )

    def test_api_video_instructor_initiate_live(self):
        """An instructor should be able to initiate a live."""
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)
        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video"
        ) as mock_dispatch_video:
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-live/",
                {"type": "raw"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            video.refresh_from_db()
            mock_dispatch_video.assert_called_with(video, to_admin=True)

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
                "upload_state": "pending",
                "thumbnail": None,
                "timed_text_tracks": [],
                "urls": None,
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
                "live_state": "idle",
                "live_info": {},
                "xmpp": None,
                "live_type": "raw",
                "tags": [],
                "license": None,
            },
        )

    def test_api_video_instructor_initiate_live_with_playlist_token(self):
        """
        Initiate a live with playlist token.

        Used in the context of a lti select request (deep linking).
        """
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
        )
        jwt_token = PlaylistLtiTokenFactory(playlist=video.playlist)
        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video"
        ) as mock_dispatch_video:
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-live/",
                {"type": "raw"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            video.refresh_from_db()
            mock_dispatch_video.assert_called_with(video, to_admin=True)

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
                "upload_state": "pending",
                "thumbnail": None,
                "timed_text_tracks": [],
                "urls": None,
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
                "live_state": "idle",
                "live_info": {},
                "xmpp": None,
                "live_type": "raw",
                "tags": [],
                "license": None,
            },
        )

    def test_api_video_instructor_initiate_jitsi_live(self):
        """An instructor should be able to initiate a jitsi live."""
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video"
        ) as mock_dispatch_video:
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-live/",
                {"type": "jitsi"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            video.refresh_from_db()
            mock_dispatch_video.assert_called_with(video, to_admin=True)

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
                "upload_state": "pending",
                "thumbnail": None,
                "timed_text_tracks": [],
                "urls": None,
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
                "live_state": "idle",
                "live_info": {
                    "jitsi": {
                        "config_overwrite": {},
                        "domain": "meet.jit.si",
                        "external_api_url": "https://meet.jit.si/external_api.js",
                        "interface_config_overwrite": {},
                        "room_name": str(video.pk),
                    }
                },
                "live_type": JITSI,
                "xmpp": None,
                "tags": [],
                "license": None,
            },
        )

    @override_settings(JITSI_JWT_APP_ID="jitsi_app_id")
    @override_settings(JITSI_JWT_APP_SECRET="jitsi_jwt_app_secret")
    def test_api_video_instructor_initiate_jitsi_live_with_token(self):
        """Admin or instructor should be able to initiate a jitsi live and generate a token to
        connect to jitsi."""
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        now = datetime(2022, 5, 4, tzinfo=timezone.utc)
        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video"
        ) as mock_dispatch_video, mock.patch.object(timezone, "now", return_value=now):
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-live/",
                {"type": "jitsi"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            video.refresh_from_db()
            mock_dispatch_video.assert_called_with(video, to_admin=True)

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
                "upload_state": "pending",
                "thumbnail": None,
                "timed_text_tracks": [],
                "urls": None,
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
                "live_state": "idle",
                "live_info": {
                    "jitsi": {
                        "config_overwrite": {},
                        "domain": "meet.jit.si",
                        "external_api_url": "https://meet.jit.si/external_api.js",
                        "interface_config_overwrite": {},
                        "room_name": str(video.pk),
                        "token": (
                            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb250ZXh0Ijp7InVzZXIiOnsiYW"
                            "ZmaWxpYXRpb24iOiJvd25lciJ9fSwiZXhwIjoxNjUxNjIzMDAwLCJpYXQiOjE2NTE2M"
                            "jI0MDAsIm1vZGVyYXRvciI6dHJ1ZSwiYXVkIjoiaml0c2kiLCJpc3MiOiJqaXRzaV9h"
                            "cHBfaWQiLCJzdWIiOiJtZWV0LmppdC5zaSIsInJvb20iOiIyN2EyM2Y1Mi0zMzc5LTQ"
                            "2YTItOTRmYS02OTdiNTljZmUzYzcifQ.JxHCJ4VKfvtEliTyNnR0sj2LGLOUQAcEnmi"
                            "q-vi_MDA"
                        ),
                    }
                },
                "live_type": JITSI,
                "xmpp": None,
                "tags": [],
                "license": None,
            },
        )
