"""Tests for the File API."""
from base64 import b64decode
from datetime import datetime
import json
import random
from unittest import mock

from django.test import TestCase, override_settings

import pytz
from rest_framework_simplejwt.tokens import AccessToken

from ..api import timezone
from ..factories import FileFactory


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class FileAPITest(TestCase):
    """Test for the File API."""

    def test_api_file_fetch_anonymous(self):
        """Anonymous users should not be able to fetch a file."""
        file_to_test = FileFactory()

        response = self.client.get("/api/files/{!s}/".format(file_to_test.id))
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_file_fetch_student(self):
        """A student should not be allowed to fetch a file."""
        file_to_test = FileFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(file_to_test.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["read_only"] = False

        response = self.client.get(
            "/api/files/{!s}/".format(file_to_test.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Only admin users or object owners are allowed."}
        )

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_file_fetch_instructor(self):
        """An instructor should be able to fetch a file."""
        file_to_test = FileFactory(
            pk="4c51f469-f91e-4998-b438-e31ee3bd3ea6",
            uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc),
            upload_state="ready",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(file_to_test.id)
        jwt_token.payload["roles"] = ["instructor"]
        jwt_token.payload["read_only"] = False

        response = self.client.get(
            "/api/files/{!s}/".format(file_to_test.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "active_stamp": "1533686400",
                "id": str(file_to_test.id),
                "is_ready_to_display": True,
                "title": file_to_test.title,
                "upload_state": "ready",
                "url": "https://abc.cloudfront.net/4c51f469-f91e-4998-b438-e31ee3bd3ea6/"
                "file/1533686400",
                "show_download": True,
            },
        )

    def test_api_file_fetch_instructor_read_only(self):
        """An instructor should not be able to fetch a file in read_only."""
        file_to_test = FileFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(file_to_test.id)
        jwt_token.payload["roles"] = ["instructor"]
        jwt_token.payload["read_only"] = True

        response = self.client.get(
            "/api/files/{!s}/".format(file_to_test.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Only admin users or object owners are allowed."}
        )

    def test_api_file_fetch_list_anonymous(self):
        """An anonymous should not be able to fetch a list of file."""
        response = self.client.get("/api/files/")
        self.assertEqual(response.status_code, 404)

    def test_api_file_fetch_list_student(self):
        """A student should not be able to fetch a list of file."""
        file_to_test = FileFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(file_to_test.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["read_only"] = False

        response = self.client.get(
            "/api/files/", HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token)
        )
        self.assertEqual(response.status_code, 404)

    def test_api_fetch_list_instructor(self):
        """An instrustor should not be able to fetch a file list."""
        file_to_test = FileFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(file_to_test.id)
        jwt_token.payload["roles"] = ["instructor"]
        jwt_token.payload["read_only"] = False

        response = self.client.get(
            "/api/files/", HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token)
        )
        self.assertEqual(response.status_code, 404)

    def test_api_file_create_anonymous(self):
        """An anonymous should not be able to create a file."""
        response = self.client.post("/api/files/")
        self.assertEqual(response.status_code, 404)

    def test_api_file_create_student(self):
        """A student should not be able to create a file."""
        file_to_test = FileFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(file_to_test.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["read_only"] = False

        response = self.client.post(
            "/api/files/", HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token)
        )
        self.assertEqual(response.status_code, 404)

    def test_api_file_create_instructor(self):
        """An instrustor should not be able to create a file."""
        file_to_test = FileFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(file_to_test.id)
        jwt_token.payload["roles"] = ["instructor"]
        jwt_token.payload["read_only"] = False

        response = self.client.get(
            "/api/files/", HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token)
        )
        self.assertEqual(response.status_code, 404)

    def test_api_file_delete_anonymous(self):
        """An anonymous should not be able to delete a file."""
        file_to_test = FileFactory()
        response = self.client.delete("/api/files/{!s}/".format(file_to_test.id))
        self.assertEqual(response.status_code, 401)

    def test_api_file_delete_student(self):
        """A student should not be able to delete a file."""
        file_to_test = FileFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(file_to_test.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["read_only"] = False

        response = self.client.delete(
            "/api/files/{!s}/".format(file_to_test.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)

    def test_api_file_delete_instructor(self):
        """An instrustor should not be able to create a file."""
        file_to_test = FileFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(file_to_test.id)
        jwt_token.payload["roles"] = ["instructor"]
        jwt_token.payload["read_only"] = False

        response = self.client.delete(
            "/api/files/{!s}/".format(file_to_test.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 405)

    def test_api_file_update_anonymous(self):
        """An anonymous should not be able to update a file."""
        file_to_test = FileFactory()
        response = self.client.put("/api/files/{!s}/".format(file_to_test.id))
        self.assertEqual(response.status_code, 401)

    def test_api_file_update_student(self):
        """A student user should not be able to update a file."""
        file_to_test = FileFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(file_to_test.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["read_only"] = False
        data = {"title": "new title"}

        response = self.client.put(
            "/api/files/{!s}/".format(file_to_test.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_file_update_instructor_read_only(self):
        """An instructor should not be able to update a video in read_only."""
        file_to_test = FileFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(file_to_test.id)
        jwt_token.payload["roles"] = ["instructor"]
        jwt_token.payload["read_only"] = True
        data = {"title": "new title"}

        response = self.client.put(
            "/api/files/{!s}/".format(file_to_test.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_file_update_instructor(self):
        """An instructor should be able to update a video."""
        file_to_test = FileFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(file_to_test.id)
        jwt_token.payload["roles"] = ["instructor"]
        jwt_token.payload["read_only"] = False
        data = {"title": "new title"}

        response = self.client.put(
            "/api/files/{!s}/".format(file_to_test.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

        file_to_test.refresh_from_db()
        self.assertEqual(file_to_test.title, "new title")

    def test_api_file_initiate_upload_anonymous(self):
        """Anonymous user should not be able to initiate an upload."""
        file_to_test = FileFactory()
        response = self.client.post(
            "/api/files/{!s}/initiate-upload/".format(file_to_test.id)
        )
        self.assertEqual(response.status_code, 401)

    def test_api_file_initiate_upload_student(self):
        """Student should not be able to initiate an upload."""
        file_to_test = FileFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(file_to_test.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["read_only"] = False

        response = self.client.post(
            "/api/files/{!s}/initiate-upload/".format(file_to_test.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)

    def test_api_file_initiate_upload_instructor_read_only(self):
        """An instructor should not be able to initiate an upload for a file in read_only."""
        file_to_test = FileFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(file_to_test.id)
        jwt_token.payload["roles"] = ["instructor"]
        jwt_token.payload["read_only"] = True

        response = self.client.post(
            "/api/files/{!s}/initiate-upload/".format(file_to_test.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)

    def test_api_file_initiate_upload_instructor(self):
        """An instructor should not be able to initiate an upload for a file."""
        file_to_test = FileFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(file_to_test.id)
        jwt_token.payload["roles"] = ["instructor"]
        jwt_token.payload["read_only"] = False

        now = datetime(2018, 8, 8, tzinfo=pytz.utc)
        with mock.patch.object(timezone, "now", return_value=now):
            response = self.client.post(
                "/api/files/{!s}/initiate-upload/".format(file_to_test.id),
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
                            "27a23f52-3379-46a2-94fa-697b59cfe3c7/file/"
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
                "key": "{id!s}/file/{id!s}/1533686400".format(id=file_to_test.pk),
                "max_file_size": 1073741824,
                "s3_endpoint": "s3.eu-west-1.amazonaws.com",
                "x_amz_algorithm": "AWS4-HMAC-SHA256",
                "x_amz_credential": "aws-access-key-id/20180808/eu-west-1/s3/aws4_request",
                "x_amz_date": "20180808T000000Z",
                "x_amz_expires": 86400,
                "x_amz_signature": (
                    "e316d1291fca8423db88e3b389874a1443469ed8aa8f73a1d5f0efd6b9da0f1b"
                ),
            },
        )
