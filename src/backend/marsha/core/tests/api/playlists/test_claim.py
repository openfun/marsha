"""Tests for the Playlist claim API of the Marsha project."""

from django.test import TestCase

from marsha.core import factories
from marsha.core.models import ADMINISTRATOR, INSTRUCTOR, PlaylistAccess
from marsha.core.simple_jwt.factories import UserAccessTokenFactory


class PlaylistClaimAPITest(TestCase):
    """Test the claim API for playlist objects."""

    maxDiff = None

    def test_claim_playlist_by_anonymous_user(self):
        """Anonymous users cannot claim playlists."""
        playlist = factories.PlaylistFactory()
        response = self.client.post(
            f"/api/playlists/{playlist.id}/claim/",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 401)
        playlist.refresh_from_db()
        self.assertFalse(PlaylistAccess.objects.filter(playlist=playlist).exists())

    def test_claim_playlist_by_random_logged_in_user(self):
        """Random logged-in users cannot claim playlists unrelated to them."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            f"/api/playlists/{playlist.id}/claim/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        playlist.refresh_from_db()
        self.assertFalse(PlaylistAccess.objects.filter(playlist=playlist).exists())

    def test_claim_playlist_by_orga_administrator(self):
        """Organization administrators can claim playlists."""
        organization_access = factories.OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = factories.PlaylistFactory(
            organization=organization_access.organization,
        )

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.post(
            f"/api/playlists/{playlist.id}/claim/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        playlist.refresh_from_db()
        self.assertTrue(PlaylistAccess.objects.filter(playlist=playlist).exists())

    def test_claim_playlist_by_orga_instructor_no_other_access(self):
        """Organization instructors can claim playlists.
        If no other access exists, the instructor is granted administrator access."""
        organization_access = factories.OrganizationAccessFactory(role=INSTRUCTOR)
        playlist = factories.PlaylistFactory(
            organization=organization_access.organization,
        )

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.post(
            f"/api/playlists/{playlist.id}/claim/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        playlist.refresh_from_db()
        self.assertTrue(PlaylistAccess.objects.filter(playlist=playlist).exists())
        self.assertEqual(
            PlaylistAccess.objects.get(
                playlist=playlist, user=organization_access.user
            ).role,
            ADMINISTRATOR,
        )

    def test_claim_playlist_by_orga_instructor_with_other_access(self):
        """Organization instructors can claim playlists.
        If other access exists, the instructor is granted instructor access."""
        organization_access = factories.OrganizationAccessFactory(role=INSTRUCTOR)
        playlist = factories.PlaylistFactory(
            organization=organization_access.organization,
        )
        factories.PlaylistAccessFactory(
            playlist=playlist,
            role=ADMINISTRATOR,
        )

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.post(
            f"/api/playlists/{playlist.id}/claim/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        playlist.refresh_from_db()
        self.assertTrue(PlaylistAccess.objects.filter(playlist=playlist).exists())
        self.assertEqual(
            PlaylistAccess.objects.get(
                playlist=playlist, user=organization_access.user
            ).role,
            INSTRUCTOR,
        )
