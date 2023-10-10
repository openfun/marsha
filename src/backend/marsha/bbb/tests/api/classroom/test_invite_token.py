"""Tests for the classroom invite token API."""
import secrets

from django.test import TestCase, override_settings

from marsha.bbb.factories import ClassroomFactory
from marsha.core.models import INSTRUCTOR, NONE
from marsha.core.simple_jwt.tokens import PlaylistAccessToken
from marsha.core.tests.testing_utils import reload_urlconf


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
@override_settings(BBB_ENABLED=True)
class ClassroomInviteTokenAPITest(TestCase):
    """Test classroom token endpoint."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

    def test_missing_token(self):
        """Missing invite token in the query string should return a 400."""

        classroom = ClassroomFactory()

        response = self.client.get(f"/api/classrooms/{classroom.id}/token/")

        self.assertEqual(response.status_code, 400)
        content = response.json()
        self.assertEqual(
            content, {"message": "missing required invite_token in query string"}
        )

    def test_invite_public_token(self):
        """Using a public token should return a resource token with no permission."""

        classroom = ClassroomFactory()

        response = self.client.get(
            f"/api/classrooms/{classroom.id}/token/?invite_token={classroom.public_token}"
        )
        self.assertEqual(response.status_code, 200)
        public_token = response.json().get("access_token")

        decoded_public_token = PlaylistAccessToken(public_token)
        self.assertEqual(
            decoded_public_token.payload["playlist_id"], str(classroom.playlist_id)
        )
        self.assertEqual(decoded_public_token.payload["roles"], [NONE])
        self.assertEqual(
            decoded_public_token.payload["permissions"],
            {"can_update": False, "can_access_dashboard": False},
        )

    def test_invite_instructor_token(self):
        """Using an instructor token should return a resource token with permissions."""

        classroom = ClassroomFactory()

        response = self.client.get(
            f"/api/classrooms/{classroom.id}/token/?invite_token={classroom.instructor_token}"
        )
        self.assertEqual(response.status_code, 200)
        instructor_token = response.json().get("access_token")

        decoded_instructor_token = PlaylistAccessToken(instructor_token)
        self.assertEqual(
            decoded_instructor_token.payload["playlist_id"], str(classroom.playlist_id)
        )
        self.assertEqual(decoded_instructor_token.payload["roles"], [INSTRUCTOR])
        self.assertEqual(
            decoded_instructor_token.payload["permissions"],
            {"can_update": True, "can_access_dashboard": True},
        )

    def test_invite_invalid_token(self):
        """Using an invalid token should return a 404."""

        classroom = ClassroomFactory()

        response = self.client.get(
            f"/api/classrooms/{classroom.id}/token/?invite_token={secrets.token_urlsafe()}"
        )
        self.assertEqual(response.status_code, 404)

    @override_settings(
        BBB_INVITE_TOKEN_BANNED_LIST=["rejected_token", "another_rejected"]
    )
    def test_invite_blacklist_token(self):
        """Using an invite token present in the blacklist settings should be forbidden"""
        classroom = ClassroomFactory(instructor_token="rejected_token")

        response = self.client.get(
            f"/api/classrooms/{classroom.id}/token/?invite_token=rejected_token"
        )
        self.assertEqual(response.status_code, 400)
        content = response.json()
        self.assertEqual(
            content,
            {
                "message": (
                    "invitation link is not valid anymore. Ask for a new "
                    "invitation link to the classroom maintainer"
                )
            },
        )
