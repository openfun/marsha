"""Tests for the classroom API."""

from unittest import mock

from django.test import TestCase, override_settings

from marsha.bbb import api
from marsha.bbb.factories import ClassroomFactory
from marsha.core import factories as core_factories
from marsha.core.factories import (
    OrganizationAccessFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
)
from marsha.core.models import ADMINISTRATOR
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)
from marsha.core.tests.testing_utils import reload_urlconf


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
@override_settings(BBB_ENABLED=True)
class ClassroomServiceEndAPITest(TestCase):
    """Test for the Classroom API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

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
        """A logged-in user should not be able to end a classroom."""
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

        jwt_token = StudentLtiTokenFactory(playlist=classroom.playlist)

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
        )
        mock_end_request.return_value = {
            "message": "A request to end the classroom was sent.",
            "messageKey": "sentEndClassroomRequest",
            "returncode": "SUCCESS",
        }

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=classroom.playlist)

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

    @mock.patch.object(api, "end")
    def test_api_bbb_end_classroom_user_access_token(self, mock_end_request):
        """A user with UserAccessToken should not be able to end a classroom."""
        organization_access = OrganizationAccessFactory()
        playlist = PlaylistFactory(organization=organization_access.organization)
        classroom = ClassroomFactory(playlist=playlist)

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.patch(
            f"/api/classrooms/{classroom.id}/end/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        mock_end_request.assert_not_called()

    @mock.patch.object(api, "end")
    def test_api_bbb_end_classroom_user_access_token_organization_admin(
        self, mock_end_request
    ):
        """An organization administrator should be able to end a classroom."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        classroom = ClassroomFactory(playlist=playlist)
        mock_end_request.return_value = {
            "message": "A request to end the classroom was sent.",
            "messageKey": "sentEndClassroomRequest",
            "returncode": "SUCCESS",
        }

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

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

    @mock.patch.object(api, "end")
    def test_api_bbb_end_classroom_user_access_token_playlist_admin(
        self, mock_end_request
    ):
        """A playlist administrator should be able to join a classroom."""
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        classroom = ClassroomFactory(playlist=playlist_access.playlist)
        mock_end_request.return_value = {
            "message": "A request to end the classroom was sent.",
            "messageKey": "sentEndClassroomRequest",
            "returncode": "SUCCESS",
        }

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

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
