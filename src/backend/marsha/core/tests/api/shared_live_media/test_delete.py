"""Tests for the SharedLiveMedia delete API of the Marsha project."""
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
from marsha.core.models import SharedLiveMedia
from marsha.core.models.account import ADMINISTRATOR, INSTRUCTOR
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)


class SharedLiveMediaDeleteAPITest(TestCase):
    """Test the delete API of the shared live media object."""

    def _delete_url(self, video, shared_live_media):
        """Return the url to use in tests."""
        return f"/api/videos/{video.pk}/sharedlivemedias/{shared_live_media.pk}/"

    maxDiff = None

    def test_api_shared_live_media_delete_anonymous(self):
        """An anonymous user can not delete a shared live media."""
        shared_live_media = SharedLiveMediaFactory()

        response = self.client.delete(
            self._delete_url(shared_live_media.video, shared_live_media),
        )

        self.assertEqual(response.status_code, 401)

    def test_api_shared_live_media_delete_student(self):
        """A student can not delete a shared live media."""
        shared_live_media = SharedLiveMediaFactory()

        jwt_token = StudentLtiTokenFactory(resource=shared_live_media.video)

        response = self.client.delete(
            self._delete_url(shared_live_media.video, shared_live_media),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_delete_instructor(self):
        """An instructor can delete a shared live media."""
        shared_live_media = SharedLiveMediaFactory()
        video = VideoFactory()
        video.shared_live_medias.set([shared_live_media])

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=shared_live_media.video)

        self.assertTrue(SharedLiveMedia.objects.exists())

        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.delete(
                self._delete_url(shared_live_media.video, shared_live_media),
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            mock_dispatch_video_to_groups.assert_called_once_with(video)

        self.assertEqual(response.status_code, 204)
        self.assertFalse(SharedLiveMedia.objects.exists())

    def test_api_shared_live_media_delete_staff_or_user(self):
        """Users authenticated via a session shouldn't be able to delete a shared live medias."""
        shared_live_media = SharedLiveMediaFactory()
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            response = self.client.delete(
                self._delete_url(shared_live_media.video, shared_live_media),
                content_type="application/json",
            )
            self.assertEqual(response.status_code, 401)

    def test_api_shared_live_media_delete_by_user_with_no_access(self):
        """
        Token user without any access deletes a shared live medias for a video.

        A user with a user token, without any specific access, cannot delete a shared live
        medias for any given video.
        """
        shared_live_media = SharedLiveMediaFactory()

        jwt_token = UserAccessTokenFactory()

        response = self.client.delete(
            self._delete_url(shared_live_media.video, shared_live_media),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_delete_by_video_playlist_instructor(self):
        """
        Playlist instructor token user deletes a shared live medias for a video.

        A user with a user token, who is a playlist instructor, can delete a shared
        live medias for a video that belongs to that playlist.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = PlaylistFactory()
        video = VideoFactory(playlist=playlist)
        shared_live_media = SharedLiveMediaFactory(video=video)
        PlaylistAccessFactory(user=user, playlist=playlist, role=INSTRUCTOR)

        jwt_token = UserAccessTokenFactory(user=user)

        self.assertTrue(SharedLiveMedia.objects.exists())

        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.delete(
                self._delete_url(shared_live_media.video, shared_live_media),
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            mock_dispatch_video_to_groups.assert_called_once_with(video)

        self.assertEqual(response.status_code, 204)
        self.assertFalse(SharedLiveMedia.objects.exists())

    def test_api_shared_live_media_delete_by_video_playlist_admin(self):
        """
        Playlist administrator token user deletes a shared live medias for a video.

        A user with a user token, who is a playlist administrator, can delete
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

        self.assertTrue(SharedLiveMedia.objects.exists())

        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.delete(
                self._delete_url(shared_live_media.video, shared_live_media),
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            mock_dispatch_video_to_groups.assert_called_once_with(video)

        self.assertEqual(response.status_code, 204)
        self.assertFalse(SharedLiveMedia.objects.exists())

    def test_api_shared_live_media_delete_by_video_organization_instructor(self):
        """
        Organization instructor token user deletes a shared live medias for a video.

        A user with a user token, who is an organization instructor, cannot delete a shared
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

        response = self.client.delete(
            self._delete_url(shared_live_media.video, shared_live_media),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_delete_by_video_organization_admin(self):
        """
        Organization administrator token user deletes a shared live medias for a video.

        A user with a user token, who is an organization administrator, can delete a shared
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

        self.assertTrue(SharedLiveMedia.objects.exists())

        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.delete(
                self._delete_url(shared_live_media.video, shared_live_media),
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            mock_dispatch_video_to_groups.assert_called_once_with(video)

        self.assertEqual(response.status_code, 204)
        self.assertFalse(SharedLiveMedia.objects.exists())

    def test_api_shared_live_media_delete_active(self):
        """
        Playlist instructor token user deletes an active shared live medias for a video.

        When the active shared_live_media is deleted,
        related video active_shared_live_media is set to None.
        """
        shared_live_media = SharedLiveMediaFactory(nb_pages=5)
        video = VideoFactory(
            active_shared_live_media=shared_live_media, active_shared_live_media_page=3
        )
        video.shared_live_medias.set([shared_live_media])

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=shared_live_media.video)

        self.assertTrue(SharedLiveMedia.objects.exists())

        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.delete(
                self._delete_url(shared_live_media.video, shared_live_media),
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            mock_dispatch_video_to_groups.assert_called_once_with(video)

        self.assertEqual(response.status_code, 204)
        self.assertFalse(SharedLiveMedia.objects.exists())
        video.refresh_from_db()
        self.assertIsNone(video.active_shared_live_media)
        self.assertIsNone(video.active_shared_live_media_page)


class SharedLiveMediaDeleteAPIOldTest(SharedLiveMediaDeleteAPITest):
    """Test the delete API of the shared live media object."""

    def _delete_url(self, video, shared_live_media):
        """Return the url to use in tests."""
        return f"/api/sharedlivemedias/{shared_live_media.id}/"
