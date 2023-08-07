"""Tests for the classroomdocument initiate-upload API."""
from datetime import datetime, timezone as baseTimezone
import json
import random
from unittest import mock

from django.test import TestCase, override_settings
from django.utils import timezone

from marsha.bbb.factories import ClassroomDocumentFactory
from marsha.core.factories import (
    OrganizationAccessFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
)
from marsha.core.models import ADMINISTRATOR, INSTRUCTOR, STUDENT
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    UserAccessTokenFactory,
)
from marsha.core.tests.testing_utils import reload_urlconf


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(BBB_ENABLED=True)
class ClassroomDocumentInitiateUploadAPITest(TestCase):
    """Test for the ClassroomDocument initiate-upload API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

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

        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/classrooms/{classroom_document.classroom.id}"
                f"/classroomdocuments/{classroom_document.id}/initiate-upload/",
                {"filename": "foo.pdf", "mimetype": "application/pdf", "size": 10},
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

        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/classrooms/{classroom_document.classroom.id}"
                f"/classroomdocuments/{classroom_document.id}/initiate-upload/",
                {"filename": "foo", "mimetype": "application/pdf", "size": 10},
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

        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/classrooms/{classroom_document.classroom.id}"
                f"/classroomdocuments/{classroom_document.id}/initiate-upload/",
                {"filename": "foo", "mimetype": "", "size": 10},
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

        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/classrooms/{classroom_document.classroom.id}"
                f"/classroomdocuments/{classroom_document.id}/initiate-upload/",
                {"filename": "foo", "mimetype": "application/wrong-type", "size": 10},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 400)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {"mimetype": ["application/wrong-type is not a supported mimetype"]},
        )

    def test_api_classroom_document_initiate_upload_user_access_token(self):
        """
        A user with UserAccessToken should not be able to initiate an upload for a deposited file.
        """
        organization_access = OrganizationAccessFactory()
        playlist = PlaylistFactory(organization=organization_access.organization)
        classroom_document = ClassroomDocumentFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            classroom__id="ed08da34-7447-4141-96ff-5740315d7b99",
            classroom__playlist=playlist,
        )
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/classrooms/{classroom_document.classroom.id}"
                f"/classroomdocuments/{classroom_document.id}/initiate-upload/",
                {"filename": "foo.pdf", "mimetype": "application/pdf", "size": 10},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 403)

    def test_api_classroom_document_initiate_upload_user_access_token_organization_admin(
        self,
    ):
        """
        An organization administrator should be able to initiate an upload for a deposited file.
        """
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        classroom_document = ClassroomDocumentFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            classroom__id="ed08da34-7447-4141-96ff-5740315d7b99",
            classroom__playlist=playlist,
        )
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/classrooms/{classroom_document.classroom.id}"
                f"/classroomdocuments/{classroom_document.id}/initiate-upload/",
                {"filename": "foo.pdf", "mimetype": "application/pdf", "size": 10},
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

    def test_api_classroom_document_initiate_upload_user_access_token_playlist_admin(
        self,
    ):
        """
        A playlist administrator should be able to initiate an upload for a deposited file.
        """
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        classroom_document = ClassroomDocumentFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            classroom__id="ed08da34-7447-4141-96ff-5740315d7b99",
            classroom__playlist=playlist_access.playlist,
        )
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/classrooms/{classroom_document.classroom.id}"
                f"/classroomdocuments/{classroom_document.id}/initiate-upload/",
                {"filename": "foo.pdf", "mimetype": "application/pdf", "size": 10},
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

    def test_api_classroom_document_initiate_upload_user_access_token_playlist_instructor(
        self,
    ):
        """
        A playlist instructor should be able to initiate an upload for a classroom document.
        """
        playlist_access = PlaylistAccessFactory(role=INSTRUCTOR)
        classroom_document = ClassroomDocumentFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            classroom__id="ed08da34-7447-4141-96ff-5740315d7b99",
            classroom__playlist=playlist_access.playlist,
        )
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/classrooms/{classroom_document.classroom.id}"
                f"/classroomdocuments/{classroom_document.id}/initiate-upload/",
                {"filename": "foo.pdf", "mimetype": "application/pdf", "size": 10},
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

    def test_api_classroom_document_initiate_upload_user_access_token_playlist_student(
        self,
    ):
        """
        A playlist student should not be able to initiate an upload for a classroom document.
        """
        playlist_access = PlaylistAccessFactory(role=STUDENT)
        classroom_document = ClassroomDocumentFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            classroom__id="ed08da34-7447-4141-96ff-5740315d7b99",
            classroom__playlist=playlist_access.playlist,
            filename=None,
        )
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/classrooms/{classroom_document.classroom.id}"
                f"/classroomdocuments/{classroom_document.id}/initiate-upload/",
                {"filename": "foo.pdf", "mimetype": "application/pdf", "size": 10},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 403)
        self.assertIsNone(classroom_document.filename)
        self.assertEqual(classroom_document.upload_state, "pending")

    @override_settings(CLASSROOM_DOCUMENT_SOURCE_MAX_SIZE=10)
    def test_api_classroom_document_initiate_upload_file_too_large(self):
        """With a file size too large the request should fail"""
        classroom_document = ClassroomDocumentFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
            classroom__id="ed08da34-7447-4141-96ff-5740315d7b99",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=classroom_document.classroom
        )

        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/classrooms/{classroom_document.classroom.id}"
                f"/classroomdocuments/{classroom_document.id}/initiate-upload/",
                {"filename": "foo.pdf", "mimetype": "application/pdf", "size": 100},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"size": ["file too large, max size allowed is 10 Bytes"]},
        )
