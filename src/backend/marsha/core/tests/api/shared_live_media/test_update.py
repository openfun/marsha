"""Tests for the SharedLiveMedia update API of the Marsha project."""
import json
from unittest import mock

from django.test import TestCase

from marsha.core import defaults
from marsha.core.factories import (
    OrganizationAccessFactory,
    OrganizationFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
    SharedLiveMediaFactory,
    UserFactory,
    VideoFactory,
)
from marsha.core.models.account import ADMINISTRATOR, INSTRUCTOR
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)


class SharedLiveMediaUpdateAPITest(TestCase):
    """Test the update API of the shared live media object."""

    maxDiff = None

    def test_api_shared_live_media_update_anonymous(self):
        """An anonymous user can not update a shared live media."""
        shared_live_media = SharedLiveMediaFactory()

        response = self.client.put(
            f"/api/sharedlivemedias/{shared_live_media.id}/",
            {"title": "you shall not pass!"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 401)

    def test_api_shared_live_media_update_student(self):
        """A student can not update a shared live media."""
        shared_live_media = SharedLiveMediaFactory()

        jwt_token = StudentLtiTokenFactory(resource=shared_live_media.video)

        response = self.client.put(
            f"/api/sharedlivemedias/{shared_live_media.id}/",
            {"title": "you shall not pass!"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_update_instructor(self):
        """An instructor can update a shared live media."""
        shared_live_media = SharedLiveMediaFactory(title="update me!")

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=shared_live_media.video)

        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_shared_live_media"
        ) as mock_dispatch_shared_live_media:
            response = self.client.put(
                f"/api/sharedlivemedias/{shared_live_media.id}/",
                {"title": "Give me the red pill"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )
            mock_dispatch_shared_live_media.assert_called_once_with(shared_live_media)

        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "id": str(shared_live_media.id),
                "active_stamp": None,
                "filename": None,
                "is_ready_to_show": False,
                "nb_pages": shared_live_media.nb_pages,
                "show_download": True,
                "title": "Give me the red pill",
                "upload_state": "pending",
                "urls": None,
                "video": str(shared_live_media.video.id),
            },
        )

    def test_api_shared_live_media_update_staff_or_user(self):
        """Users authenticated via a session shouldn't be able to update a shared live medias."""
        shared_live_media = SharedLiveMediaFactory()
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            response = self.client.put(
                f"/api/sharedlivemedias/{shared_live_media.id}/",
                {"title": "you shall not pass!"},
                content_type="application/json",
            )
            self.assertEqual(response.status_code, 401)

    def test_api_shared_live_media_update_by_user_with_no_access(self):
        """
        Token user without any access updates a shared live medias for a video.

        A user with a user token, without any specific access, cannot update a shared live
        medias for any given video.
        """
        shared_live_media = SharedLiveMediaFactory()

        jwt_token = UserAccessTokenFactory()

        response = self.client.put(
            f"/api/sharedlivemedias/{shared_live_media.id}/",
            {"title": "you shall not pass!"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_update_by_video_playlist_instructor(self):
        """
        Playlist instructor token user updates a shared live medias for a video.

        A user with a user token, who is a playlist instructor, can update a shared
        live medias for a video that belongs to that playlist.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = PlaylistFactory()
        video = VideoFactory(playlist=playlist)
        shared_live_media = SharedLiveMediaFactory(
            upload_state=defaults.PENDING,
            uploaded_on=None,
            nb_pages=None,
            video=video,
            title="update me!",
        )
        PlaylistAccessFactory(user=user, playlist=playlist, role=INSTRUCTOR)

        jwt_token = UserAccessTokenFactory(user=user)

        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_shared_live_media"
        ) as mock_dispatch_shared_live_media:
            response = self.client.put(
                f"/api/sharedlivemedias/{shared_live_media.id}/",
                {"title": "give me the red pill!"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )
            mock_dispatch_shared_live_media.assert_called_once_with(shared_live_media)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "id": str(shared_live_media.id),
                "active_stamp": None,
                "filename": None,
                "is_ready_to_show": False,
                "nb_pages": None,
                "show_download": True,
                "title": "give me the red pill!",
                "upload_state": "pending",
                "urls": None,
                "video": str(video.id),
            },
        )

    def test_api_shared_live_media_update_by_video_playlist_admin(self):
        """
        Playlist administrator token user updated a shared live medias for a video.

        A user with a user token, who is a playlist administrator, can list update
        a shared live media for a video that belongs to that playlist.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = PlaylistFactory()
        video = VideoFactory(playlist=playlist)
        shared_live_media = SharedLiveMediaFactory(
            upload_state=defaults.PENDING,
            uploaded_on=None,
            nb_pages=None,
            video=video,
            title="update me!",
        )
        PlaylistAccessFactory(user=user, playlist=playlist, role=ADMINISTRATOR)

        jwt_token = UserAccessTokenFactory(user=user)

        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_shared_live_media"
        ) as mock_dispatch_shared_live_media:
            response = self.client.put(
                f"/api/sharedlivemedias/{shared_live_media.id}/",
                {"title": "give me the red pill!"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )
            mock_dispatch_shared_live_media.assert_called_once_with(shared_live_media)

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "id": str(shared_live_media.id),
                "active_stamp": None,
                "filename": None,
                "is_ready_to_show": False,
                "nb_pages": None,
                "show_download": True,
                "title": "give me the red pill!",
                "upload_state": "pending",
                "urls": None,
                "video": str(video.id),
            },
        )

    def test_api_shared_live_media_update_by_video_organization_instructor(self):
        """
        Organization instructor token user updates a shared live medias for a video.

        A user with a user token, who is an organization instructor, cannot update a shared
        live media for a video that belongs to that organization.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        organization = OrganizationFactory()
        playlist = PlaylistFactory(organization=organization)
        video = VideoFactory(playlist=playlist)
        shared_live_media = SharedLiveMediaFactory(video=video)
        OrganizationAccessFactory(user=user, organization=organization, role=INSTRUCTOR)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.put(
            f"/api/sharedlivemedias/{shared_live_media.id}/",
            {"title": "you shall not pass!"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_update_by_video_organization_admin(self):
        """
        Organization administrator token user updates a shared live medias for a video.

        A user with a user token, who is an organization administrator, can update a shared
        live medias for a video that belongs to that organization.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        organization = OrganizationFactory()
        playlist = PlaylistFactory(organization=organization)
        video = VideoFactory(playlist=playlist)
        shared_live_media = SharedLiveMediaFactory(
            upload_state=defaults.PENDING,
            uploaded_on=None,
            nb_pages=None,
            video=video,
            title="update me!",
        )
        OrganizationAccessFactory(
            user=user, organization=organization, role=ADMINISTRATOR
        )

        jwt_token = UserAccessTokenFactory(user=user)

        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_shared_live_media"
        ) as mock_dispatch_shared_live_media:
            response = self.client.put(
                f"/api/sharedlivemedias/{shared_live_media.id}/",
                {"title": "give me the red pill!"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )
            mock_dispatch_shared_live_media.assert_called_once_with(shared_live_media)

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "id": str(shared_live_media.id),
                "active_stamp": None,
                "filename": None,
                "is_ready_to_show": False,
                "nb_pages": None,
                "show_download": True,
                "title": "give me the red pill!",
                "upload_state": "pending",
                "urls": None,
                "video": str(video.id),
            },
        )
