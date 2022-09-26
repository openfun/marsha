"""Tests for the classroom API."""
from datetime import datetime, timedelta
import json
import random
from unittest import mock
from urllib.parse import quote_plus
import zoneinfo

from django.test import TestCase, override_settings
from django.utils import timezone

from marsha.bbb import api, serializers
from marsha.core import factories as core_factories
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    PlaylistLtiTokenFactory,
    StudentLtiTokenFactory,
)
from marsha.core.tests.utils import reload_urlconf

from ..factories import ClassroomDocumentFactory, ClassroomFactory
from ..models import Classroom, ClassroomDocument
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

        jwt_token = StudentLtiTokenFactory(
            resource=classroom,
            permissions__can_update=True,
        )

        response = self.client.get(
            "/api/classrooms/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_fetch_list_instructor(self):
        """An instructor should not be able to fetch a classroom list."""
        classroom = ClassroomFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom)

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

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom)

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

        jwt_token = StudentLtiTokenFactory(
            resource=classroom,
            permissions__can_update=True,
        )

        response = self.client.post(
            "/api/classrooms/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_classroom_create_student_with_playlist_token(self):
        """A student with a playlist token should not be able to create a classroom."""
        jwt_token = PlaylistLtiTokenFactory(
            roles=["student"],
            permissions__can_update=True,
        )

        response = self.client.post(
            "/api/classrooms/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Classroom.objects.count(), 0)

    def test_api_classroom_create_instructor(self):
        """An instructor without playlist token should not be able to create a classroom."""
        classroom = ClassroomFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom)

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

        jwt_token = PlaylistLtiTokenFactory(playlist=playlist)

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

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom)
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

    def test_api_select_instructor_no_bbb_server(self):
        """An instructor should be able to fetch a classroom lti select."""
        playlist = core_factories.PlaylistFactory()

        jwt_token = PlaylistLtiTokenFactory(playlist=playlist)

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

        jwt_token = PlaylistLtiTokenFactory(playlist=playlist)

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

        jwt_token = PlaylistLtiTokenFactory(playlist=classroom.playlist)

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

    def test_api_list_classroom_documents_anonymous(self):
        """An anonymous should not be able to fetch a list of classroom documents."""
        classroom = ClassroomFactory()
        response = self.client.get(
            f"/api/classrooms/{classroom.id}/classroomdocuments/"
        )
        self.assertEqual(response.status_code, 401)

    def test_api_list_classroom_documents_student(self):
        """A student should not be able to fetch a list of classroom documents."""
        classroom = ClassroomFactory()
        ClassroomDocumentFactory.create_batch(3, classroom=classroom)
        jwt_token = StudentLtiTokenFactory(resource=classroom)

        response = self.client.get(
            f"/api/classrooms/{classroom.id}/classroomdocuments/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_list_classroom_documents_instructor(self):
        """An instructor should be able to fetch list of classroom documents."""
        classroom = ClassroomFactory()
        classroom_documents = ClassroomDocumentFactory.create_batch(
            3, classroom=classroom
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom)

        response = self.client.get(
            f"/api/classrooms/{classroom.id}/classroomdocuments/?limit=2",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 3,
                "next": f"http://testserver/api/classrooms/{classroom.id}"
                "/classroomdocuments/?limit=2&offset=2",
                "previous": None,
                "results": [
                    {
                        "classroom": str(classroom.id),
                        "filename": classroom_documents[2].filename,
                        "id": str(classroom_documents[2].id),
                        "is_default": False,
                        "upload_state": "pending",
                        "uploaded_on": None,
                        "url": None,
                    },
                    {
                        "classroom": str(classroom.id),
                        "filename": classroom_documents[1].filename,
                        "id": str(classroom_documents[1].id),
                        "is_default": False,
                        "upload_state": "pending",
                        "uploaded_on": None,
                        "url": None,
                    },
                ],
            },
        )

    @override_settings(
        CLOUDFRONT_SIGNED_URLS_ACTIVE=True,
        CLOUDFRONT_SIGNED_PUBLIC_KEY_ID="cloudfront-access-key-id",
    )
    def test_api_list_classroom_documents_instructor_urls(self):
        """Classroom documents should not been signed."""
        classroom = ClassroomFactory(id="4e126eac-9ca8-47b1-8dcd-157686b43c60")
        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        classroom_documents = ClassroomDocumentFactory.create_batch(
            3, classroom=classroom, uploaded_on=now
        )
        classroom_documents.append(
            ClassroomDocumentFactory(
                classroom=classroom,
                filename="no_extension_file",
                uploaded_on=now,
            )
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom)

        response = self.client.get(
            f"/api/classrooms/{classroom.id}/classroomdocuments/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 4,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "classroom": str(classroom.id),
                        "filename": classroom_documents[3].filename,
                        "id": str(classroom_documents[3].id),
                        "is_default": False,
                        "upload_state": "pending",
                        "uploaded_on": "2018-08-08T00:00:00Z",
                        "url": (
                            f"https://abc.cloudfront.net/{classroom.id}/classroomdocument/"
                            f"{classroom_documents[3].id}/1533686400"
                            f"?response-content-disposition"
                            f"=attachment%3B+filename%3D{classroom_documents[3].filename}"
                        ),
                    },
                    {
                        "classroom": str(classroom.id),
                        "filename": classroom_documents[2].filename,
                        "id": str(classroom_documents[2].id),
                        "is_default": False,
                        "upload_state": "pending",
                        "uploaded_on": "2018-08-08T00:00:00Z",
                        "url": (
                            f"https://abc.cloudfront.net/{classroom.id}/classroomdocument/"
                            f"{classroom_documents[2].id}/1533686400"
                            f".{classroom_documents[2].filename.split('.')[-1]}"
                            f"?response-content-disposition"
                            f"=attachment%3B+filename%3D{classroom_documents[2].filename}"
                        ),
                    },
                    {
                        "classroom": str(classroom.id),
                        "filename": classroom_documents[1].filename,
                        "id": str(classroom_documents[1].id),
                        "is_default": False,
                        "upload_state": "pending",
                        "uploaded_on": "2018-08-08T00:00:00Z",
                        "url": (
                            f"https://abc.cloudfront.net/{classroom.id}/classroomdocument/"
                            f"{classroom_documents[1].id}/1533686400"
                            f".{classroom_documents[1].filename.split('.')[-1]}"
                            f"?response-content-disposition"
                            f"=attachment%3B+filename%3D{classroom_documents[1].filename}"
                        ),
                    },
                    {
                        "classroom": str(classroom.id),
                        "filename": classroom_documents[0].filename,
                        "id": str(classroom_documents[0].id),
                        "is_default": False,
                        "upload_state": "pending",
                        "uploaded_on": "2018-08-08T00:00:00Z",
                        "url": (
                            f"https://abc.cloudfront.net/{classroom.id}/classroomdocument/"
                            f"{classroom_documents[0].id}/1533686400"
                            f".{classroom_documents[0].filename.split('.')[-1]}"
                            f"?response-content-disposition"
                            f"=attachment%3B+filename%3D{classroom_documents[0].filename}"
                        ),
                    },
                ],
            },
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

        jwt_token = StudentLtiTokenFactory(resource=classroom)

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

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom)
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

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom)
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

        jwt_token = StudentLtiTokenFactory(
            resource=classroom,
            consumer_site="consumer_site",
            user__id="user_id",
        )

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

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=classroom,
            consumer_site="consumer_site",
            user__id="user_id",
        )

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

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom)

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

        jwt_token = StudentLtiTokenFactory(resource=classroom)

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

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom)

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


