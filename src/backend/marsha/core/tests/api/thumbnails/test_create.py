"""Tests for the Thumbnail API."""
from datetime import datetime
import json
from unittest import mock

from django.test import TestCase, override_settings

from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
)

from ..api import timezone
from ..factories import ThumbnailFactory, VideoFactory
from ..models import Thumbnail


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class ThumbnailApiTest(TestCase):
    """Test the API of the thumbnail object."""

    maxDiff = None

    def test_api_thumbnail_read_detail_anonymous(self):
        """Anonymous users should not be allowed to retrieve a thumbnail."""
        video = VideoFactory()
        thumbnail = ThumbnailFactory(video=video)
        response = self.client.get(f"/api/thumbnails/{thumbnail.id}/")
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_thumbnail_read_detail_student(self):
        """Students users should not be allowed to read a thumbnail detail."""
        video = VideoFactory()
        thumbnail = ThumbnailFactory(video=video)

        jwt_token = StudentLtiTokenFactory(resource=video)

        response = self.client.get(
            f"/api/thumbnails/{thumbnail.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_thumbnail_instructor_read_detail_in_read_only(self):
        """Instructor should not be able to read thumbnails in a read_only mode."""
        thumbnail = ThumbnailFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=thumbnail.video,
            permissions__can_update=False,
        )

        response = self.client.get(
            f"/api/thumbnails/{thumbnail.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_thumbnail_read_detail_token_user(self):
        """Instructors should be able to read details of thumbnail assotiated to their video."""
        video = VideoFactory(
            uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc), upload_state="ready"
        )
        thumbnail = ThumbnailFactory(video=video, upload_state="pending")

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        response = self.client.get(
            f"/api/thumbnails/{thumbnail.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "id": str(thumbnail.id),
                "active_stamp": None,
                "is_ready_to_show": False,
                "upload_state": "pending",
                "urls": None,
                "video": str(video.id),
            },
        )

    def test_api_thumbnail_administrator_read_detail_in_read_only(self):
        """Admin should not be able to read thumbnails in a read_only mode."""
        thumbnail = ThumbnailFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=thumbnail.video,
            permissions__can_update=False,
        )

        response = self.client.get(
            f"/api/thumbnails/{thumbnail.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_thumbnail_read_detail_admin_user(self):
        """Admin should be able to read details of thumbnail assotiated to their video."""
        video = VideoFactory(
            uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc), upload_state="ready"
        )
        thumbnail = ThumbnailFactory(video=video, upload_state="pending")

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            roles=["administrator"],
        )

        response = self.client.get(
            f"/api/thumbnails/{thumbnail.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "id": str(thumbnail.id),
                "active_stamp": None,
                "is_ready_to_show": False,
                "upload_state": "pending",
                "urls": None,
                "video": str(video.id),
            },
        )

    def test_api_thumbnail_read_ready_thumbnail(self):
        """A ready thumbnail should have computed urls."""
        video = VideoFactory(
            pk="78338c1c-356e-4156-bd95-5bed71ffb655",
            uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc),
            upload_state="ready",
        )
        thumbnail = ThumbnailFactory(
            video=video,
            uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc),
            upload_state="ready",
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        response = self.client.get(
            f"/api/thumbnails/{thumbnail.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "id": str(thumbnail.id),
                "active_stamp": "1533686400",
                "is_ready_to_show": True,
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
        response = self.client.post("/api/thumbnails/")
        self.assertEqual(response.status_code, 401)

    def test_api_thumbnail_create_student(self):
        """Student users should not be able to create a thumbnail."""
        video = VideoFactory()

        jwt_token = StudentLtiTokenFactory(resource=video)

        response = self.client.post(
            "/api/thumbnails/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )

        self.assertEqual(response.status_code, 403)

    def test_api_thumbnail_create_instructor(self):
        """Student users should not be able to create a thumbnail."""
        video = VideoFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        response = self.client.post(
            "/api/thumbnails/", {"size": 10}, HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )

        self.assertEqual(response.status_code, 201)
        content = json.loads(response.content)
        created_thumbnail = Thumbnail.objects.last()

        self.assertEqual(
            content,
            {
                "id": str(created_thumbnail.id),
                "active_stamp": None,
                "is_ready_to_show": False,
                "upload_state": "pending",
                "urls": None,
                "video": str(video.id),
            },
        )

    @override_settings(THUMBNAIL_SOURCE_MAX_SIZE=10)
    def test_api_thumbnail_create_instructor_file_too_large(self):
        """Instructor users should not be able to create a thumbnail if file is too large"""
        video = VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        response = self.client.post(
            "/api/thumbnails/", {"size": 100}, HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {"size": ["File too large, max size allowed is 10 Bytes"]},
        )

    def test_api_thumbnail_create_instructor_no_size_parameter_provided(self):
        """Instructor users shouldn't be able to create a thumbnail without a file size"""
        video = VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        response = self.client.post(
            "/api/thumbnails/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 400)

        self.assertEqual(
            response.json(),
            {"size": ["File size is required"]},
        )

    def test_api_thumbnail_create_already_existing_instructor(self):
        """Creating a thumbnail should fail when a thumbnail already exists for the video."""
        video = VideoFactory()
        ThumbnailFactory(video=video)

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        response = self.client.post(
            "/api/thumbnails/", {"size": 10}, HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )

        self.assertEqual(response.status_code, 400)

        self.assertEqual(
            response.json(),
            {"video": ["Thumbnail with this Video already exists."]},
        )

    def test_api_thumbnail_instructor_create_in_read_only(self):
        """Instructor should not be able to create thumbnails in a read_only mode."""
        thumbnail = ThumbnailFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=thumbnail.video,
            permissions__can_update=False,
        )

        response = self.client.post(
            "/api/thumbnails/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )

        self.assertEqual(response.status_code, 403)
