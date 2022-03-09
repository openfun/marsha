"""Tests API for persisting the participants list asking to join a live."""
import random
from unittest import mock

from django.test import TestCase

from rest_framework_simplejwt.tokens import AccessToken

from ..api.video import channel_layers_utils
from ..factories import UserFactory, VideoFactory


class VideoParticipantsAskingToJoinAPITest(TestCase):
    """Tests API for persisting the participants list asking to join a live."""

    maxDiff = None

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["permissions"] = {"can_update": False}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        jwt_token.payload["user"] = {"id": "56255f3807599c377bf0e5bf072359fd"}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        jwt_token.payload["user"] = {"id": "56255f3807599c377bf0e5bf072359fd"}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        jwt_token.payload["user"] = {"id": "56255f3807599c377bf0e5bf072359fd"}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        jwt_token.payload["user"] = {"id": "56255f3807599c377bf0e5bf072359fd"}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        jwt_token.payload["user"] = {"id": "56255f3807599c377bf0e5bf072359fd"}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["permissions"] = {"can_update": False}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        jwt_token.payload["user"] = {"id": "56255f3807599c377bf0e5bf072359fd"}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        jwt_token.payload["user"] = {"id": "56255f3807599c377bf0e5bf072359fd"}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        jwt_token.payload["user"] = {"id": "56255f3807599c377bf0e5bf072359fd"}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        jwt_token.payload["user"] = {"id": "56255f3807599c377bf0e5bf072359fd"}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        jwt_token.payload["user"] = {"id": "56255f3807599c377bf0e5bf072359fd"}

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
