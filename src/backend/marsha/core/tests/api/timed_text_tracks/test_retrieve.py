"""Tests for the TimedTextTrack retrieve API of the Marsha project."""

from datetime import datetime, timezone as baseTimezone
import json
import random

from django.test import TestCase, override_settings

from marsha.core import factories, models
from marsha.core.defaults import AWS_PIPELINE
from marsha.core.factories import TimedTextTrackFactory, UserFactory, VideoFactory
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)


# flake8: noqa: E501
# pylint: disable=line-too-long


class TimedTextTrackRetrieveAPITest(TestCase):
    """Test the retrieve API of the timed text track object."""

    maxDiff = None

    def _get_url(self, video, track):
        """Return the url to retrieve a timed text track."""
        return f"/api/videos/{video.pk}/timedtexttracks/{track.id}/"

    def test_api_timed_text_track_read_detail_anonymous(self):
        """Anonymous users should not be allowed to read a timed text track detail."""
        timed_text_track = TimedTextTrackFactory()
        response = self.client.get(
            self._get_url(timed_text_track.video, timed_text_track)
        )
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_timed_text_track_read_detail_student(self):
        """Student users should not be allowed to read a timed text track detail."""
        timed_text_track = TimedTextTrackFactory()
        jwt_token = StudentLtiTokenFactory(playlist=timed_text_track.video.playlist)
        # Get the timed text track using the JWT token
        response = self.client.get(
            self._get_url(timed_text_track.video, timed_text_track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    @override_settings(MEDIA_URL="https://abc.svc.edge.scw.cloud/")
    def test_api_timed_text_track_read_detail_token_user(self):
        """A token user associated to a video can read a timed text track related to this video."""
        timed_text_track = TimedTextTrackFactory(
            video__pk="b8d40ed7-95b8-4848-98c9-50728dfee25d",
            video__playlist__title="foo",
            mode="cc",
            language="fr",
            uploaded_on=datetime(2018, 8, 8, tzinfo=baseTimezone.utc),
            upload_state="ready",
            extension="srt",
            process_pipeline=AWS_PIPELINE,
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=timed_text_track.video.playlist
        )

        # Get the timed text track using the JWT token
        response = self.client.get(
            self._get_url(timed_text_track.video, timed_text_track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "active_stamp": "1533686400",
                "is_ready_to_show": True,
                "id": str(timed_text_track.id),
                "mode": "cc",
                "language": "fr",
                "upload_state": "ready",
                "source_url": (
                    "https://abc.svc.edge.scw.cloud/aws/b8d40ed7-95b8-4848-98c9-50728dfee25d/"
                    "timedtext/source/1533686400_fr_cc"
                ),
                "url": (
                    "https://abc.svc.edge.scw.cloud/aws/b8d40ed7-95b8-4848-98c9-50728dfee25d/"
                    "timedtext/1533686400_fr_cc.vtt"
                ),
                "video": str(timed_text_track.video.id),
            },
        )

        # Try getting another timed_text_track
        other_timed_text_track = TimedTextTrackFactory()
        response = self.client.get(
            f"/api/videos/{other_timed_text_track.video.id}/"
            f"timedtexttracks/{other_timed_text_track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    @override_settings(MEDIA_URL="https://abc.svc.edge.scw.cloud/")
    def test_api_timed_text_track_without_extension_read_detail_token_user(self):
        """A timed text track without extension should return empty source url."""
        timed_text_track = TimedTextTrackFactory(
            video__pk="b8d40ed7-95b8-4848-98c9-50728dfee25d",
            video__playlist__title="foo",
            mode="cc",
            language="fr",
            uploaded_on=datetime(2018, 8, 8, tzinfo=baseTimezone.utc),
            upload_state="ready",
            process_pipeline=AWS_PIPELINE,
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=timed_text_track.video.playlist
        )

        # Get the timed text track using the JWT token
        response = self.client.get(
            self._get_url(timed_text_track.video, timed_text_track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "active_stamp": "1533686400",
                "is_ready_to_show": True,
                "id": str(timed_text_track.id),
                "mode": "cc",
                "language": "fr",
                "upload_state": "ready",
                "source_url": None,
                "url": (
                    "https://abc.svc.edge.scw.cloud/aws/b8d40ed7-95b8-4848-98c9-50728dfee25d/"
                    "timedtext/1533686400_fr_cc.vtt"
                ),
                "video": str(timed_text_track.video.id),
            },
        )

        # Try getting another timed_text_track
        other_timed_text_track = TimedTextTrackFactory()
        response = self.client.get(
            f"/api/videos/{other_timed_text_track.video.id}/"
            f"timedtexttracks/{other_timed_text_track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    @override_settings(MEDIA_URL="https://abc.svc.edge.scw.cloud/")
    def test_api_timed_text_track_read_detail_admin_user(self):
        """Admin user associated to a video can read a timed text track related to this video."""
        timed_text_track = TimedTextTrackFactory(
            video__pk="b8d40ed7-95b8-4848-98c9-50728dfee25d",
            video__playlist__title="foo",
            mode="cc",
            language="fr",
            uploaded_on=datetime(2018, 8, 8, tzinfo=baseTimezone.utc),
            upload_state="ready",
            extension="srt",
            process_pipeline=AWS_PIPELINE,
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=timed_text_track.video.playlist,
            roles=["administrator"],
        )

        # Get the timed text track using the JWT token
        response = self.client.get(
            self._get_url(timed_text_track.video, timed_text_track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "active_stamp": "1533686400",
                "is_ready_to_show": True,
                "id": str(timed_text_track.id),
                "mode": "cc",
                "language": "fr",
                "upload_state": "ready",
                "source_url": (
                    "https://abc.svc.edge.scw.cloud/aws/b8d40ed7-95b8-4848-98c9-50728dfee25d/timedtext/"
                    "source/1533686400_fr_cc"
                ),
                "url": (
                    "https://abc.svc.edge.scw.cloud/aws/b8d40ed7-95b8-4848-98c9-50728dfee25d/timedtext/"
                    "1533686400_fr_cc.vtt"
                ),
                "video": str(timed_text_track.video.id),
            },
        )

        # Try getting another timed_text_track
        other_timed_text_track = TimedTextTrackFactory()
        response = self.client.get(
            f"/api/videos/{other_timed_text_track.video.id}/"
            f"timedtexttracks/{other_timed_text_track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

        # Try getting the timed_text_track using an other video id
        other_video = VideoFactory(playlist=timed_text_track.video.playlist)

        response = self.client.get(
            self._get_url(other_video, timed_text_track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_timed_text_track_read_instructor_in_read_only(self):
        """Instructor should not be able to read a timed text track in read_only mode."""
        timed_text_track = TimedTextTrackFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=timed_text_track.video.playlist,
            permissions__can_update=False,
        )

        response = self.client.get(
            self._get_url(timed_text_track.video, timed_text_track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_timed_text_track_read_detail_token_user_no_active_stamp(self):
        """A timed text track with no active stamp should not fail.

        Its "url" field should be set to None.
        """
        timed_text_track = TimedTextTrackFactory(uploaded_on=None)
        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=timed_text_track.video.playlist
        )

        # Get the timed text track using the JWT token
        response = self.client.get(
            self._get_url(timed_text_track.video, timed_text_track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('"url":null', response.content.decode("utf-8"))
        content = json.loads(response.content)
        self.assertIsNone(content["url"])

    def test_api_timed_text_track_read_detail_token_user_not_ready(self):
        """A timed_text_track that has never been uploaded successfully should have no url."""
        timed_text_track = TimedTextTrackFactory(
            uploaded_on=None, upload_state=random.choice(["pending", "error", "ready"])
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=timed_text_track.video.playlist
        )

        # Get the timed_text_track linked to the JWT token
        response = self.client.get(
            self._get_url(timed_text_track.video, timed_text_track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('"url":null', response.content.decode("utf-8"))
        content = json.loads(response.content)
        self.assertIsNone(content["url"])

    def test_api_timed_text_track_read_detail_staff_or_user(self):
        """Users authenticated via a session are not allowed to read a timed text track detail."""
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            timed_text_track = TimedTextTrackFactory()
            response = self.client.get(
                self._get_url(timed_text_track.video, timed_text_track)
            )
            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )

    def test_api_timed_text_track_read_detail_by_user_with_no_access(self):
        """
        Token user without any access gets a single timed text track.

        A user with a user token, without any specific access, cannot get
        a single timed text track.
        """
        user = factories.UserFactory()
        video = factories.VideoFactory()
        track = TimedTextTrackFactory(video=video)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            self._get_url(track.video, track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_timed_text_track_read_detail_by_video_playlist_instructor(self):
        """
        Playlist instructor token user gets a single timed text track.

        A user with a user token, who is a playlist instructor, can get
        a single timed text track linked to a video in that playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(playlist=playlist)
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.INSTRUCTOR
        )
        track = TimedTextTrackFactory(mode="cc", video=video)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            self._get_url(track.video, track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "active_stamp": None,
                "id": str(track.id),
                "is_ready_to_show": False,
                "language": track.language,
                "mode": "cc",
                "source_url": None,
                "upload_state": "pending",
                "url": None,
                "video": str(video.id),
            },
        )

    def test_api_timed_text_track_read_detail_by_video_playlist_admin(self):
        """
        Playlist administrator token user gets a single timed text track.

        A user with a user token, who is a playlist administrator, can get
        a single timed text track linked to a video in that playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user is an administrator, with a video
        playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(playlist=playlist)
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.ADMINISTRATOR
        )
        track = TimedTextTrackFactory(mode="cc", video=video)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            self._get_url(track.video, track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "active_stamp": None,
                "id": str(track.id),
                "is_ready_to_show": False,
                "language": track.language,
                "mode": "cc",
                "source_url": None,
                "upload_state": "pending",
                "url": None,
                "video": str(video.id),
            },
        )

    def test_api_timed_text_track_read_detail_by_video_organization_instructor(self):
        """
        Organization instructor token user gets a single timed text track.

        A user with a user token, who is an organization instructor, cannot get
        a single timed text track linked to a video in that organization.
        """
        user = factories.UserFactory()
        # An organization where the user is an instructor, with a playlist with a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.INSTRUCTOR
        )
        track = TimedTextTrackFactory(mode="cc", video=video)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            self._get_url(track.video, track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_timed_text_track_read_detail_by_video_organization_admin(self):
        """
        Organization administrator token user gets a single timed text track.

        A user with a user token, who is an organization administrator, can get
        a single timed text track linked to a video in that organization.
        """
        user = factories.UserFactory()
        # An organization where the user is an admin, with a playlist with a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.ADMINISTRATOR
        )
        track = TimedTextTrackFactory(mode="cc", video=video)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            self._get_url(track.video, track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "active_stamp": None,
                "id": str(track.id),
                "is_ready_to_show": False,
                "language": track.language,
                "mode": "cc",
                "source_url": None,
                "upload_state": "pending",
                "url": None,
                "video": str(video.id),
            },
        )
