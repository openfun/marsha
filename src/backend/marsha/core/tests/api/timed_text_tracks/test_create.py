"""Tests for the TimedTextTrack create API of the Marsha project."""
import json

from django.test import TestCase, override_settings

from marsha.core import factories, models
from marsha.core.factories import TimedTextTrackFactory, UserFactory, VideoFactory
from marsha.core.models import TimedTextTrack
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    UserAccessTokenFactory,
)


class TimedTextTrackCreateAPITest(TestCase):
    """Test the create API of the timed text track object."""

    maxDiff = None

    def test_api_timed_text_track_create_anonymous(self):
        """Anonymous users should not be able to create a new timed text track."""
        response = self.client.post("/api/timedtexttracks/")
        self.assertEqual(response.status_code, 401)
        self.assertFalse(TimedTextTrack.objects.exists())

    def test_api_timed_text_track_create_token_user(self):
        """A token user should be able to create a timed text track for an existing video."""
        video = VideoFactory(id="f8c30d0d-2bb4-440d-9e8d-f4b231511f1f")
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        data = {"language": "fr", "size": 10}
        response = self.client.post(
            "/api/timedtexttracks/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(TimedTextTrack.objects.count(), 1)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "id": str(TimedTextTrack.objects.first().id),
                "active_stamp": None,
                "is_ready_to_show": False,
                "mode": "st",
                "language": "fr",
                "upload_state": "pending",
                "source_url": None,
                "url": None,
                "video": "f8c30d0d-2bb4-440d-9e8d-f4b231511f1f",
            },
        )

    def test_api_timed_text_create_token_user_track_no_size(self):
        """A token user shouldn't be able to create a track if size param is not specified"""
        video = VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        data = {"language": "fr"}
        response = self.client.post(
            "/api/timedtexttracks/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {"size": ["File size is required"]},
        )

    @override_settings(SUBTITLE_SOURCE_MAX_SIZE=10)
    def test_api_timed_text_track_create_token_user_file_too_large(self):
        """A token user shouldn't be able to create a timed text track with a too large size"""
        video = VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        data = {"language": "fr", "video": str(video.pk), "size": 100}
        response = self.client.post(
            "/api/timedtexttracks/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {"size": ["File too large, max size allowed is 10 Bytes"]},
        )

    def test_api_timed_text_track_create_instructor_in_read_only(self):
        """Instructor should not be able to create a timed text track in read_only mode."""
        timed_text_track = TimedTextTrackFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=timed_text_track.video,
            permissions__can_update=False,
        )

        response = self.client.post(
            "/api/timedtexttracks/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_timed_text_track_create_staff_or_user(self):
        """Users authenticated via a session shouldn't be able to create new timed text tracks."""
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            response = self.client.post("/api/timedtexttracks/")
            self.assertEqual(response.status_code, 401)
            self.assertFalse(TimedTextTrack.objects.exists())

    def test_api_timed_text_track_create_by_user_with_no_access(self):
        """
        Token user without any access creates a timed text track for a video.

        A user with a user token, without any specific access, cannot create a timed text
        track for any given video.
        """
        video = factories.VideoFactory()

        jwt_token = UserAccessTokenFactory()

        response = self.client.post(
            "/api/timedtexttracks/",
            {"language": "fr", "video": str(video.id), "size": 10},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(TimedTextTrack.objects.count(), 0)

    def test_api_timed_text_track_create_by_video_playlist_instructor(self):
        """
        Playlist instructor token user creates a timed text track for a video.

        A user with a user token, who is a playlist instructor, can create a timed
        text track for a video that belongs to that playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(playlist=playlist)
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.INSTRUCTOR
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            "/api/timedtexttracks/",
            {"language": "fr", "video": str(video.id), "size": 10},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(TimedTextTrack.objects.count(), 1)
        self.assertEqual(
            response.json(),
            {
                "id": str(TimedTextTrack.objects.first().id),
                "active_stamp": None,
                "is_ready_to_show": False,
                "mode": "st",
                "language": "fr",
                "upload_state": "pending",
                "source_url": None,
                "url": None,
                "video": str(video.id),
            },
        )

    def test_api_timed_text_track_create_by_video_playlist_admin(self):
        """
        Playlist administrator token user creates a timed text track for a video.

        A user with a user token, who is a playlist administrator, can create a timed
        text track for a video that belongs to that playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(playlist=playlist)
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.ADMINISTRATOR
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            "/api/timedtexttracks/",
            {"language": "fr", "video": str(video.id), "size": 10},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(TimedTextTrack.objects.count(), 1)
        self.assertEqual(
            response.json(),
            {
                "id": str(TimedTextTrack.objects.first().id),
                "active_stamp": None,
                "is_ready_to_show": False,
                "mode": "st",
                "language": "fr",
                "upload_state": "pending",
                "source_url": None,
                "url": None,
                "video": str(video.id),
            },
        )

    def test_api_timed_text_track_create_by_video_organization_instructor(self):
        """
        Organization instructor token user creates a timed text track for a video.

        A user with a user token, who is an organization instructor, cannot create a timed
        text track for a video that belongs to that organization.
        """
        user = factories.UserFactory()
        # A playlist where the user is an instructor, with a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.INSTRUCTOR
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            "/api/timedtexttracks/",
            {"language": "fr", "video": str(video.id), "size": 10},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(TimedTextTrack.objects.count(), 0)

    def test_api_timed_text_track_create_by_video_organization_admin(self):
        """
        Organization administrator token user creates a timed text track for a video.

        A user with a user token, who is an organization administrator, can create a timed
        text track for a video that belongs to that organization.
        """
        user = factories.UserFactory()
        # A playlist where the user is an instructor, with a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.ADMINISTRATOR
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            "/api/timedtexttracks/",
            data={"language": "fr", "video": str(video.id), "size": 10},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(TimedTextTrack.objects.count(), 1)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "id": str(TimedTextTrack.objects.first().id),
                "active_stamp": None,
                "is_ready_to_show": False,
                "mode": "st",
                "language": "fr",
                "upload_state": "pending",
                "source_url": None,
                "url": None,
                "video": str(video.id),
            },
        )
