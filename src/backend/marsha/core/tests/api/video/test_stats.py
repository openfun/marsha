"""Tests for the Video stats API of the Marsha project."""
from unittest import mock

from django.test import TestCase, override_settings

from marsha.core.factories import UserFactory, VideoFactory
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
)


class TestApiVideoStats(TestCase):
    """Tests for the Video stats API of the Marsha project."""

    maxDiff = None

    def test_api_video_stats_anonymous(self):
        """An anonymous user can not get video stats."""

        video = VideoFactory()

        response = self.client.get(f"/api/videos/{video.id}/stats/")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.json(), {"detail": "Authentication credentials were not provided."}
        )

    def test_api_video_stats_student(self):
        """A student user can not get video stats."""

        video = VideoFactory()

        jwt_token = StudentLtiTokenFactory(
            resource=video,
            context_id=str(video.playlist.lti_id),
            consumer_site=str(video.playlist.consumer_site.id),
        )

        response = self.client.get(
            f"/api/videos/{video.id}/stats/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.json(),
            {"detail": "You do not have permission to perform this action."},
        )

    def test_api_video_stats_staff_or_user(self):
        """Users authenticated via a session can not get video stats."""
        video = VideoFactory()
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            response = self.client.get(f"/api/videos/{video.id}/stats/")
            self.assertEqual(response.status_code, 401)
            self.assertEqual(
                response.json(),
                {"detail": "Authentication credentials were not provided."},
            )

    @override_settings(
        STAT_BACKEND="marsha.core.stats.dummy_backend",
        STAT_BACKEND_SETTINGS={
            "any": "data",
            "another": "data",
            "nested": {"any": "data"},
        },
    )
    def test_api_video_stats_instructor(self):
        """An instructor can get video stats."""
        received_stats = {
            "data": "any",
            "with_number": 123,
        }
        video = VideoFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
        )

        with mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode, mock.patch(
            "marsha.core.stats.dummy_backend"
        ) as mock_stats_backend:
            mock_jwt_encode.return_value = "xmpp_jwt"
            mock_stats_backend.return_value = received_stats
            response = self.client.get(
                f"/api/videos/{video.id}/stats/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

            mock_stats_backend.assert_called_once_with(
                video, any="data", another="data", nested={"any": "data"}
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), received_stats)
