"""Tests for the classroomdocument update API."""
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
class ClassroomDocumentUpdateAPITest(TestCase):
    """Test for the ClassroomDocument update API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

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

    def test_api_classroom_document_update_instructor_default(self):
        """A document set to be the default one should set others to false"""
        classroom = ClassroomFactory()
        first_document = ClassroomDocumentFactory(
            classroom=classroom,
            is_default=True,
        )
        second_document = ClassroomDocumentFactory(classroom=classroom)
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom)
        data = {"is_default": True}

        response = self.client.patch(
            f"/api/classroomdocuments/{second_document.id!s}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "classroom": str(second_document.classroom.id),
                "filename": second_document.filename,
                "id": str(second_document.id),
                "is_default": True,
                "upload_state": "pending",
                "uploaded_on": None,
                "url": None,
            },
        )
        self.assertEqual(ClassroomDocument.objects.count(), 2)
        self.assertEqual(ClassroomDocument.objects.filter(is_default=True).count(), 1)
        first_document.refresh_from_db()
        self.assertFalse(first_document.is_default)
