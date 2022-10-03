"""Tests for the classroom API."""
from unittest import mock

from django.test import TestCase, override_settings

from marsha.bbb import api, serializers
from marsha.bbb.factories import ClassroomFactory
from marsha.bbb.utils.bbb_utils import ApiMeetingException
from marsha.core import factories as core_factories
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
)
from marsha.core.tests.utils import reload_urlconf


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
@override_settings(BBB_ENABLED=True)
class ClassroomServiceCreateAPITest(TestCase):
    """Test for the Classroom API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

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
