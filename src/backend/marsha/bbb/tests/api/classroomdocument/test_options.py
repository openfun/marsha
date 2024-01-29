"""Tests for the classroomdocument options API."""

from django.test import TestCase, override_settings

from marsha.bbb.factories import ClassroomDocumentFactory, ClassroomFactory
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)
from marsha.core.tests.testing_utils import reload_urlconf


@override_settings(BBB_ENABLED=True)
class ClassroomDocumentCreateAPITest(TestCase):
    """Test for the ClassroomDocument create API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

    def test_api_classroom_document_options_anonymous(self):
        """Anonymous user can't fetch the classroom document options endpoint"""
        classroom = ClassroomFactory()
        response = self.client.options(
            f"/api/classrooms/{classroom.id}/classroomdocuments/"
        )

        self.assertEqual(response.status_code, 401)

    def test_api_classroom_document_options_as_logged_user(self):
        """A logged user can fetch the classroom document options endpoint"""
        jwt_token = UserAccessTokenFactory()
        classroom = ClassroomFactory()
        response = self.client.options(
            f"/api/classrooms/{classroom.id}/classroomdocuments/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

    def test_api_classroom_document_options_as_student(self):
        """A student can fetch the classroom document options endpoint"""

        classroom_document = ClassroomDocumentFactory()
        jwt_token = StudentLtiTokenFactory(
            playlist=classroom_document.classroom.playlist
        )
        response = self.client.options(
            f"/api/classrooms/{classroom_document.classroom.id}/classroomdocuments/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

    @override_settings(CLASSROOM_DOCUMENT_SOURCE_MAX_SIZE=10)
    def test_api_classroom_document_options_instructor(self):
        """An instructor can fetch the classroom document options endpoint"""

        classroom = ClassroomFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=classroom.playlist)

        response = self.client.options(
            f"/api/classrooms/{classroom.id}/classroomdocuments/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["upload_max_size_bytes"], 10)
