"""Tests for the LiveSession serializers of the Marsha project."""

from uuid import UUID

from django.test import TestCase

from marsha.core.factories import LiveSessionFactory, UserFactory
from marsha.core.serializers import (
    LiveSessionDisplayUsernameSerializer,
    LiveSessionSerializer,
)


class LiveSessionDisplayUsernameSerializerTestCase(TestCase):
    """Test the serializer that receives upload & processing state updates."""

    def test_live_session_with_user(self):
        """The serializer should return the user's username."""
        user = UserFactory(username="john")
        live_session = LiveSessionFactory(email=None, user=user)
        serializer = LiveSessionDisplayUsernameSerializer(live_session)
        self.assertEqual(
            serializer.data,
            {
                "username": "john",
                "anonymous_id": None,
                "display_name": None,
            },
        )

    def test_live_session_with_username(self):
        """The serializer should return the username."""
        live_session = LiveSessionFactory(is_from_lti_connection=True, username="john")
        serializer = LiveSessionDisplayUsernameSerializer(live_session)
        self.assertEqual(
            serializer.data,
            {
                "username": "john",
                "anonymous_id": None,
                "display_name": None,
            },
        )


class LiveSessionSerializerTestCase(TestCase):
    """Test the serializer that receives upload & processing state updates."""

    maxDiff = None

    def test_live_session_with_user(self):
        """The serializer should return the user's username."""
        user = UserFactory(username="john")
        live_session = LiveSessionFactory(
            pk="981f4dc2-be80-11ed-b18f-6761bd7b701c",
            email=None,
            user=user,
            video__pk="710caf9a-be80-11ed-9a5f-9b65f3cd60c4",
        )
        serializer = LiveSessionSerializer(live_session)
        self.assertEqual(
            serializer.data,
            {
                "anonymous_id": None,
                "consumer_site": None,
                "display_name": None,
                "email": None,
                "id": "981f4dc2-be80-11ed-b18f-6761bd7b701c",
                "is_registered": False,
                "language": "en",
                "live_attendance": None,
                "lti_user_id": None,
                "lti_id": None,
                "should_send_reminders": True,
                "username": "john",
                "video": "710caf9a-be80-11ed-9a5f-9b65f3cd60c4",
            },
        )

    def test_live_session_with_username(self):
        """The serializer should return the username."""
        live_session = LiveSessionFactory(
            pk="981f4dc2-be80-11ed-b18f-6761bd7b701c",
            is_from_lti_connection=True,
            email="some-email@example.com",
            lti_user_id="lti-user-id",
            lti_id="lti-id",
            username="john",
            video__pk="710caf9a-be80-11ed-9a5f-9b65f3cd60c4",
            video__playlist__consumer_site__pk="fc3b4a90-be80-11ed-9c9c-1be9949d011a",
        )
        serializer = LiveSessionSerializer(live_session)
        self.assertEqual(
            serializer.data,
            {
                "anonymous_id": None,
                "consumer_site": UUID("fc3b4a90-be80-11ed-9c9c-1be9949d011a"),
                "display_name": None,
                "email": "some-email@example.com",
                "id": "981f4dc2-be80-11ed-b18f-6761bd7b701c",
                "is_registered": False,
                "language": "en",
                "live_attendance": None,
                "lti_user_id": "lti-user-id",
                "lti_id": "lti-id",
                "should_send_reminders": True,
                "username": "john",
                "video": "710caf9a-be80-11ed-9a5f-9b65f3cd60c4",
            },
        )
