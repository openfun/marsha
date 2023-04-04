"""Tests for the document API."""
from datetime import datetime
import json
import random
from unittest import mock

from django.test import TestCase, override_settings

from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    PlaylistLtiTokenFactory,
    StudentLtiTokenFactory,
)

from ..api import timezone
from ..factories import DocumentFactory, PlaylistFactory
from ..models import Document


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class DocumentAPITest(TestCase):
    """Test for the Document API."""

    maxDiff = None

    def test_api_document_fetch_anonymous(self):
        """Anonymous users should not be able to fetch a document."""
        document = DocumentFactory()

        response = self.client.get(f"/api/documents/{document.id}/")
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_document_fetch_student(self):
        """A student should not be allowed to fetch a document."""
        document = DocumentFactory()

        jwt_token = StudentLtiTokenFactory(
            resource=document,
            permissions__can_update=True,
        )

        response = self.client.get(
            f"/api/documents/{document.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_document_fetch_instructor(self):
        """An instructor should be able to fetch a document."""
        document = DocumentFactory(
            pk="4c51f469-f91e-4998-b438-e31ee3bd3ea6",
            uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc),
            upload_state="ready",
            extension="pdf",
            playlist__title="foo",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            title="bar baz",
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=document)

        response = self.client.get(
            f"/api/documents/{document.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "active_stamp": "1533686400",
                "extension": "pdf",
                "filename": "foo_bar-baz.pdf",
                "id": str(document.id),
                "is_ready_to_show": True,
                "title": document.title,
                "upload_state": "ready",
                "url": "https://abc.cloudfront.net/4c51f469-f91e-4998-b438-e31ee3bd3ea6/"
                "document/1533686400.pdf"
                "?response-content-disposition=attachment%3B+filename%3Dfoo_bar-baz.pdf",
                "show_download": True,
                "playlist": {
                    "id": str(document.playlist.id),
                    "title": "foo",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
            },
        )

    def test_api_document_fetch_instructor_read_only(self):
        """An instructor should not be able to fetch a document in read_only."""
        document = DocumentFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=document,
            permissions__can_update=False,
        )

        response = self.client.get(
            f"/api/documents/{document.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_document_fetch_list_anonymous(self):
        """An anonymous should not be able to fetch a list of document."""
        response = self.client.get("/api/documents/")
        self.assertEqual(response.status_code, 401)

    def test_api_document_fetch_list_student(self):
        """A student should not be able to fetch a list of document."""
        document = DocumentFactory()

        jwt_token = StudentLtiTokenFactory(
            resource=document,
            permissions__can_update=True,
        )

        response = self.client.get(
            "/api/documents/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_fetch_list_instructor(self):
        """An instrustor should not be able to fetch a document list."""
        document = DocumentFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=document)

        response = self.client.get(
            "/api/documents/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_create_anonymous(self):
        """An anonymous should not be able to create a document."""
        response = self.client.post("/api/documents/")
        self.assertEqual(response.status_code, 401)

    def test_api_document_create_student(self):
        """A student should not be able to create a document."""
        document = DocumentFactory()

        jwt_token = StudentLtiTokenFactory(
            resource=document,
            permissions__can_update=True,
        )

        response = self.client.post(
            "/api/documents/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_create_student_with_playlist_token(self):
        """A student with a playlist token should not be able to create a document."""
        jwt_token = PlaylistLtiTokenFactory(
            roles=["student"],
            permissions__can_update=True,
        )

        response = self.client.post(
            "/api/documents/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_create_instructor(self):
        """An instrustor should not be able to create a document."""
        document = DocumentFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=document)

        response = self.client.post(
            "/api/documents/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_create_instructor_with_playlist_token(self):
        """
        Create document with playlist token.

        Used in the context of a lti select request (deep linking).
        """
        playlist = PlaylistFactory(title="Playlist")

        jwt_token = PlaylistLtiTokenFactory(playlist=playlist)

        self.assertEqual(Document.objects.count(), 0)

        response = self.client.post(
            "/api/documents/",
            {
                "lti_id": "document_one",
                "playlist": str(playlist.id),
                "title": "Some document",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(Document.objects.count(), 1)
        self.assertEqual(response.status_code, 201)
        document = Document.objects.first()
        self.assertEqual(
            response.json(),
            {
                "active_stamp": None,
                "extension": None,
                "filename": "playlist_some-document",
                "id": str(document.id),
                "is_ready_to_show": False,
                "playlist": {
                    "id": str(playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "show_download": True,
                "title": "Some document",
                "upload_state": "pending",
                "url": None,
            },
        )

    def test_api_document_delete_anonymous(self):
        """An anonymous should not be able to delete a document."""
        document = DocumentFactory()
        response = self.client.delete(
            f"/api/documents/{document.id}/",
        )
        self.assertEqual(response.status_code, 401)

    def test_api_document_delete_student(self):
        """A student should not be able to delete a document."""
        document = DocumentFactory()

        jwt_token = StudentLtiTokenFactory(
            resource=document,
            permissions__can_update=True,
        )

        response = self.client.delete(
            f"/api/documents/{document.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_delete_instructor(self):
        """An instructor should be able to delete a document."""
        document = DocumentFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=document)

        response = self.client.delete(
            f"/api/documents/{document.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 204)

    def test_api_document_update_anonymous(self):
        """An anonymous should not be able to update a document."""
        document = DocumentFactory()
        response = self.client.put(f"/api/documents/{document.id}/")
        self.assertEqual(response.status_code, 401)

    def test_api_document_update_student(self):
        """A student user should not be able to update a document."""
        document = DocumentFactory()

        jwt_token = StudentLtiTokenFactory(
            resource=document,
            permissions__can_update=True,
        )
        data = {"title": "new title"}

        response = self.client.put(
            f"/api/documents/{document.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_update_instructor_read_only(self):
        """An instructor should not be able to update a document in read_only."""
        document = DocumentFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=document,
            permissions__can_update=False,
        )
        data = {"title": "new title"}

        response = self.client.put(
            f"/api/documents/{document.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_update_instructor(self):
        """An instructor should be able to update a document."""
        document = DocumentFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=document)
        data = {"title": "new title"}

        response = self.client.put(
            f"/api/documents/{document.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

        document.refresh_from_db()
        self.assertEqual(document.title, "new title")

    def test_api_document_update_title_with_extension(self):
        """Serializer should remove the extension from the document title (if any)."""
        document = DocumentFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=document)
        data = {"title": "new title.pdf"}

        response = self.client.put(
            f"/api/documents/{document.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

        document.refresh_from_db()
        self.assertEqual(document.title, "new title")

    def test_api_document_initiate_upload_anonymous(self):
        """Anonymous user should not be able to initiate an upload."""
        document = DocumentFactory()
        response = self.client.post(f"/api/documents/{document.id}/initiate-upload/")
        self.assertEqual(response.status_code, 401)

    def test_api_document_initiate_upload_student(self):
        """Student should not be able to initiate an upload."""
        document = DocumentFactory()

        jwt_token = StudentLtiTokenFactory(
            resource=document,
            permissions__can_update=True,
        )

        response = self.client.post(
            f"/api/documents/{document.id}/initiate-upload/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_initiate_upload_instructor_read_only(self):
        """An instructor should not be able to initiate an upload for a document in read_only."""
        document = DocumentFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=document,
            permissions__can_update=False,
        )

        response = self.client.post(
            f"/api/documents/{document.id}/initiate-upload/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_initiate_upload_instructor(self):
        """An instructor should be able to initiate an upload for a document."""
        document = DocumentFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=document)

        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/documents/{document.id}/initiate-upload/",
                {"filename": "foo.pdf", "mimetype": "application/pdf", "size": 10},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content),
            {
                "url": "https://test-marsha-source.s3.amazonaws.com/",
                "fields": {
                    "acl": "private",
                    "key": (
                        "27a23f52-3379-46a2-94fa-697b59cfe3c7/document/27a23f52-3379-46a2-94fa-"
                        "697b59cfe3c7/1533686400.pdf"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "aws-access-key-id/20180808/eu-west-1/s3/aws4_request",
                    "x-amz-date": "20180808T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMTgtMDgtMDlUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBb"
                        "eyJhY2wiOiAicHJpdmF0ZSJ9LCBbImNvbnRlbnQtbGVuZ3RoLXJhbmdlIiwgMCwgMTA3Mzc0"
                        "MTgyNF0sIHsiYnVja2V0IjogInRlc3QtbWFyc2hhLXNvdXJjZSJ9LCB7ImtleSI6ICIyN2Ey"
                        "M2Y1Mi0zMzc5LTQ2YTItOTRmYS02OTdiNTljZmUzYzcvZG9jdW1lbnQvMjdhMjNmNTItMzM3"
                        "OS00NmEyLTk0ZmEtNjk3YjU5Y2ZlM2M3LzE1MzM2ODY0MDAucGRmIn0sIHsieC1hbXotYWxn"
                        "b3JpdGhtIjogIkFXUzQtSE1BQy1TSEEyNTYifSwgeyJ4LWFtei1jcmVkZW50aWFsIjogImF3"
                        "cy1hY2Nlc3Mta2V5LWlkLzIwMTgwODA4L2V1LXdlc3QtMS9zMy9hd3M0X3JlcXVlc3QifSwg"
                        "eyJ4LWFtei1kYXRlIjogIjIwMTgwODA4VDAwMDAwMFoifV19"
                    ),
                    "x-amz-signature": (
                        "9ee691c89e2061c5f631b093e01e7faee1ffe71de4c9684fb83d810a3fca799e"
                    ),
                },
            },
        )

    def test_api_document_initiate_upload_file_without_extension(self):
        """An extension should be guessed from the mimetype."""
        document = DocumentFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=document)

        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/documents/{document.id}/initiate-upload/",
                {"filename": "foo", "mimetype": "application/pdf", "size": 10},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content),
            {
                "url": "https://test-marsha-source.s3.amazonaws.com/",
                "fields": {
                    "acl": "private",
                    "key": (
                        "27a23f52-3379-46a2-94fa-697b59cfe3c7/document/27a23f52-3379-46a2-94fa-"
                        "697b59cfe3c7/1533686400.pdf"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "aws-access-key-id/20180808/eu-west-1/s3/aws4_request",
                    "x-amz-date": "20180808T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMTgtMDgtMDlUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBbe"
                        "yJhY2wiOiAicHJpdmF0ZSJ9LCBbImNvbnRlbnQtbGVuZ3RoLXJhbmdlIiwgMCwgMTA3Mzc0MT"
                        "gyNF0sIHsiYnVja2V0IjogInRlc3QtbWFyc2hhLXNvdXJjZSJ9LCB7ImtleSI6ICIyN2EyM2Y"
                        "1Mi0zMzc5LTQ2YTItOTRmYS02OTdiNTljZmUzYzcvZG9jdW1lbnQvMjdhMjNmNTItMzM3OS00"
                        "NmEyLTk0ZmEtNjk3YjU5Y2ZlM2M3LzE1MzM2ODY0MDAucGRmIn0sIHsieC1hbXotYWxnb3Jpd"
                        "GhtIjogIkFXUzQtSE1BQy1TSEEyNTYifSwgeyJ4LWFtei1jcmVkZW50aWFsIjogImF3cy1hY2"
                        "Nlc3Mta2V5LWlkLzIwMTgwODA4L2V1LXdlc3QtMS9zMy9hd3M0X3JlcXVlc3QifSwgeyJ4LWF"
                        "tei1kYXRlIjogIjIwMTgwODA4VDAwMDAwMFoifV19"
                    ),
                    "x-amz-signature": (
                        "9ee691c89e2061c5f631b093e01e7faee1ffe71de4c9684fb83d810a3fca799e"
                    ),
                },
            },
        )

    def test_api_document_initiate_upload_file_without_mimetype(self):
        """With no mimetype the extension should be ignored."""
        document = DocumentFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=document)

        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/documents/{document.id}/initiate-upload/",
                {"filename": "foo", "mimetype": "", "size": 10},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content),
            {
                "url": "https://test-marsha-source.s3.amazonaws.com/",
                "fields": {
                    "acl": "private",
                    "key": (
                        "27a23f52-3379-46a2-94fa-697b59cfe3c7/document/27a23f52-3379-46a2-94fa-"
                        "697b59cfe3c7/1533686400"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "aws-access-key-id/20180808/eu-west-1/s3/aws4_request",
                    "x-amz-date": "20180808T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMTgtMDgtMDlUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBbe"
                        "yJhY2wiOiAicHJpdmF0ZSJ9LCBbImNvbnRlbnQtbGVuZ3RoLXJhbmdlIiwgMCwgMTA3Mzc0MT"
                        "gyNF0sIHsiYnVja2V0IjogInRlc3QtbWFyc2hhLXNvdXJjZSJ9LCB7ImtleSI6ICIyN2EyM2Y"
                        "1Mi0zMzc5LTQ2YTItOTRmYS02OTdiNTljZmUzYzcvZG9jdW1lbnQvMjdhMjNmNTItMzM3OS00"
                        "NmEyLTk0ZmEtNjk3YjU5Y2ZlM2M3LzE1MzM2ODY0MDAifSwgeyJ4LWFtei1hbGdvcml0aG0iO"
                        "iAiQVdTNC1ITUFDLVNIQTI1NiJ9LCB7IngtYW16LWNyZWRlbnRpYWwiOiAiYXdzLWFjY2Vzcy"
                        "1rZXktaWQvMjAxODA4MDgvZXUtd2VzdC0xL3MzL2F3czRfcmVxdWVzdCJ9LCB7IngtYW16LWR"
                        "hdGUiOiAiMjAxODA4MDhUMDAwMDAwWiJ9XX0="
                    ),
                    "x-amz-signature": (
                        "b952d4bcdd88a082e0cae8e01ea7754ef0959475887fd732d79e3a04d672a166"
                    ),
                },
            },
        )
