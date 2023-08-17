"""Tests for the Video list API of the Marsha project."""
from datetime import datetime, timezone

from django.test import TestCase

from marsha.core import factories
from marsha.core.models import ADMINISTRATOR
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    UserAccessTokenFactory,
)


class VideoListAPITest(TestCase):
    """Test the list API of the video object."""

    maxDiff = None

    def test_api_video_read_list_anonymous(self):
        """Anonymous users should not be able to read a list of videos."""
        factories.VideoFactory()
        response = self.client.get("/api/videos/")
        self.assertEqual(response.status_code, 401)

    def test_api_video_read_list_token_user(self):
        """
        Token user lists videos.

        A token user associated to a video should be able to read a list of videos.
        It should however be empty as they have no rights on lists of videos.
        """
        video = factories.VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=video.playlist,
            permissions__can_update=False,
        )

        response = self.client.get(
            "/api/videos/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(), {"count": 0, "next": None, "previous": None, "results": []}
        )

    def test_api_video_read_list_user_with_no_access(self):
        """
        Token user lists videos.

        A user with a user token, with no playlist or organization access should not
        get any videos in response to video list requests.
        """
        # An organization with a playlist and one video
        organization = factories.OrganizationFactory()
        organization_playlist = factories.PlaylistFactory(organization=organization)
        factories.VideoFactory(playlist=organization_playlist)
        # A playlist with a video but no organization
        other_playlist = factories.PlaylistFactory()
        factories.VideoFactory(playlist=other_playlist)

        jwt_token = UserAccessTokenFactory()

        response = self.client.get(
            "/api/videos/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(), {"count": 0, "next": None, "previous": None, "results": []}
        )

    def test_api_video_read_list_user_with_playlist_access(self):
        """
        Token user with playlist access lists videos.

        A user with a user token, with access to a playlist should get only videos from that
        playlist, and not from other playlists, even if they are from the same organization.
        """
        user = factories.UserFactory()
        # An organization where the user has no access
        organization = factories.OrganizationFactory()
        # In this organization, a playlist where the user has access
        organization_playlist_1 = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=organization_playlist_1)
        # Default role is instructor
        factories.PlaylistAccessFactory(user=user, playlist=organization_playlist_1)
        # In the same organization, a playlist where the user has no access
        organization_playlist_2 = factories.PlaylistFactory(organization=organization)
        factories.VideoFactory(playlist=organization_playlist_2)
        # An unrelated playlist where the user has no access
        other_playlist = factories.PlaylistFactory()
        factories.VideoFactory(playlist=other_playlist)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            "/api/videos/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 1,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "active_shared_live_media": None,
                        "active_shared_live_media_page": None,
                        "active_stamp": None,
                        "allow_recording": True,
                        "can_edit": True,
                        "description": video.description,
                        "estimated_duration": None,
                        "has_chat": True,
                        "has_live_media": True,
                        "has_transcript": False,
                        "id": str(video.id),
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
                            "id": str(organization_playlist_1.id),
                            "lti_id": organization_playlist_1.lti_id,
                            "title": organization_playlist_1.title,
                        },
                        "recording_time": 0,
                        "retention_date": None,
                        "shared_live_medias": [],
                        "should_use_subtitle_as_transcript": False,
                        "show_download": True,
                        "starting_at": None,
                        "thumbnail": None,
                        "timed_text_tracks": [],
                        "title": video.title,
                        "upload_state": "pending",
                        "urls": None,
                        "xmpp": None,
                        "tags": [],
                        "license": None,
                    }
                ],
            },
        )

    def test_api_video_read_list_user_with_admin_organization_access(self):
        """
        Token user with an admin access on an organization lists videos.

        A user with a user token, with admin access on an organization should get only videos from
        that organization no matter the playlist they are in, and not from other playlists or
        organizations.
        """
        user = factories.UserFactory()
        # An organization where the user has access
        organization_1 = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            user=user, organization=organization_1, role=ADMINISTRATOR
        )
        # In this organization, two playlists where the user has no direct access
        organization_1_playlist_1 = factories.PlaylistFactory(
            organization=organization_1
        )
        video_1 = factories.VideoFactory(
            playlist=organization_1_playlist_1, title="First video"
        )
        organization_1_playlist_2 = factories.PlaylistFactory(
            organization=organization_1
        )
        video_2 = factories.VideoFactory(
            playlist=organization_1_playlist_2, title="Second video"
        )
        # An unrelated organization with a playlist where the user has no access
        organization_2 = factories.OrganizationFactory()
        other_playlist = factories.PlaylistFactory(organization=organization_2)
        factories.VideoFactory(playlist=other_playlist)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            "/api/videos/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 2,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "active_shared_live_media": None,
                        "active_shared_live_media_page": None,
                        "active_stamp": None,
                        "can_edit": True,
                        "allow_recording": True,
                        "description": video_1.description,
                        "estimated_duration": None,
                        "has_chat": True,
                        "has_live_media": True,
                        "has_transcript": False,
                        "id": str(video_1.id),
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
                            "id": str(organization_1_playlist_1.id),
                            "lti_id": organization_1_playlist_1.lti_id,
                            "title": organization_1_playlist_1.title,
                        },
                        "recording_time": 0,
                        "retention_date": None,
                        "shared_live_medias": [],
                        "should_use_subtitle_as_transcript": False,
                        "show_download": True,
                        "starting_at": None,
                        "thumbnail": None,
                        "timed_text_tracks": [],
                        "title": video_1.title,
                        "upload_state": "pending",
                        "urls": None,
                        "xmpp": None,
                        "tags": [],
                        "license": None,
                    },
                    {
                        "active_shared_live_media": None,
                        "active_shared_live_media_page": None,
                        "active_stamp": None,
                        "allow_recording": True,
                        "can_edit": True,
                        "description": video_2.description,
                        "estimated_duration": None,
                        "has_chat": True,
                        "has_live_media": True,
                        "has_transcript": False,
                        "id": str(video_2.id),
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
                            "id": str(organization_1_playlist_2.id),
                            "lti_id": organization_1_playlist_2.lti_id,
                            "title": organization_1_playlist_2.title,
                        },
                        "recording_time": 0,
                        "retention_date": None,
                        "shared_live_medias": [],
                        "should_use_subtitle_as_transcript": False,
                        "show_download": True,
                        "starting_at": None,
                        "thumbnail": None,
                        "timed_text_tracks": [],
                        "title": video_2.title,
                        "upload_state": "pending",
                        "urls": None,
                        "xmpp": None,
                        "tags": [],
                        "license": None,
                    },
                ],
            },
        )

    def test_api_video_read_list_by_playlist_user_with_no_access(self):
        """
        Token user lists videos by playlist.

        A user with a user token, with no playlist or organization access should not
        get any videos in response to requests to list videos by playlist.
        """
        # A playlist, where the user has no access, with a video
        playlist = factories.PlaylistFactory()
        factories.VideoFactory(playlist=playlist)

        jwt_token = UserAccessTokenFactory()

        response = self.client.get(
            f"/api/videos/?playlist={playlist.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(), {"count": 0, "next": None, "previous": None, "results": []}
        )

    def test_api_video_read_list_by_playlist_user_with_playlist_access(self):
        """
        Token user with playlist access lists videos by playlist.

        A user with a user token, with a playlist access, can list videos for this playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user has access, with a video
        first_playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(playlist=first_playlist)
        # Default role is Instructor
        factories.PlaylistAccessFactory(user=user, playlist=first_playlist)
        # Another one where the user has no access, with a video
        other_playlist = factories.PlaylistFactory()
        factories.VideoFactory(playlist=other_playlist)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/videos/?playlist={first_playlist.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 1,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "active_shared_live_media": None,
                        "active_shared_live_media_page": None,
                        "active_stamp": None,
                        "allow_recording": True,
                        "can_edit": True,
                        "description": video.description,
                        "estimated_duration": None,
                        "has_chat": True,
                        "has_live_media": True,
                        "has_transcript": False,
                        "id": str(video.id),
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
                            "id": str(first_playlist.id),
                            "lti_id": first_playlist.lti_id,
                            "title": first_playlist.title,
                        },
                        "recording_time": 0,
                        "retention_date": None,
                        "shared_live_medias": [],
                        "should_use_subtitle_as_transcript": False,
                        "show_download": True,
                        "starting_at": None,
                        "thumbnail": None,
                        "timed_text_tracks": [],
                        "title": video.title,
                        "upload_state": "pending",
                        "urls": None,
                        "xmpp": None,
                        "tags": [],
                        "license": None,
                    }
                ],
            },
        )

    def test_api_video_read_list_by_playlist_user_with_org_access(self):
        """
        Token user with admin role access on an organization lists videos by playlist.

        A user with a user token, with admin role access on an organization, can list videos
        for a playlist that belongs to that organization.
        """
        user = factories.UserFactory()
        # An organization where the user has access, with a playlist with a video
        first_organization = factories.OrganizationFactory()
        first_playlist = factories.PlaylistFactory(organization=first_organization)
        video = factories.VideoFactory(playlist=first_playlist)
        factories.OrganizationAccessFactory(
            user=user, organization=first_organization, role=ADMINISTRATOR
        )
        # Another one where the user has no access, with a video
        other_organization = factories.OrganizationFactory()
        other_playlist = factories.PlaylistFactory(organization=other_organization)
        factories.VideoFactory(playlist=other_playlist)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/videos/?playlist={first_playlist.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 1,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "active_shared_live_media": None,
                        "active_shared_live_media_page": None,
                        "active_stamp": None,
                        "allow_recording": True,
                        "can_edit": True,
                        "description": video.description,
                        "estimated_duration": None,
                        "has_chat": True,
                        "has_live_media": True,
                        "has_transcript": False,
                        "id": str(video.id),
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
                            "id": str(first_playlist.id),
                            "lti_id": first_playlist.lti_id,
                            "title": first_playlist.title,
                        },
                        "recording_time": 0,
                        "retention_date": None,
                        "shared_live_medias": [],
                        "should_use_subtitle_as_transcript": False,
                        "show_download": True,
                        "starting_at": None,
                        "thumbnail": None,
                        "timed_text_tracks": [],
                        "title": video.title,
                        "upload_state": "pending",
                        "urls": None,
                        "xmpp": None,
                        "tags": [],
                        "license": None,
                    }
                ],
            },
        )

    def test_api_video_read_list_by_org_user_with_no_access(self):
        """
        Token user lists videos by organization.

        A user with a user token, with no playlist or organization access should not
        get any videos in response to requests to list videos by organization.
        """
        user = factories.UserFactory()
        # An organization where the user has no access, with a playlist and a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        factories.VideoFactory(playlist=playlist)

        jwt_token = UserAccessTokenFactory(user=user)
        response = self.client.get(
            f"/api/videos/?organization={organization.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(), {"count": 0, "next": None, "previous": None, "results": []}
        )

    def test_api_video_read_list_by_org_user_with_playlist_access(self):
        """
        Token user with playlist access lists videos by organization.

        A user with a user token, with a playlist access, can list videos for the organization
        linked to the playlist, and get only those they have access to, and not videos for
        other organization playlists.
        """
        user = factories.UserFactory()
        # The organization for both our playlists
        organization = factories.OrganizationFactory()
        # A playlist where the user has access, with a video
        first_playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=first_playlist)
        # Default role is Instructor
        factories.PlaylistAccessFactory(user=user, playlist=first_playlist)
        # Another one where the user has no access, with a video
        other_playlist = factories.PlaylistFactory(organization=organization)
        factories.VideoFactory(playlist=other_playlist)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/videos/?organization={organization.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 1,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "active_shared_live_media": None,
                        "active_shared_live_media_page": None,
                        "active_stamp": None,
                        "allow_recording": True,
                        "can_edit": True,
                        "description": video.description,
                        "estimated_duration": None,
                        "has_chat": True,
                        "has_live_media": True,
                        "has_transcript": False,
                        "id": str(video.id),
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
                            "id": str(first_playlist.id),
                            "lti_id": first_playlist.lti_id,
                            "title": first_playlist.title,
                        },
                        "recording_time": 0,
                        "retention_date": None,
                        "shared_live_medias": [],
                        "should_use_subtitle_as_transcript": False,
                        "show_download": True,
                        "starting_at": None,
                        "thumbnail": None,
                        "timed_text_tracks": [],
                        "title": video.title,
                        "upload_state": "pending",
                        "urls": None,
                        "xmpp": None,
                        "tags": [],
                        "license": None,
                    }
                ],
            },
        )

    def test_api_video_read_list_by_org_user_with_admin_org_access(self):
        """
        Token user with administrator role on an organization can lists videos.

        A user with a user token, with an organization access, can list videos for the
        organization, no matter the playlist they belong to.
        """
        user = factories.UserFactory()
        # The organization for both our playlists
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            organization=organization, user=user, role=ADMINISTRATOR
        )
        # Two separate playlists for the organization, with a video each
        playlist_1 = factories.PlaylistFactory(organization=organization)
        video_1 = factories.VideoFactory(playlist=playlist_1, title="First video")
        playlist_2 = factories.PlaylistFactory(organization=organization)
        video_2 = factories.VideoFactory(playlist=playlist_2, title="Second video")

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/videos/?organization={organization.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 2,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "active_shared_live_media": None,
                        "active_shared_live_media_page": None,
                        "active_stamp": None,
                        "allow_recording": True,
                        "can_edit": True,
                        "description": video_1.description,
                        "estimated_duration": None,
                        "has_chat": True,
                        "has_live_media": True,
                        "has_transcript": False,
                        "id": str(video_1.id),
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
                            "id": str(playlist_1.id),
                            "lti_id": playlist_1.lti_id,
                            "title": playlist_1.title,
                        },
                        "recording_time": 0,
                        "retention_date": None,
                        "shared_live_medias": [],
                        "should_use_subtitle_as_transcript": False,
                        "show_download": True,
                        "starting_at": None,
                        "thumbnail": None,
                        "timed_text_tracks": [],
                        "title": video_1.title,
                        "upload_state": "pending",
                        "urls": None,
                        "xmpp": None,
                        "tags": [],
                        "license": None,
                    },
                    {
                        "active_shared_live_media": None,
                        "active_shared_live_media_page": None,
                        "active_stamp": None,
                        "allow_recording": True,
                        "can_edit": True,
                        "description": video_2.description,
                        "estimated_duration": None,
                        "has_chat": True,
                        "has_live_media": True,
                        "has_transcript": False,
                        "id": str(video_2.id),
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
                            "id": str(playlist_2.id),
                            "lti_id": playlist_2.lti_id,
                            "title": playlist_2.title,
                        },
                        "recording_time": 0,
                        "retention_date": None,
                        "shared_live_medias": [],
                        "should_use_subtitle_as_transcript": False,
                        "show_download": True,
                        "starting_at": None,
                        "thumbnail": None,
                        "timed_text_tracks": [],
                        "title": video_2.title,
                        "upload_state": "pending",
                        "urls": None,
                        "xmpp": None,
                        "tags": [],
                        "license": None,
                    },
                ],
            },
        )

    def test_api_video_read_list_by_org_user_with_org_access(self):
        """
        Token user with organization access lists videos by organization.

        A user with a user token, with an organization access, will have no result if
        he has not the administrator role.
        """
        user = factories.UserFactory()
        # The organization for both our playlists
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(organization=organization, user=user)
        # Two separate playlists for the organization, with a video each
        playlist_1 = factories.PlaylistFactory(organization=organization)
        factories.VideoFactory(playlist=playlist_1, title="First video")
        playlist_2 = factories.PlaylistFactory(organization=organization)
        factories.VideoFactory(playlist=playlist_2, title="Second video")

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/videos/?organization={organization.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 0,
                "next": None,
                "previous": None,
                "results": [],
            },
        )

    def test_api_video_read_list_staff_or_user(self):
        """Users authenticated via a session should not be able to read a list of videos."""
        for user in [factories.UserFactory(), factories.UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            factories.VideoFactory()
            response = self.client.get("/api/videos/")
            self.assertEqual(response.status_code, 401)

    def test_list_video_not_duplicated(self):
        """
        When several users have administrator role on a playlist,
        the video must be returned only once.
        """
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()

        playlist = factories.PlaylistFactory(
            organization=organization,
        )
        video = factories.VideoFactory(playlist=playlist)

        factories.PlaylistAccessFactory(
            playlist=playlist,
            user=user,
            role=ADMINISTRATOR,
        )
        factories.PlaylistAccessFactory.create_batch(
            3,
            playlist=playlist,
            role=ADMINISTRATOR,
        )
        factories.OrganizationAccessFactory(
            organization=organization,
            user=user,
            role=ADMINISTRATOR,
        )
        factories.OrganizationAccessFactory.create_batch(
            3,
            organization=organization,
            role=ADMINISTRATOR,
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            "/api/videos/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["id"], str(video.id))

    def test_list_video_thumbnail_not_duplicated(self):
        """
        When several users have administrator role on a playlist,
        the video's thumbnail must not be duplicated across videos.
        """
        organization_access = factories.OrganizationAccessFactory(role=ADMINISTRATOR)

        playlist = factories.PlaylistFactory(
            organization=organization_access.organization,
        )

        video_1 = factories.VideoFactory(
            playlist=playlist,
            title="video 1",
        )
        video_2 = factories.VideoFactory(
            playlist=playlist,
            title="video 2",
            is_public=True,
        )
        factories.ThumbnailFactory(
            video=video_2,
            uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc),
            upload_state="ready",
        )
        video_3 = factories.VideoFactory(
            playlist=playlist,
            title="video 3",
        )

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        # No filter
        response = self.client.get(
            "/api/videos/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 3)
        results = response.json()["results"]
        self.assertListEqual(
            [result["id"] for result in results],
            [str(video_1.pk), str(video_2.pk), str(video_3.pk)],
        )
        self.assertIsNone(results[0]["thumbnail"])
        self.assertIsNotNone(results[1]["thumbnail"])
        self.assertIsNone(results[2]["thumbnail"])

    def test_filters(self):
        """Results are filtered."""
        organization_access = factories.OrganizationAccessFactory(role=ADMINISTRATOR)

        playlist = factories.PlaylistFactory(
            organization=organization_access.organization,
        )

        video_1 = factories.VideoFactory(
            playlist=playlist,
            title="video 1",
        )
        video_2 = factories.VideoFactory(
            playlist=playlist,
            title="a video 2",
            is_public=True,
        )
        video_3 = factories.WebinarVideoFactory(
            playlist=playlist,
            title="video 3",
        )

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        # No filter
        response = self.client.get(
            "/api/videos/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 3)
        self.assertListEqual(
            [result["id"] for result in response.json()["results"]],
            [str(video_2.pk), str(video_1.pk), str(video_3.pk)],
        )

        # Filter on title
        response = self.client.get(
            "/api/videos/?title__icontains=a",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertListEqual(
            [result["id"] for result in response.json()["results"]],
            [str(video_2.pk)],
        )

        # Filter on is live false
        response = self.client.get(
            "/api/videos/?is_live=false",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertListEqual(
            [result["id"] for result in response.json()["results"]],
            [str(video_2.pk), str(video_1.pk)],
        )

        # Filter on is live true
        response = self.client.get(
            "/api/videos/?is_live=true",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertListEqual(
            [result["id"] for result in response.json()["results"]],
            [str(video_3.pk)],
        )

        # Filter on is public
        response = self.client.get(
            "/api/videos/?is_public=false",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertListEqual(
            [result["id"] for result in response.json()["results"]],
            [str(video_1.pk), str(video_3.pk)],
        )

    def test_ordering(self):
        """Results are ordered."""
        organization_access = factories.OrganizationAccessFactory(role=ADMINISTRATOR)

        playlist = factories.PlaylistFactory(
            organization=organization_access.organization,
        )

        video_1 = factories.VideoFactory(
            playlist=playlist,
            title="video 1",
        )
        video_2 = factories.VideoFactory(
            playlist=playlist,
            title="a video 2",
        )
        video_3 = factories.WebinarVideoFactory(
            playlist=playlist,
            title="video 3",
        )

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        # Default order: title
        response = self.client.get(
            "/api/videos/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 3)
        self.assertListEqual(
            [result["id"] for result in response.json()["results"]],
            [str(video_2.pk), str(video_1.pk), str(video_3.pk)],
        )

        # Order on created_on
        response = self.client.get(
            "/api/videos/?ordering=created_on",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 3)
        self.assertListEqual(
            [result["id"] for result in response.json()["results"]],
            [str(video_1.pk), str(video_2.pk), str(video_3.pk)],
        )

    def test_api_video_read_list_control_database_queries(self):
        """
        This test is here to control the number of database queries made
        when a video or a list of video id requested. Lot of videos and related objects
        are created to simulate a real API call made by the front application.
        """
        user = factories.UserFactory()
        # The organization for both our playlists
        organization = factories.OrganizationFactory()
        # A playlist where the user has access, with a video
        first_playlist = factories.PlaylistFactory(organization=organization)
        # create an empty video without any relation (timed_text_Track, thumbnail, etc)
        factories.VideoFactory(playlist=first_playlist)
        # Create a batch of videos and add to them many related objects
        videos = factories.VideoFactory.create_batch(40, playlist=first_playlist)
        for video in videos:
            factories.TimedTextTrackFactory(video=video, mode="ts")
            factories.TimedTextTrackFactory(video=video, mode="st")
            factories.ThumbnailFactory(video=video)
            factories.SharedLiveMediaFactory.create_batch(4, video=video)

        # Default role is Instructor
        factories.PlaylistAccessFactory(user=user, playlist=first_playlist)
        # Another one where the user has no access, with a video
        other_playlist = factories.PlaylistFactory(organization=organization)
        factories.VideoFactory(playlist=other_playlist)

        jwt_token = UserAccessTokenFactory(user=user)

        with self.assertNumQueries(5):
            response = self.client.get(
                f"/api/videos/?organization={organization.id}&limit=20",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 41)
