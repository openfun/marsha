"""Tests for the classroom API."""
from unittest import mock

from django.test import TestCase, override_settings

from marsha.bbb import serializers
from marsha.bbb.factories import ClassroomFactory
from marsha.core.factories import (
    OrganizationAccessFactory,
    OrganizationFactory,
    PlaylistFactory,
    UserFactory,
)
from marsha.core.models import ADMINISTRATOR
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)
from marsha.core.tests.utils import reload_urlconf


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
@override_settings(BBB_ENABLED=True)
class ClassroomListAPITest(TestCase):
    """Test for the Classroom API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

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
    def test_api_fetch_list_user_access_token(self, mock_get_meeting_infos):
        """A user with UserAccessToken should be able to fetch a classroom list."""
        user = UserFactory()
        organization_1 = OrganizationFactory()
        organization_2 = OrganizationFactory()
        OrganizationAccessFactory(
            organization=organization_1, user=user, role=ADMINISTRATOR
        )
        OrganizationAccessFactory(organization=organization_2, user=user)
        playlist_1_a = PlaylistFactory(organization=organization_1)
        playlist_1_b = PlaylistFactory(organization=organization_1)
        playlist_2_a = PlaylistFactory(organization=organization_2)
        playlist_2_b = PlaylistFactory(organization=organization_2)
        ClassroomFactory.create_batch(3, playlist=playlist_1_a)
        classrooms_1_b = ClassroomFactory.create_batch(3, playlist=playlist_1_b)
        ClassroomFactory.create_batch(3, playlist=playlist_2_a)
        ClassroomFactory.create_batch(3, playlist=playlist_2_b)
        ClassroomFactory()

        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            "/api/classrooms/?limit=2", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 6,
                "next": "http://testserver/api/classrooms/?limit=2&offset=2",
                "previous": None,
                "results": [
                    {
                        "description": classrooms_1_b[2].description,
                        "ended": False,
                        "estimated_duration": None,
                        "id": str(classrooms_1_b[2].id),
                        "infos": {"returncode": "SUCCESS", "running": "true"},
                        "lti_id": str(classrooms_1_b[2].lti_id),
                        "meeting_id": str(classrooms_1_b[2].meeting_id),
                        "playlist": {
                            "id": str(playlist_1_b.id),
                            "lti_id": playlist_1_b.lti_id,
                            "title": playlist_1_b.title,
                        },
                        "started": False,
                        "starting_at": None,
                        "title": classrooms_1_b[2].title,
                        "welcome_text": classrooms_1_b[2].welcome_text,
                    },
                    {
                        "description": classrooms_1_b[1].description,
                        "ended": False,
                        "estimated_duration": None,
                        "id": str(classrooms_1_b[1].id),
                        "infos": {"returncode": "SUCCESS", "running": "true"},
                        "lti_id": str(classrooms_1_b[1].lti_id),
                        "meeting_id": str(classrooms_1_b[1].meeting_id),
                        "playlist": {
                            "id": str(playlist_1_b.id),
                            "lti_id": playlist_1_b.lti_id,
                            "title": playlist_1_b.title,
                        },
                        "started": False,
                        "starting_at": None,
                        "title": classrooms_1_b[1].title,
                        "welcome_text": classrooms_1_b[1].welcome_text,
                    },
                ],
            },
        )

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_fetch_list_user_access_token_filter_organization(
        self, mock_get_meeting_infos
    ):
        """A user with UserAccessToken should be able to filter classroom list by organization."""
        user = UserFactory()
        organization_1 = OrganizationFactory()
        organization_2 = OrganizationFactory()
        OrganizationAccessFactory(
            organization=organization_1, user=user, role=ADMINISTRATOR
        )
        OrganizationAccessFactory(
            organization=organization_2, user=user, role=ADMINISTRATOR
        )
        playlist_1_a = PlaylistFactory(organization=organization_1)
        playlist_1_b = PlaylistFactory(organization=organization_1)
        playlist_2_a = PlaylistFactory(organization=organization_2)
        playlist_2_b = PlaylistFactory(organization=organization_2)
        ClassroomFactory.create_batch(3, playlist=playlist_1_a)
        ClassroomFactory.create_batch(3, playlist=playlist_1_b)
        ClassroomFactory.create_batch(3, playlist=playlist_2_a)
        classrooms_2_b = ClassroomFactory.create_batch(3, playlist=playlist_2_b)
        ClassroomFactory()

        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/classrooms/?limit=2&organization={organization_2.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 6,
                "next": (
                    "http://testserver/api/classrooms/"
                    f"?limit=2&offset=2&organization={organization_2.id}"
                ),
                "previous": None,
                "results": [
                    {
                        "description": classrooms_2_b[2].description,
                        "ended": False,
                        "estimated_duration": None,
                        "id": str(classrooms_2_b[2].id),
                        "infos": {"returncode": "SUCCESS", "running": "true"},
                        "lti_id": str(classrooms_2_b[2].lti_id),
                        "meeting_id": str(classrooms_2_b[2].meeting_id),
                        "playlist": {
                            "id": str(playlist_2_b.id),
                            "lti_id": playlist_2_b.lti_id,
                            "title": playlist_2_b.title,
                        },
                        "started": False,
                        "starting_at": None,
                        "title": classrooms_2_b[2].title,
                        "welcome_text": classrooms_2_b[2].welcome_text,
                    },
                    {
                        "description": classrooms_2_b[1].description,
                        "ended": False,
                        "estimated_duration": None,
                        "id": str(classrooms_2_b[1].id),
                        "infos": {"returncode": "SUCCESS", "running": "true"},
                        "lti_id": str(classrooms_2_b[1].lti_id),
                        "meeting_id": str(classrooms_2_b[1].meeting_id),
                        "playlist": {
                            "id": str(playlist_2_b.id),
                            "lti_id": playlist_2_b.lti_id,
                            "title": playlist_2_b.title,
                        },
                        "started": False,
                        "starting_at": None,
                        "title": classrooms_2_b[1].title,
                        "welcome_text": classrooms_2_b[1].welcome_text,
                    },
                ],
            },
        )

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_fetch_list_user_access_token_filter_playlist(
        self, mock_get_meeting_infos
    ):
        """A user with UserAccessToken should be able to filter classroom list by playlist."""
        user = UserFactory()
        organization_1 = OrganizationFactory()
        organization_2 = OrganizationFactory()
        OrganizationAccessFactory(
            organization=organization_1, user=user, role=ADMINISTRATOR
        )
        OrganizationAccessFactory(
            organization=organization_2, user=user, role=ADMINISTRATOR
        )
        playlist_1_a = PlaylistFactory(organization=organization_1)
        playlist_1_b = PlaylistFactory(organization=organization_1)
        playlist_2_a = PlaylistFactory(organization=organization_2)
        playlist_2_b = PlaylistFactory(organization=organization_2)
        ClassroomFactory.create_batch(3, playlist=playlist_1_a)
        classrooms_1_b = ClassroomFactory.create_batch(3, playlist=playlist_1_b)
        ClassroomFactory.create_batch(3, playlist=playlist_2_a)
        ClassroomFactory.create_batch(3, playlist=playlist_2_b)
        ClassroomFactory()

        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/classrooms/?limit=2&playlist={playlist_1_b.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 3,
                "next": (
                    "http://testserver/api/classrooms/"
                    f"?limit=2&offset=2&playlist={playlist_1_b.id}"
                ),
                "previous": None,
                "results": [
                    {
                        "description": classrooms_1_b[2].description,
                        "ended": False,
                        "estimated_duration": None,
                        "id": str(classrooms_1_b[2].id),
                        "infos": {"returncode": "SUCCESS", "running": "true"},
                        "lti_id": str(classrooms_1_b[2].lti_id),
                        "meeting_id": str(classrooms_1_b[2].meeting_id),
                        "playlist": {
                            "id": str(playlist_1_b.id),
                            "lti_id": playlist_1_b.lti_id,
                            "title": playlist_1_b.title,
                        },
                        "started": False,
                        "starting_at": None,
                        "title": classrooms_1_b[2].title,
                        "welcome_text": classrooms_1_b[2].welcome_text,
                    },
                    {
                        "description": classrooms_1_b[1].description,
                        "ended": False,
                        "estimated_duration": None,
                        "id": str(classrooms_1_b[1].id),
                        "infos": {"returncode": "SUCCESS", "running": "true"},
                        "lti_id": str(classrooms_1_b[1].lti_id),
                        "meeting_id": str(classrooms_1_b[1].meeting_id),
                        "playlist": {
                            "id": str(playlist_1_b.id),
                            "lti_id": playlist_1_b.lti_id,
                            "title": playlist_1_b.title,
                        },
                        "started": False,
                        "starting_at": None,
                        "title": classrooms_1_b[1].title,
                        "welcome_text": classrooms_1_b[1].welcome_text,
                    },
                ],
            },
        )
