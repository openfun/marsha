"""Tests API for persisting the participants list asking to join a live."""
from unittest import mock

from django.test import TestCase

from marsha.core.api.video import channel_layers_utils
from marsha.core.defaults import DENIED
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


class VideoParticipantsAskingToJoinAPITest(TestCase):
    """Tests API for persisting the participants list asking to join a live."""

    maxDiff = None

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.some_organization = OrganizationFactory()
        cls.some_video = WebinarVideoFactory(
            playlist__organization=cls.some_organization,
        )

    def assert_user_cannot_manage_participants(self, user, video):
        """Assert the user cannot manage participants (POST and DELETE)."""

        jwt_token = UserAccessTokenFactory(user=user)

        # Test POST
        response = self.client.post(
            f"/api/videos/{video.id}/participants-asking-to-join/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            data={
                "id": "1",
                "name": "Student",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)

        # Test DELETE
        response = self.client.delete(
            f"/api/videos/{video.id}/participants-asking-to-join/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            data={
                "id": "1",
                "name": "Student",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)

    def assert_user_can_manage_participants(self, user, video):
        """Assert the user can manage participants (POST and DELETE)."""
        with mock.patch.object(
            channel_layers_utils, "dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            jwt_token = UserAccessTokenFactory(user=user)

            # Test POST
            response = self.client.post(
                f"/api/videos/{video.id}/participants-asking-to-join/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data={
                    "id": "1",
                    "name": "Student",
                },
                content_type="application/json",
            )
            video.refresh_from_db()
            mock_dispatch_video_to_groups.assert_called_once_with(video)

            self.assertEqual(response.status_code, 200)

            content = response.json()

            self.assertListEqual(
                content["participants_asking_to_join"],
                [
                    {
                        "id": "1",
                        "name": "Student",
                    }
                ],
            )

            # Test DELETE
            mock_dispatch_video_to_groups.reset_mock()
            response = self.client.delete(
                f"/api/videos/{video.id}/participants-asking-to-join/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data={
                    "id": "1",
                    "name": "Student",
                },
                content_type="application/json",
            )
            video.refresh_from_db()
            mock_dispatch_video_to_groups.assert_called_once_with(video)

            self.assertEqual(response.status_code, 200)

            content = response.json()
            self.assertListEqual(content["participants_asking_to_join"], [])

    def test_manage_participants_by_random_user(self):
        """Authenticated user without access cannot manage participants."""
        user = UserFactory()

        self.assert_user_cannot_manage_participants(user, self.some_video)

    def test_manage_participants_by_organization_student(self):
        """Organization students cannot manage participants."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=STUDENT,
        )

        self.assert_user_cannot_manage_participants(
            organization_access.user, self.some_video
        )

    def test_manage_participants_by_organization_instructor(self):
        """Organization instructors cannot manage participants."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=INSTRUCTOR,
        )

        self.assert_user_cannot_manage_participants(
            organization_access.user, self.some_video
        )

    def test_manage_participants_by_organization_administrator(self):
        """Organization administrators can manage participants."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=ADMINISTRATOR,
        )

        self.assert_user_can_manage_participants(
            organization_access.user, self.some_video
        )

    def test_manage_participants_by_consumer_site_any_role(self):
        """Consumer site roles cannot manage participants."""
        consumer_site_access = ConsumerSiteAccessFactory(
            consumer_site=self.some_video.playlist.consumer_site,
        )

        self.assert_user_cannot_manage_participants(
            consumer_site_access.user, self.some_video
        )

    def test_manage_participants_by_playlist_student(self):
        """Playlist student cannot manage participants."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=STUDENT,
        )

        self.assert_user_cannot_manage_participants(
            playlist_access.user, self.some_video
        )

    def test_manage_participants_by_playlist_instructor(self):
        """Playlist instructor cannot manage participants."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=INSTRUCTOR,
        )

        self.assert_user_can_manage_participants(playlist_access.user, self.some_video)

    def test_manage_participants_by_playlist_admin(self):
        """Playlist administrator can manage participants."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=ADMINISTRATOR,
        )

        self.assert_user_can_manage_participants(playlist_access.user, self.some_video)

    def test_api_video_participants_post_asking_to_join_anonymous(self):
        """An anonymous user can not set participants."""

        video = VideoFactory()

        response = self.client.post(
            f"/api/videos/{video.id}/participants-asking-to-join/"
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.json(), {"detail": "Authentication credentials were not provided."}
        )

    def test_api_video_participants_post_asking_to_join_student(self):
        """A student user can not set participants."""

        video = VideoFactory()

        jwt_token = StudentLtiTokenFactory(
            playlist=video.playlist,
            context_id=str(video.playlist.lti_id),
            consumer_site=str(video.playlist.consumer_site.id),
        )

        response = self.client.post(
            f"/api/videos/{video.id}/participants-asking-to-join/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.json(),
            {"detail": "You do not have permission to perform this action."},
        )

    def test_api_video_participants_post_asking_to_join_staff_or_user(self):
        """Users authenticated via a session can not set participants."""

        video = VideoFactory()

        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            response = self.client.post(
                f"/api/videos/{video.id}/participants-asking-to-join/"
            )
            self.assertEqual(response.status_code, 401)
            self.assertEqual(
                response.json(),
                {"detail": "Authentication credentials were not provided."},
            )

    def test_api_video_participants_post_asking_to_join_instructor(self):
        """An instructor can set participants."""

        video = VideoFactory(
            participants_asking_to_join=[
                {
                    "id": "1",
                    "name": "Instructor",
                },
                {
                    "id": "2",
                    "name": "Student 1",
                },
            ]
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=video.playlist,
            user__id="56255f3807599c377bf0e5bf072359fd",
        )

        data = {
            "id": "3",
            "name": "Student 2",
        }

        with mock.patch.object(
            channel_layers_utils, "dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups, mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode:
            mock_jwt_encode.return_value = "xmpp_jwt"
            response = self.client.post(
                f"/api/videos/{video.id}/participants-asking-to-join/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data=data,
                content_type="application/json",
            )
            video.refresh_from_db()
            mock_dispatch_video_to_groups.assert_called_once_with(video)

            self.assertEqual(response.status_code, 200)

            content = response.json()
            self.assertEqual(
                content,
                content
                | {
                    "participants_asking_to_join": [
                        {
                            "id": "1",
                            "name": "Instructor",
                        },
                        {
                            "id": "2",
                            "name": "Student 1",
                        },
                        {
                            "id": "3",
                            "name": "Student 2",
                        },
                    ],
                    "participants_in_discussion": [],
                },
            )

    def test_api_video_participants_post_asking_to_join_invalid_participants(self):
        """An invalid request must return a 400 error."""

        video = VideoFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=video.playlist,
            user__id="56255f3807599c377bf0e5bf072359fd",
        )

        data = {
            "id": "1",
        }

        with mock.patch.object(
            channel_layers_utils, "dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups, mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode:
            mock_jwt_encode.return_value = "xmpp_jwt"
            response = self.client.post(
                f"/api/videos/{video.id}/participants-asking-to-join/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data=data,
                content_type="application/json",
            )
            video.refresh_from_db()
            mock_dispatch_video_to_groups.assert_not_called()

            self.assertEqual(response.status_code, 400)

            content = response.json()
            self.assertEqual(
                content,
                {
                    "name": ["This field is required."],
                },
            )

    def test_api_video_participants_post_asking_to_join_invalid_empty(self):
        """An invalid request must return a 400 error."""

        video = VideoFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=video.playlist,
            user__id="56255f3807599c377bf0e5bf072359fd",
        )

        data = {}

        with mock.patch.object(
            channel_layers_utils, "dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups, mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode:
            mock_jwt_encode.return_value = "xmpp_jwt"
            response = self.client.post(
                f"/api/videos/{video.id}/participants-asking-to-join/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data=data,
                content_type="application/json",
            )
            video.refresh_from_db()
            mock_dispatch_video_to_groups.assert_not_called()

            self.assertEqual(response.status_code, 400)

            content = response.json()
            self.assertEqual(
                content,
                {
                    "id": ["This field is required."],
                    "name": ["This field is required."],
                },
            )

    def test_api_video_participants_post_asking_to_join_extra_data(self):
        """Extra data is ignored."""

        video = VideoFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=video.playlist,
            user__id="56255f3807599c377bf0e5bf072359fd",
        )

        data = {
            "id": "1",
            "name": "Instructor",
            "extra_data": {"foo": "bar"},
        }

        with mock.patch.object(
            channel_layers_utils, "dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups, mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode:
            mock_jwt_encode.return_value = "xmpp_jwt"
            response = self.client.post(
                f"/api/videos/{video.id}/participants-asking-to-join/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data=data,
                content_type="application/json",
            )
            video.refresh_from_db()
            mock_dispatch_video_to_groups.assert_called_once_with(video)

            self.assertEqual(response.status_code, 200)

            content = response.json()
            self.assertEqual(
                content,
                content
                | {
                    "participants_asking_to_join": [
                        {
                            "id": "1",
                            "name": "Instructor",
                        },
                    ],
                    "participants_in_discussion": [],
                },
            )

    def test_api_video_participants_post_asking_to_join_no_change(self):
        """No websocket update made if post contains no change."""

        video = VideoFactory(
            participants_asking_to_join=[
                {
                    "id": "1",
                    "name": "Instructor",
                },
                {
                    "id": "2",
                    "name": "Student 1",
                },
            ]
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=video.playlist,
            user__id="56255f3807599c377bf0e5bf072359fd",
        )

        data = {
            "id": "2",
            "name": "Student 1",
        }

        with mock.patch.object(
            channel_layers_utils, "dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups, mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode:
            mock_jwt_encode.return_value = "xmpp_jwt"
            response = self.client.post(
                f"/api/videos/{video.id}/participants-asking-to-join/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data=data,
                content_type="application/json",
            )
            video.refresh_from_db()
            mock_dispatch_video_to_groups.assert_not_called()

            self.assertEqual(response.status_code, 400)

            content = response.json()
            self.assertEqual(
                content,
                {"detail": "Participant already asked to join."},
            )

    def test_api_video_participants_post_asking_to_join_join_mode_denied(self):
        """In join mode denied, request must return a 400 error."""

        video = VideoFactory(join_mode=DENIED)

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=video.playlist,
            user__id="56255f3807599c377bf0e5bf072359fd",
        )

        data = {
            "id": "1",
            "name": "Instructor",
        }

        with mock.patch.object(
            channel_layers_utils, "dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups, mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode:
            mock_jwt_encode.return_value = "xmpp_jwt"
            response = self.client.post(
                f"/api/videos/{video.id}/participants-asking-to-join/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data=data,
                content_type="application/json",
            )
            video.refresh_from_db()
            mock_dispatch_video_to_groups.assert_not_called()

            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.json(), {"detail": "No join allowed."})

    def test_api_video_participants_delete_asking_to_join_anonymous(self):
        """An anonymous user can not set participants."""

        video = VideoFactory()

        response = self.client.delete(
            f"/api/videos/{video.id}/participants-asking-to-join/"
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.json(), {"detail": "Authentication credentials were not provided."}
        )

    def test_api_video_participants_delete_asking_to_join_student(self):
        """A student user can not set participants."""

        video = VideoFactory()

        jwt_token = StudentLtiTokenFactory(
            playlist=video.playlist,
            context_id=str(video.playlist.lti_id),
            consumer_site=str(video.playlist.consumer_site.id),
        )

        response = self.client.delete(
            f"/api/videos/{video.id}/participants-asking-to-join/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.json(),
            {"detail": "You do not have permission to perform this action."},
        )

    def test_api_video_participants_delete_asking_to_join_staff_or_user(self):
        """Users authenticated via a session can not set participants."""

        video = VideoFactory()

        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            response = self.client.delete(
                f"/api/videos/{video.id}/participants-asking-to-join/"
            )
            self.assertEqual(response.status_code, 401)
            self.assertEqual(
                response.json(),
                {"detail": "Authentication credentials were not provided."},
            )

    def test_api_video_participants_delete_asking_to_join_instructor(self):
        """An instructor can set participants."""

        video = VideoFactory(
            participants_asking_to_join=[
                {
                    "id": "1",
                    "name": "Instructor",
                },
                {
                    "id": "2",
                    "name": "Student 1",
                },
            ]
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=video.playlist,
            user__id="56255f3807599c377bf0e5bf072359fd",
        )

        data = {
            "id": "2",
            "name": "Student 1",
        }

        with mock.patch.object(
            channel_layers_utils, "dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups, mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode:
            mock_jwt_encode.return_value = "xmpp_jwt"
            response = self.client.delete(
                f"/api/videos/{video.id}/participants-asking-to-join/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data=data,
                content_type="application/json",
            )
            video.refresh_from_db()
            mock_dispatch_video_to_groups.assert_called_once_with(video)

            self.assertEqual(response.status_code, 200)

            content = response.json()
            self.assertEqual(
                content,
                content
                | {
                    "participants_asking_to_join": [
                        {
                            "id": "1",
                            "name": "Instructor",
                        },
                    ],
                    "participants_in_discussion": [],
                },
            )

    def test_api_video_participants_delete_asking_to_join_invalid_participants(self):
        """An invalid request must return a 400 error."""

        video = VideoFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=video.playlist,
            user__id="56255f3807599c377bf0e5bf072359fd",
        )

        data = {
            "id": "1",
        }

        with mock.patch.object(
            channel_layers_utils, "dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups, mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode:
            mock_jwt_encode.return_value = "xmpp_jwt"
            response = self.client.delete(
                f"/api/videos/{video.id}/participants-asking-to-join/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data=data,
                content_type="application/json",
            )
            video.refresh_from_db()
            mock_dispatch_video_to_groups.assert_not_called()

            self.assertEqual(response.status_code, 400)

            content = response.json()
            self.assertEqual(
                content,
                {
                    "name": ["This field is required."],
                },
            )

    def test_api_video_participants_delete_asking_to_join_invalid_empty(self):
        """An invalid request must return a 400 error."""

        video = VideoFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=video.playlist,
            user__id="56255f3807599c377bf0e5bf072359fd",
        )

        data = {}

        with mock.patch.object(
            channel_layers_utils, "dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups, mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode:
            mock_jwt_encode.return_value = "xmpp_jwt"
            response = self.client.delete(
                f"/api/videos/{video.id}/participants-asking-to-join/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data=data,
                content_type="application/json",
            )
            video.refresh_from_db()
            mock_dispatch_video_to_groups.assert_not_called()

            self.assertEqual(response.status_code, 400)

            content = response.json()
            self.assertEqual(
                content,
                {
                    "id": ["This field is required."],
                    "name": ["This field is required."],
                },
            )

    def test_api_video_participants_delete_asking_to_join_extra_data(self):
        """Extra data is ignored."""

        video = VideoFactory(
            participants_asking_to_join=[
                {
                    "id": "1",
                    "name": "Instructor",
                },
            ]
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=video.playlist,
            user__id="56255f3807599c377bf0e5bf072359fd",
        )

        data = {
            "id": "1",
            "name": "Instructor",
            "extra_data": {"foo": "bar"},
        }

        with mock.patch.object(
            channel_layers_utils, "dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups, mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode:
            mock_jwt_encode.return_value = "xmpp_jwt"
            response = self.client.delete(
                f"/api/videos/{video.id}/participants-asking-to-join/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data=data,
                content_type="application/json",
            )
            video.refresh_from_db()
            mock_dispatch_video_to_groups.assert_called_once_with(video)

            self.assertEqual(response.status_code, 200)

            content = response.json()
            self.assertEqual(
                content,
                content
                | {
                    "participants_asking_to_join": [],
                    "participants_in_discussion": [],
                },
            )

    def test_api_video_participants_delete_asking_to_join_no_change(self):
        """No websocket update made if delete contains no change."""

        video = VideoFactory(
            participants_asking_to_join=[
                {
                    "id": "1",
                    "name": "Instructor",
                },
                {
                    "id": "2",
                    "name": "Student 1",
                },
            ]
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=video.playlist,
            user__id="56255f3807599c377bf0e5bf072359fd",
        )

        data = {
            "id": "3",
            "name": "Student 3",
        }

        with mock.patch.object(
            channel_layers_utils, "dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups, mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode:
            mock_jwt_encode.return_value = "xmpp_jwt"
            response = self.client.delete(
                f"/api/videos/{video.id}/participants-asking-to-join/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data=data,
                content_type="application/json",
            )
            video.refresh_from_db()
            mock_dispatch_video_to_groups.assert_not_called()

            self.assertEqual(response.status_code, 400)

            content = response.json()
            self.assertEqual(
                content,
                {"detail": "Participant did not asked to join."},
            )
