"""Tests for the classroom API."""
from unittest import mock

from django.test import TestCase, override_settings

from marsha.bbb import serializers
from marsha.bbb.factories import ClassroomFactory
from marsha.core.factories import (
    OrganizationAccessFactory,
    PlaylistAccessFactory,
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
    def test_api_fetch_list_user_access_token_playlist_admin(
        self, mock_get_meeting_infos
    ):
        """
        A user with UserAccessToken should be able to fetch a classroom list from playlist
        he is admin
        """
        user = UserFactory()
        playlist_access = PlaylistAccessFactory(user=user, role=ADMINISTRATOR)
        classrooms = ClassroomFactory.create_batch(3, playlist=playlist_access.playlist)
        ClassroomFactory()

        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = UserAccessTokenFactory(user=user)
        response = self.client.get(
            "/api/classrooms/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 3,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "description": classrooms[2].description,
                        "ended": False,
                        "estimated_duration": None,
                        "id": str(classrooms[2].id),
                        "infos": {"returncode": "SUCCESS", "running": "true"},
                        "lti_id": str(classrooms[2].lti_id),
                        "meeting_id": str(classrooms[2].meeting_id),
                        "playlist": {
                            "id": str(playlist_access.playlist.id),
                            "lti_id": playlist_access.playlist.lti_id,
                            "title": playlist_access.playlist.title,
                        },
                        "started": False,
                        "starting_at": None,
                        "title": classrooms[2].title,
                        "welcome_text": classrooms[2].welcome_text,
                    },
                    {
                        "description": classrooms[1].description,
                        "ended": False,
                        "estimated_duration": None,
                        "id": str(classrooms[1].id),
                        "infos": {"returncode": "SUCCESS", "running": "true"},
                        "lti_id": str(classrooms[1].lti_id),
                        "meeting_id": str(classrooms[1].meeting_id),
                        "playlist": {
                            "id": str(playlist_access.playlist.id),
                            "lti_id": playlist_access.playlist.lti_id,
                            "title": playlist_access.playlist.title,
                        },
                        "started": False,
                        "starting_at": None,
                        "title": classrooms[1].title,
                        "welcome_text": classrooms[1].welcome_text,
                    },
                    {
                        "description": classrooms[0].description,
                        "ended": False,
                        "estimated_duration": None,
                        "id": str(classrooms[0].id),
                        "infos": {"returncode": "SUCCESS", "running": "true"},
                        "lti_id": str(classrooms[0].lti_id),
                        "meeting_id": str(classrooms[0].meeting_id),
                        "playlist": {
                            "id": str(playlist_access.playlist.id),
                            "lti_id": playlist_access.playlist.lti_id,
                            "title": playlist_access.playlist.title,
                        },
                        "started": False,
                        "starting_at": None,
                        "title": classrooms[0].title,
                        "welcome_text": classrooms[0].welcome_text,
                    },
                ],
            },
        )

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_fetch_list_user_access_token_organization_admin(
        self, mock_get_meeting_infos
    ):
        """A user with UserAccessToken should be able to fetch a classroom list."""
        organization_access_admin = OrganizationAccessFactory(role=ADMINISTRATOR)
        organization_access = OrganizationAccessFactory(
            user=organization_access_admin.user
        )
        playlist_1_a = PlaylistFactory(
            organization=organization_access_admin.organization
        )
        playlist_1_b = PlaylistFactory(
            organization=organization_access_admin.organization
        )
        playlist_2_a = PlaylistFactory(organization=organization_access.organization)
        playlist_2_b = PlaylistFactory(organization=organization_access.organization)
        ClassroomFactory.create_batch(3, playlist=playlist_1_a)
        classrooms_1_b = ClassroomFactory.create_batch(3, playlist=playlist_1_b)
        ClassroomFactory.create_batch(3, playlist=playlist_2_a)
        ClassroomFactory.create_batch(3, playlist=playlist_2_b)
        ClassroomFactory()

        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = UserAccessTokenFactory(user=organization_access_admin.user)

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
        organization_access_admin_1 = OrganizationAccessFactory(role=ADMINISTRATOR)
        organization_access_admin_2 = OrganizationAccessFactory(
            user=organization_access_admin_1.user, role=ADMINISTRATOR
        )
        playlist_1_a = PlaylistFactory(
            organization=organization_access_admin_1.organization
        )
        playlist_1_b = PlaylistFactory(
            organization=organization_access_admin_1.organization
        )
        playlist_2_a = PlaylistFactory(
            organization=organization_access_admin_2.organization
        )
        playlist_2_b = PlaylistFactory(
            organization=organization_access_admin_2.organization
        )
        ClassroomFactory.create_batch(3, playlist=playlist_1_a)
        ClassroomFactory.create_batch(3, playlist=playlist_1_b)
        ClassroomFactory.create_batch(3, playlist=playlist_2_a)
        classrooms_2_b = ClassroomFactory.create_batch(3, playlist=playlist_2_b)
        ClassroomFactory()

        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = UserAccessTokenFactory(user=organization_access_admin_1.user)

        response = self.client.get(
            f"/api/classrooms/?limit=2&organization={organization_access_admin_2.organization.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 6,
                "next": (
                    "http://testserver/api/classrooms/"
                    f"?limit=2&offset=2&organization={organization_access_admin_2.organization.id}"
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
        organization_access_admin = OrganizationAccessFactory(role=ADMINISTRATOR)
        organization_access = OrganizationAccessFactory(
            user=organization_access_admin.user
        )
        playlist_1_a = PlaylistFactory(
            organization=organization_access_admin.organization
        )
        playlist_1_b = PlaylistFactory(
            organization=organization_access_admin.organization
        )
        playlist_2_a = PlaylistFactory(organization=organization_access.organization)
        playlist_2_b = PlaylistFactory(organization=organization_access.organization)
        ClassroomFactory.create_batch(3, playlist=playlist_1_a)
        classrooms_1_b = ClassroomFactory.create_batch(3, playlist=playlist_1_b)
        ClassroomFactory.create_batch(3, playlist=playlist_2_a)
        ClassroomFactory.create_batch(3, playlist=playlist_2_b)
        ClassroomFactory()

        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = UserAccessTokenFactory(user=organization_access_admin.user)

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
