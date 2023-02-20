"""Tests for the Thumbnail options API."""

from django.test import TestCase, override_settings

from marsha.core.factories import VideoFactory
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
)


class ThumbnailOptionsApiTest(TestCase):
    """Test the options API of the thumbnail object."""

    maxDiff = None

    @override_settings(THUMBNAIL_SOURCE_MAX_SIZE=10)
    def test_api_thumbnail_options_as_instructor(self):
        """An autheticated user can fetch the thumbnail options endpoint"""
        video = VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        response = self.client.options(
            "/api/thumbnails/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["upload_max_size_bytes"], 10)

    def test_api_thumbnail_options_as_student(self):
        """A student user can't fetch the thumbnail options endpoint"""
        video = VideoFactory()
        jwt_token = StudentLtiTokenFactory(resource=video)

        response = self.client.options(
            "/api/thumbnails/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)
