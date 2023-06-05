"""Tests for the classroom retrieve API."""
from datetime import datetime, timedelta
import json
from unittest import mock
import zoneinfo

from django.test import TestCase, override_settings

from marsha.bbb import serializers
from marsha.bbb.factories import ClassroomFactory, ClassroomRecordingFactory
from marsha.core.factories import (
    OrganizationAccessFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
)
from marsha.core.models import ADMINISTRATOR, INSTRUCTOR, NONE
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)
from marsha.core.simple_jwt.tokens import ResourceAccessToken
from marsha.core.tests.testing_utils import reload_urlconf


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
@override_settings(BBB_ENABLED=True)
class ClassroomRetrieveAPITest(TestCase):
    """Test for the Classroom retrieve API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_fetch_student(self, mock_get_meeting_infos):
        """A student should be allowed to fetch a classroom."""
        classroom = ClassroomFactory()
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = StudentLtiTokenFactory(resource=classroom)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertDictEqual(
            {
                "id": str(classroom.id),
                "infos": {"returncode": "SUCCESS", "running": "true"},
                "lti_id": str(classroom.lti_id),
                "title": classroom.title,
                "description": classroom.description,
                "started": False,
                "ended": False,
                "meeting_id": str(classroom.meeting_id),
                "welcome_text": classroom.welcome_text,
                "playlist": {
                    "id": str(classroom.playlist.id),
                    "title": classroom.playlist.title,
                    "lti_id": classroom.playlist.lti_id,
                },
                "starting_at": None,
                "estimated_duration": None,
                "invite_token": None,
                "instructor_token": None,
                "recordings": [],
                "enable_waiting_room": False,
                "enable_chat": True,
                "enable_presentation_supports": True,
                "enable_recordings": True,
                "recording_purpose": classroom.recording_purpose,
                "enable_shared_notes": True,
                "vod_conversion_enabled": True,
            },
            content,
        )

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_fetch_student_with_recordings(self, mock_get_meeting_infos):
        """Existing recordings should not be retrieved by students."""
        classroom = ClassroomFactory()
        ClassroomRecordingFactory(
            classroom=classroom,
            started_at="2019-08-21T15:00:02Z",
        )
        ClassroomRecordingFactory(
            classroom=classroom,
            started_at="2019-08-21T11:00:02Z",
        )
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = StudentLtiTokenFactory(resource=classroom)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        self.assertDictEqual(
            {
                "id": str(classroom.id),
                "infos": {"returncode": "SUCCESS", "running": "true"},
                "lti_id": str(classroom.lti_id),
                "title": classroom.title,
                "description": classroom.description,
                "started": False,
                "ended": False,
                "meeting_id": str(classroom.meeting_id),
                "welcome_text": classroom.welcome_text,
                "playlist": {
                    "id": str(classroom.playlist.id),
                    "title": classroom.playlist.title,
                    "lti_id": classroom.playlist.lti_id,
                },
                "starting_at": None,
                "estimated_duration": None,
                "recordings": [],
                "invite_token": None,
                "instructor_token": None,
                "enable_waiting_room": False,
                "enable_chat": True,
                "enable_presentation_supports": True,
                "enable_recordings": True,
                "recording_purpose": classroom.recording_purpose,
                "enable_shared_notes": True,
                "vod_conversion_enabled": True,
            },
            content,
        )

    def test_api_classroom_fetch_from_other_classroom(self):
        """
        Fetching a classroom with a token resource for an other classroom should not be allowed.
        """
        classroom = ClassroomFactory()
        other_classroom = ClassroomFactory()

        jwt_token = StudentLtiTokenFactory(resource=other_classroom)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_fetch_student_scheduled(self, mock_get_meeting_infos):
        """A student should be allowed to fetch a scheduled classroom."""
        now = datetime(2018, 8, 8, tzinfo=zoneinfo.ZoneInfo("Europe/Paris"))

        # set microseconds to 0 to compare date surely as serializer truncate them
        starting_at = (now + timedelta(hours=3)).replace(microsecond=0)
        estimated_duration = timedelta(seconds=60)

        classroom = ClassroomFactory(
            starting_at=starting_at, estimated_duration=estimated_duration
        )
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = StudentLtiTokenFactory(resource=classroom)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertDictEqual(
            {
                "id": str(classroom.id),
                "infos": {"returncode": "SUCCESS", "running": "true"},
                "lti_id": str(classroom.lti_id),
                "title": classroom.title,
                "description": classroom.description,
                "started": False,
                "ended": False,
                "meeting_id": str(classroom.meeting_id),
                "welcome_text": classroom.welcome_text,
                "playlist": {
                    "id": str(classroom.playlist.id),
                    "title": classroom.playlist.title,
                    "lti_id": classroom.playlist.lti_id,
                },
                "starting_at": "2018-08-08T01:00:00Z",
                "estimated_duration": "00:01:00",
                "invite_token": None,
                "instructor_token": None,
                "recordings": [],
                "enable_waiting_room": False,
                "enable_chat": True,
                "enable_presentation_supports": True,
                "enable_recordings": True,
                "recording_purpose": classroom.recording_purpose,
                "enable_shared_notes": True,
                "vod_conversion_enabled": True,
            },
            content,
        )

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_fetch_instructor(self, mock_get_meeting_infos):
        """An instructor should be able to fetch a classroom."""
        classroom = ClassroomFactory()
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        invite_token = content.pop("invite_token")
        instructor_token = content.pop("instructor_token")
        self.assertDictEqual(
            {
                "id": str(classroom.id),
                "infos": {"returncode": "SUCCESS", "running": "true"},
                "lti_id": str(classroom.lti_id),
                "title": classroom.title,
                "description": classroom.description,
                "started": False,
                "ended": False,
                "meeting_id": str(classroom.meeting_id),
                "welcome_text": classroom.welcome_text,
                "playlist": {
                    "id": str(classroom.playlist.id),
                    "title": classroom.playlist.title,
                    "lti_id": classroom.playlist.lti_id,
                },
                "starting_at": None,
                "estimated_duration": None,
                "recordings": [],
                "enable_waiting_room": False,
                "enable_chat": True,
                "enable_presentation_supports": True,
                "enable_recordings": True,
                "recording_purpose": classroom.recording_purpose,
                "enable_shared_notes": True,
                "vod_conversion_enabled": True,
                # invite_token is tested below
                # instructor_token is tested below
            },
            content,
        )

        decoded_invite_token = ResourceAccessToken(invite_token)
        self.assertEqual(decoded_invite_token.payload["resource_id"], str(classroom.id))
        self.assertEqual(decoded_invite_token.payload["roles"], [NONE])
        self.assertEqual(
            decoded_invite_token.payload["permissions"],
            {"can_update": False, "can_access_dashboard": False},
        )

        decoded_instructor_token = ResourceAccessToken(instructor_token)
        self.assertEqual(decoded_instructor_token.payload["roles"], [INSTRUCTOR])
        self.assertEqual(
            decoded_instructor_token.payload["permissions"],
            {"can_update": True, "can_access_dashboard": True},
        )

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_fetch_user_access_token(self, mock_get_meeting_infos):
        """A user with UserAccessToken should not be able to fetch a classroom."""
        organization_access = OrganizationAccessFactory()
        playlist = PlaylistFactory(organization=organization_access.organization)
        classroom = ClassroomFactory(playlist=playlist)
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_fetch_user_access_token_organization_admin(
        self, mock_get_meeting_infos
    ):
        """An organization administrator should be able to fetch a classroom."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        classroom = ClassroomFactory(playlist=playlist)
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        invite_token = content.pop("invite_token")
        instructor_token = content.pop("instructor_token")
        self.assertDictEqual(
            {
                "id": str(classroom.id),
                "infos": {"returncode": "SUCCESS", "running": "true"},
                "lti_id": str(classroom.lti_id),
                "title": classroom.title,
                "description": classroom.description,
                "started": False,
                "ended": False,
                "meeting_id": str(classroom.meeting_id),
                "welcome_text": classroom.welcome_text,
                "playlist": {
                    "id": str(classroom.playlist.id),
                    "title": classroom.playlist.title,
                    "lti_id": classroom.playlist.lti_id,
                },
                "starting_at": None,
                "estimated_duration": None,
                "recordings": [],
                "enable_waiting_room": False,
                "enable_chat": True,
                "enable_presentation_supports": True,
                "enable_recordings": True,
                "recording_purpose": classroom.recording_purpose,
                "enable_shared_notes": True,
                "vod_conversion_enabled": True,
                # invite_token is tested below
                # instructor_token is tested below
            },
            content,
        )

        decoded_invite_token = ResourceAccessToken(invite_token)
        self.assertEqual(decoded_invite_token.payload["resource_id"], str(classroom.id))
        self.assertEqual(decoded_invite_token.payload["roles"], [NONE])
        self.assertEqual(
            decoded_invite_token.payload["permissions"],
            {"can_update": False, "can_access_dashboard": False},
        )

        decoded_instructor_token = ResourceAccessToken(instructor_token)
        self.assertEqual(
            decoded_instructor_token.payload["resource_id"], str(classroom.id)
        )
        self.assertEqual(decoded_instructor_token.payload["roles"], [INSTRUCTOR])
        self.assertEqual(
            decoded_instructor_token.payload["permissions"],
            {"can_update": True, "can_access_dashboard": True},
        )

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_fetch_user_access_token_playlist_admin(
        self, mock_get_meeting_infos
    ):
        """A playlist administrator should be able to fetch a classroom."""
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        classroom = ClassroomFactory(playlist=playlist_access.playlist)
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        invite_token = content.pop("invite_token")
        instructor_token = content.pop("instructor_token")
        self.assertDictEqual(
            {
                "id": str(classroom.id),
                "infos": {"returncode": "SUCCESS", "running": "true"},
                "lti_id": str(classroom.lti_id),
                "title": classroom.title,
                "description": classroom.description,
                "started": False,
                "ended": False,
                "meeting_id": str(classroom.meeting_id),
                "welcome_text": classroom.welcome_text,
                "playlist": {
                    "id": str(classroom.playlist.id),
                    "title": classroom.playlist.title,
                    "lti_id": classroom.playlist.lti_id,
                },
                "starting_at": None,
                "estimated_duration": None,
                "recordings": [],
                "enable_waiting_room": False,
                "enable_chat": True,
                "enable_presentation_supports": True,
                "enable_recordings": True,
                "recording_purpose": classroom.recording_purpose,
                "enable_shared_notes": True,
                "vod_conversion_enabled": True,
                # invite_token is tested below
                # instructor_token is tested below
            },
            content,
        )

        decoded_invite_token = ResourceAccessToken(invite_token)
        self.assertEqual(decoded_invite_token.payload["resource_id"], str(classroom.id))
        self.assertEqual(decoded_invite_token.payload["roles"], [NONE])
        self.assertEqual(
            decoded_invite_token.payload["permissions"],
            {"can_update": False, "can_access_dashboard": False},
        )

        decoded_instructor_token = ResourceAccessToken(instructor_token)
        self.assertEqual(
            decoded_instructor_token.payload["resource_id"], str(classroom.id)
        )
        self.assertEqual(decoded_instructor_token.payload["roles"], [INSTRUCTOR])
        self.assertEqual(
            decoded_instructor_token.payload["permissions"],
            {"can_update": True, "can_access_dashboard": True},
        )

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        invite_token_2 = content.pop("invite_token")

        self.assertEqual(str(invite_token), str(invite_token_2))

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_fetch_user_access_token_playlist_instructor(
        self, mock_get_meeting_infos
    ):
        """A playlist instructor should be able to fetch a classroom."""
        playlist_access = PlaylistAccessFactory(role=INSTRUCTOR)
        classroom = ClassroomFactory(playlist=playlist_access.playlist)
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        invite_token = content.pop("invite_token")
        instructor_token = content.pop("instructor_token")
        self.assertDictEqual(
            {
                "id": str(classroom.id),
                "infos": {"returncode": "SUCCESS", "running": "true"},
                "lti_id": str(classroom.lti_id),
                "title": classroom.title,
                "description": classroom.description,
                "started": False,
                "ended": False,
                "meeting_id": str(classroom.meeting_id),
                "welcome_text": classroom.welcome_text,
                "playlist": {
                    "id": str(classroom.playlist.id),
                    "title": classroom.playlist.title,
                    "lti_id": classroom.playlist.lti_id,
                },
                "starting_at": None,
                "estimated_duration": None,
                "recordings": [],
                "enable_waiting_room": False,
                "enable_chat": True,
                "enable_presentation_supports": True,
                "enable_recordings": True,
                "recording_purpose": classroom.recording_purpose,
                "enable_shared_notes": True,
                "vod_conversion_enabled": True,
                # invite_token is tested below
                # instructor_token is tested below
            },
            content,
        )

        decoded_invite_token = ResourceAccessToken(invite_token)
        self.assertEqual(decoded_invite_token.payload["resource_id"], str(classroom.id))
        self.assertEqual(decoded_invite_token.payload["roles"], [NONE])
        self.assertEqual(
            decoded_invite_token.payload["permissions"],
            {"can_update": False, "can_access_dashboard": False},
        )

        decoded_instructor_token = ResourceAccessToken(instructor_token)
        self.assertEqual(
            decoded_instructor_token.payload["resource_id"], str(classroom.id)
        )
        self.assertEqual(decoded_instructor_token.payload["roles"], [INSTRUCTOR])
        self.assertEqual(
            decoded_instructor_token.payload["permissions"],
            {"can_update": True, "can_access_dashboard": True},
        )

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        invite_token_2 = content.pop("invite_token")

        self.assertEqual(str(invite_token), str(invite_token_2))

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_fetch_with_recordings(self, mock_get_meeting_infos):
        """Existing recordings should be retrieved."""
        classroom = ClassroomFactory()
        classroom_recording_1 = ClassroomRecordingFactory(
            classroom=classroom,
            started_at="2019-08-21T15:00:02Z",
        )
        classroom_recording_2 = ClassroomRecordingFactory(
            classroom=classroom,
            started_at="2019-08-21T11:00:02Z",
        )
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        invite_token = content.pop("invite_token")
        instructor_token = content.pop("instructor_token")
        self.assertDictEqual(
            {
                "id": str(classroom.id),
                "infos": {"returncode": "SUCCESS", "running": "true"},
                "lti_id": str(classroom.lti_id),
                "title": classroom.title,
                "description": classroom.description,
                "started": False,
                "ended": False,
                "meeting_id": str(classroom.meeting_id),
                "welcome_text": classroom.welcome_text,
                "playlist": {
                    "id": str(classroom.playlist.id),
                    "title": classroom.playlist.title,
                    "lti_id": classroom.playlist.lti_id,
                },
                "starting_at": None,
                "estimated_duration": None,
                "recordings": [
                    {
                        "classroom": str(classroom.id),
                        "id": str(classroom_recording_2.id),
                        "record_id": str(classroom_recording_2.record_id),
                        "started_at": "2019-08-21T11:00:02Z",
                        "video_file_url": classroom_recording_2.video_file_url,
                        "vod": None,
                    },
                    {
                        "classroom": str(classroom.id),
                        "id": str(classroom_recording_1.id),
                        "record_id": str(classroom_recording_1.record_id),
                        "started_at": "2019-08-21T15:00:02Z",
                        "video_file_url": classroom_recording_1.video_file_url,
                        "vod": None,
                    },
                ],
                "enable_waiting_room": False,
                "enable_chat": True,
                "enable_presentation_supports": True,
                "enable_recordings": True,
                "recording_purpose": classroom.recording_purpose,
                "enable_shared_notes": True,
                "vod_conversion_enabled": True,
                # invite_token is tested below
                # instructor_token is tested below
            },
            content,
        )

        decoded_invite_token = ResourceAccessToken(invite_token)
        self.assertEqual(decoded_invite_token.payload["resource_id"], str(classroom.id))
        self.assertEqual(decoded_invite_token.payload["roles"], [NONE])
        self.assertEqual(
            decoded_invite_token.payload["permissions"],
            {"can_update": False, "can_access_dashboard": False},
        )

        decoded_instructor_token = ResourceAccessToken(instructor_token)
        self.assertEqual(
            decoded_instructor_token.payload["resource_id"], str(classroom.id)
        )
        self.assertEqual(decoded_instructor_token.payload["roles"], [INSTRUCTOR])
        self.assertEqual(
            decoded_instructor_token.payload["permissions"],
            {"can_update": True, "can_access_dashboard": True},
        )

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_fetch_with_recordings_inactive_conversion(
        self, mock_get_meeting_infos
    ):
        """Existing recordings should be retrieved."""
        classroom = ClassroomFactory(
            playlist__consumer_site__inactive_features=["vod_convert"],
        )
        classroom_recording_1 = ClassroomRecordingFactory(
            classroom=classroom,
            started_at="2019-08-21T15:00:02Z",
        )
        classroom_recording_2 = ClassroomRecordingFactory(
            classroom=classroom,
            started_at="2019-08-21T11:00:02Z",
        )
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        _ = content.pop("invite_token")
        _ = content.pop("instructor_token")
        self.assertDictEqual(
            {
                "id": str(classroom.id),
                "infos": {"returncode": "SUCCESS", "running": "true"},
                "lti_id": str(classroom.lti_id),
                "title": classroom.title,
                "description": classroom.description,
                "started": False,
                "ended": False,
                "meeting_id": str(classroom.meeting_id),
                "welcome_text": classroom.welcome_text,
                "playlist": {
                    "id": str(classroom.playlist.id),
                    "title": classroom.playlist.title,
                    "lti_id": classroom.playlist.lti_id,
                },
                "starting_at": None,
                "estimated_duration": None,
                "recordings": [
                    {
                        "classroom": str(classroom.id),
                        "id": str(classroom_recording_2.id),
                        "record_id": str(classroom_recording_2.record_id),
                        "started_at": "2019-08-21T11:00:02Z",
                        "video_file_url": classroom_recording_2.video_file_url,
                        "vod": None,
                    },
                    {
                        "classroom": str(classroom.id),
                        "id": str(classroom_recording_1.id),
                        "record_id": str(classroom_recording_1.record_id),
                        "started_at": "2019-08-21T15:00:02Z",
                        "video_file_url": classroom_recording_1.video_file_url,
                        "vod": None,
                    },
                ],
                "enable_waiting_room": False,
                "enable_chat": True,
                "enable_presentation_supports": True,
                "enable_recordings": True,
                "recording_purpose": classroom.recording_purpose,
                "enable_shared_notes": True,
                "vod_conversion_enabled": False,
                # invite_token is tested below
                # instructor_token is tested below
            },
            content,
        )
