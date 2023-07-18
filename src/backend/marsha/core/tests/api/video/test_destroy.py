"""Tests for the Video destroy API of the Marsha project."""
import json

from django.test import TestCase

from marsha.core import factories, models
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)


class VideoDestroyAPITest(TestCase):
    """Test the destroy API of the video object."""

    maxDiff = None

    def test_api_video_delete_detail_anonymous(self):
        """Anonymous users should not be allowed to delete a video."""
        video = factories.VideoFactory()
        response = self.client.delete(f"/api/videos/{video.id}/")
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )
        self.assertTrue(models.Video.objects.filter(id=video.id).exists())

    def test_api_video_delete_detail_token_user(self):
        """A token user associated to a video should not be able to delete it or any other."""
        videos = factories.VideoFactory.create_batch(2)
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=videos[0].playlist)

        # Try deleting the video linked to the JWT token and the other one
        for video in videos:
            response = self.client.delete(
                f"/api/videos/{video.id}/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            self.assertEqual(response.status_code, 403)
            self.assertTrue(models.Video.objects.filter(id=video.id).exists())

    def test_api_video_delete_detail_student(self):
        """Student users should not be able to delete a video."""
        video = factories.VideoFactory()
        jwt_token = StudentLtiTokenFactory(resource=video.playlist)

        response = self.client.delete(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_video_delete_detail_staff_or_user(self):
        """Users authenticated via a session should not be able to delete a video."""
        video = factories.VideoFactory()
        for user in [factories.UserFactory(), factories.UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")

            response = self.client.delete(f"/api/videos/{video.id}/")

            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )
        self.assertTrue(models.Video.objects.filter(id=video.id).exists())

    def test_api_video_delete_by_playlist_admin(self):
        """
        Delete video by playlist admin.

        Users with an administrator role on a playlist should be able to delete videos.
        """
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.ADMINISTRATOR, playlist=playlist, user=user
        )
        video = factories.VideoFactory(playlist=playlist)

        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Video.objects.count(), 1)

        response = self.client.delete(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(models.Video.objects.count(), 0)
        self.assertEqual(response.status_code, 204)

    def test_api_video_delete_by_playlist_instructor(self):
        """
        Delete video by playlist instructor.

        Users with an instructor role on a playlist should be able to delete videos.
        """
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.INSTRUCTOR, playlist=playlist, user=user
        )
        video = factories.VideoFactory(playlist=playlist)

        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Video.objects.count(), 1)

        response = self.client.delete(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(models.Video.objects.count(), 0)
        self.assertEqual(response.status_code, 204)

    def test_api_video_delete_by_organization_admin(self):
        """
        Delete video by organization admin.

        Users with an administrator role on an organization should be able to
        delete videos from playlists linked to that organization.
        """
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)

        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Video.objects.count(), 1)

        response = self.client.delete(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(models.Video.objects.count(), 0)
        self.assertEqual(response.status_code, 204)

    def test_api_video_delete_by_organization_instructor(self):
        """
        Delete video by organization instructor.

        Users with an instructor role on an organization should not be able to
        delete videos from playlists linked to that organization.
        """
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.INSTRUCTOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)

        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Video.objects.count(), 1)

        response = self.client.delete(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(models.Video.objects.count(), 1)
        self.assertEqual(response.status_code, 403)

    def test_api_video_instructor_delete_video_in_read_only(self):
        """An instructor with read_only set to true should not be able to delete the video."""
        video = factories.VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video.playlist,
            permissions__can_update=False,
        )

        response = self.client.delete(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_video_delete_with_active_shared_live_media(self):
        """
        Deleting a video with an active shared live media is allowed
        """
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.INSTRUCTOR, playlist=playlist, user=user
        )
        video = factories.VideoFactory(playlist=playlist)
        shared_live_media = factories.SharedLiveMediaFactory(video=video)
        video.active_shared_live_media = shared_live_media
        video.active_shared_live_media_page = 1
        video.save()

        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Video.objects.count(), 1)
        self.assertEqual(models.SharedLiveMedia.objects.count(), 1)

        response = self.client.delete(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(models.Video.objects.count(), 0)
        self.assertEqual(models.SharedLiveMedia.objects.count(), 0)
        self.assertEqual(response.status_code, 204)
