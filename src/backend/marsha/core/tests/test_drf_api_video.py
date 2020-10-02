"""Tests for the Video API with DRF token of the Marsha project."""
import json

from django.test import TestCase

from rest_framework.authtoken.models import Token

from ..factories import UserFactory, VideoFactory


class VideoDRFAPITest(TestCase):
    """Test the DRF API of the video object."""

    def test_api_video_get_detail_staff_with_drf_token(self):
        """Staff users should be able to get video details with a drf token."""
        staff_token = Token.objects.create(user=UserFactory(is_staff=True))
        video = VideoFactory()

        # Test staff user (200)
        response = self.client.get(
            "/api/videos/{!s}/".format(video.id),
            HTTP_AUTHORIZATION="Token {!s}".format(staff_token.key),
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(content["id"], str(video.id))
        self.assertEqual(content["title"], video.title)

    def test_api_video_get_detail_user_with_drf_token(self):
        """Non-staff users should not be able to get video details with a drf token."""
        user_token = Token.objects.create(user=UserFactory())
        video = VideoFactory()

        # Test regular user (403)
        response = self.client.get(
            "/api/videos/{!s}/".format(video.id),
            HTTP_AUTHORIZATION="Token {!s}".format(user_token.key),
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_video_patch_detail_staff_with_drf_token(self):
        """Staff users should not be able to patch videos with a drf token."""
        staff_token = Token.objects.create(user=UserFactory(is_staff=True))
        video = VideoFactory()
        data = {"description": "my new description"}

        # Test staff user (403)
        response = self.client.patch(
            "/api/videos/{!s}/".format(video.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Token {!s}".format(staff_token.key),
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_video_patch_detail_user_with_drf_token(self):
        """Regular users should not be able to patch videos with a drf token."""
        user_token = Token.objects.create(user=UserFactory())
        video = VideoFactory()
        data = {"description": "my new description"}

        # Test regular user (403)
        response = self.client.patch(
            "/api/videos/{!s}/".format(video.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Token {!s}".format(user_token.key),
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_video_delete_staff_with_drf_token(self):
        """Staff users should not be able to delete videos with a drf token."""
        staff_token = Token.objects.create(user=UserFactory(is_staff=True))
        video = VideoFactory()

        # Test staff user (403)
        response = self.client.delete(
            "/api/videos/{!s}/".format(video.id),
            HTTP_AUTHORIZATION="Token {!s}".format(staff_token.key),
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_video_delete_user_with_drf_token(self):
        """Regular users should not be able to delete videos with a drf token."""
        user_token = Token.objects.create(user=UserFactory())
        video = VideoFactory()

        # Test regular user (403)
        response = self.client.delete(
            "/api/videos/{!s}/".format(video.id),
            HTTP_AUTHORIZATION="Token {!s}".format(user_token.key),
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )
