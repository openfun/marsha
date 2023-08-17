"""Tests for the file_depositories retrieve API."""
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
from marsha.deposit.factories import FileDepositoryFactory


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(DEPOSIT_ENABLED=True)
class FileDepositoryRetrieveAPITest(TestCase):
    """Test for the FileDepository retrieve API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use DEPOSIT_ENABLED
        reload_urlconf()

    def test_api_file_depository_fetch_student(self):
        """A student should be allowed to fetch a file_depository."""
        file_depository = FileDepositoryFactory()
        jwt_token = StudentLtiTokenFactory(playlist=file_depository.playlist)

        response = self.client.get(
            f"/api/filedepositories/{file_depository.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertDictEqual(
            {
                "id": str(file_depository.id),
                "lti_id": str(file_depository.lti_id),
                "title": file_depository.title,
                "description": file_depository.description,
                "playlist": {
                    "id": str(file_depository.playlist.id),
                    "title": file_depository.playlist.title,
                    "lti_id": file_depository.playlist.lti_id,
                },
            },
            content,
        )

    def test_api_file_depository_fetch_from_other_file_depository(self):
        """
        Fetching a file depository using a resource token from an other resource should
        not be allowed.
        """
        file_depository = FileDepositoryFactory()
        other_file_depository = FileDepositoryFactory()
        jwt_token = StudentLtiTokenFactory(playlist=other_file_depository.playlist)

        response = self.client.get(
            f"/api/filedepositories/{file_depository.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_file_depository_fetch_instructor(self):
        """An instructor should be able to fetch a file_depository."""
        file_depository = FileDepositoryFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=file_depository.playlist)

        response = self.client.get(
            f"/api/filedepositories/{file_depository.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertDictEqual(
            {
                "id": str(file_depository.id),
                "lti_id": str(file_depository.lti_id),
                "title": file_depository.title,
                "description": file_depository.description,
                "playlist": {
                    "id": str(file_depository.playlist.id),
                    "title": file_depository.playlist.title,
                    "lti_id": file_depository.playlist.lti_id,
                },
            },
            content,
        )

    def test_api_file_depository_fetch_user_access_token(self):
        """A user with UserAccessToken should not be able to fetch a file depository."""
        organization_access = OrganizationAccessFactory()
        playlist = PlaylistFactory(organization=organization_access.organization)
        file_depository = FileDepositoryFactory(playlist=playlist)

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.get(
            f"/api/filedepositories/{file_depository.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_file_depository_fetch_user_access_token_organization_admin(self):
        """An organization administrator should be able to fetch a file depository."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        file_depository = FileDepositoryFactory(playlist=playlist)

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.get(
            f"/api/filedepositories/{file_depository.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            response.json(),
            {
                "id": str(file_depository.id),
                "lti_id": str(file_depository.lti_id),
                "title": file_depository.title,
                "description": file_depository.description,
                "playlist": {
                    "id": str(file_depository.playlist.id),
                    "title": file_depository.playlist.title,
                    "lti_id": file_depository.playlist.lti_id,
                },
            },
        )

    def test_api_file_depository_fetch_user_access_token_playlist_admin(self):
        """A playlist administrator should be able to fetch a file depository."""
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        file_depository = FileDepositoryFactory(playlist=playlist_access.playlist)

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        response = self.client.get(
            f"/api/filedepositories/{file_depository.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            response.json(),
            {
                "id": str(file_depository.id),
                "lti_id": str(file_depository.lti_id),
                "title": file_depository.title,
                "description": file_depository.description,
                "playlist": {
                    "id": str(file_depository.playlist.id),
                    "title": file_depository.playlist.title,
                    "lti_id": file_depository.playlist.lti_id,
                },
            },
        )
