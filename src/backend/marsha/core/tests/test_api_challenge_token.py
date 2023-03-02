"""Tests for the challenge token API."""

from django.test import TestCase

from marsha.core.simple_jwt.factories import ChallengeTokenFactory
from marsha.core.simple_jwt.tokens import ChallengeToken, UserAccessToken, UserRefreshToken


class ChallengeAuthenticationViewTestCase(TestCase):
    """Test the API for challenge token conversion."""

    def test_access_by_anonymous_user(self):
        """Test case of badly authenticated users."""
        response = self.client.get("/api/auth/challenge/")
        self.assertEqual(response.status_code, 405)  # Method not provided

        response = self.client.post("/api/auth/challenge/")
        self.assertEqual(response.status_code, 400)  # Bad request, token mandatory

        response = self.client.post(
            "/api/auth/challenge/", data={"token": str(ChallengeToken())}
        )
        self.assertEqual(response.status_code, 401)

    def test_challenge_accepted_by_logged_in_user(self):
        """Test proper user access token retrieval."""
        challenge = ChallengeTokenFactory()

        response = self.client.post(
            "/api/auth/challenge/", data={"token": str(challenge)}
        )
        self.assertEqual(response.status_code, 200)

        response_data = response.json()
        # Verify tokens
        user_token = UserAccessToken(response_data["access"])
        UserRefreshToken(response_data["refresh"])

        self.assertEqual(user_token.payload["user_id"], challenge.payload["user_id"])
