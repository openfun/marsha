"""Tests for the classroom API."""
import json
from unittest import mock

from django.test import TestCase, override_settings

from marsha.bbb import api, serializers
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
class ClassroomServiceJoinAPITest(TestCase):
    """Test for the Classroom API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

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
            "role=viewer&userID=consumer_site_user_id&redirect=true",
            response.data.get("url"),
        )

    def test_api_bbb_join_from_other_classroom(self):
        """
        Joining a classroom using a resource token for an other resource should not be allowed.
        """
        classroom = ClassroomFactory(
            meeting_id="21e6634f-ab6f-4c77-a665-4229c61b479a",
            title="Classroom 1",
        )
        other_classroom = ClassroomFactory()

        jwt_token = StudentLtiTokenFactory(
            resource=other_classroom,
            consumer_site="consumer_site",
            user__id="user_id",
        )

        response = self.client.patch(
            f"/api/classrooms/{classroom.id}/join/",
            data=json.dumps({"fullname": "John Doe"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_bbb_join_instructor(self):
        """Joining a classroom as instructor should return a moderator classroom url."""
        classroom = ClassroomFactory(
            meeting_id="21e6634f-ab6f-4c77-a665-4229c61b479a",
            title="Classroom 1",
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
            f"role=moderator&userID=consumer_site_user_id&redirect=true",
            response.data.get("url"),
        )

    def test_api_bbb_join_instructor_no_fullname(self):
        """Joining a classroom without fullname parameter should return a 422."""
        classroom = ClassroomFactory(
            meeting_id="21e6634f-ab6f-4c77-a665-4229c61b479a",
            title="Classroom 1",
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

    @mock.patch.object(api, "join")
    def test_api_bbb_join_user_access_token(self, mock_join_request):
        """A user with UserAccessToken should not be able to join a classroom."""
        organization_access = OrganizationAccessFactory()
        playlist = PlaylistFactory(organization=organization_access.organization)
        classroom = ClassroomFactory(playlist=playlist)

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.patch(
            f"/api/classrooms/{classroom.id}/join/",
            data=json.dumps({"fullname": "John Doe"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        mock_join_request.assert_not_called()

    def test_api_bbb_join_user_access_token_organization_admin(self):
        """An organization administrator should be able to join a classroom."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        classroom = ClassroomFactory(playlist=playlist)

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

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
            f"role=moderator&userID={organization_access.user_id}&redirect=true",
            response.data.get("url"),
        )

    def test_api_bbb_join_user_access_token_playlist_admin(self):
        """A playlist administrator should be able to join a classroom."""
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        classroom = ClassroomFactory(playlist=playlist_access.playlist)

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

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
            f"role=moderator&userID={playlist_access.user_id}&redirect=true",
            response.data.get("url"),
        )
