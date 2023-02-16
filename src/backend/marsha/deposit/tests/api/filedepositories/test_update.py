"""Tests for the file_depositories update API."""
import json

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
from marsha.core.tests.testing_utils import reload_urlconf
from marsha.deposit.factories import FileDepositoryFactory


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(DEPOSIT_ENABLED=True)
class FileDepositoryUpdateAPITest(TestCase):
    """Test for the FileDepository update API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use DEPOSIT_ENABLED
        reload_urlconf()

    def test_api_file_depository_update_anonymous(self):
        """An anonymous should not be able to update a file_depository."""
        file_depository = FileDepositoryFactory()
        response = self.client.patch(f"/api/filedepositories/{file_depository.id!s}/")
        self.assertEqual(response.status_code, 401)

    def test_api_file_depository_update_user_logged_in(self):
        """An logged in user should not be able to update a file_depository."""
        user = core_factories.UserFactory(
            first_name="Jane", last_name="Doe", email="jane.doe@example.com"
        )
        file_depository = FileDepositoryFactory()
        self.client.force_login(user)
        response = self.client.patch(f"/api/filedepositories/{file_depository.id!s}/")
        self.assertEqual(response.status_code, 401)

    def test_api_file_depository_update_student(self):
        """A student user should not be able to update a file_depository."""
        file_depository = FileDepositoryFactory()
        jwt_token = StudentLtiTokenFactory(resource=file_depository)
        data = {"title": "new title"}

        response = self.client.patch(
            f"/api/filedepositories/{file_depository.id!s}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_file_depository_update_instructor_read_only(self):
        """An instructor should not be able to update a file_depository in read_only."""
        file_depository = FileDepositoryFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=file_depository,
            permissions__can_update=False,
        )
        data = {"title": "new title"}

        response = self.client.patch(
            f"/api/filedepositories/{file_depository.id!s}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_file_depository_update_instructor(self):
        """An instructor should be able to update a file_depository."""
        file_depository = FileDepositoryFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=file_depository)
        data = {"title": "new title", "description": "Hello"}

        response = self.client.patch(
            f"/api/filedepositories/{file_depository.id!s}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

        file_depository.refresh_from_db()
        self.assertEqual("new title", file_depository.title)
        self.assertEqual("Hello", file_depository.description)

    def test_api_file_depository_update_user_access_token(self):
        """A user with UserAccessToken user should not be able to update a file_depository."""
        organization_access = OrganizationAccessFactory()
        playlist = PlaylistFactory(organization=organization_access.organization)
        file_depository = FileDepositoryFactory(playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=organization_access.user)
        data = {"title": "new title"}

        response = self.client.patch(
            f"/api/filedepositories/{file_depository.id!s}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_file_depository_update_user_access_token_organization_admin(self):
        """An organization administrator should be able to update a file depository."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        file_depository = FileDepositoryFactory(playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=organization_access.user)
        data = {"title": "new title", "description": "Hello"}

        response = self.client.patch(
            f"/api/filedepositories/{file_depository.id!s}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

        file_depository.refresh_from_db()
        self.assertEqual("new title", file_depository.title)
        self.assertEqual("Hello", file_depository.description)

    def test_api_file_depository_update_user_access_token_playlist_admin(self):
        """A playlist administrator should be able to update a file depository."""
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        file_depository = FileDepositoryFactory(playlist=playlist_access.playlist)
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        data = {"title": "new title", "description": "Hello"}

        response = self.client.patch(
            f"/api/filedepositories/{file_depository.id!s}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

        file_depository.refresh_from_db()
        self.assertEqual("new title", file_depository.title)
        self.assertEqual("Hello", file_depository.description)
