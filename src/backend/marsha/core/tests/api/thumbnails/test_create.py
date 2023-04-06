"""Tests for the create Thumbnail API."""
import json

from django.test import TestCase, override_settings

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


class ThumbnailCreateApiTest(TestCase):
    """Test the create API of the thumbnail object."""

    maxDiff = None

    def _post_url(self, video):
        """Return the url to use to create a thumbnail."""
        return f"/api/videos/{video.pk}/thumbnails/"

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.some_organization = OrganizationFactory()
        cls.some_video = VideoFactory(
            playlist__organization=cls.some_organization,
        )

    def assert_user_cannot_create_thumbnail(self, user, video):
        """Assert the user cannot create a thumbnail."""
        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            self._post_url(video),
            {"video": str(video.pk), "size": 10},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def assert_user_can_create_thumbnail(self, user, video):
        """Assert the user can create a thumbnail."""
        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            self._post_url(video),
            {"video": str(video.pk), "size": 10},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 201, response.content)

        created_thumbnail = Thumbnail.objects.last()

        self.assertEqual(
            response.json(),
            {
                "id": str(created_thumbnail.id),
                "active_stamp": None,
                "is_ready_to_show": False,
                "upload_state": "pending",
                "urls": None,
                "video": str(video.id),
            },
        )

    def test_api_thumbnail_create_anonymous(self):
        """Anonymous users should not be able to create a thumbnail."""
        response = self.client.post(self._post_url(self.some_video))
        self.assertEqual(response.status_code, 401)

    def test_api_thumbnail_create_by_random_user(self):
        """Authenticated user without access cannot create a thumbnail."""
        user = UserFactory()

        self.assert_user_cannot_create_thumbnail(user, self.some_video)

    def test_api_thumbnail_create_by_organization_student(self):
        """Organization students cannot create a thumbnail."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=STUDENT,
        )

        self.assert_user_cannot_create_thumbnail(
            organization_access.user, self.some_video
        )

    def test_api_thumbnail_create_by_organization_instructor(self):
        """Organization instructors cannot create a thumbnail."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=INSTRUCTOR,
        )

        self.assert_user_cannot_create_thumbnail(
            organization_access.user, self.some_video
        )

    def test_api_thumbnail_create_by_organization_administrator(self):
        """Organization administrators can create a thumbnail."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=ADMINISTRATOR,
        )

        self.assert_user_can_create_thumbnail(organization_access.user, self.some_video)

    def test_api_thumbnail_create_by_consumer_site_any_role(self):
        """Consumer site roles cannot create a thumbnail."""
        consumer_site_access = ConsumerSiteAccessFactory(
            consumer_site=self.some_video.playlist.consumer_site,
        )

        self.assert_user_cannot_create_thumbnail(
            consumer_site_access.user, self.some_video
        )

    def test_api_thumbnail_create_by_playlist_student(self):
        """Playlist student cannot create a thumbnail."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=STUDENT,
        )

        self.assert_user_cannot_create_thumbnail(playlist_access.user, self.some_video)

    def test_api_thumbnail_create_by_playlist_instructor(self):
        """Playlist instructor cannot create a thumbnail."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=INSTRUCTOR,
        )

        self.assert_user_can_create_thumbnail(playlist_access.user, self.some_video)

    def test_api_thumbnail_create_by_playlist_admin(self):
        """Playlist administrator can create a thumbnail."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=ADMINISTRATOR,
        )

        self.assert_user_can_create_thumbnail(playlist_access.user, self.some_video)

    def test_api_thumbnail_create_student(self):
        """Student users should not be able to create a thumbnail."""
        video = VideoFactory()

        jwt_token = StudentLtiTokenFactory(resource=video)

        response = self.client.post(
            "/api/thumbnails/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )

        self.assertEqual(response.status_code, 403)

    def test_api_thumbnail_create_instructor_or_admin(self):
        """LTI instructor or admin should be able to create a thumbnail."""
        video = VideoFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        response = self.client.post(
            self._post_url(video),
            {"size": 10},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 201)
        content = json.loads(response.content)
        created_thumbnail = Thumbnail.objects.last()

        self.assertEqual(
            content,
            {
                "id": str(created_thumbnail.id),
                "active_stamp": None,
                "is_ready_to_show": False,
                "upload_state": "pending",
                "urls": None,
                "video": str(video.id),
            },
        )

    @override_settings(THUMBNAIL_SOURCE_MAX_SIZE=10)
    def test_api_thumbnail_create_instructor_file_too_large(self):
        """Instructor users should not be able to create a thumbnail if file is too large"""
        video = VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        response = self.client.post(
            self._post_url(video),
            {"size": 100},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {"size": ["File too large, max size allowed is 10 Bytes"]},
        )

    def test_api_thumbnail_create_instructor_no_size_parameter_provided(self):
        """Instructor users shouldn't be able to create a thumbnail without a file size"""
        video = VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        response = self.client.post(
            self._post_url(video), HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 400)

        self.assertEqual(
            response.json(),
            {"size": ["File size is required"]},
        )

    def test_api_thumbnail_create_already_existing_instructor(self):
        """Creating a thumbnail should fail when a thumbnail already exists for the video."""
        video = VideoFactory()
        ThumbnailFactory(video=video)

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        response = self.client.post(
            self._post_url(video),
            {"size": 10},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)

        self.assertEqual(
            response.json(),
            {"video": ["Thumbnail with this Video already exists."]},
        )

    def test_api_thumbnail_instructor_create_in_read_only(self):
        """Instructor should not be able to create thumbnails in a read_only mode."""
        thumbnail = ThumbnailFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=thumbnail.video,
            permissions__can_update=False,
        )

        response = self.client.post(
            "/api/thumbnails/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )

        self.assertEqual(response.status_code, 403)


class ThumbnailCreateApiOldTest(ThumbnailCreateApiTest):
    """Test the create API of the thumbnail object."""

    def _post_url(self, video):
        """Return the url to use to create a thumbnail."""
        return "/api/thumbnails/"
