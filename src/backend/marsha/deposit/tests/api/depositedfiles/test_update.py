"""Tests for the deposited files update API."""
import json

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
from marsha.core.tests.testing_utils import reload_urlconf
from marsha.deposit.factories import DepositedFileFactory


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(DEPOSIT_ENABLED=True)
class DepositedFileUpdateAPITest(TestCase):
    """Test for the DepositedFile update API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use DEPOSIT_ENABLED
        reload_urlconf()

    def test_api_deposited_file_update_student(self):
        """A student user should not be able to update a deposited_file."""
        deposited_file = DepositedFileFactory()
        jwt_token = StudentLtiTokenFactory(resource=deposited_file.file_depository)
        data = {"read": True}

        response = self.client.patch(
            f"/api/filedepositories/{deposited_file.file_depository.id}"
            f"/depositedfiles/{deposited_file.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_deposited_file_update_instructor(self):
        """An instructor should be able to update a deposited_file."""
        deposited_file = DepositedFileFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=deposited_file.file_depository
        )
        data = {"read": True}

        response = self.client.patch(
            f"/api/filedepositories/{deposited_file.file_depository.id}"
            f"/depositedfiles/{deposited_file.id!s}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "author_name": deposited_file.author_name,
                "file_depository": str(deposited_file.file_depository.id),
                "filename": deposited_file.filename,
                "id": str(deposited_file.id),
                "read": True,
                "size": deposited_file.size,
                "upload_state": "pending",
                "uploaded_on": None,
                "url": None,
            },
        )

        deposited_file.refresh_from_db()
        self.assertTrue(deposited_file.read)

    def test_api_deposited_file_update_user_access_token(self):
        """A user with UserAccessToken should not be able to update a deposited_file."""
        organization_access = OrganizationAccessFactory()
        playlist = PlaylistFactory(organization=organization_access.organization)
        deposited_file = DepositedFileFactory(file_depository__playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=organization_access.user)
        data = {"read": True}

        response = self.client.patch(
            f"/api/filedepositories/{deposited_file.file_depository.id}"
            f"/depositedfiles/{deposited_file.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_deposited_file_update_user_access_token_organization_admin(self):
        """An organization administrator should be able to update a deposited_file."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        deposited_file = DepositedFileFactory(file_depository__playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=organization_access.user)
        data = {"read": True}

        response = self.client.patch(
            f"/api/filedepositories/{deposited_file.file_depository.id}"
            f"/depositedfiles/{deposited_file.id!s}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "author_name": deposited_file.author_name,
                "file_depository": str(deposited_file.file_depository.id),
                "filename": deposited_file.filename,
                "id": str(deposited_file.id),
                "read": True,
                "size": deposited_file.size,
                "upload_state": "pending",
                "uploaded_on": None,
                "url": None,
            },
        )

        deposited_file.refresh_from_db()
        self.assertTrue(deposited_file.read)

    def test_api_deposited_file_update_user_access_token_playlist_admin(self):
        """A playlist administrator should be able to update a deposited_file."""
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        deposited_file = DepositedFileFactory(
            file_depository__playlist=playlist_access.playlist
        )
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        data = {"read": True}

        response = self.client.patch(
            f"/api/filedepositories/{deposited_file.file_depository.id}"
            f"/depositedfiles/{deposited_file.id!s}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "author_name": deposited_file.author_name,
                "file_depository": str(deposited_file.file_depository.id),
                "filename": deposited_file.filename,
                "id": str(deposited_file.id),
                "read": True,
                "size": deposited_file.size,
                "upload_state": "pending",
                "uploaded_on": None,
                "url": None,
            },
        )

        deposited_file.refresh_from_db()
        self.assertTrue(deposited_file.read)
