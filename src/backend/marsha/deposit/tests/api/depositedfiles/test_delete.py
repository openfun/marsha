"""Tests for the deposited files delete API."""
from django.test import TestCase, override_settings

from marsha.core.factories import (
    OrganizationAccessFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
)
from marsha.core.models import ADMINISTRATOR
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)
from marsha.deposit.factories import DepositedFileFactory
from marsha.deposit.models import DepositedFile


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(DEPOSIT_ENABLED=True)
class DepositedFileDeleteAPITest(TestCase):
    """Test for the DepositedFile delete API."""

    maxDiff = None

    def test_api_deposited_file_delete_student(self):
        """A student user should not be able to delete a deposited_file."""
        deposited_file = DepositedFileFactory()
        jwt_token = StudentLtiTokenFactory(
            playlist=deposited_file.file_depository.playlist
        )

        self.assertEqual(DepositedFile.objects.count(), 1)
        response = self.client.delete(
            f"/api/filedepositories/{deposited_file.file_depository.id}"
            f"/depositedfiles/{deposited_file.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(DepositedFile.objects.count(), 1)

    def test_api_deposited_file_delete_instructor(self):
        """An instructor should be able to delete a deposited_file."""
        deposited_file = DepositedFileFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=deposited_file.file_depository.playlist
        )

        self.assertEqual(DepositedFile.objects.count(), 1)
        response = self.client.delete(
            f"/api/filedepositories/{deposited_file.file_depository.id}"
            f"/depositedfiles/{deposited_file.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(DepositedFile.objects.count(), 0)

    def test_api_deposited_file_delete_user_access_token(self):
        """A user with UserAccessToken should not be able to delete a deposited_file."""
        organization_access = OrganizationAccessFactory()
        playlist = PlaylistFactory(organization=organization_access.organization)
        deposited_file = DepositedFileFactory(file_depository__playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        self.assertEqual(DepositedFile.objects.count(), 1)
        response = self.client.delete(
            f"/api/filedepositories/{deposited_file.file_depository.id}"
            f"/depositedfiles/{deposited_file.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(DepositedFile.objects.count(), 1)

    def test_api_deposited_file_delete_user_access_token_organization_admin(self):
        """An organization administrator should be able to delete a deposited_file."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        deposited_file = DepositedFileFactory(file_depository__playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        self.assertEqual(DepositedFile.objects.count(), 1)
        response = self.client.delete(
            f"/api/filedepositories/{deposited_file.file_depository.id}"
            f"/depositedfiles/{deposited_file.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(DepositedFile.objects.count(), 0)

    def test_api_deposited_file_delete_user_access_token_playlist_admin(self):
        """A playlist administrator should be able to delete a deposited_file."""
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        deposited_file = DepositedFileFactory(
            file_depository__playlist=playlist_access.playlist
        )
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        self.assertEqual(DepositedFile.objects.count(), 1)
        response = self.client.delete(
            f"/api/filedepositories/{deposited_file.file_depository.id}"
            f"/depositedfiles/{deposited_file.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(DepositedFile.objects.count(), 0)
