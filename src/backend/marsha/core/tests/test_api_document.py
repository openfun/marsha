"""Tests for the document API."""
from base64 import b64decode
from datetime import datetime
import json
import random
from unittest import mock

from django.test import TestCase, override_settings

import pytz
from rest_framework_simplejwt.tokens import AccessToken

from ..api import timezone
from ..factories import DocumentFactory


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class DocumentAPITest(TestCase):
    """Test for the Document API."""

    def test_api_document_fetch_anonymous(self):
        """Anonymous users should not be able to fetch a document."""
        document = DocumentFactory()

        response = self.client.get("/api/documents/{!s}/".format(document.id))
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_document_fetch_student(self):
        """A student should not be allowed to fetch a document."""
        document = DocumentFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(document.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["read_only"] = False

        response = self.client.get(
            "/api/documents/{!s}/".format(document.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
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
            uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc),
            upload_state="ready",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(document.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["read_only"] = False

        response = self.client.get(
            "/api/documents/{!s}/".format(document.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "active_stamp": "1533686400",
                "id": str(document.id),
                "is_ready_to_show": True,
                "title": document.title,
                "upload_state": "ready",
                "url": "https://abc.cloudfront.net/4c51f469-f91e-4998-b438-e31ee3bd3ea6/"
                "document/1533686400",
                "show_download": True,
            },
        )

    def test_api_document_fetch_instructor_read_only(self):
        """An instructor should not be able to fetch a document in read_only."""
        document = DocumentFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(document.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["read_only"] = True

        response = self.client.get(
            "/api/documents/{!s}/".format(document.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_document_fetch_list_anonymous(self):
        """An anonymous should not be able to fetch a list of document."""
        response = self.client.get("/api/documents/")
        self.assertEqual(response.status_code, 404)

    def test_api_document_fetch_list_student(self):
        """A student should not be able to fetch a list of document."""
        document = DocumentFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(document.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["read_only"] = False

        response = self.client.get(
            "/api/documents/", HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token)
        )
        self.assertEqual(response.status_code, 404)

    def test_api_fetch_list_instructor(self):
        """An instrustor should not be able to fetch a document list."""
        document = DocumentFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(document.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["read_only"] = False

        response = self.client.get(
            "/api/documents/", HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token)
        )
        self.assertEqual(response.status_code, 404)

    def test_api_document_create_anonymous(self):
        """An anonymous should not be able to create a document."""
        response = self.client.post("/api/documents/")
        self.assertEqual(response.status_code, 404)

    def test_api_document_create_student(self):
        """A student should not be able to create a document."""
        document = DocumentFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(document.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["read_only"] = False

        response = self.client.post(
            "/api/documents/", HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token)
        )
        self.assertEqual(response.status_code, 404)

    def test_api_document_create_instructor(self):
        """An instrustor should not be able to create a document."""
        document = DocumentFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(document.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["read_only"] = False

        response = self.client.get(
            "/api/documents/", HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token)
        )
        self.assertEqual(response.status_code, 404)

    def test_api_document_delete_anonymous(self):
        """An anonymous should not be able to delete a document."""
        document = DocumentFactory()
        response = self.client.delete("/api/documents/{!s}/".format(document.id))
        self.assertEqual(response.status_code, 401)

    def test_api_document_delete_student(self):
        """A student should not be able to delete a document."""
        document = DocumentFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(document.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["read_only"] = False

        response = self.client.delete(
            "/api/documents/{!s}/".format(document.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_delete_instructor(self):
        """An instructor should not be able to create a document."""
        document = DocumentFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(document.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["read_only"] = False

        response = self.client.delete(
            "/api/documents/{!s}/".format(document.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 405)

    def test_api_document_update_anonymous(self):
        """An anonymous should not be able to update a document."""
        document = DocumentFactory()
        response = self.client.put("/api/documents/{!s}/".format(document.id))
        self.assertEqual(response.status_code, 401)

    def test_api_document_update_student(self):
        """A student user should not be able to update a document."""
        document = DocumentFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(document.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["read_only"] = False
        data = {"title": "new title"}

        response = self.client.put(
            "/api/documents/{!s}/".format(document.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_update_instructor_read_only(self):
        """An instructor should not be able to update a document in read_only."""
        document = DocumentFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(document.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["read_only"] = True
        data = {"title": "new title"}

        response = self.client.put(
            "/api/documents/{!s}/".format(document.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_update_instructor(self):
        """An instructor should be able to update a document."""
        document = DocumentFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(document.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["read_only"] = False
        data = {"title": "new title"}

        response = self.client.put(
            "/api/documents/{!s}/".format(document.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

        document.refresh_from_db()
        self.assertEqual(document.title, "new title")

    def test_api_document_initiate_upload_anonymous(self):
        """Anonymous user should not be able to initiate an upload."""
        document = DocumentFactory()
        response = self.client.post(
            "/api/documents/{!s}/initiate-upload/".format(document.id)
        )
        self.assertEqual(response.status_code, 401)

    def test_api_document_initiate_upload_student(self):
        """Student should not be able to initiate an upload."""
        document = DocumentFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(document.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["read_only"] = False

        response = self.client.post(
            "/api/documents/{!s}/initiate-upload/".format(document.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_initiate_upload_instructor_read_only(self):
        """An instructor should not be able to initiate an upload for a document in read_only."""
        document = DocumentFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(document.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["read_only"] = True

        response = self.client.post(
            "/api/documents/{!s}/initiate-upload/".format(document.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_initiate_upload_instructor(self):
        """An instructor should be able to initiate an upload for a document."""
        document = DocumentFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(document.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["read_only"] = False

        now = datetime(2018, 8, 8, tzinfo=pytz.utc)
        with mock.patch.object(timezone, "now", return_value=now):
            response = self.client.post(
                "/api/documents/{!s}/initiate-upload/".format(document.id),
                HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        policy = content.pop("policy")
        self.assertEqual(
            json.loads(b64decode(policy)),
            {
                "expiration": "2018-08-09T00:00:00.000Z",
                "conditions": [
                    {"acl": "private"},
                    {"bucket": "test-marsha-source"},
                    {
                        "x-amz-credential": "aws-access-key-id/20180808/eu-west-1/s3/aws4_request"
                    },
                    {"x-amz-algorithm": "AWS4-HMAC-SHA256"},
                    {"x-amz-date": "20180808T000000Z"},
                    {
                        "key": (
                            "27a23f52-3379-46a2-94fa-697b59cfe3c7/document/"
                            "27a23f52-3379-46a2-94fa-697b59cfe3c7/1533686400"
                        )
                    },
                    ["content-length-range", 0, 1073741824],
                ],
            },
        )
        self.assertEqual(
            content,
            {
                "acl": "private",
                "bucket": "test-marsha-source",
                "stamp": "1533686400",
                "key": "{id!s}/document/{id!s}/1533686400".format(id=document.pk),
                "max_file_size": 1073741824,
                "s3_endpoint": "s3.eu-west-1.amazonaws.com",
                "x_amz_algorithm": "AWS4-HMAC-SHA256",
                "x_amz_credential": "aws-access-key-id/20180808/eu-west-1/s3/aws4_request",
                "x_amz_date": "20180808T000000Z",
                "x_amz_expires": 86400,
                "x_amz_signature": (
                    "610ebbc09b4d482aa1d4a09133c1561a707abe5bf3cd57a09802c72f0b357571"
                ),
            },
        )
