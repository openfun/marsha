"""Tests for the classroom API."""
from datetime import datetime, timedelta
import json
import random
from unittest import mock
from urllib.parse import quote_plus
import zoneinfo

from django.test import TestCase, override_settings
from django.utils import timezone

from rest_framework_simplejwt.tokens import AccessToken

from marsha.bbb import api, serializers
from marsha.core import factories as core_factories
from marsha.core.tests.utils import reload_urlconf

from ..factories import ClassroomFactory
from ..models import Classroom
from ..utils.bbb_utils import ApiMeetingException


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument,too-many-lines


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
@override_settings(BBB_ENABLED=True)
class ClassroomAPITest(TestCase):
    """Test for the Classroom API."""

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(classroom.id)
        jwt_token.payload["roles"] = ["student"]

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
            },
            content,
        )

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(classroom.id)
        jwt_token.payload["roles"] = ["student"]

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
            },
            content,
        )

    def test_api_classroom_fetch_list_anonymous(self):
        """An anonymous should not be able to fetch a list of classroom."""
        response = self.client.get("/api/classrooms/")
        self.assertEqual(response.status_code, 401)

    def test_api_classroom_fetch_list_student(self):
        """A student should not be able to fetch a list of classroom."""
        classroom = ClassroomFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(classroom.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["permissions"] = {"can_update": True}

        response = self.client.get(
            "/api/classrooms/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_fetch_list_instructor(self):
        """An instructor should not be able to fetch a classroom list."""
        classroom = ClassroomFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(classroom.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        response = self.client.get(
            "/api/classrooms/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_fetch_instructor(self, mock_get_meeting_infos):
        """An instructor should be able to fetch a classroom."""
        classroom = ClassroomFactory()
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(classroom.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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
            },
            content,
        )

    def test_api_classroom_create_anonymous(self):
        """An anonymous should not be able to create a classroom."""
        response = self.client.post("/api/classrooms/")
        self.assertEqual(response.status_code, 401)

    def test_api_classroom_create_student(self):
        """A student should not be able to create a classroom."""
        classroom = ClassroomFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(classroom.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["permissions"] = {"can_update": True}

        response = self.client.post(
            "/api/classrooms/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_classroom_create_student_with_playlist_token(self):
        """A student with a playlist token should not be able to create a classroom."""
        playlist = core_factories.PlaylistFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = "None"
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["permissions"] = {"can_update": True}
        jwt_token.payload["playlist_id"] = str(playlist.id)

        response = self.client.post(
            "/api/classrooms/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Classroom.objects.count(), 0)

    def test_api_classroom_create_instructor(self):
        """An instructor without playlist token should not be able to create a classroom."""
        classroom = ClassroomFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(classroom.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        response = self.client.post(
            "/api/classrooms/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_create_instructor_with_playlist_token(
        self, mock_get_meeting_infos
    ):
        """
        Create classroom with playlist token.

        Used in the context of a lti select request (deep linking).
        """
        playlist = core_factories.PlaylistFactory()

        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = "None"
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        jwt_token.payload["playlist_id"] = str(playlist.id)

        self.assertEqual(Classroom.objects.count(), 0)

        response = self.client.post(
            "/api/classrooms/",
            {
                "lti_id": "classroom_one",
                "playlist": str(playlist.id),
                "title": "Some classroom",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(Classroom.objects.count(), 1)
        self.assertEqual(response.status_code, 201)
        classroom = Classroom.objects.first()
        self.assertEqual(
            response.json(),
            {
                "description": "",
                "ended": False,
                "estimated_duration": None,
                "id": str(classroom.id),
                "infos": {"returncode": "SUCCESS", "running": "true"},
                "lti_id": "classroom_one",
                "meeting_id": str(classroom.meeting_id),
                "playlist": {
                    "id": str(playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "started": False,
                "starting_at": None,
                "title": "Some classroom",
                "welcome_text": "Welcome!",
            },
        )

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(classroom.id)
        jwt_token.payload["roles"] = ["student"]
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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(classroom.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": False}
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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(classroom.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(classroom.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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
                "starting_at": starting_at.astimezone(timezone.utc)
                .isoformat()
                .replace("+00:00", "Z"),
                "estimated_duration": "00:01:00",
            },
            response.json(),
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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(classroom.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(classroom.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
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
            },
            response.json(),
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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(classroom.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(classroom.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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

    def test_api_select_instructor_no_bbb_server(self):
        """An instructor should be able to fetch a classroom lti select."""
        playlist = core_factories.PlaylistFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = "None"
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        jwt_token.payload["playlist_id"] = str(playlist.id)

        response = self.client.get(
            "/api/classrooms/lti-select/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            {
                "new_url": "http://testserver/lti/classrooms/",
                "classrooms": [],
            },
            response.json(),
        )

    def test_api_select_instructor_no_classrooms(self):
        """An instructor should be able to fetch a classroom lti select."""
        playlist = core_factories.PlaylistFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = "None"
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        jwt_token.payload["playlist_id"] = str(playlist.id)

        response = self.client.get(
            "/api/classrooms/lti-select/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            {
                "new_url": "http://testserver/lti/classrooms/",
                "classrooms": [],
            },
            response.json(),
        )

    def test_api_select_instructor(self):
        """An instructor should be able to fetch a classroom lti select."""
        classroom = ClassroomFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = "None"
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        jwt_token.payload["playlist_id"] = str(classroom.playlist_id)

        response = self.client.get(
            "/api/classrooms/lti-select/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            {
                "new_url": "http://testserver/lti/classrooms/",
                "classrooms": [
                    {
                        "id": str(classroom.id),
                        "lti_id": str(classroom.lti_id),
                        "lti_url": f"http://testserver/lti/classrooms/{str(classroom.id)}",
                        "title": classroom.title,
                        "description": classroom.description,
                        "meeting_id": str(classroom.meeting_id),
                        "playlist": {
                            "id": str(classroom.playlist_id),
                            "title": classroom.playlist.title,
                            "lti_id": classroom.playlist.lti_id,
                        },
                    }
                ],
            },
            response.json(),
        )

    @mock.patch.object(api, "create")
    def test_api_bbb_create_anonymous(self, mock_create_request):
        """An anonymous should not be able to create a classroom."""
        classroom = ClassroomFactory()

        response = self.client.patch(f"/api/classrooms/{classroom.id}/create/")
        self.assertEqual(response.status_code, 401)
        mock_create_request.assert_not_called()

    @mock.patch.object(api, "create")
    def test_api_bbb_create_user_logged_in(self, mock_create_request):
        """A logged in user should not be able to create a classroom."""
        user = core_factories.UserFactory(
            first_name="Jane", last_name="Doe", email="jane.doe@example.com"
        )
        classroom = ClassroomFactory()
        self.client.force_login(user)

        response = self.client.patch(f"/api/classrooms/{classroom.id}/create/")
        self.assertEqual(response.status_code, 401)
        mock_create_request.assert_not_called()

    @mock.patch.object(api, "create")
    def test_api_bbb_create_student(self, mock_create_request):
        """A student should not be able to create a classroom."""
        classroom = ClassroomFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(classroom.id)
        jwt_token.payload["roles"] = ["student"]

        response = self.client.patch(
            f"/api/classrooms/{classroom.id}/create/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        mock_create_request.assert_not_called()

    @mock.patch.object(api, "create")
    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_bbb_create_new_classroom(
        self, mock_get_meeting_infos, mock_create_request
    ):
        """Starting a classroom with parameters should store them."""
        classroom = ClassroomFactory()
        mock_get_meeting_infos.return_value = {"returncode": "SUCCESS"}
        mock_create_request.return_value = {"returncode": "SUCCESS"}

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(classroom.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        data = {"title": "new title", "welcome_text": "Hello"}

        response = self.client.patch(
            f"/api/classrooms/{classroom.id}/create/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            {
                "returncode": "SUCCESS",
            },
            response.data,
        )
        classroom.refresh_from_db()
        self.assertEqual("new title", classroom.title)
        self.assertEqual("Hello", classroom.welcome_text)
        mock_create_request.assert_called_with(classroom=classroom)

    @mock.patch.object(api, "create")
    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_bbb_create_existing_classroom(
        self, mock_get_meeting_infos, mock_create_request
    ):
        """No new classroom should be started if a BBB classroom exists for the same id."""
        classroom = ClassroomFactory(
            meeting_id="21e6634f-ab6f-4c77-a665-4229c61b479a",
            title="Classroom 1",
            attendee_password="9#R1kuUl3R",
            moderator_password="0$C7Aaz0o",
        )

        mock_get_meeting_infos.return_value = {"returncode": "SUCCESS"}
        mock_create_request.side_effect = ApiMeetingException(
            {"message": "A classroom already exists with that classroom ID."}
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(classroom.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        data = {"title": classroom.title, "welcome_text": classroom.welcome_text}

        response = self.client.patch(
            f"/api/classrooms/{classroom.id}/create/",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertDictEqual(
            response.data,
            {"message": "A classroom already exists with that classroom ID."},
        )
        mock_create_request.assert_called_with(classroom=classroom)

    @mock.patch.object(api, "join")
    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_bbb_join_classroom_anonymous(
        self, mock_get_meeting_infos, mock_join_request
    ):
        """An anonymous should not be able to join a classroom."""
        classroom = ClassroomFactory()

        response = self.client.patch(
            f"/api/classrooms/{classroom.id}/join/",
        )
        self.assertEqual(response.status_code, 401)
        mock_get_meeting_infos.assert_not_called()
        mock_join_request.assert_not_called()

    @mock.patch.object(api, "join")
    def test_api_bbb_join_classroom_user_logged_in(self, mock_join_request):
        """A logged in user should not be able to join a classroom."""
        user = core_factories.UserFactory(
            first_name="Jane", last_name="Doe", email="jane.doe@example.com"
        )
        classroom = ClassroomFactory()
        self.client.force_login(user)

        response = self.client.patch(f"/api/classrooms/{classroom.id}/join/")
        self.assertEqual(response.status_code, 401)
        mock_join_request.assert_not_called()

    def test_api_bbb_join_student(self):
        """Joining a classroom as student should return an attendee classroom url."""
        classroom = ClassroomFactory(
            meeting_id="21e6634f-ab6f-4c77-a665-4229c61b479a",
            title="Classroom 1",
            attendee_password="9#R1kuUl3R",
            moderator_password="0$C7Aaz0o",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(classroom.id)
        jwt_token.payload["consumer_site"] = "consumer_site"
        jwt_token.payload["user"] = {"id": "user_id"}
        jwt_token.payload["roles"] = ["student"]

        response = self.client.patch(
            f"/api/classrooms/{classroom.id}/join/",
            data=json.dumps({"fullname": "John Doe"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn(
            "https://10.7.7.1/bigbluebutton/api/join?"
            f"fullName=John+Doe&meetingID={classroom.meeting_id}&"
            f"password={quote_plus(classroom.attendee_password)}&"
            "userID=consumer_site_user_id&redirect=true",
            response.data.get("url"),
        )

    def test_api_bbb_join_instructor(self):
        """Joining a classroom as instructor should return a moderator classroom url."""
        classroom = ClassroomFactory(
            meeting_id="21e6634f-ab6f-4c77-a665-4229c61b479a",
            title="Classroom 1",
            attendee_password="9#R1kuUl3R",
            moderator_password="0$C7Aaz0o",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(classroom.id)
        jwt_token.payload["consumer_site"] = "consumer_site"
        jwt_token.payload["user"] = {"id": "user_id"}
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        response = self.client.patch(
            f"/api/classrooms/{classroom.id}/join/",
            data=json.dumps({"fullname": "John Doe"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn(
            "https://10.7.7.1/bigbluebutton/api/join?"
            f"fullName=John+Doe&meetingID={classroom.meeting_id}&"
            f"password={quote_plus(classroom.moderator_password)}&"
            "userID=consumer_site_user_id&redirect=true",
            response.data.get("url"),
        )

    def test_api_bbb_join_instructor_no_fullname(self):
        """Joining a classroom without fullname parameter should return a 422."""
        classroom = ClassroomFactory(
            meeting_id="21e6634f-ab6f-4c77-a665-4229c61b479a",
            title="Classroom 1",
            attendee_password="9#R1kuUl3R",
            moderator_password="0$C7Aaz0o",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(classroom.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        response = self.client.patch(
            f"/api/classrooms/{classroom.id}/join/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertDictEqual(
            {"message": "missing fullname parameter"},
            response.data,
        )

    @mock.patch.object(api, "end")
    def test_api_bbb_end_classroom_anonymous(self, mock_end_request):
        """An anonymous should not be able to end a classroom."""
        classroom = ClassroomFactory()

        response = self.client.patch(
            f"/api/classrooms/{classroom.id}/end/",
        )
        self.assertEqual(response.status_code, 401)
        mock_end_request.assert_not_called()

    @mock.patch.object(api, "end")
    def test_api_bbb_end_classroom_user_logged_in(self, mock_end_request):
        """A logged in user should not be able to end a classroom."""
        user = core_factories.UserFactory(
            first_name="Jane", last_name="Doe", email="jane.doe@example.com"
        )
        classroom = ClassroomFactory()
        self.client.force_login(user)

        response = self.client.patch(
            f"/api/classrooms/{classroom.id}/end/",
        )
        self.assertEqual(response.status_code, 401)
        mock_end_request.assert_not_called()

    @mock.patch.object(api, "end")
    def test_api_bbb_end_classroom_student(self, mock_end_request):
        """A student should not be able to end a classroom."""
        classroom = ClassroomFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(classroom.id)
        jwt_token.payload["roles"] = ["student"]

        response = self.client.patch(
            f"/api/classrooms/{classroom.id}/end/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        mock_end_request.assert_not_called()

    @mock.patch.object(api, "end")
    def test_api_bbb_end_classroom_instructor(self, mock_end_request):
        """Ending a classroom as instructor should return a moderator classroom url."""
        classroom = ClassroomFactory(
            meeting_id="21e6634f-ab6f-4c77-a665-4229c61b479a",
            title="Classroom 1",
            attendee_password="9#R1kuUl3R",
            moderator_password="0$C7Aaz0o",
        )
        mock_end_request.return_value = {
            "message": "A request to end the classroom was sent.",
            "messageKey": "sentEndClassroomRequest",
            "returncode": "SUCCESS",
        }

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(classroom.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        response = self.client.patch(
            f"/api/classrooms/{classroom.id}/end/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            {
                "returncode": "SUCCESS",
                "message": "A request to end the classroom was sent.",
                "messageKey": "sentEndClassroomRequest",
            },
            response.data,
        )
