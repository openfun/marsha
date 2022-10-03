"""Tests for the classroom API."""
from datetime import datetime
import json
import random
from unittest import mock

from django.test import TestCase, override_settings
from django.utils import timezone

from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
)
from marsha.core.tests.utils import reload_urlconf

from ..factories import ClassroomDocumentFactory, ClassroomFactory
from ..models import ClassroomDocument


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(BBB_ENABLED=True)
class ClassroomDocumentAPITest(TestCase):
    """Test for the ClassroomDocument API."""

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

    def test_api_classroom_document_initiate_upload_instructor(self):
        """
        An instructor should be able to initiate an upload for a deposited file.
        """
        classroom_document = ClassroomDocumentFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
            classroom__id="ed08da34-7447-4141-96ff-5740315d7b99",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=classroom_document.classroom
        )

        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/classroomdocuments/{classroom_document.id}/initiate-upload/",
                {"filename": "foo.pdf", "mimetype": "application/pdf"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "url": "https://test-marsha-source.s3.amazonaws.com/",
                "fields": {
                    "acl": "private",
                    "key": (
                        "ed08da34-7447-4141-96ff-5740315d7b99/classroomdocument/"
                        "27a23f52-3379-46a2-94fa-697b59cfe3c7/1533686400.pdf"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "aws-access-key-id/20180808/eu-west-1/s3/aws4_request",
                    "x-amz-date": "20180808T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMTgtMDgtMDlUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBb"
                        "eyJhY2wiOiAicHJpdmF0ZSJ9LCBbImVxIiwgIiRDb250ZW50LVR5cGUiLCAiYXBwbGljYXRp"
                        "b24vcGRmIl0sIFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLCAwLCAzMTQ1NzI4MDBdLCB7ImJ1"
                        "Y2tldCI6ICJ0ZXN0LW1hcnNoYS1zb3VyY2UifSwgeyJrZXkiOiAiZWQwOGRhMzQtNzQ0Ny00"
                        "MTQxLTk2ZmYtNTc0MDMxNWQ3Yjk5L2NsYXNzcm9vbWRvY3VtZW50LzI3YTIzZjUyLTMzNzkt"
                        "NDZhMi05NGZhLTY5N2I1OWNmZTNjNy8xNTMzNjg2NDAwLnBkZiJ9LCB7IngtYW16LWFsZ29y"
                        "aXRobSI6ICJBV1M0LUhNQUMtU0hBMjU2In0sIHsieC1hbXotY3JlZGVudGlhbCI6ICJhd3Mt"
                        "YWNjZXNzLWtleS1pZC8yMDE4MDgwOC9ldS13ZXN0LTEvczMvYXdzNF9yZXF1ZXN0In0sIHsi"
                        "eC1hbXotZGF0ZSI6ICIyMDE4MDgwOFQwMDAwMDBaIn1dfQ=="
                    ),
                    "x-amz-signature": (
                        "c34ed8fa1461564740c402c32bed7e8b579eeac71756c3dd505397c14ffac412"
                    ),
                },
            },
        )
        classroom_document.refresh_from_db()
        self.assertEqual(classroom_document.filename, "foo.pdf")
        self.assertEqual(classroom_document.upload_state, "pending")

    def test_api_classroom_document_initiate_upload_instructor_without_extension(self):
        """An extension should be guessed from the mimetype."""
        classroom_document = ClassroomDocumentFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
            classroom__id="ed08da34-7447-4141-96ff-5740315d7b99",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=classroom_document.classroom
        )

        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/classroomdocuments/{classroom_document.id}/initiate-upload/",
                {"filename": "foo", "mimetype": "application/pdf"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "url": "https://test-marsha-source.s3.amazonaws.com/",
                "fields": {
                    "acl": "private",
                    "key": (
                        "ed08da34-7447-4141-96ff-5740315d7b99/classroomdocument/"
                        "27a23f52-3379-46a2-94fa-697b59cfe3c7/1533686400.pdf"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "aws-access-key-id/20180808/eu-west-1/s3/aws4_request",
                    "x-amz-date": "20180808T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMTgtMDgtMDlUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBb"
                        "eyJhY2wiOiAicHJpdmF0ZSJ9LCBbImVxIiwgIiRDb250ZW50LVR5cGUiLCAiYXBwbGljYXRp"
                        "b24vcGRmIl0sIFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLCAwLCAzMTQ1NzI4MDBdLCB7ImJ1"
                        "Y2tldCI6ICJ0ZXN0LW1hcnNoYS1zb3VyY2UifSwgeyJrZXkiOiAiZWQwOGRhMzQtNzQ0Ny00"
                        "MTQxLTk2ZmYtNTc0MDMxNWQ3Yjk5L2NsYXNzcm9vbWRvY3VtZW50LzI3YTIzZjUyLTMzNzkt"
                        "NDZhMi05NGZhLTY5N2I1OWNmZTNjNy8xNTMzNjg2NDAwLnBkZiJ9LCB7IngtYW16LWFsZ29y"
                        "aXRobSI6ICJBV1M0LUhNQUMtU0hBMjU2In0sIHsieC1hbXotY3JlZGVudGlhbCI6ICJhd3Mt"
                        "YWNjZXNzLWtleS1pZC8yMDE4MDgwOC9ldS13ZXN0LTEvczMvYXdzNF9yZXF1ZXN0In0sIHsi"
                        "eC1hbXotZGF0ZSI6ICIyMDE4MDgwOFQwMDAwMDBaIn1dfQ=="
                    ),
                    "x-amz-signature": (
                        "c34ed8fa1461564740c402c32bed7e8b579eeac71756c3dd505397c14ffac412"
                    ),
                },
            },
        )
        classroom_document.refresh_from_db()
        self.assertEqual(classroom_document.filename, "foo")
        self.assertEqual(classroom_document.upload_state, "pending")

    def test_api_classroom_document_initiate_upload_instructor_without_mimetype(self):
        """With no mimetype the request should fail."""
        classroom_document = ClassroomDocumentFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
            classroom__id="ed08da34-7447-4141-96ff-5740315d7b99",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=classroom_document.classroom
        )

        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/classroomdocuments/{classroom_document.id}/initiate-upload/",
                {"filename": "foo", "mimetype": ""},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 400)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {"mimetype": ["mimetype not guessable"]},
        )

    def test_api_classroom_document_initiate_upload_instructor_wrong_mimetype(self):
        """With a wrong mimetype the request should fail."""
        classroom_document = ClassroomDocumentFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
            classroom__id="ed08da34-7447-4141-96ff-5740315d7b99",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=classroom_document.classroom
        )

        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/classroomdocuments/{classroom_document.id}/initiate-upload/",
                {"filename": "foo", "mimetype": "application/wrong-type"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 400)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {"mimetype": ["application/wrong-type is not a supported mimetype"]},
        )

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
