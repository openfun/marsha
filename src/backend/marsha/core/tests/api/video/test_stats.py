"""Tests for the Video stats API of the Marsha project."""
from unittest import mock

from django.test import TestCase, override_settings

from marsha.core.factories import (
    ConsumerSiteAccessFactory,
    OrganizationAccessFactory,
    OrganizationFactory,
    PlaylistAccessFactory,
    UserFactory,
    VideoFactory,
    WebinarVideoFactory,
)
from marsha.core.models import ADMINISTRATOR, INSTRUCTOR, STUDENT
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)


class TestApiVideoStats(TestCase):
    """Tests for the Video stats API of the Marsha project."""

    maxDiff = None

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.some_organization = OrganizationFactory()
        cls.some_video = WebinarVideoFactory(
            playlist__organization=cls.some_organization,
        )

    def assert_user_cannot_get_stats(self, user, video):
        """Assert the user cannot get the stats."""

        jwt_token = UserAccessTokenFactory(user=user)
        response = self.client.get(
            f"/api/videos/{video.pk}/stats/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    @override_settings(
        STAT_BACKEND="marsha.core.stats.dummy_backend",
        STAT_BACKEND_SETTINGS={
            "any": "data",
            "another": "data",
            "nested": {"any": "data"},
        },
    )
    def assert_user_can_get_stats(self, user, video):
        """Assert the user can get the stats."""
        received_stats = {
            "data": "any",
            "with_number": 123,
        }

        with mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode, mock.patch(
            "marsha.core.stats.dummy_backend"
        ) as mock_stats_backend:
            mock_jwt_encode.return_value = "xmpp_jwt"
            mock_stats_backend.return_value = received_stats

            jwt_token = UserAccessTokenFactory(user=user)
            response = self.client.get(
                f"/api/videos/{video.id}/stats/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

            mock_stats_backend.assert_called_once_with(
                video, any="data", another="data", nested={"any": "data"}
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), received_stats)

    def test_stats_by_anonymous_user(self):
        """Anonymous users cannot get stats."""
        response = self.client.get(f"/api/videos/{self.some_video.pk}/stats/")

        self.assertEqual(response.status_code, 401)

    def test_stats_by_random_user(self):
        """Authenticated user without access cannot get stats."""
        user = UserFactory()

        self.assert_user_cannot_get_stats(user, self.some_video)

    def test_stats_by_organization_student(self):
        """Organization students cannot get stats."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=STUDENT,
        )

        self.assert_user_cannot_get_stats(organization_access.user, self.some_video)

    def test_stats_by_organization_instructor(self):
        """Organization instructors cannot get stats."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=INSTRUCTOR,
        )

        self.assert_user_cannot_get_stats(organization_access.user, self.some_video)

    def test_stats_by_organization_administrator(self):
        """Organization administrators can get stats."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=ADMINISTRATOR,
        )

        self.assert_user_can_get_stats(organization_access.user, self.some_video)

    def test_stats_by_consumer_site_any_role(self):
        """Consumer site roles cannot get stats."""
        consumer_site_access = ConsumerSiteAccessFactory(
            consumer_site=self.some_video.playlist.consumer_site,
        )

        self.assert_user_cannot_get_stats(consumer_site_access.user, self.some_video)

    def test_stats_by_playlist_student(self):
        """Playlist student cannot get stats."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=STUDENT,
        )

        self.assert_user_cannot_get_stats(playlist_access.user, self.some_video)

    def test_stats_by_playlist_instructor(self):
        """Playlist instructor cannot get stats."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=INSTRUCTOR,
        )

        self.assert_user_can_get_stats(playlist_access.user, self.some_video)

    def test_stats_by_playlist_admin(self):
        """Playlist administrator can get stats."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=ADMINISTRATOR,
        )

        self.assert_user_can_get_stats(playlist_access.user, self.some_video)

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
            resource=video.playlist,
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
