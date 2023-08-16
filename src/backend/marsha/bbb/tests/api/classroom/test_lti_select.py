"""Tests for the classroom API."""

from django.test import TestCase, override_settings

from marsha.bbb.factories import ClassroomFactory
from marsha.core import factories as core_factories
from marsha.core.simple_jwt.factories import InstructorOrAdminLtiTokenFactory
from marsha.core.tests.testing_utils import reload_urlconf


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

    def test_api_select_instructor_no_bbb_server(self):
        """An instructor should be able to fetch a classroom lti select."""
        playlist = core_factories.PlaylistFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=playlist)

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

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=playlist)

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

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom.playlist)

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
