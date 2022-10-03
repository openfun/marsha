"""Tests for the classroomdocument create API."""
import json

from django.test import TestCase, override_settings

from marsha.bbb.factories import ClassroomDocumentFactory, ClassroomFactory
from marsha.bbb.models import ClassroomDocument
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
)
from marsha.core.tests.utils import reload_urlconf


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(BBB_ENABLED=True)
class ClassroomDocumentCreateAPITest(TestCase):
    """Test for the ClassroomDocument create API."""

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

    def test_api_classroom_document_create_instructor_first_document(self):
        """
        An instructor should be able to create a document
        for an existing classroom.

        First created document should be the default one.
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
                "is_default": True,
                "upload_state": "pending",
                "uploaded_on": None,
                "url": None,
            },
        )

    def test_api_classroom_document_create_instructor_second_document(self):
        """
        An instructor should be able to create a document
        for an existing classroom.

        Second created document should not be the default one.
        """
        classroom = ClassroomFactory()
        first_document = ClassroomDocumentFactory(
            classroom=classroom,
            is_default=True,
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom)
        response = self.client.post(
            "/api/classroomdocuments/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(
                {
                    "filename": "test2.pdf",
                }
            ),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(ClassroomDocument.objects.count(), 2)
        self.assertEqual(
            response.json(),
            {
                "classroom": str(classroom.id),
                "filename": "test2.pdf",
                "id": str(ClassroomDocument.objects.last().id),
                "is_default": False,
                "upload_state": "pending",
                "uploaded_on": None,
                "url": None,
            },
        )
        first_document.refresh_from_db()
        self.assertTrue(first_document.is_default)
