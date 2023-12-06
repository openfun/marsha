"""Tests for the retrieve Thumbnail API."""
from datetime import datetime, timezone
import json

from django.test import TestCase, override_settings

from marsha.core.defaults import AWS_PIPELINE
from marsha.core.factories import (
    ConsumerSiteAccessFactory,
    OrganizationAccessFactory,
    OrganizationFactory,
    PlaylistAccessFactory,
    ThumbnailFactory,
    UserFactory,
    VideoFactory,
)
from marsha.core.models import ADMINISTRATOR, INSTRUCTOR, STUDENT
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)


class ThumbnailRetrieveApiTest(TestCase):
    """Test the retrieve API of the thumbnail object."""

    maxDiff = None

    def _get_url(self, video, thumbnail):
        """Return the url to use to get a video thumbnail."""
        return f"/api/videos/{video.pk}/thumbnails/{thumbnail.id}/"

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.some_organization = OrganizationFactory()
        cls.some_video = VideoFactory(
            playlist__organization=cls.some_organization,
        )
        cls.some_thumbnail = ThumbnailFactory(video=cls.some_video)

    def assert_user_cannot_retrieve_thumbnail(self, user, thumbnail):
        """Assert the user cannot retrieve a thumbnail."""
        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            self._get_url(thumbnail.video, thumbnail),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def assert_user_can_retrieve_thumbnail(self, user, thumbnail):
        """Assert the user can retrieve a thumbnail."""
        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            self._get_url(thumbnail.video, thumbnail),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            response.json(),
            {
                "id": str(thumbnail.id),
                "active_stamp": None,
                "is_ready_to_show": False,
                "upload_state": "pending",
                "urls": None,
                "video": str(thumbnail.video.id),
            },
        )

    def test_api_thumbnail_read_detail_anonymous(self):
        """Anonymous users should not be allowed to retrieve a thumbnail."""
        video = VideoFactory()
        thumbnail = ThumbnailFactory(video=video)
        response = self.client.get(self._get_url(video, thumbnail))
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_thumbnail_retrieve_by_random_user(self):
        """Authenticated user without access cannot retrieve a thumbnail."""
        user = UserFactory()

        self.assert_user_cannot_retrieve_thumbnail(user, self.some_thumbnail)

    def test_api_thumbnail_retrieve_by_organization_student(self):
        """Organization students cannot retrieve a thumbnail."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=STUDENT,
        )

        self.assert_user_cannot_retrieve_thumbnail(
            organization_access.user, self.some_thumbnail
        )

    def test_api_thumbnail_retrieve_by_organization_instructor(self):
        """Organization instructors cannot retrieve a thumbnail."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=INSTRUCTOR,
        )

        self.assert_user_cannot_retrieve_thumbnail(
            organization_access.user, self.some_thumbnail
        )

    def test_api_thumbnail_retrieve_by_organization_administrator(self):
        """Organization administrators can retrieve a thumbnail."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=ADMINISTRATOR,
        )

        self.assert_user_can_retrieve_thumbnail(
            organization_access.user, self.some_thumbnail
        )

    def test_api_thumbnail_retrieve_by_consumer_site_any_role(self):
        """Consumer site roles cannot retrieve a thumbnail."""
        consumer_site_access = ConsumerSiteAccessFactory(
            consumer_site=self.some_video.playlist.consumer_site,
        )

        self.assert_user_cannot_retrieve_thumbnail(
            consumer_site_access.user, self.some_thumbnail
        )

    def test_api_thumbnail_retrieve_by_playlist_student(self):
        """Playlist student cannot retrieve a thumbnail."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=STUDENT,
        )

        self.assert_user_cannot_retrieve_thumbnail(
            playlist_access.user, self.some_thumbnail
        )

    def test_api_thumbnail_retrieve_by_playlist_instructor(self):
        """Playlist instructor cannot retrieve a thumbnail."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=INSTRUCTOR,
        )

        self.assert_user_can_retrieve_thumbnail(
            playlist_access.user, self.some_thumbnail
        )

    def test_api_thumbnail_retrieve_by_playlist_admin(self):
        """Playlist administrator can retrieve a thumbnail."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=ADMINISTRATOR,
        )

        self.assert_user_can_retrieve_thumbnail(
            playlist_access.user, self.some_thumbnail
        )

    def test_api_thumbnail_read_detail_student(self):
        """Students users should not be allowed to read a thumbnail detail."""
        video = VideoFactory()
        thumbnail = ThumbnailFactory(video=video)

        jwt_token = StudentLtiTokenFactory(playlist=video.playlist)

        response = self.client.get(
            self._get_url(video, thumbnail),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_thumbnail_instructor_read_detail_in_read_only(self):
        """Instructor should not be able to read thumbnails in a read_only mode."""
        thumbnail = ThumbnailFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=thumbnail.video.playlist,
            permissions__can_update=False,
        )

        response = self.client.get(
            self._get_url(thumbnail.video, thumbnail),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_thumbnail_read_detail_token_user(self):
        """Instructors should be able to read details of thumbnail associated to their video."""
        video = VideoFactory(
            uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc), upload_state="ready"
        )
        thumbnail = ThumbnailFactory(video=video, upload_state="pending")

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        response = self.client.get(
            self._get_url(thumbnail.video, thumbnail),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "id": str(thumbnail.id),
                "active_stamp": None,
                "is_ready_to_show": False,
                "upload_state": "pending",
                "urls": None,
                "video": str(video.id),
            },
        )

    def test_api_thumbnail_administrator_read_detail_in_read_only(self):
        """Admin should not be able to read thumbnails in a read_only mode."""
        thumbnail = ThumbnailFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=thumbnail.video.playlist,
            permissions__can_update=False,
        )

        response = self.client.get(
            self._get_url(thumbnail.video, thumbnail),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_thumbnail_read_detail_admin_user(self):
        """Admin should be able to read details of thumbnail associated to their video."""
        video = VideoFactory(
            uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc), upload_state="ready"
        )
        thumbnail = ThumbnailFactory(video=video, upload_state="pending")

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=video.playlist,
            roles=["administrator"],
        )

        response = self.client.get(
            self._get_url(video, thumbnail),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "id": str(thumbnail.id),
                "active_stamp": None,
                "is_ready_to_show": False,
                "upload_state": "pending",
                "urls": None,
                "video": str(video.id),
            },
        )

    def test_api_thumbnail_read_ready_thumbnail(self):
        """A ready thumbnail should have computed urls."""
        video = VideoFactory(
            pk="78338c1c-356e-4156-bd95-5bed71ffb655",
            uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc),
            upload_state="ready",
        )
        thumbnail = ThumbnailFactory(
            video=video,
            uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc),
            upload_state="ready",
            process_pipeline=AWS_PIPELINE,
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        response = self.client.get(
            self._get_url(video, thumbnail),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "id": str(thumbnail.id),
                "active_stamp": "1533686400",
                "is_ready_to_show": True,
                "upload_state": "ready",
                "urls": {
                    "144": "https://abc.cloudfront.net/78338c1c-356e-4156-bd95-5bed71ffb655/"
                    "thumbnails/1533686400_144.jpg",
                    "240": "https://abc.cloudfront.net/78338c1c-356e-4156-bd95-5bed71ffb655/"
                    "thumbnails/1533686400_240.jpg",
                    "480": "https://abc.cloudfront.net/78338c1c-356e-4156-bd95-5bed71ffb655/"
                    "thumbnails/1533686400_480.jpg",
                    "720": "https://abc.cloudfront.net/78338c1c-356e-4156-bd95-5bed71ffb655/"
                    "thumbnails/1533686400_720.jpg",
                    "1080": "https://abc.cloudfront.net/78338c1c-356e-4156-bd95-5bed71ffb655/"
                    "thumbnails/1533686400_1080.jpg",
                },
                "video": str(video.id),
            },
        )

    def test_api_thumbnail_retrieve_from_another_video(self):
        """Trying to retrieve a thumbnail using an other video in the url should return a 404."""

        thumbnail = ThumbnailFactory()
        other_video = VideoFactory(playlist=thumbnail.video.playlist)

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=thumbnail.video.playlist)

        response = self.client.get(
            self._get_url(other_video, thumbnail),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)
