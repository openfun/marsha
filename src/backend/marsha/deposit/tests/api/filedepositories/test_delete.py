"""Tests for the file_depositories delete API."""
from django.test import TestCase, override_settings

from marsha.core import factories as core_factories
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
from marsha.deposit.factories import FileDepositoryFactory
from marsha.deposit.models import FileDepository


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(DEPOSIT_ENABLED=True)
class FileDepositoryDeleteAPITest(TestCase):
    """Test for the FileDepository delete API."""

    maxDiff = None

    def test_api_file_depository_delete_anonymous(self):
        """An anonymous should not be able to delete a file_depository."""
        file_depository = FileDepositoryFactory()

        self.assertEqual(FileDepository.objects.count(), 1)
        response = self.client.delete(f"/api/filedepositories/{file_depository.id!s}/")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(FileDepository.objects.count(), 1)

    def test_api_file_depository_delete_user_logged_in(self):
        """An logged in user should not be able to delete a file_depository."""
        user = core_factories.UserFactory(
            first_name="Jane", last_name="Doe", email="jane.doe@example.com"
        )
        file_depository = FileDepositoryFactory()
        self.client.force_login(user)

        self.assertEqual(FileDepository.objects.count(), 1)
        response = self.client.delete(f"/api/filedepositories/{file_depository.id!s}/")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(FileDepository.objects.count(), 1)

    def test_api_file_depository_delete_student(self):
        """A student user should not be able to delete a file_depository."""
        file_depository = FileDepositoryFactory()
        jwt_token = StudentLtiTokenFactory(resource=file_depository.playlist)

        self.assertEqual(FileDepository.objects.count(), 1)
        response = self.client.delete(
            f"/api/filedepositories/{file_depository.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(FileDepository.objects.count(), 1)

    def test_api_file_depository_delete_instructor_read_only(self):
        """An instructor should not be able to delete a file_depository in read_only."""
        file_depository = FileDepositoryFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=file_depository.playlist,
            permissions__can_update=False,
        )

        self.assertEqual(FileDepository.objects.count(), 1)
        response = self.client.delete(
            f"/api/filedepositories/{file_depository.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(FileDepository.objects.count(), 1)

    def test_api_file_depository_delete_instructor(self):
        """An instructor should be able to delete a file_depository."""
        file_depository = FileDepositoryFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=file_depository.playlist)

        self.assertEqual(FileDepository.objects.count(), 1)
        response = self.client.delete(
            f"/api/filedepositories/{file_depository.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 204)
        self.assertEqual(FileDepository.objects.count(), 0)

    def test_api_file_depository_delete_user_access_token(self):
        """A user with UserAccessToken user should not be able to delete a file_depository."""
        organization_access = OrganizationAccessFactory()
        playlist = PlaylistFactory(organization=organization_access.organization)
        file_depository = FileDepositoryFactory(playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        self.assertEqual(FileDepository.objects.count(), 1)
        response = self.client.delete(
            f"/api/filedepositories/{file_depository.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(FileDepository.objects.count(), 1)

    def test_api_file_depository_delete_user_access_token_organization_admin(self):
        """An organization administrator should be able to delete a file depository."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        file_depository = FileDepositoryFactory(playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        self.assertEqual(FileDepository.objects.count(), 1)
        response = self.client.delete(
            f"/api/filedepositories/{file_depository.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(FileDepository.objects.count(), 0)

    def test_api_file_depository_delete_user_access_token_playlist_admin(self):
        """A playlist administrator should be able to delete a file depository."""
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        file_depository = FileDepositoryFactory(playlist=playlist_access.playlist)
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        self.assertEqual(FileDepository.objects.count(), 1)
        response = self.client.delete(
            f"/api/filedepositories/{file_depository.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(FileDepository.objects.count(), 0)
