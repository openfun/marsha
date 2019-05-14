"""Tests for the Thumbnail API."""
from base64 import b64decode
from datetime import datetime
import json
from unittest import mock

from django.test import TestCase, override_settings

import pytz
from rest_framework_simplejwt.tokens import AccessToken

from ..api import timezone
from ..factories import ThumbnailFactory, VideoFactory
from ..models import Thumbnail


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class ThumbnailApiTest(TestCase):
    """Test the API of the thumbnail object."""

    def test_api_thumbnail_read_detail_anonymous(self):
        """Anonymous users should not be allowed to retrieve a thumbnail."""
        video = VideoFactory()
        thumbnail = ThumbnailFactory(video=video)
        response = self.client.get("/api/thumbnail/{!s}/".format(thumbnail.id))
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_thumbnail_read_detail_student(self):
        """Students users should not be allowed to read a thumbnail detail."""
        video = VideoFactory()
        thumbnail = ThumbnailFactory(video=video)

        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]

        response = self.client.get(
            "/api/thumbnail/{!s}/".format(thumbnail.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )

        self.assertEqual(response.status_code, 403)

    def test_api_thumbnail_instructor_read_detail_in_read_only(self):
        """Instructor should not be able to read thumbnails in a read_only mode."""
        thumbnail = ThumbnailFactory()

        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(thumbnail.video.id)
        jwt_token.payload["roles"] = ["instructor"]
        jwt_token.payload["read_only"] = True

        response = self.client.get(
            "/api/thumbnail/{!s}/".format(thumbnail.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )

        self.assertEqual(response.status_code, 403)

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_thumbnail_read_detail_token_user(self):
        """Instructors should be able to read details of thumbnail assotiated to their video."""
        video = VideoFactory(
            uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc), upload_state="ready"
        )
        thumbnail = ThumbnailFactory(video=video, upload_state="pending")

        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)
        jwt_token.payload["roles"] = ["instructor"]
        jwt_token.payload["read_only"] = False

        response = self.client.get(
            "/api/thumbnail/{!s}/".format(thumbnail.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "id": str(thumbnail.id),
                "active_stamp": None,
                "is_ready_to_display": False,
                "upload_state": "pending",
                "urls": None,
                "video": str(video.id),
            },
        )

    def test_api_thumbnail_read_ready_thumbnail(self):
        """A ready thumbnail should have computed urls."""
        video = VideoFactory(
            pk="78338c1c-356e-4156-bd95-5bed71ffb655",
            uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc),
            upload_state="ready",
        )
        thumbnail = ThumbnailFactory(
            video=video,
            uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc),
            upload_state="ready",
        )

        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)
        jwt_token.payload["roles"] = ["instructor"]
        jwt_token.payload["read_only"] = False

        response = self.client.get(
            "/api/thumbnail/{!s}/".format(thumbnail.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "id": str(thumbnail.id),
                "active_stamp": "1533686400",
                "is_ready_to_display": True,
                "upload_state": "ready",
                "urls": {
                    "144": "https://abc.cloudfront.net/78338c1c-356e-4156-bd95-5bed71ffb655/"
                    "thumbnails/1533686400_144.jpg",
                    "240": "https://abc.cloudfront.net/78338c1c-356e-4156-bd95-5bed71ffb655/"
                    "thumbnails/1533686400_240.jpg",
                    "480": "https://abc.cloudfront.net/78338c1c-356e-4156-bd95-5bed71ffb655/"
                    "thumbnails/1533686400_480.jpg",
                    "720": "https://abc.cloudfront.net/78338c1c-356e-4156-bd95-5bed71ffb655/"
                    "thumbnails/1533686400_720.jpg",
                    "1080": "https://abc.cloudfront.net/78338c1c-356e-4156-bd95-5bed71ffb655/"
                    "thumbnails/1533686400_1080.jpg",
                },
                "video": str(video.id),
            },
        )

    def test_api_thumbnail_create_anonymous(self):
        """Anonymous users should not be able to create a thumbnail."""
        response = self.client.post("/api/thumbnail/")
        self.assertEqual(response.status_code, 401)

    def test_api_thumbnail_create_student(self):
        """Student users should not be able to create a thumbnail."""
        video = VideoFactory()

        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]

        response = self.client.post(
            "/api/thumbnail/", HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token)
        )

        self.assertEqual(response.status_code, 403)

    def test_api_thumbnail_create_instructor(self):
        """Student users should not be able to create a thumbnail."""
        video = VideoFactory()

        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)
        jwt_token.payload["roles"] = ["instructor"]
        jwt_token.payload["read_only"] = False

        response = self.client.post(
            "/api/thumbnail/", HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token)
        )

        self.assertEqual(response.status_code, 201)
        content = json.loads(response.content)
        created_thumbnail = Thumbnail.objects.last()

        self.assertEqual(
            content,
            {
                "id": str(created_thumbnail.id),
                "active_stamp": None,
                "is_ready_to_display": False,
                "upload_state": "pending",
                "urls": None,
                "video": str(video.id),
            },
        )

    def test_api_thumbnail_instructor_create_in_read_only(self):
        """Instructor should not be able to create thumbnails in a read_only mode."""
        thumbnail = ThumbnailFactory()

        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(thumbnail.video.id)
        jwt_token.payload["roles"] = ["instructor"]
        jwt_token.payload["read_only"] = True

        response = self.client.post(
            "/api/thumbnail/", HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token)
        )

        self.assertEqual(response.status_code, 403)

    def test_api_thumbnail_delete_anonymous(self):
        """Anonymous users should not be able to delete a thumbnail."""
        video = VideoFactory()
        thumbnail = ThumbnailFactory(video=video)

        response = self.client.delete("/api/thumbnail/{!s}/".format(thumbnail.id))
        self.assertEqual(response.status_code, 401)

    def test_api_thumbnail_delete_student(self):
        """Student users should not be able to delete a thumbnail."""
        video = VideoFactory()
        thumbnail = ThumbnailFactory(video=video)

        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]

        response = self.client.delete(
            "/api/thumbnail/{!s}/".format(thumbnail.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)

    def test_api_thumbnail_delete_instructor(self):
        """Instructor should be able to delete a thumbnail for its video."""
        video = VideoFactory()
        thumbnail = ThumbnailFactory(video=video)

        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)
        jwt_token.payload["roles"] = ["instructor"]
        jwt_token.payload["read_only"] = False

        response = self.client.delete(
            "/api/thumbnail/{!s}/".format(thumbnail.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Thumbnail.objects.filter(id=thumbnail.id).exists())

    def test_api_thumbnail_delete_instructor_in_read_only(self):
        """Instructor should not be able to delete thumbnails in a read_only mode."""
        thumbnail = ThumbnailFactory()

        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(thumbnail.video.id)
        jwt_token.payload["roles"] = ["instructor"]
        jwt_token.payload["read_only"] = True

        response = self.client.delete(
            "/api/thumbnail/{!s}/".format(thumbnail.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )

        self.assertEqual(response.status_code, 403)

    def test_api_thumbnail_delete_instructor_other_video(self):
        """Instructor users should not be able to delete a thumbnail on another video."""
        video_token = VideoFactory()
        video_other = VideoFactory()
        thumbnail = ThumbnailFactory(video=video_other)

        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video_token.id)
        jwt_token.payload["roles"] = ["instructor"]
        jwt_token.payload["read_only"] = False

        response = self.client.delete(
            "/api/thumbnail/{!s}/".format(thumbnail.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 404)

    def test_api_thumbnail_initiate_upload_anonymous(self):
        """Anonymous users are not allowed to initiate an upload."""
        thumbnail = ThumbnailFactory()

        response = self.client.post(
            "/api/thumbnail/{!s}/initiate-upload/".format(thumbnail.id)
        )
        self.assertEqual(response.status_code, 401)

    def test_api_thumbnail_initiate_upload_student(self):
        """Student users should not be allowed to initiate an upload."""
        thumbnail = ThumbnailFactory()
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(thumbnail.video.id)
        jwt_token.payload["roles"] = ["student"]

        response = self.client.post(
            "/api/thumbnail/{!s}/initiate-upload/".format(thumbnail.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)

    def test_api_thumbnail_initiate_upload_instructor(self):
        """Instructor users should not be allowed to initiate an upload."""
        video = VideoFactory(
            id="c10b79b6-9ecc-4aba-bf9d-5aab4765fd40", upload_state="ready"
        )
        thumbnail = ThumbnailFactory(
            id="4ab8079e-ff4d-4d06-9922-4929e4f7a6eb", video=video, upload_state="ready"
        )
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)
        jwt_token.payload["roles"] = ["instructor"]
        jwt_token.payload["read_only"] = False

        # Get the upload policy for this thumbnail
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=pytz.utc)
        with mock.patch.object(timezone, "now", return_value=now):
            response = self.client.post(
                "/api/thumbnail/{!s}/initiate-upload/".format(thumbnail.id),
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
                            "c10b79b6-9ecc-4aba-bf9d-5aab4765fd40/thumbnail/"
                            "4ab8079e-ff4d-4d06-9922-4929e4f7a6eb/1533686400"
                        )
                    },
                    ["starts-with", "$Content-Type", "image/"],
                    ["content-length-range", 0, 10485760],
                ],
            },
        )
        self.assertEqual(
            content,
            {
                "acl": "private",
                "bucket": "test-marsha-source",
                "stamp": "1533686400",
                "key": "{video!s}/thumbnail/{thumbnail!s}/1533686400".format(
                    video=video.pk, thumbnail=thumbnail.id
                ),
                "max_file_size": 10485760,
                "s3_endpoint": "s3.eu-west-1.amazonaws.com",
                "x_amz_algorithm": "AWS4-HMAC-SHA256",
                "x_amz_credential": "aws-access-key-id/20180808/eu-west-1/s3/aws4_request",
                "x_amz_date": "20180808T000000Z",
                "x_amz_expires": 86400,
                "x_amz_signature": (
                    "c2d6de925194710b939abf80b7b1218a3af93123c1da16dd2c3f35aac145dbfc"
                ),
            },
        )

        # The upload_state of the thumbnail should have been reset
        thumbnail.refresh_from_db()
        self.assertEqual(thumbnail.upload_state, "pending")

    def test_api_thumbnail_initiate_upload_instructor_read_only(self):
        """Instructor should not be able to initiate thumbnails upload in a read_only mode."""
        thumbnail = ThumbnailFactory()

        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(thumbnail.video.id)
        jwt_token.payload["roles"] = ["instructor"]
        jwt_token.payload["read_only"] = True

        response = self.client.post(
            "/api/thumbnail/{!s}/initiate-upload/".format(thumbnail.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )

        self.assertEqual(response.status_code, 403)
