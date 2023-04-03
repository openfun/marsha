"""Tests for the classroom API."""
from datetime import datetime, timedelta, timezone as baseTimezone
import json
from unittest import mock
import zoneinfo

from django.test import TestCase, override_settings
from django.utils import timezone

from marsha.bbb import serializers
from marsha.bbb.factories import ClassroomFactory
from marsha.bbb.models import Classroom
from marsha.core import factories as core_factories
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
class ClassroomUpdateAPITest(TestCase):
    """Test for the Classroom API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

    def test_api_classroom_update_anonymous(self):
        """An anonymous should not be able to update a classroom."""
        classroom = ClassroomFactory()
        response = self.client.patch(f"/api/classrooms/{classroom.id!s}/")
        self.assertEqual(response.status_code, 401)

    def test_api_classroom_update_user_logged_in(self):
        """An logged in user should not be able to update a classroom."""
        user = core_factories.UserFactory(
            first_name="Jane", last_name="Doe", email="jane.doe@example.com"
        )
        classroom = ClassroomFactory()
        self.client.force_login(user)
        response = self.client.patch(f"/api/classrooms/{classroom.id!s}/")
        self.assertEqual(response.status_code, 401)

    def test_api_classroom_update_student(self):
        """A student user should not be able to update a classroom."""
        classroom = ClassroomFactory()

        jwt_token = StudentLtiTokenFactory(resource=classroom)

        data = {"title": "new title"}

        response = self.client.patch(
            f"/api/classrooms/{classroom.id!s}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_classroom_update_instructor_read_only(self):
        """An instructor should not be able to update a classroom in read_only."""
        classroom = ClassroomFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=classroom,
            permissions__can_update=False,
        )
        data = {"title": "new title"}

        response = self.client.patch(
            f"/api/classrooms/{classroom.id!s}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_update_instructor(self, mock_get_meeting_infos):
        """An instructor should be able to update a classroom."""
        classroom = ClassroomFactory()

        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom)
        data = {"title": "new title", "welcome_text": "Hello"}

        response = self.client.patch(
            f"/api/classrooms/{classroom.id!s}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

        classroom.refresh_from_db()
        self.assertEqual("new title", classroom.title)
        self.assertEqual("Hello", classroom.welcome_text)

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_update_instructor_scheduling(self, mock_get_meeting_infos):
        """Update a classroom to be scheduled."""
        classroom = ClassroomFactory()

        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom)

        now = datetime(2018, 8, 8, tzinfo=zoneinfo.ZoneInfo("Europe/Paris"))
        # set microseconds to 0 to compare date surely as serializer truncate them
        starting_at = (now + timedelta(hours=3)).replace(microsecond=0)
        estimated_duration = timedelta(seconds=60)
        data = {
            # starting_at sent with timezone : "2018-08-08T03:00:00+02:00"
            "starting_at": starting_at.isoformat(),
            "estimated_duration": estimated_duration,
        }

        with mock.patch.object(timezone, "now", return_value=now):
            response = self.client.patch(
                f"/api/classrooms/{classroom.id!s}/",
                data,
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
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
                # starting_at is stored in UTC : "2018-08-08T01:00:00Z"
                "starting_at": starting_at.astimezone(baseTimezone.utc)
                .isoformat()
                .replace("+00:00", "Z"),
                "estimated_duration": "00:01:00",
                "recordings": [],
                "enable_waiting_room": False,
                "enable_chat": True,
                "enable_presentation_supports": True,
                "enable_recordings": True,
                "enable_shared_notes": True
                # invite_token is tested below
                # instructor_token is tested below
            },
            content,
        )

        # don't verify here, because of time travel (tested elsewhere)
        decoded_invite_token = ResourceAccessToken(invite_token, verify=False)
        self.assertEqual(decoded_invite_token.payload["resource_id"], str(classroom.id))
        self.assertEqual(decoded_invite_token.payload["roles"], [NONE])
        self.assertEqual(
            decoded_invite_token.payload["permissions"],
            {"can_update": False, "can_access_dashboard": False},
        )

        # don't verify here, because of time travel (tested elsewhere)
        decoded_instructor_token = ResourceAccessToken(instructor_token, verify=False)
        self.assertEqual(
            decoded_instructor_token.payload["resource_id"], str(classroom.id)
        )
        self.assertEqual(decoded_instructor_token.payload["roles"], [INSTRUCTOR])
        self.assertEqual(
            decoded_instructor_token.payload["permissions"],
            {"can_update": True, "can_access_dashboard": True},
        )

        classroom.refresh_from_db()
        self.assertEqual(starting_at, classroom.starting_at)
        self.assertEqual(estimated_duration, classroom.estimated_duration)

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_update_instructor_scheduling_past_date(
        self, mock_get_meeting_infos
    ):
        """Scheduling a classroom in the pash is not allowed."""
        classroom = ClassroomFactory()

        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom)

        now = datetime(2018, 8, 8, tzinfo=zoneinfo.ZoneInfo("Europe/Paris"))
        # set microseconds to 0 to compare date surely as serializer truncate them
        starting_at = (now - timedelta(hours=3)).replace(microsecond=0)
        estimated_duration = timedelta(seconds=60)
        data = {
            "starting_at": starting_at.isoformat(),
            "estimated_duration": estimated_duration,
        }

        with mock.patch.object(timezone, "now", return_value=now):
            response = self.client.patch(
                f"/api/classrooms/{classroom.id!s}/",
                data,
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {
                "starting_at": [
                    f"{starting_at} is not a valid date, date should be planned after!"
                ]
            },
        )

        updated_classroom = Classroom.objects.get(id=classroom.id)
        self.assertNotEqual(starting_at, updated_classroom.starting_at)
        self.assertEqual(classroom.starting_at, updated_classroom.starting_at)
        self.assertEqual(
            classroom.estimated_duration, updated_classroom.estimated_duration
        )

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_update_put_instructor_scheduling(
        self, mock_get_meeting_infos
    ):
        """Update a classroom to be scheduled."""
        classroom = ClassroomFactory()

        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom)
        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        # set microseconds to 0 to compare date surely as serializer truncate them
        starting_at = (now + timedelta(hours=1)).replace(microsecond=0)
        estimated_duration = timedelta(seconds=60)

        data = {
            "title": classroom.title,
            "description": classroom.description,
            "welcome_text": classroom.welcome_text,
            "starting_at": "2018-08-08T01:00:00Z",
            "estimated_duration": "00:01:00",
        }

        with mock.patch.object(timezone, "now", return_value=now):
            response = self.client.put(
                f"/api/classrooms/{classroom.id!s}/",
                data,
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
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
                "starting_at": "2018-08-08T01:00:00Z",
                "estimated_duration": "00:01:00",
                "recordings": [],
                "enable_waiting_room": False,
                "enable_chat": True,
                "enable_presentation_supports": True,
                "enable_recordings": True,
                "enable_shared_notes": True
                # invite_token is tested below
                # instructor_token is tested below
            },
            content,
        )

        # don't verify here, because of time travel (tested elsewhere)
        decoded_invite_token = ResourceAccessToken(invite_token, verify=False)
        self.assertEqual(decoded_invite_token.payload["resource_id"], str(classroom.id))
        self.assertEqual(decoded_invite_token.payload["roles"], [NONE])
        self.assertEqual(
            decoded_invite_token.payload["permissions"],
            {"can_update": False, "can_access_dashboard": False},
        )

        decoded_instructor_token = ResourceAccessToken(instructor_token, verify=False)
        self.assertEqual(
            decoded_instructor_token.payload["resource_id"], str(classroom.id)
        )
        self.assertEqual(decoded_instructor_token.payload["roles"], [INSTRUCTOR])
        self.assertEqual(
            decoded_instructor_token.payload["permissions"],
            {"can_update": True, "can_access_dashboard": True},
        )

        classroom.refresh_from_db()
        self.assertEqual(starting_at, classroom.starting_at)
        self.assertEqual(estimated_duration, classroom.estimated_duration)

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_update_starting_at_ended(self, mock_get_meeting_infos):
        """Updating starting at of a classroom sets ended to false."""
        classroom = ClassroomFactory(ended=True)

        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom)
        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        # set microseconds to 0 to compare date surely as serializer truncate them
        starting_at = (now + timedelta(hours=1)).replace(microsecond=0)
        data = {"starting_at": starting_at}

        with mock.patch.object(timezone, "now", return_value=now):
            self.client.patch(
                f"/api/classrooms/{classroom.id!s}/",
                data,
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        classroom.refresh_from_db()
        self.assertFalse(classroom.ended)

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_update_estimated_duration_ended(
        self, mock_get_meeting_infos
    ):
        """Updating estimated duration of a classroom sets ended to false."""
        classroom = ClassroomFactory(ended=True)

        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom)

        estimated_duration = timedelta(seconds=60)
        data = {"estimated_duration": estimated_duration}

        self.client.patch(
            f"/api/classrooms/{classroom.id!s}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        classroom.refresh_from_db()
        self.assertFalse(classroom.ended)

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_update_user_access_token(self, mock_get_meeting_infos):
        """A user with UserAccessToken should not be able to update a classroom."""
        organization_access = OrganizationAccessFactory()
        playlist = PlaylistFactory(organization=organization_access.organization)
        classroom = ClassroomFactory(playlist=playlist)
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = UserAccessTokenFactory(user=organization_access.user)
        data = {"title": "new title", "welcome_text": "Hello"}

        response = self.client.patch(
            f"/api/classrooms/{classroom.id!s}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_update_user_access_token_organization_admin(
        self, mock_get_meeting_infos
    ):
        """An organization administrator should be able to update a classroom."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        classroom = ClassroomFactory(playlist=playlist)
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = UserAccessTokenFactory(user=organization_access.user)
        data = {"title": "new title", "welcome_text": "Hello"}

        response = self.client.patch(
            f"/api/classrooms/{classroom.id!s}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

        classroom.refresh_from_db()
        self.assertEqual("new title", classroom.title)
        self.assertEqual("Hello", classroom.welcome_text)

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_update_user_access_token_playlist_admin(
        self, mock_get_meeting_infos
    ):
        """A playlist administrator should be able to update a classroom."""
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        classroom = ClassroomFactory(playlist=playlist_access.playlist)
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        data = {"title": "new title", "welcome_text": "Hello"}

        response = self.client.patch(
            f"/api/classrooms/{classroom.id!s}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

        classroom.refresh_from_db()
        self.assertEqual("new title", classroom.title)
        self.assertEqual("Hello", classroom.welcome_text)
