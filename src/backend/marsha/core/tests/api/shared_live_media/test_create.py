"""Tests for the SharedLiveMedia create API of the Marsha project."""
import json

from django.test import TestCase

from marsha.core.factories import (
    OrganizationAccessFactory,
    OrganizationFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
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


class SharedLiveMediaCreateAPITest(TestCase):
    """Test the create API of the shared live media object."""

    def _post_url(self, video):
        """Return the url to use in tests."""
        return f"/api/videos/{video.pk}/sharedlivemedias/"

    maxDiff = None

    def test_api_shared_live_media_create_anonymous(self):
        """An anonymous user can't create a shared live media."""
        video = VideoFactory()
        response = self.client.post(self._post_url(video))
        self.assertEqual(response.status_code, 401)
        self.assertFalse(SharedLiveMedia.objects.exists())

    def test_api_shared_live_media_create_instructor(self):
        """An instructor should be able to create a shared live media for an existing video."""

        video = VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        response = self.client.post(
            self._post_url(video),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(SharedLiveMedia.objects.count(), 1)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "id": str(SharedLiveMedia.objects.first().id),
                "active_stamp": None,
                "filename": None,
                "is_ready_to_show": False,
                "nb_pages": None,
                "show_download": True,
                "title": None,
                "upload_state": "pending",
                "urls": None,
                "video": str(video.id),
            },
        )

    def test_api_shared_live_media_create_instructor_in_read_only(self):
        """An instructor in read only should not be able to create a shared live media."""
        video = VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            permissions__can_update=False,
        )

        response = self.client.post(
            self._post_url(video),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(SharedLiveMedia.objects.exists())

    def test_api_shared_live_media_create_student(self):
        """A student should not be able to create a shared live media."""
        video = VideoFactory()
        jwt_token = StudentLtiTokenFactory(resource=video)

        response = self.client.post(
            self._post_url(video),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(SharedLiveMedia.objects.exists())

    def test_api_shared_live_media_create_staff_or_user(self):
        """Users authenticated via a session shouldn't be able to create new shared live medias."""
        video = VideoFactory()
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            response = self.client.post(self._post_url(video))
            self.assertEqual(response.status_code, 401)
            self.assertFalse(SharedLiveMedia.objects.exists())

    def test_api_shared_live_media_create_by_user_with_no_access(self):
        """
        Token user without any access creates a shared live media for a video.

        A user with a user token, without any specific access, cannot create a shared live
        media for any given video.
        """
        video = VideoFactory()

        jwt_token = UserAccessTokenFactory()

        response = self.client.post(
            self._post_url(video),
            {"video": str(video.id)},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(SharedLiveMedia.objects.count(), 0)

    def test_api_shared_live_media_create_by_video_playlist_instructor(self):
        """
        Playlist instructor token user creates a shared live media for a video.

        A user with a user token, who is a playlist instructor, can create a shared
        live media for a video that belongs to that playlist.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = PlaylistFactory()
        video = VideoFactory(playlist=playlist)
        PlaylistAccessFactory(user=user, playlist=playlist, role=INSTRUCTOR)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            self._post_url(video),
            {"video": str(video.id)},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(SharedLiveMedia.objects.count(), 1)
        self.assertEqual(
            response.json(),
            {
                "id": str(SharedLiveMedia.objects.first().id),
                "active_stamp": None,
                "filename": None,
                "is_ready_to_show": False,
                "nb_pages": None,
                "show_download": True,
                "title": None,
                "upload_state": "pending",
                "urls": None,
                "video": str(video.id),
            },
        )

    def test_api_shared_live_media_create_by_video_playlist_admin(self):
        """
        Playlist administrator token user creates a shared live media for a video.

        A user with a user token, who is a playlist administrator, can create a shared
        live media for a video that belongs to that playlist.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = PlaylistFactory()
        video = VideoFactory(playlist=playlist)
        PlaylistAccessFactory(user=user, playlist=playlist, role=ADMINISTRATOR)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            self._post_url(video),
            {"video": str(video.id)},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(SharedLiveMedia.objects.count(), 1)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "id": str(SharedLiveMedia.objects.first().id),
                "active_stamp": None,
                "filename": None,
                "is_ready_to_show": False,
                "nb_pages": None,
                "show_download": True,
                "title": None,
                "upload_state": "pending",
                "urls": None,
                "video": str(video.id),
            },
        )

    def test_api_shared_live_media_create_by_video_organization_instructor(self):
        """
        Organization instructor token user creates a shared live media for a video.

        A user with a user token, who is an organization instructor, cannot create a shared
        live media for a video that belongs to that organization.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        organization = OrganizationFactory()
        playlist = PlaylistFactory(organization=organization)
        video = VideoFactory(playlist=playlist)
        OrganizationAccessFactory(user=user, organization=organization, role=INSTRUCTOR)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            self._post_url(video),
            {"video": str(video.id)},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(SharedLiveMedia.objects.count(), 0)

    def test_api_shared_live_media_create_by_video_organization_admin(self):
        """
        Organization administrator token user creates a shared live media for a video.

        A user with a user token, who is an organization administrator, can create a shared
        live media for a video that belongs to that organization.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        organization = OrganizationFactory()
        playlist = PlaylistFactory(organization=organization)
        video = VideoFactory(playlist=playlist)
        OrganizationAccessFactory(
            user=user, organization=organization, role=ADMINISTRATOR
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            self._post_url(video),
            {"video": str(video.id)},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)

        self.assertEqual(SharedLiveMedia.objects.count(), 1)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "id": str(SharedLiveMedia.objects.first().id),
                "active_stamp": None,
                "filename": None,
                "is_ready_to_show": False,
                "nb_pages": None,
                "show_download": True,
                "title": None,
                "upload_state": "pending",
                "urls": None,
                "video": str(video.id),
            },
        )


class SharedLiveMediaCreateAPIOldTest(SharedLiveMediaCreateAPITest):
    """Test the create API of the shared live media object."""

    def _post_url(self, video):
        """Return the url to use in tests."""
        return "/api/sharedlivemedias/"
