"""Tests for the Bulk destroy API of the Marsha project."""
import json

from django.test import TestCase

from marsha.core import factories, models
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)


class VideoBulkDestroyAPITest(TestCase):
    """Test the destroy API of the video object."""

    maxDiff = None

    def _api_url(self):
        """Bulk delete api url."""
        return "/api/videos/"

    def test_api_video_bulk_delete_detail_anonymous(self):
        """Anonymous users should not be allowed to delete a list of video."""
        video1 = factories.VideoFactory()
        response = self.client.delete(self._api_url())
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )
        self.assertTrue(models.Video.objects.filter(id=video1.id).exists())

    def test_api_video_bulk_delete_detail_token_user(self):
        """A token user associated to a video should not be able to delete it or any other."""
        video1 = factories.VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video1.playlist)

        # Try deleting the video linked to the JWT token and the other one
        response = self.client.delete(
            self._api_url(),
            {"ids": [str(video1.pk)]},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertTrue(models.Video.objects.filter(id=video1.id).exists())

    def test_api_video_bulk_delete_detail_student(self):
        """Student users should not be able to delete a video."""
        video1 = factories.VideoFactory()
        jwt_token = StudentLtiTokenFactory(playlist=video1.playlist)

        response = self.client.delete(
            self._api_url(),
            {"ids": [str(video1.pk)]},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            "You do not have permission to perform this action for objects:"
            f"['{str(video1.id)}']",
        )

    def test_api_video_bulk_delete_for_one_video(self):
        """
        Delete a list of video by playlist admin.

        If admin doesn't have the permission on one of them, then
        the call must fail.
        """
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.ADMINISTRATOR, playlist=playlist, user=user
        )
        video1 = factories.VideoFactory(playlist=playlist)
        video2 = factories.VideoFactory()
        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Video.objects.count(), 2)

        response = self.client.delete(
            self._api_url(),
            {"ids": [str(video1.pk), str(video2.pk)]},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.Video.objects.count(), 2)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            f"You do not have permission to perform this action for objects:['{str(video2.id)}']",
        )

    def test_api_video_bulk_delete_detail_staff_or_user(self):
        """Users authenticated via a session should not be able to delete a list of video."""
        video1 = factories.VideoFactory()
        video2 = factories.VideoFactory()
        for user in [factories.UserFactory(), factories.UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")

            response = self.client.delete(
                self._api_url(),
                {"ids": [str(video1.pk), str(video2.pk)]},
                content_type="application/json",
            )

            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )
        self.assertTrue(models.Video.objects.filter(id=video1.id).exists())
        self.assertTrue(models.Video.objects.filter(id=video2.id).exists())

    def test_api_video_bulk_delete_by_playlist_admin(self):
        """
        Delete video by playlist admin.

        Users with an administrator role on a playlist should be able to delete videos list.
        """
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.ADMINISTRATOR, playlist=playlist, user=user
        )
        video1 = factories.VideoFactory(playlist=playlist)
        video2 = factories.VideoFactory(playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Video.objects.count(), 2)

        response = self.client.delete(
            self._api_url(),
            {"ids": [str(video1.pk), str(video2.pk)]},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(models.Video.objects.count(), 0)

    def test_api_video_bulk_delete_by_playlist_instructor(self):
        """
        Delete video by playlist instructor.

        Users with an instructor role on a playlist should be able to delete list of video.
        """
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.INSTRUCTOR, playlist=playlist, user=user
        )
        video1 = factories.VideoFactory(playlist=playlist)
        video2 = factories.VideoFactory(playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Video.objects.count(), 2)

        response = self.client.delete(
            self._api_url(),
            {"ids": [str(video1.pk), str(video2.pk)]},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(models.Video.objects.count(), 0)
        self.assertEqual(response.status_code, 204)

    def test_api_video_bulk_delete_by_organization_admin(self):
        """
        Delete video by organization admin.

        Users with an administrator role on an organization should be able to
        delete list of video from playlists linked to that organization.
        """
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)
        video1 = factories.VideoFactory(playlist=playlist)
        video2 = factories.VideoFactory(playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Video.objects.count(), 2)

        response = self.client.delete(
            self._api_url(),
            {"ids": [str(video1.pk), str(video2.pk)]},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(models.Video.objects.count(), 0)
        self.assertEqual(response.status_code, 204)

    def test_api_video_bulk_delete_by_organization_instructor(self):
        """
        Delete video by organization instructor.

        Users with an instructor role on an organization should not be able to
        delete list of video from playlists linked to that organization.
        """
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.INSTRUCTOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)
        video1 = factories.VideoFactory(playlist=playlist)
        video2 = factories.VideoFactory(playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Video.objects.count(), 2)

        response = self.client.delete(
            self._api_url(),
            {"ids": [str(video1.pk), str(video2.pk)]},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(models.Video.objects.count(), 2)
        self.assertEqual(response.status_code, 403)

    def test_api_video_instructor_bulk_delete_video_in_read_only(self):
        """
        An instructor with read_only set to true
        should not be able to delete the list of video.
        """
        video1 = factories.VideoFactory()
        video2 = factories.VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=video1.playlist,
            permissions__can_update=False,
        )

        response = self.client.delete(
            self._api_url(),
            {"ids": [str(video1.pk), str(video2.pk)]},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
