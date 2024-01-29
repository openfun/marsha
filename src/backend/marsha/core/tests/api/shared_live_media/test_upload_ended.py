"""Tests for the shared live media upload ended API of the Marsha project."""

from unittest import mock

from django.test import TestCase

from marsha.core import factories, models
from marsha.core.defaults import PEERTUBE_PIPELINE
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)


class SharedLiveMediaUploadEndedAPITest(TestCase):
    """Test the "upload-ended" API of the shared live media object."""

    maxDiff = None

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.some_organization = factories.OrganizationFactory()
        cls.some_video = factories.VideoFactory(
            playlist__organization=cls.some_organization,
            transcode_pipeline=PEERTUBE_PIPELINE,
        )
        cls.some_shared_live_media = factories.SharedLiveMediaFactory(
            video=cls.some_video,
        )

    def assert_user_cannot_end_an_upload(self, video, shared_live_media, token):
        """Assert the user cannot end an upload."""

        response = self.client.post(
            f"/api/videos/{video.pk}/sharedlivemedias/{shared_live_media.pk}/upload-ended/",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 403)

    def assert_user_can_end_an_upload(self, video, shared_live_media, token):
        """Assert the user can end an upload."""
        with mock.patch(
            "marsha.core.api.shared_live_media.convert_shared_live_media"
        ) as mock_convert_shared_live_media:
            response = self.client.post(
                f"/api/videos/{video.id}/sharedlivemedias/{shared_live_media.pk}/upload-ended/",
                {
                    "file_key": f"tmp/{video.pk}/sharedlivemedia/"
                    f"{shared_live_media.pk}/4564565456",
                },
                HTTP_AUTHORIZATION=f"Bearer {token}",
            )

            mock_convert_shared_live_media.delay.assert_called_once_with(
                str(shared_live_media.pk), "4564565456"
            )

        self.assertEqual(response.status_code, 200)

    def test_end_upload_by_anonymous_user(self):
        """Anonymous users cannot end an upload."""
        response = self.client.post(
            f"/api/videos/{self.some_video.pk}/"
            f"sharedlivemedias/{self.some_shared_live_media.pk}/upload-ended/"
        )

        self.assertEqual(response.status_code, 401)

    def test_end_upload_by_random_user(self):
        """Authenticated user without access cannot end an upload."""
        user = factories.UserFactory()

        jwt_token = UserAccessTokenFactory(user=user)
        self.assert_user_cannot_end_an_upload(
            self.some_video, self.some_shared_live_media, jwt_token
        )

    def test_end_upload_by_organization_student(self):
        """Organization students cannot end an upload."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.some_organization,
            role=models.STUDENT,
        )

        jwt_token = UserAccessTokenFactory(user=organization_access.user)
        self.assert_user_cannot_end_an_upload(
            self.some_video, self.some_shared_live_media, jwt_token
        )

    def test_end_upload_by_organization_instructor(self):
        """Organization instructors cannot end an upload."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.some_organization,
            role=models.INSTRUCTOR,
        )
        jwt_token = UserAccessTokenFactory(user=organization_access.user)
        self.assert_user_cannot_end_an_upload(
            self.some_video, self.some_shared_live_media, jwt_token
        )

    def test_end_upload_by_organization_administrator(self):
        """Organization administrators can end an upload."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.some_organization,
            role=models.ADMINISTRATOR,
        )
        jwt_token = UserAccessTokenFactory(user=organization_access.user)
        self.assert_user_can_end_an_upload(
            self.some_video, self.some_shared_live_media, jwt_token
        )

    def test_end_upload_by_consumer_site_any_role(self):
        """Consumer site roles cannot end an upload."""
        consumer_site_access = factories.ConsumerSiteAccessFactory(
            consumer_site=self.some_video.playlist.consumer_site,
        )

        jwt_token = UserAccessTokenFactory(user=consumer_site_access.user)
        self.assert_user_cannot_end_an_upload(
            self.some_video, self.some_shared_live_media, jwt_token
        )

    def test_end_upload_by_playlist_student(self):
        """Playlist student cannot end an upload."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=models.STUDENT,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        self.assert_user_cannot_end_an_upload(
            self.some_video, self.some_shared_live_media, jwt_token
        )

    def test_end_upload_by_lti_student(self):
        """Lti student cannot end an upload."""
        jwt_token = StudentLtiTokenFactory(playlist=self.some_video.playlist)

        self.assert_user_cannot_end_an_upload(
            self.some_video, self.some_shared_live_media, jwt_token
        )

    def test_end_upload_by_playlist_instructor(self):
        """Playlist instructor cannot end an upload."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=models.INSTRUCTOR,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        self.assert_user_can_end_an_upload(
            self.some_video, self.some_shared_live_media, jwt_token
        )

    def test_end_upload_by_lti_instructor(self):
        """Playlist instructor cannot end an upload."""
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=self.some_video.playlist)

        self.assert_user_can_end_an_upload(
            self.some_video, self.some_shared_live_media, jwt_token
        )

    def test_end_upload_by_playlist_admin(self):
        """Playlist administrator can end an upload."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=models.ADMINISTRATOR,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        self.assert_user_can_end_an_upload(
            self.some_video, self.some_shared_live_media, jwt_token
        )

    def test_end_upload_with_wrong_body(self):
        """Playlist administrator can end an upload."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=models.ADMINISTRATOR,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        response = self.client.post(
            (
                f"/api/videos/{self.some_video.pk}/sharedlivemedias/"
                f"{self.some_shared_live_media.pk}/upload-ended/"
            ),
            {
                "wrong_key": f"source/{self.some_video.pk}/thumbnail/4564565456",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)

    def test_end_upload_with_forged_path(self):
        """Playlist administrator can end an upload."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=models.ADMINISTRATOR,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        response = self.client.post(
            (
                f"/api/videos/{self.some_video.pk}/sharedlivemedias/"
                f"{self.some_shared_live_media.pk}/upload-ended/"
            ),
            {
                "file_key": f"tmp/{self.some_video.pk}/crafted/4564565456",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)

    def test_end_upload_with_forged_stamp(self):
        """Playlist administrator can end an upload."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=models.ADMINISTRATOR,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        response = self.client.post(
            (
                f"/api/videos/{self.some_video.pk}/sharedlivemedias/"
                f"{self.some_shared_live_media.pk}/upload-ended/"
            ),
            {
                "wrong_key": f"tmp/{self.some_video.pk}/video/crafted_stamp",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
