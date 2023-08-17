"""Tests for the Thumbnail options API."""

from django.test import TestCase, override_settings

from marsha.core.factories import UserFactory, VideoFactory
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)


@override_settings(THUMBNAIL_SOURCE_MAX_SIZE=10)
class ThumbnailOptionsApiTest(TestCase):
    """Test the options API of the thumbnail object."""

    maxDiff = None

    def _options_url(self, video):
        """Return the url to use options a thumbnail."""
        return f"/api/videos/{video.id}/thumbnails/"

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.video = VideoFactory()

    def assert_user_can_query_options(self, user):
        """Assert the user can query the thumbnail options' endpoint."""

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.options(
            self._options_url(self.video), HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["upload_max_size_bytes"], 10)

    def test_options_query_by_anonymous_user(self):
        """
        Unauthenticated user cannot query the thumbnail options' endpoint.
        """
        response = self.client.options(self._options_url(self.video))

        self.assertEqual(response.status_code, 401)

    def test_options_query_by_random_user(self):
        """
        Authenticated user without access
        can query the thumbnail options' endpoint.
        """
        user = UserFactory()

        self.assert_user_can_query_options(user)

    def test_api_thumbnail_options_as_instructor(self):
        """
        An LTI authenticated instructor or administrator
        can query the thumbnail options' endpoint.
        """
        video = VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        response = self.client.options(
            self._options_url(video), HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["upload_max_size_bytes"], 10)

    def test_api_thumbnail_options_as_student(self):
        """
        An LTI authenticated student
        can query the thumbnail options' endpoint.
        """
        video = VideoFactory()
        jwt_token = StudentLtiTokenFactory(playlist=video.playlist)

        response = self.client.options(
            self._options_url(video), HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["upload_max_size_bytes"], 10)
