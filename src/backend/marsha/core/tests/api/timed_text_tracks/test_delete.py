"""Tests for the TimedTextTrack delete API of the Marsha project."""
import json

from django.test import TestCase

from marsha.core import factories, models
from marsha.core.factories import TimedTextTrackFactory, UserFactory
from marsha.core.models import TimedTextTrack
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    UserAccessTokenFactory,
)


class TimedTextTrackDeleteAPITest(TestCase):
    """Test the delete API of the timed text track object."""

    maxDiff = None

    def _delete_url(self, video, track):
        """Return the url to delete a timed text track."""
        return f"/api/videos/{video.pk}/timedtexttracks/{track.id}/"

    def test_api_timed_text_track_patch_by_video_organization_admin(self):
        """
        Organization administrator token user patches a timed text track.

        A user with a user token, who is an organization administrator, can patch
        a timed text track for a video that belongs to that organization.
        """
        user = factories.UserFactory()
        # An organization where the user is an administrator, with a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.ADMINISTRATOR
        )
        track = factories.TimedTextTrackFactory(language="fr", video=video)

        jwt_token = UserAccessTokenFactory(user=user)

        data = {"language": "en", "size": 10}

        response = self.client.patch(
            self._delete_url(video, track),
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        track.refresh_from_db()
        self.assertEqual(track.language, "en")

    def test_api_timed_text_track_delete_detail_anonymous(self):
        """Anonymous users should not be allowed to delete a timed text track."""
        timed_text_track = TimedTextTrackFactory()

        response = self.client.delete(
            self._delete_url(timed_text_track.video, timed_text_track)
        )

        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )
        self.assertTrue(TimedTextTrack.objects.filter(id=timed_text_track.id).exists())

    def test_api_timed_text_track_delete_detail_token_user(self):
        """A token user linked to a video should be allowed to delete its timed text tracks."""
        timed_text_tracks = TimedTextTrackFactory.create_batch(2)

        # Delete the timed text tracks using the JWT token
        for timed_text_track in timed_text_tracks:
            jwt_token = InstructorOrAdminLtiTokenFactory(
                resource=timed_text_track.video
            )
            response = self.client.delete(
                self._delete_url(timed_text_track.video, timed_text_track),
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            self.assertEqual(response.status_code, 204)
            self.assertFalse(
                TimedTextTrack.objects.filter(id=timed_text_track.id).exists()
            )

    def test_api_timed_text_track_delete_detail_staff_or_user(self):
        """Users authenticated via a session should not be able to delete a timed text track."""
        timed_text_track = TimedTextTrackFactory()
        for user in [
            UserFactory(),
            UserFactory(is_staff=True),
            UserFactory(is_superuser=True),
        ]:
            self.client.login(username=user.username, password="test")

            response = self.client.delete(
                self._delete_url(timed_text_track.video, timed_text_track),
            )

            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )
        self.assertTrue(TimedTextTrack.objects.filter(id=timed_text_track.id).exists())

    def test_api_timed_text_track_delete_instructor_in_read_only(self):
        """Instructor should not be able to delete a timed text track in read_only mode."""
        timed_text_track = TimedTextTrackFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=timed_text_track.video,
            permissions__can_update=False,
        )

        response = self.client.delete(
            self._delete_url(timed_text_track.video, timed_text_track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_timed_text_track_delete_by_user_with_no_access(self):
        """
        Token user without any access deletes a single timed text track.

        A user with a user token, without any specific access, cannot delete
        a single timed text track.
        """
        video = factories.VideoFactory()

        track = TimedTextTrackFactory(video=video)
        self.assertEqual(TimedTextTrack.objects.count(), 1)

        jwt_token = UserAccessTokenFactory()

        response = self.client.delete(
            self._delete_url(video, track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(TimedTextTrack.objects.count(), 1)

    def test_api_timed_text_track_delete_by_video_playlist_instructor(self):
        """
        Playlist instructor token user deletes a timed text track for a video.

        A user with a user token, who is a playlist instructor, can delete a timed
        text track for a video that belongs to that playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(playlist=playlist)
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.INSTRUCTOR
        )

        track = factories.TimedTextTrackFactory(video=video)
        self.assertEqual(TimedTextTrack.objects.count(), 1)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.delete(
            self._delete_url(video, track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(TimedTextTrack.objects.count(), 0)

    def test_api_timed_text_track_delete_by_video_playlist_admin(self):
        """
        Playlist administrator token user deletes a timed text track for a video.

        A user with a user token, who is a playlist administrator, can delete a timed
        text track for a video that belongs to that playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user is an administrator, with a video
        playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(playlist=playlist)
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.ADMINISTRATOR
        )

        track = factories.TimedTextTrackFactory(video=video)
        self.assertEqual(TimedTextTrack.objects.count(), 1)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.delete(
            self._delete_url(video, track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(TimedTextTrack.objects.count(), 0)

    def test_api_timed_text_track_delete_by_video_organization_instructor(self):
        """
        Organization instructor token user deletes a timed text track for a video.

        A user with a user token, who is an organization instructor, cannot delete a
        timed text track for a video that belongs to that playlist.
        """
        user = factories.UserFactory()
        # An organization where the user is an instructor, with a playlist with a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.INSTRUCTOR
        )

        track = factories.TimedTextTrackFactory(video=video)
        self.assertEqual(TimedTextTrack.objects.count(), 1)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.delete(
            self._delete_url(video, track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(TimedTextTrack.objects.count(), 1)

    def test_api_timed_text_track_delete_by_video_organization_admin(self):
        """
        Organization administrator token user deletes a timed text track for a video.

        A user with a user token, who is an organization administrator, can delete a
        timed text track for a video that belongs to that playlist.
        """
        user = factories.UserFactory()
        # An organization where the user is an admin, with a playlist with a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.ADMINISTRATOR
        )

        track = factories.TimedTextTrackFactory(video=video)
        self.assertEqual(TimedTextTrack.objects.count(), 1)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.delete(
            self._delete_url(video, track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(TimedTextTrack.objects.count(), 0)


class TimedTextTrackDeleteAPIOldTest(TimedTextTrackDeleteAPITest):
    """Test the delete API of the timed text track object with old URLs."""

    def _delete_url(self, video, track):
        """Return the url to delete a timed text track."""
        return f"/api/timedtexttracks/{track.id}/"
