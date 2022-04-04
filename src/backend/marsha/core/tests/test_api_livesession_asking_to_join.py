"""Test for live_session api when a user ask to join a discussion."""
import random
from unittest import mock
import uuid

from django.test import TestCase

from rest_framework_simplejwt.tokens import AccessToken

from ..factories import LiveSessionFactory, VideoFactory
from ..models.account import NONE


class LiveSessionAskingToJoin(TestCase):
    """Test for live_session api when a user ask to join a discussion."""

    def test_asking_to_join_anonymous(self):
        """Anonymous users should not be allowed to ask to join."""
        live_session = LiveSessionFactory(
            anonymous_id=uuid.uuid4(), email="chantal@test-fun-mooc.fr"
        )

        response = self.client.post(f"/api/livesessions/{live_session.id}/ask_to_join/")

        self.assertEqual(response.status_code, 401)

    def test_asking_to_join_public_token_no_display_name(self):
        """User with a public token but display_name set is not able to ask to join."""
        anonymous_id = uuid.uuid4()
        live_session = LiveSessionFactory(
            anonymous_id=anonymous_id, email="chantal@test-fun-mooc.fr"
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(live_session.video.id)
        jwt_token.payload["roles"] = [NONE]

        response = self.client.post(
            f"/api/livesessions/{live_session.id}/ask_to_join/?anonymous_id={anonymous_id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "display_name": "display_name must be set before asking to join the discussion"
            },
        )

    def test_asking_to_join_public_token_and_no_anonymous_id(self):
        """User with a public token and no anonymous_id in the query string is not able
        to ask to join."""
        anonymous_id = uuid.uuid4()
        live_session = LiveSessionFactory(
            anonymous_id=anonymous_id, email="chantal@test-fun-mooc.fr"
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(live_session.video.id)
        jwt_token.payload["roles"] = [NONE]

        response = self.client.post(
            f"/api/livesessions/{live_session.id}/ask_to_join/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 404)

    def test_asking_to_join_public_token_and_anonymous_id(self):
        """User with a public token and an anonymous_id in the query string is able
        to ask to join."""
        anonymous_id = uuid.uuid4()
        video = VideoFactory()
        live_session = LiveSessionFactory(
            anonymous_id=anonymous_id,
            display_name="chantal",
            email="chantal@test-fun-mooc.fr",
            video=video,
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(live_session.video.id)
        jwt_token.payload["roles"] = [NONE]

        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.post(
                f"/api/livesessions/{live_session.id}/ask_to_join/?anonymous_id={anonymous_id}",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)

        video.refresh_from_db()
        self.assertIn(
            {"id": str(live_session.id), "name": live_session.display_name},
            video.participants_asking_to_join,
        )
        mock_dispatch_video_to_groups.assert_called_once_with(video)

    def test_asking_to_join_lti_token(self):
        """User with a lti token and an existing live session can ask to join."""
        video = VideoFactory()
        # livesession has consumer_site
        live_session = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            display_name="Sarah",
            email="sarah@openfun.fr",
            is_registered=False,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            username="John",
            video=video,
        )
        # token from LTI has context_id, consumer_site and user.id
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = [random.choice(["student", ""])]
        jwt_token.payload["user"] = {
            "email": "sarah@openfun.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "John",
        }

        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.post(
                f"/api/livesessions/{live_session.id}/ask_to_join/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)

        video.refresh_from_db()
        self.assertIn(
            {"id": str(live_session.id), "name": live_session.display_name},
            video.participants_asking_to_join,
        )
        mock_dispatch_video_to_groups.assert_called_once_with(video)

    def test_asking_to_join_lti_token_missing_display_name(self):
        """User with LTI Token but missing display_name can't ask to join."""
        video = VideoFactory()
        # livesession has consumer_site
        live_session = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="sarah@openfun.fr",
            is_registered=False,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            username="John",
            video=video,
        )
        # token from LTI has context_id, consumer_site and user.id
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = [random.choice(["student", ""])]
        jwt_token.payload["user"] = {
            "email": "sarah@openfun.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "John",
        }

        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.post(
                f"/api/livesessions/{live_session.id}/ask_to_join/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "display_name": "display_name must be set before asking to join the discussion"
            },
        )

        video.refresh_from_db()
        mock_dispatch_video_to_groups.assert_not_called()
        self.assertEqual(video.participants_asking_to_join, [])

    def test_asking_to_join_lti_token_already_asking(self):
        """A user already asking to join can't ask twice."""
        live_session_id = uuid.uuid4()
        video = VideoFactory(
            participants_asking_to_join=[
                {
                    "id": str(live_session_id),
                    "name": "Sarah",
                }
            ]
        )
        # livesession has consumer_site
        live_session = LiveSessionFactory(
            id=live_session_id,
            consumer_site=video.playlist.consumer_site,
            display_name="Sarah",
            email="sarah@openfun.fr",
            is_registered=False,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            username="John",
            video=video,
        )
        # token from LTI has context_id, consumer_site and user.id
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = [random.choice(["student", ""])]
        jwt_token.payload["user"] = {
            "email": "sarah@openfun.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "John",
        }

        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.post(
                f"/api/livesessions/{live_session.id}/ask_to_join/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"detail": "Participant already asked to join."}
        )

        video.refresh_from_db()
        self.assertEqual(
            video.participants_asking_to_join,
            [{"id": str(live_session.id), "name": live_session.display_name}],
        )
        mock_dispatch_video_to_groups.assert_not_called()

    def test_asking_to_join_lti_token_already_in_discussion(self):
        """A user already in the discussion can't ask to join."""
        live_session_id = uuid.uuid4()
        video = VideoFactory(
            participants_in_discussion=[
                {
                    "id": str(live_session_id),
                    "name": "Sarah",
                }
            ]
        )
        # livesession has consumer_site
        live_session = LiveSessionFactory(
            id=live_session_id,
            consumer_site=video.playlist.consumer_site,
            display_name="Sarah",
            email="sarah@openfun.fr",
            is_registered=False,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            username="John",
            video=video,
        )
        # token from LTI has context_id, consumer_site and user.id
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = [random.choice(["student", ""])]
        jwt_token.payload["user"] = {
            "email": "sarah@openfun.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "John",
        }

        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.post(
                f"/api/livesessions/{live_session.id}/ask_to_join/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "Participant already joined."})

        video.refresh_from_db()
        self.assertEqual(
            video.participants_in_discussion,
            [{"id": str(live_session.id), "name": live_session.display_name}],
        )
        self.assertEqual(
            video.participants_asking_to_join,
            [],
        )
        mock_dispatch_video_to_groups.assert_not_called()
