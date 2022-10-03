"""Tests for the classroom API."""
from unittest import mock

from django.test import TestCase, override_settings

from marsha.bbb import serializers
from marsha.bbb.factories import ClassroomFactory
from marsha.bbb.models import Classroom
from marsha.core import factories as core_factories
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    PlaylistLtiTokenFactory,
    StudentLtiTokenFactory,
)
from marsha.core.tests.utils import reload_urlconf


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
@override_settings(BBB_ENABLED=True)
class ClassroomCreateAPITest(TestCase):
    """Test for the Classroom API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

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
