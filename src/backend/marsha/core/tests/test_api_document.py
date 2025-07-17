"""Tests for the document API."""

from datetime import datetime, timezone as baseTimezone
import json
import random
from unittest import mock

from django.test import TestCase, override_settings

from marsha.core.api import timezone
from marsha.core.defaults import AWS_S3, READY, SCW_S3
from marsha.core.factories import DocumentFactory, PlaylistFactory
from marsha.core.models import Document
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
)


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
            playlist=document.playlist,
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

    @override_settings(MEDIA_URL="https://abc.svc.edge.scw.cloud/")
    def test_api_document_fetch_instructor_on_aws(self):
        """An instructor should be able to fetch a document."""
        document = DocumentFactory(
            pk="4c51f469-f91e-4998-b438-e31ee3bd3ea6",
            uploaded_on=datetime(2018, 8, 8, tzinfo=baseTimezone.utc),
            upload_state="ready",
            filename="bar_baz.pdf",
            extension="pdf",
            playlist__title="foo",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            title="bar baz",
            storage_location=AWS_S3,
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=document.playlist)

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
                "filename": "bar_baz.pdf",
                "id": str(document.id),
                "is_ready_to_show": True,
                "title": document.title,
                "upload_state": "ready",
                "url": "https://abc.svc.edge.scw.cloud/aws/4c51f469-f91e-4998-b438-e31ee3bd3ea6/"
                "document/bar_baz.pdf",
                "show_download": True,
                "playlist": {
                    "id": str(document.playlist.id),
                    "title": "foo",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
            },
        )

    @override_settings(MEDIA_URL="https://abc.svc.edge.scw.cloud/")
    def test_api_document_fetch_instructor_on_scw(self):
        """An instructor should be able to fetch a document."""
        document = DocumentFactory(
            pk="4c51f469-f91e-4998-b438-e31ee3bd3ea6",
            uploaded_on=datetime(2018, 8, 8, tzinfo=baseTimezone.utc),
            upload_state="ready",
            filename="bar.pdf",
            extension="pdf",
            playlist__title="foo",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            title="bar baz",
            storage_location=SCW_S3,
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=document.playlist)

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
                "filename": "bar.pdf",
                "id": str(document.id),
                "is_ready_to_show": True,
                "title": document.title,
                "upload_state": "ready",
                "url": "https://abc.svc.edge.scw.cloud/document/"
                "4c51f469-f91e-4998-b438-e31ee3bd3ea6/bar.pdf",
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
            playlist=document.playlist,
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
            playlist=document.playlist,
            permissions__can_update=True,
        )

        response = self.client.get(
            "/api/documents/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_fetch_list_instructor(self):
        """An instrustor should not be able to fetch a document list."""
        document = DocumentFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=document.playlist)

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
            playlist=document.playlist,
            permissions__can_update=True,
        )

        response = self.client.post(
            "/api/documents/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_create_instructor(self):
        """An instructor should be able to create a document."""
        playlist = PlaylistFactory(title="Playlist")

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=playlist)

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
                "filename": None,
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
            playlist=document.playlist,
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

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=document.playlist)

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
            playlist=document.playlist,
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
            playlist=document.playlist,
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

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=document.playlist)
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

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=document.playlist)
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
            playlist=document.playlist,
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
            playlist=document.playlist,
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

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=document.playlist)

        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with (
            mock.patch.object(timezone, "now", return_value=now),
            mock.patch("datetime.datetime") as mock_dt,
        ):
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/documents/{document.id}/initiate-upload/",
                {"filename": "foo.pdf", "mimetype": "application/pdf", "size": 10},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        response_json = response.json()
        fields = response_json["fields"]

        self.assertEqual(
            response_json["url"], "https://s3.fr-par.scw.cloud/test-marsha"
        )
        self.assertEqual(fields["acl"], "private")
        self.assertEqual(
            fields["key"],
            "document/27a23f52-3379-46a2-94fa-697b59cfe3c7/foo.pdf",
        )
        self.assertEqual(fields["x-amz-algorithm"], "AWS4-HMAC-SHA256")
        self.assertEqual(
            fields["x-amz-credential"],
            "scw-access-key/20180808/fr-par/s3/aws4_request",
        )
        self.assertEqual(fields["x-amz-date"], "20180808T000000Z")

        document.refresh_from_db()
        self.assertEqual(document.upload_state, "pending")

    def test_api_document_initiate_upload_file_without_extension(self):
        """An extension should be guessed from the mimetype."""
        document = DocumentFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=document.playlist)

        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with (
            mock.patch.object(timezone, "now", return_value=now),
            mock.patch("datetime.datetime") as mock_dt,
        ):
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/documents/{document.id}/initiate-upload/",
                {"filename": "foo", "mimetype": "application/pdf", "size": 10},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        response_json = response.json()
        fields = response_json["fields"]

        self.assertEqual(
            response_json["url"], "https://s3.fr-par.scw.cloud/test-marsha"
        )
        self.assertEqual(fields["acl"], "private")
        self.assertEqual(
            fields["key"],
            "document/27a23f52-3379-46a2-94fa-697b59cfe3c7/foo.pdf",
        )
        self.assertEqual(fields["x-amz-algorithm"], "AWS4-HMAC-SHA256")
        self.assertEqual(
            fields["x-amz-credential"],
            "scw-access-key/20180808/fr-par/s3/aws4_request",
        )
        self.assertEqual(fields["x-amz-date"], "20180808T000000Z")

        document.refresh_from_db()
        self.assertEqual(document.upload_state, "pending")

    def test_api_document_initiate_upload_file_without_mimetype(self):
        """With no mimetype the extension should be ignored."""
        document = DocumentFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=document.playlist)

        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with (
            mock.patch.object(timezone, "now", return_value=now),
            mock.patch("datetime.datetime") as mock_dt,
        ):
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/documents/{document.id}/initiate-upload/",
                {"filename": "foo", "mimetype": "", "size": 10},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        response_json = response.json()
        fields = response_json["fields"]

        self.assertEqual(
            response_json["url"], "https://s3.fr-par.scw.cloud/test-marsha"
        )
        self.assertEqual(fields["acl"], "private")
        self.assertEqual(
            fields["key"],
            "document/27a23f52-3379-46a2-94fa-697b59cfe3c7/foo",
        )
        self.assertEqual(fields["x-amz-algorithm"], "AWS4-HMAC-SHA256")
        self.assertEqual(
            fields["x-amz-credential"],
            "scw-access-key/20180808/fr-par/s3/aws4_request",
        )
        self.assertEqual(fields["x-amz-date"], "20180808T000000Z")

        document.refresh_from_db()
        self.assertEqual(document.upload_state, "pending")

    def test_api_document_upload_ended_student(self):
        """Student should not be able to end an upload."""
        document = DocumentFactory()

        jwt_token = StudentLtiTokenFactory(
            playlist=document.playlist,
            permissions__can_update=True,
        )

        response = self.client.post(
            f"/api/documents/{document.id}/upload-ended/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_upload_ended_instructor(self):
        """An instructor should be able to end an upload for a document."""
        document = DocumentFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=document.playlist)

        response = self.client.post(
            f"/api/documents/{document.id}/upload-ended/",
            {
                "file_key": f"document/{document.pk}/foo.pdf",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)

        document.refresh_from_db()
        self.assertEqual(document.upload_state, READY)

    def test_api_document_upload_ended_with_wrong_body(self):
        """A wrong body should not succeed."""
        document = DocumentFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=document.playlist)

        response = self.client.post(
            f"/api/documents/{document.id}/upload-ended/",
            {
                "wrong_key": f"document/{document.pk}/foo.pdf",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)

    def test_api_document_upload_ended_with_wrong_path(self):
        """A wrong path should not succeed."""
        document = DocumentFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=document.playlist)

        response = self.client.post(
            f"/api/documents/{document.id}/upload-ended/",
            {
                "file_key": f"wrongpath/{document.pk}/foo.pdf",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)
