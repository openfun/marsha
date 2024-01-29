"""Tests for the TimedTextTrack list API of the Marsha project."""

import json

from django.test import TestCase

from marsha.core import factories, models
from marsha.core.factories import TimedTextTrackFactory, UserFactory
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    UserAccessTokenFactory,
)


class TimedTextTrackListAPITest(TestCase):
    """Test the list API of the timed text track object."""

    maxDiff = None

    def _get_url(self, video):
        """Return the url to list timed text track."""
        return f"/api/videos/{video.id}/timedtexttracks/"

    def test_api_timed_text_track_read_list_anonymous(self):
        """Anonymous users should not be able to read a list of timed text tracks."""
        track = TimedTextTrackFactory()
        response = self.client.get(self._get_url(track.video))
        self.assertEqual(response.status_code, 401)

    def test_api_timed_text_track_read_list_token_user(self):
        """A token user associated to a video is able to read a list of timed text tracks."""
        # Make sure modes differ to avoid random failures as attempting to create a TTT with the
        # same language and mode as an existing one raises an exception.
        timed_text_track_one = TimedTextTrackFactory(mode="st")
        timed_text_track_two = TimedTextTrackFactory(
            mode="cc", video=timed_text_track_one.video
        )
        # Add a timed text track for another video
        TimedTextTrackFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=timed_text_track_one.video.playlist
        )

        response = self.client.get(
            self._get_url(timed_text_track_one.video),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        timed_text_track_list = json.loads(response.content)
        self.assertEqual(len(timed_text_track_list["results"]), 2)
        self.assertEqual(timed_text_track_list["count"], 2)
        self.assertTrue(
            str(timed_text_track_one.id)
            in (ttt["id"] for ttt in timed_text_track_list["results"])
        )
        self.assertTrue(
            str(timed_text_track_two.id)
            in (ttt["id"] for ttt in timed_text_track_list["results"])
        )

    def test_api_timed_text_track_read_list_staff_or_user(self):
        """Users authenticated via a session shouldn't be able to read timed text tracks."""
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            timed_text_track = TimedTextTrackFactory()
            response = self.client.get(
                f"/api/videos/{timed_text_track.video.id}/timedtexttracks/"
            )
            self.assertEqual(response.status_code, 401)

    def test_api_timed_text_track_read_list_by_user_with_no_access(self):
        """
        Token user without any access lists timed text tracks by video.

        A user with a user token, without any specific access, cannot list
        timed text tracks for a video.
        """
        video = factories.VideoFactory()

        TimedTextTrackFactory(mode="st", video=video)
        TimedTextTrackFactory(mode="cc", video=video)
        # Add a timed text track for another video
        TimedTextTrackFactory()

        jwt_token = UserAccessTokenFactory()

        response = self.client.get(
            self._get_url(video),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_timed_text_track_read_list_by_video_playlist_instructor(self):
        """
        Playlist instructor token user lists timed text tracks by video.

        A user with a user token, who is a playlist instructor, can list timed
        text tracks for a video that belongs to that playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(playlist=playlist)
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.INSTRUCTOR
        )

        timed_text_track_one = TimedTextTrackFactory(mode="st", video=video)
        timed_text_track_two = TimedTextTrackFactory(mode="cc", video=video)
        # Add a timed text track for another video
        TimedTextTrackFactory()

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            self._get_url(video),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        timed_text_track_list = response.json()
        self.assertEqual(len(timed_text_track_list["results"]), 2)
        self.assertEqual(timed_text_track_list["count"], 2)
        self.assertTrue(
            str(timed_text_track_one.id)
            in (ttt["id"] for ttt in timed_text_track_list["results"])
        )
        self.assertTrue(
            str(timed_text_track_two.id)
            in (ttt["id"] for ttt in timed_text_track_list["results"])
        )

    def test_api_timed_text_track_read_list_by_video_playlist_admin(self):
        """
        Playlist admin token user lists timed text tracks by video.

        A user with a user token, who is a playlist administrator, can list timed
        text tracks for a video that belongs to that playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user is an admin, with a video
        playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(playlist=playlist)
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.ADMINISTRATOR
        )

        timed_text_track_one = TimedTextTrackFactory(mode="st", video=video)
        timed_text_track_two = TimedTextTrackFactory(mode="cc", video=video)
        # Add a timed text track for another video
        TimedTextTrackFactory()

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            self._get_url(video),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        timed_text_track_list = response.json()
        self.assertEqual(len(timed_text_track_list["results"]), 2)
        self.assertEqual(timed_text_track_list["count"], 2)
        self.assertTrue(
            str(timed_text_track_one.id)
            in (ttt["id"] for ttt in timed_text_track_list["results"])
        )
        self.assertTrue(
            str(timed_text_track_two.id)
            in (ttt["id"] for ttt in timed_text_track_list["results"])
        )

    def test_api_timed_text_track_read_list_by_video_organization_instructor(self):
        """
        Organization instructor token user lists timed text tracks by video.

        A user with a user token, who is an organization instructor, cannot list timed
        text tracks for a video that belongs to that organization.
        """
        user = factories.UserFactory()
        # An organization where the user is an instructor, with a playlist with a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.INSTRUCTOR
        )

        TimedTextTrackFactory(mode="st", video=video)
        TimedTextTrackFactory(mode="cc", video=video)
        # Add a timed text track for another video
        TimedTextTrackFactory()

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            self._get_url(video),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_timed_text_track_read_list_by_video_organization_admin(self):
        """
        Organization admin token user lists timed text tracks by video.

        A user with a user token, who is an organization administrator, can list timed
        text tracks for a video that belongs to that organization.
        """
        user = factories.UserFactory()
        # An organization where the user is an admin, with a playlist with a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.ADMINISTRATOR
        )

        timed_text_track_one = TimedTextTrackFactory(mode="st", video=video)
        timed_text_track_two = TimedTextTrackFactory(mode="cc", video=video)
        # Add a timed text track for another video
        TimedTextTrackFactory()

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            self._get_url(video),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        timed_text_track_list = json.loads(response.content)
        self.assertEqual(len(timed_text_track_list["results"]), 2)
        self.assertEqual(timed_text_track_list["count"], 2)
        self.assertTrue(
            str(timed_text_track_one.id)
            in (ttt["id"] for ttt in timed_text_track_list["results"])
        )
        self.assertTrue(
            str(timed_text_track_two.id)
            in (ttt["id"] for ttt in timed_text_track_list["results"])
        )
