"""Tests for the Thumbnail delete API."""

from django.test import TestCase

from marsha.core.factories import ThumbnailFactory, VideoFactory
from marsha.core.models import Thumbnail
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
)


class ThumbnailDeleteApiTest(TestCase):
    """Test the delete API of the thumbnail object."""

    maxDiff = None

    def test_api_thumbnail_delete_anonymous(self):
        """Anonymous users should not be able to delete a thumbnail."""
        video = VideoFactory()
        thumbnail = ThumbnailFactory(video=video)

        response = self.client.delete(f"/api/thumbnails/{thumbnail.id}/")
        self.assertEqual(response.status_code, 401)

    def test_api_thumbnail_delete_student(self):
        """Student users should not be able to delete a thumbnail."""
        video = VideoFactory()
        thumbnail = ThumbnailFactory(video=video)

        jwt_token = StudentLtiTokenFactory(resource=video)

        response = self.client.delete(
            f"/api/thumbnails/{thumbnail.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_thumbnail_delete_instructor(self):
        """Instructor should be able to delete a thumbnail for its video."""
        video = VideoFactory()
        thumbnail = ThumbnailFactory(video=video)

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        self.assertEqual(Thumbnail.objects.count(), 1)

        response = self.client.delete(
            f"/api/thumbnails/{thumbnail.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Thumbnail.objects.filter(id=thumbnail.id).exists())
        self.assertEqual(Thumbnail.objects.count(), 0)

        response = self.client.get(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        content = response.json()
        self.assertIsNone(content["thumbnail"])

        # Creating a new thumbnail should be allowed.
        response = self.client.post(
            "/api/thumbnails/", {"size": 10}, HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )

        self.assertEqual(response.status_code, 201)

    def test_api_thumbnail_delete_instructor_in_read_only(self):
        """Instructor should not be able to delete thumbnails in a read_only mode."""
        thumbnail = ThumbnailFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=thumbnail.video,
            permissions__can_update=False,
        )

        response = self.client.delete(
            f"/api/thumbnails/{thumbnail.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_thumbnail_delete_instructor_other_video(self):
        """Instructor users should not be able to delete a thumbnail on another video."""
        video_token = VideoFactory()
        video_other = VideoFactory()
        thumbnail = ThumbnailFactory(video=video_other)

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video_token)

        response = self.client.delete(
            f"/api/thumbnails/{thumbnail.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