@override_settings(BBB_ENABLED=True)
class ClassroomDocumentAPITest(TestCase):
    """Test for the ClassroomDocument API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

    def test_api_classroom_document_create_student(self):
        """
        A student should not be able to create a document
        for an existing classroom.
        """

        classroom = ClassroomFactory()
        jwt_token = StudentLtiTokenFactory(resource=classroom)

        response = self.client.post(
            "/api/classroomdocuments/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(
                {
                    "filename": "test.pdf",
                }
            ),
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(ClassroomDocument.objects.count(), 0)
        self.assertEqual(classroom.classroom_documents.count(), 0)

    def test_api_classroom_document_create_instructor(self):
        """
        An instructor should be able to create a document
        for an existing classroom.
        """
        classroom = ClassroomFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom)

        response = self.client.post(
            "/api/classroomdocuments/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(
                {
                    "filename": "test.pdf",
                }
            ),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(ClassroomDocument.objects.count(), 1)
        self.assertEqual(
            response.json(),
            {
                "classroom": str(classroom.id),
                "filename": "test.pdf",
                "id": str(ClassroomDocument.objects.first().id),
                "is_default": False,
                "upload_state": "pending",
                "uploaded_on": None,
                "url": None,
            },
        )

    def test_api_classroom_document_initiate_upload_instructor(self):
        """
        An instructor should be able to initiate an upload for a deposited file.
        """
        classroom_document = ClassroomDocumentFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
            classroom__id="ed08da34-7447-4141-96ff-5740315d7b99",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=classroom_document.classroom
        )

        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/classroomdocuments/{classroom_document.id}/initiate-upload/",
                {"filename": "foo.pdf", "mimetype": "application/pdf"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "url": "https://test-marsha-source.s3.amazonaws.com/",
                "fields": {
                    "acl": "private",
                    "key": (
                        "ed08da34-7447-4141-96ff-5740315d7b99/classroomdocument/"
                        "27a23f52-3379-46a2-94fa-697b59cfe3c7/1533686400.pdf"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "aws-access-key-id/20180808/eu-west-1/s3/aws4_request",
                    "x-amz-date": "20180808T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMTgtMDgtMDlUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBb"
                        "eyJhY2wiOiAicHJpdmF0ZSJ9LCBbImVxIiwgIiRDb250ZW50LVR5cGUiLCAiYXBwbGljYXRp"
                        "b24vcGRmIl0sIFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLCAwLCAzMTQ1NzI4MDBdLCB7ImJ1"
                        "Y2tldCI6ICJ0ZXN0LW1hcnNoYS1zb3VyY2UifSwgeyJrZXkiOiAiZWQwOGRhMzQtNzQ0Ny00"
                        "MTQxLTk2ZmYtNTc0MDMxNWQ3Yjk5L2NsYXNzcm9vbWRvY3VtZW50LzI3YTIzZjUyLTMzNzkt"
                        "NDZhMi05NGZhLTY5N2I1OWNmZTNjNy8xNTMzNjg2NDAwLnBkZiJ9LCB7IngtYW16LWFsZ29y"
                        "aXRobSI6ICJBV1M0LUhNQUMtU0hBMjU2In0sIHsieC1hbXotY3JlZGVudGlhbCI6ICJhd3Mt"
                        "YWNjZXNzLWtleS1pZC8yMDE4MDgwOC9ldS13ZXN0LTEvczMvYXdzNF9yZXF1ZXN0In0sIHsi"
                        "eC1hbXotZGF0ZSI6ICIyMDE4MDgwOFQwMDAwMDBaIn1dfQ=="
                    ),
                    "x-amz-signature": (
                        "c34ed8fa1461564740c402c32bed7e8b579eeac71756c3dd505397c14ffac412"
                    ),
                },
            },
        )
        classroom_document.refresh_from_db()
        self.assertEqual(classroom_document.filename, "foo.pdf")
        self.assertEqual(classroom_document.upload_state, "pending")

    def test_api_classroom_document_initiate_upload_instructor_without_extension(self):
        """An extension should be guessed from the mimetype."""
        classroom_document = ClassroomDocumentFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
            classroom__id="ed08da34-7447-4141-96ff-5740315d7b99",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=classroom_document.classroom
        )

        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/classroomdocuments/{classroom_document.id}/initiate-upload/",
                {"filename": "foo", "mimetype": "application/pdf"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "url": "https://test-marsha-source.s3.amazonaws.com/",
                "fields": {
                    "acl": "private",
                    "key": (
                        "ed08da34-7447-4141-96ff-5740315d7b99/classroomdocument/"
                        "27a23f52-3379-46a2-94fa-697b59cfe3c7/1533686400.pdf"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "aws-access-key-id/20180808/eu-west-1/s3/aws4_request",
                    "x-amz-date": "20180808T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMTgtMDgtMDlUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBb"
                        "eyJhY2wiOiAicHJpdmF0ZSJ9LCBbImVxIiwgIiRDb250ZW50LVR5cGUiLCAiYXBwbGljYXRp"
                        "b24vcGRmIl0sIFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLCAwLCAzMTQ1NzI4MDBdLCB7ImJ1"
                        "Y2tldCI6ICJ0ZXN0LW1hcnNoYS1zb3VyY2UifSwgeyJrZXkiOiAiZWQwOGRhMzQtNzQ0Ny00"
                        "MTQxLTk2ZmYtNTc0MDMxNWQ3Yjk5L2NsYXNzcm9vbWRvY3VtZW50LzI3YTIzZjUyLTMzNzkt"
                        "NDZhMi05NGZhLTY5N2I1OWNmZTNjNy8xNTMzNjg2NDAwLnBkZiJ9LCB7IngtYW16LWFsZ29y"
                        "aXRobSI6ICJBV1M0LUhNQUMtU0hBMjU2In0sIHsieC1hbXotY3JlZGVudGlhbCI6ICJhd3Mt"
                        "YWNjZXNzLWtleS1pZC8yMDE4MDgwOC9ldS13ZXN0LTEvczMvYXdzNF9yZXF1ZXN0In0sIHsi"
                        "eC1hbXotZGF0ZSI6ICIyMDE4MDgwOFQwMDAwMDBaIn1dfQ=="
                    ),
                    "x-amz-signature": (
                        "c34ed8fa1461564740c402c32bed7e8b579eeac71756c3dd505397c14ffac412"
                    ),
                },
            },
        )
        classroom_document.refresh_from_db()
        self.assertEqual(classroom_document.filename, "foo")
        self.assertEqual(classroom_document.upload_state, "pending")

    def test_api_classroom_document_initiate_upload_instructor_without_mimetype(self):
        """With no mimetype the request should fail."""
        classroom_document = ClassroomDocumentFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
            classroom__id="ed08da34-7447-4141-96ff-5740315d7b99",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=classroom_document.classroom
        )

        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/classroomdocuments/{classroom_document.id}/initiate-upload/",
                {"filename": "foo", "mimetype": ""},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 400)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {"mimetype": ["mimetype not guessable"]},
        )

    def test_api_classroom_document_initiate_upload_instructor_wrong_mimetype(self):
        """With a wrong mimetype the request should fail."""
        classroom_document = ClassroomDocumentFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
            classroom__id="ed08da34-7447-4141-96ff-5740315d7b99",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=classroom_document.classroom
        )

        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/classroomdocuments/{classroom_document.id}/initiate-upload/",
                {"filename": "foo", "mimetype": "application/wrong-type"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 400)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {"mimetype": ["application/wrong-type is not a supported mimetype"]},
        )

    def test_api_classroom_document_update_student(self):
        """A student user should not be able to update a classroom_document."""
        classroom_document = ClassroomDocumentFactory()
        jwt_token = StudentLtiTokenFactory(resource=classroom_document.classroom)
        data = {"filename": "updated_name.pdf"}

        response = self.client.patch(
            f"/api/classroomdocuments/{classroom_document.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_classroom_document_update_instructor(self):
        """An instructor should be able to update a classroom_document."""
        classroom_document = ClassroomDocumentFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=classroom_document.classroom
        )
        data = {"filename": "updated_name.pdf"}

        response = self.client.patch(
            f"/api/classroomdocuments/{classroom_document.id!s}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "classroom": str(classroom_document.classroom.id),
                "filename": "updated_name.pdf",
                "id": str(classroom_document.id),
                "is_default": False,
                "upload_state": "pending",
                "uploaded_on": None,
                "url": None,
            },
        )
