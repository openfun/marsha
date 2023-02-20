"""Tests for the create Thumbnail API."""
import json

from django.test import TestCase, override_settings

from marsha.core.factories import ThumbnailFactory, VideoFactory
from marsha.core.models import Thumbnail
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
)


class ThumbnailCreateApiTest(TestCase):
    """Test the create API of the thumbnail object."""

    maxDiff = None

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
