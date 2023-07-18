"""Tests for the Video create API of the Marsha project."""
from datetime import timedelta
import random
import uuid

from django.test import TestCase

from marsha.core import factories, models
from marsha.core.api import timezone
from marsha.core.defaults import INITIALIZED, STATE_CHOICES
from marsha.core.simple_jwt.factories import (
    PlaylistLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)


class VideoCreateAPITest(TestCase):
    """Test the create API of the video object."""

    maxDiff = None

    def test_api_video_create_anonymous(self):
        """Anonymous users should not be able to create a new video."""
        response = self.client.post("/api/videos/")
        self.assertEqual(response.status_code, 401)
        self.assertFalse(models.Video.objects.exists())

    def test_api_video_create_token_user_playlist_preexists(self):
        """A token user should not be able to create a video."""
        jwt_token = UserAccessTokenFactory()
        response = self.client.post(
            "/api/videos/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        # Te user is authenticated, but action is forbidden => 403
        self.assertEqual(response.status_code, 403)
        self.assertFalse(models.Video.objects.exists())

    def test_api_video_create_student(self):
        """Student users should not be able to create videos."""
        video = factories.VideoFactory()
        jwt_token = StudentLtiTokenFactory(resource=video.playlist)
        response = self.client.post(
            "/api/videos/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.Video.objects.count(), 1)

    def test_api_video_create_student_with_playlist_token(self):
        """A student with a playlist token should not be able to create a video."""
        jwt_token = PlaylistLtiTokenFactory(roles=["student"])

        response = self.client.post(
            "/api/videos/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.Video.objects.count(), 0)

    def test_api_video_create_staff_or_user(self):
        """Users authenticated via a session should not be able to create videos."""
        for user in [factories.UserFactory(), factories.UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            response = self.client.post("/api/videos/")
            self.assertEqual(response.status_code, 401)
            self.assertFalse(models.Video.objects.exists())

    def test_api_video_create_by_playlist_admin(self):
        """
        Create video with playlist admin access.

        Users with an administrator role on a playlist should be able to create videos
        for it.
        """
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.ADMINISTRATOR, playlist=playlist, user=user
        )

        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Video.objects.count(), 0)

        response = self.client.post(
            "/api/videos/",
            {
                "lti_id": "video_one",
                "playlist": str(playlist.id),
                "title": "Some video",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(models.Video.objects.count(), 1)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            response.json(),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": None,
                "allow_recording": True,
                "can_edit": True,
                "description": "",
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "has_transcript": False,
                "id": str(models.Video.objects.get().id),
                "is_live": False,
                "is_public": False,
                "is_ready_to_show": False,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "live_info": {},
                "live_state": None,
                "live_type": None,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "recording_time": 0,
                "retention_date": None,
                "shared_live_medias": [],
                "should_use_subtitle_as_transcript": False,
                "show_download": True,
                "starting_at": None,
                "thumbnail": None,
                "timed_text_tracks": [],
                "title": "Some video",
                "upload_state": "pending",
                "urls": None,
                "xmpp": None,
                "tags": [],
                "license": None,
            },
        )

    def test_api_video_create_for_nonexistent_playlist(self):
        """
        Create video for nonexistet playlist.

        Requests with a UUID that does not match an existing playlist should fail.
        """
        some_uuid = uuid.uuid4()

        jwt_token = UserAccessTokenFactory()
        self.assertEqual(models.Video.objects.count(), 0)

        response = self.client.post(
            "/api/videos/",
            {"lti_id": "video_one", "playlist": some_uuid, "title": "Some video"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(models.Video.objects.count(), 0)
        self.assertEqual(response.status_code, 403)

    def test_api_video_create_by_playlist_instructor(self):
        """
        Create video with playlist instructor access.

        Users with an instructor role on a playlist should not be able to create videos
        for it.
        """
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.INSTRUCTOR, playlist=playlist, user=user
        )

        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Video.objects.count(), 0)

        response = self.client.post(
            "/api/videos/",
            {
                "lti_id": "video_one",
                "playlist": str(playlist.id),
                "title": "Some video",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(models.Video.objects.count(), 1)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            response.json(),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": None,
                "allow_recording": True,
                "can_edit": True,
                "description": "",
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "has_transcript": False,
                "id": str(models.Video.objects.get().id),
                "is_live": False,
                "is_public": False,
                "is_ready_to_show": False,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "live_info": {},
                "live_state": None,
                "live_type": None,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "recording_time": 0,
                "retention_date": None,
                "shared_live_medias": [],
                "should_use_subtitle_as_transcript": False,
                "show_download": True,
                "starting_at": None,
                "thumbnail": None,
                "timed_text_tracks": [],
                "title": "Some video",
                "upload_state": "pending",
                "urls": None,
                "xmpp": None,
                "tags": [],
                "license": None,
            },
        )

    def test_api_video_create_by_organization_admin(self):
        """
        Create video with organization admin access.

        Users with an administrator role on an organization should be able to create videos
        for playlists linked to that organization.
        """
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)

        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Video.objects.count(), 0)

        response = self.client.post(
            "/api/videos/",
            {
                "lti_id": "video_one",
                "playlist": str(playlist.id),
                "title": "Some video",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(models.Video.objects.count(), 1)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            response.json(),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": None,
                "allow_recording": True,
                "can_edit": True,
                "description": "",
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "has_transcript": False,
                "id": str(models.Video.objects.get().id),
                "is_live": False,
                "is_public": False,
                "is_ready_to_show": False,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "live_info": {},
                "live_state": None,
                "live_type": None,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "recording_time": 0,
                "retention_date": None,
                "shared_live_medias": [],
                "should_use_subtitle_as_transcript": False,
                "show_download": True,
                "starting_at": None,
                "thumbnail": None,
                "timed_text_tracks": [],
                "title": "Some video",
                "upload_state": "pending",
                "urls": None,
                "xmpp": None,
                "tags": [],
                "license": None,
            },
        )

    def test_api_video_create_with_scheduled_date_gets_ignored(self):
        """
        Create video with right access.

        Try to init field starting_at and property is_scheduled on creation. Data are ignored.
        """
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)

        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Video.objects.count(), 0)
        # try to set starting_at and is_scheduled
        response = self.client.post(
            "/api/videos/",
            {
                "lti_id": "video_one",
                "playlist": str(playlist.id),
                "title": "Some title",
                "starting_at": timezone.now() + timedelta(days=100),
                "is_scheduled": True,
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(models.Video.objects.count(), 1)
        self.assertEqual(response.status_code, 201)

        # starting_at is None by default, is_scheduled is False
        self.assertEqual(
            response.json(),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": None,
                "allow_recording": True,
                "can_edit": True,
                "description": "",
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "has_transcript": False,
                "id": str(models.Video.objects.get().id),
                "is_live": False,
                "is_public": False,
                "is_ready_to_show": False,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "live_info": {},
                "live_state": None,
                "live_type": None,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "recording_time": 0,
                "retention_date": None,
                "shared_live_medias": [],
                "should_use_subtitle_as_transcript": False,
                "show_download": True,
                "starting_at": None,
                "thumbnail": None,
                "timed_text_tracks": [],
                "title": "Some title",
                "upload_state": "pending",
                "urls": None,
                "xmpp": None,
                "tags": [],
                "license": None,
            },
        )

    def test_api_video_create_with_invalid_upload_state(self):
        """
        Create video with right access.

        Creating with an invalid upload state should fails
        """
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)

        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Video.objects.count(), 0)
        # try to set starting_at and is_scheduled
        response = self.client.post(
            "/api/videos/",
            {
                "lti_id": "video_one",
                "playlist": str(playlist.id),
                "title": "Some title",
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "initialized"]
                ),
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(models.Video.objects.count(), 0)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": [{"upload_state": ["initialized is the only accepted value"]}]},
        )

    def test_api_video_create_with_a_valid_upload_state(self):
        """
        Create video with right access and a valid upload state
        """
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)

        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Video.objects.count(), 0)
        # try to set starting_at and is_scheduled
        response = self.client.post(
            "/api/videos/",
            {
                "lti_id": "video_one",
                "playlist": str(playlist.id),
                "title": "Some title",
                "upload_state": INITIALIZED,
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(models.Video.objects.count(), 1)
        self.assertEqual(response.status_code, 201)

        # starting_at is None by default, is_scheduled is False
        self.assertEqual(
            response.json(),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": None,
                "allow_recording": True,
                "can_edit": True,
                "description": "",
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "has_transcript": False,
                "id": str(models.Video.objects.get().id),
                "is_live": False,
                "is_public": False,
                "is_ready_to_show": False,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "live_info": {},
                "live_state": None,
                "live_type": None,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "recording_time": 0,
                "retention_date": None,
                "shared_live_medias": [],
                "should_use_subtitle_as_transcript": False,
                "show_download": True,
                "starting_at": None,
                "thumbnail": None,
                "timed_text_tracks": [],
                "title": "Some title",
                "upload_state": INITIALIZED,
                "urls": None,
                "xmpp": None,
                "tags": [],
                "license": None,
            },
        )

    def test_api_video_create_by_organization_instructor(self):
        """
        Create video with organization instructor access.

        Users with an instructor role on an organization should not be able to create videos
        for playlists linked to that organization.
        """
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.INSTRUCTOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)

        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Video.objects.count(), 0)

        response = self.client.post(
            "/api/videos/",
            {
                "lti_id": "video_one",
                "playlist": str(playlist.id),
                "title": "Some video",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(models.Video.objects.count(), 0)
        self.assertEqual(response.status_code, 403)

    def test_api_video_create_instructor_with_playlist_token(self):
        """
        Create video with playlist token.

        Used in the context of a lti select request (deep linking).
        """
        playlist = factories.PlaylistFactory()

        jwt_token = PlaylistLtiTokenFactory(playlist=playlist)

        self.assertEqual(models.Video.objects.count(), 0)

        response = self.client.post(
            "/api/videos/",
            {
                "lti_id": "video_one",
                "playlist": str(playlist.id),
                "title": "Some video",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(models.Video.objects.count(), 1)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            response.json(),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": None,
                "allow_recording": True,
                "can_edit": True,
                "description": "",
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "has_transcript": False,
                "id": str(models.Video.objects.get().id),
                "is_live": False,
                "is_public": False,
                "is_ready_to_show": False,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "live_info": {},
                "live_state": None,
                "live_type": None,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "recording_time": 0,
                "retention_date": None,
                "shared_live_medias": [],
                "should_use_subtitle_as_transcript": False,
                "show_download": True,
                "starting_at": None,
                "thumbnail": None,
                "timed_text_tracks": [],
                "title": "Some video",
                "upload_state": "pending",
                "urls": None,
                "xmpp": None,
                "tags": [],
                "license": None,
            },
        )
