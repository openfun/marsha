"""Test for live_session api when a user leave a discussion."""
import random
from unittest import mock
import uuid

from django.test import TestCase

from rest_framework_simplejwt.tokens import AccessToken

from ..factories import LiveSessionFactory, VideoFactory
from ..models.account import NONE

class LiveSessionLaveDiscussion(TestCase):
    """Test for live_session api when a user leave a discussion."""

    def test_leave_discussion_anonymous(self):
        """Anonymous users should not be allowed to leave a discussion."""
        live_session = LiveSessionFactory(
            anonymous_id=uuid.uuid4(), email="chantal@test-fun-mooc.fr"
        )

        response = self.client.delete(f"/api/livesessions/{live_session.id}/leave_discussion/")

        self.assertEqual(response.status_code, 401)

    def test_leave_discussion_public_token_and_no_anonymous_id(self):
        """User with a public token and no anonymous_id in the query string is not able
        to leave a discussion."""
        anonymous_id = uuid.uuid4()
        live_session = LiveSessionFactory(
            anonymous_id=anonymous_id, email="chantal@test-fun-mooc.fr"
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(live_session.video.id)
        jwt_token.payload["roles"] = [NONE]

        response = self.client.delete(
            f"/api/livesessions/{live_session.id}/leave_discussion/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 404)

    def test_leave_discussion_public_token_and_anonymous_id(self):
        """User with a public token and an anonymous_id in the query string is able
        to leave a discussion."""
        anonymous_id = uuid.uuid4()
        live_session_id = uuid.uuid4()
        video = VideoFactory(
            participants_in_discussion=[{
                "id": live_session_id,
                "name": "chantal",
            }]
        )
        live_session = LiveSessionFactory(
            id=live_session_id,
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
            response = self.client.delete(
                f"/api/livesessions/{live_session.id}/leave_discussion/?anonymous_id={anonymous_id}",
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
