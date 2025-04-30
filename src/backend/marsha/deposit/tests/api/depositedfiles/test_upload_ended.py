"""Tests for the deposited file upload ended API."""

from django.test import TestCase, override_settings

from marsha.core import factories, models
from marsha.core.defaults import READY
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    UserAccessTokenFactory,
)
from marsha.deposit.factories import DepositedFileFactory, FileDepositoryFactory


@override_settings(BBB_ENABLED=True)
class DepositedFileUploadEndedAPITest(TestCase):
    """Test the "upload-ended" API of the deposited file object."""

    maxDiff = None

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.organization = factories.OrganizationFactory()
        cls.file_depository = FileDepositoryFactory(
            playlist__organization=cls.organization
        )
        cls.deposited_file = DepositedFileFactory(
            upload_state="pending",
            file_depository=cls.file_depository,
        )

    def assert_user_cannot_end_an_upload(self, file_depository, deposited_file, token):
        """Assert the user cannot end an upload."""

        response = self.client.post(
            f"/api/filedepositories/{file_depository.pk}/depositedfiles/"
            f"{deposited_file.pk}/upload-ended/",
            {
                "file_key": f"filedepository/{deposited_file.file_depository.id}/"
                f"depositedfile/{deposited_file.pk}/foo.pdf",
            },
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(response.status_code, 403)

    def assert_user_can_end_an_upload(self, file_depository, deposited_file, token):
        """Assert the user can end an upload."""
        response = self.client.post(
            f"/api/filedepositories/{file_depository.pk}/depositedfiles/"
            f"{deposited_file.pk}/upload-ended/",
            {
                "file_key": f"filedepository/{deposited_file.file_depository.id}/"
                f"depositedfile/{deposited_file.pk}/{deposited_file.filename}",
            },
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 200)

        deposited_file.refresh_from_db()
        self.assertEqual(deposited_file.upload_state, READY)

    def test_end_upload_by_anonymous_user(self):
        """Anonymous users cannot end an upload."""
        response = self.client.post(
            f"/api/filedepositories/{self.file_depository.pk}/"
            f"depositedfiles/{self.deposited_file.pk}/upload-ended/"
        )
        self.assertEqual(response.status_code, 401)

    def test_end_upload_by_random_user(self):
        """Authenticated user without access can end an upload."""
        user = factories.UserFactory()

        jwt_token = UserAccessTokenFactory(user=user)
        self.assert_user_can_end_an_upload(
            self.file_depository, self.deposited_file, jwt_token
        )

    def test_end_upload_by_organization_student(self):
        """Organization students can end an upload."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.organization,
            role=models.STUDENT,
        )

        jwt_token = UserAccessTokenFactory(user=organization_access.user)
        self.assert_user_can_end_an_upload(
            self.file_depository, self.deposited_file, jwt_token
        )

    def test_end_upload_by_organization_instructor(self):
        """Organization instructors can end an upload."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.organization,
            role=models.INSTRUCTOR,
        )
        jwt_token = UserAccessTokenFactory(user=organization_access.user)
        self.assert_user_can_end_an_upload(
            self.file_depository, self.deposited_file, jwt_token
        )

    def test_end_upload_by_organization_administrator(self):
        """Organization administrators can end an upload."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.organization,
            role=models.ADMINISTRATOR,
        )
        jwt_token = UserAccessTokenFactory(user=organization_access.user)
        self.assert_user_can_end_an_upload(
            self.file_depository, self.deposited_file, jwt_token
        )

    def test_end_upload_by_consumer_site_any_role(self):
        """Consumer site roles can end an upload."""
        consumer_site_access = factories.ConsumerSiteAccessFactory(
            consumer_site=self.file_depository.playlist.consumer_site,
        )

        jwt_token = UserAccessTokenFactory(user=consumer_site_access.user)
        self.assert_user_can_end_an_upload(
            self.file_depository, self.deposited_file, jwt_token
        )

    def test_end_upload_by_playlist_student(self):
        """Playlist student can end an upload."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.file_depository.playlist,
            role=models.STUDENT,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        self.assert_user_can_end_an_upload(
            self.file_depository, self.deposited_file, jwt_token
        )

    def test_end_upload_by_playlist_instructor(self):
        """Playlist instructor can end an upload."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.file_depository.playlist,
            role=models.INSTRUCTOR,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        self.assert_user_can_end_an_upload(
            self.file_depository, self.deposited_file, jwt_token
        )

    def test_end_upload_by_lti_instructor(self):
        """Playlist instructor can end an upload."""
        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=self.file_depository.playlist
        )

        self.assert_user_can_end_an_upload(
            self.file_depository, self.deposited_file, jwt_token
        )

    def test_end_upload_by_playlist_admin(self):
        """Playlist administrator can end an upload."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.file_depository.playlist,
            role=models.ADMINISTRATOR,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        self.assert_user_can_end_an_upload(
            self.file_depository, self.deposited_file, jwt_token
        )

    def test_end_upload_with_wrong_body(self):
        """Playlist administrator can end an upload."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.file_depository.playlist,
            role=models.ADMINISTRATOR,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        response = self.client.post(
            (
                f"/api/filedepositories/{self.file_depository.pk}/depositedfiles/"
                f"{self.deposited_file.pk}/upload-ended/"
            ),
            {
                "wrong_key": f"source/{self.file_depository.pk}/thumbnail/4564565456",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)

    def test_end_upload_with_forged_path(self):
        """Playlist administrator can end an upload."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.file_depository.playlist,
            role=models.ADMINISTRATOR,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        response = self.client.post(
            (
                f"/api/filedepositories/{self.file_depository.pk}/depositedfiles/"
                f"{self.deposited_file.pk}/upload-ended/"
            ),
            {
                "file_key": f"filedepository/{self.file_depository.pk}/crafted/4564565456",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)

    def test_end_upload_with_forged_stamp(self):
        """Playlist administrator can end an upload."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.file_depository.playlist,
            role=models.ADMINISTRATOR,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        response = self.client.post(
            (
                f"/api/filedepositories/{self.file_depository.pk}/depositedfiles/"
                f"{self.deposited_file.pk}/upload-ended/"
            ),
            {
                "wrong_key": f"filedepository/{self.file_depository.pk}/filedepository/"
                "crafted_stamp",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
