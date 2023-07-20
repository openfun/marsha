"""Tests for the Thumbnail delete API."""

from django.test import TestCase

from marsha.core.factories import (
    ConsumerSiteAccessFactory,
    OrganizationAccessFactory,
    OrganizationFactory,
    PlaylistAccessFactory,
    ThumbnailFactory,
    UserFactory,
    VideoFactory,
)
from marsha.core.models import ADMINISTRATOR, INSTRUCTOR, STUDENT, Thumbnail
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)


class ThumbnailDeleteApiTest(TestCase):
    """Test the delete API of the thumbnail object."""

    maxDiff = None

    def _delete_url(self, video, thumbnail):
        """Return the url to use to delete a thumbnail."""
        return f"/api/videos/{video.pk}/thumbnails/{thumbnail.id}/"

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.some_organization = OrganizationFactory()
        cls.some_video = VideoFactory(
            playlist__organization=cls.some_organization,
        )
        cls.some_thumbnail = ThumbnailFactory(video=cls.some_video)

    def assert_user_cannot_delete_thumbnail(self, user, thumbnail):
        """Assert the user cannot delete a thumbnail."""
        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.delete(
            self._delete_url(thumbnail.video, thumbnail),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def assert_user_can_delete_thumbnail(self, user, thumbnail):
        """Assert the user can delete a thumbnail."""
        self.assertEqual(Thumbnail.objects.count(), 1)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.delete(
            self._delete_url(thumbnail.video, thumbnail),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 204)

        self.assertFalse(Thumbnail.objects.filter(id=thumbnail.pk).exists())
        self.assertEqual(Thumbnail.objects.count(), 0)

    def test_api_thumbnail_delete_anonymous(self):
        """Anonymous users should not be able to delete a thumbnail."""
        video = VideoFactory()
        thumbnail = ThumbnailFactory(video=video)

        response = self.client.delete(self._delete_url(video, thumbnail))
        self.assertEqual(response.status_code, 401)

    def test_api_thumbnail_delete_by_random_user(self):
        """Authenticated user without access cannot delete a thumbnail."""
        user = UserFactory()

        self.assert_user_cannot_delete_thumbnail(user, self.some_thumbnail)

    def test_api_thumbnail_delete_by_organization_student(self):
        """Organization students cannot delete a thumbnail."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=STUDENT,
        )

        self.assert_user_cannot_delete_thumbnail(
            organization_access.user, self.some_thumbnail
        )

    def test_api_thumbnail_delete_by_organization_instructor(self):
        """Organization instructors cannot delete a thumbnail."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=INSTRUCTOR,
        )

        self.assert_user_cannot_delete_thumbnail(
            organization_access.user, self.some_thumbnail
        )

    def test_api_thumbnail_delete_by_organization_administrator(self):
        """Organization administrators can delete a thumbnail."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=ADMINISTRATOR,
        )

        self.assert_user_can_delete_thumbnail(
            organization_access.user, self.some_thumbnail
        )

    def test_api_thumbnail_delete_by_consumer_site_any_role(self):
        """Consumer site roles cannot delete a thumbnail."""
        consumer_site_access = ConsumerSiteAccessFactory(
            consumer_site=self.some_video.playlist.consumer_site,
        )

        self.assert_user_cannot_delete_thumbnail(
            consumer_site_access.user, self.some_thumbnail
        )

    def test_api_thumbnail_delete_by_playlist_student(self):
        """Playlist student cannot delete a thumbnail."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=STUDENT,
        )

        self.assert_user_cannot_delete_thumbnail(
            playlist_access.user, self.some_thumbnail
        )

    def test_api_thumbnail_delete_by_playlist_instructor(self):
        """Playlist instructor cannot delete a thumbnail."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=INSTRUCTOR,
        )

        self.assert_user_can_delete_thumbnail(playlist_access.user, self.some_thumbnail)

    def test_api_thumbnail_delete_by_playlist_admin(self):
        """Playlist administrator can delete a thumbnail."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=ADMINISTRATOR,
        )

        self.assert_user_can_delete_thumbnail(playlist_access.user, self.some_thumbnail)

    def test_api_thumbnail_delete_student(self):
        """Student users should not be able to delete a thumbnail."""
        video = VideoFactory()
        thumbnail = ThumbnailFactory(video=video)

        jwt_token = StudentLtiTokenFactory(resource=video.playlist)

        response = self.client.delete(
            self._delete_url(video, thumbnail),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_thumbnail_delete_instructor(self):
        """Instructor should be able to delete a thumbnail for its video."""
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=self.some_video.playlist)

        self.assertEqual(Thumbnail.objects.count(), 1)

        response = self.client.delete(
            self._delete_url(self.some_video, self.some_thumbnail),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Thumbnail.objects.filter(id=self.some_thumbnail.pk).exists())
        self.assertEqual(Thumbnail.objects.count(), 0)

        response = self.client.get(
            f"/api/videos/{self.some_video.pk}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        content = response.json()
        self.assertIsNone(content["thumbnail"])

        # Creating a new thumbnail should be allowed.
        response = self.client.post(
            f"/api/videos/{self.some_video.pk}/thumbnails/",
            {"size": 10},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 201)

    def test_api_thumbnail_delete_instructor_in_read_only(self):
        """Instructor should not be able to delete thumbnails in a read_only mode."""
        thumbnail = ThumbnailFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=thumbnail.video.playlist,
            permissions__can_update=False,
        )

        response = self.client.delete(
            self._delete_url(thumbnail.video, thumbnail),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_thumbnail_delete_instructor_other_video(self):
        """Instructor users should not be able to delete a thumbnail on another video."""
        video_token = VideoFactory()
        video_other = VideoFactory()
        thumbnail = ThumbnailFactory(video=video_other)

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video_token.playlist)

        response = self.client.delete(
            self._delete_url(video_other, thumbnail),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
