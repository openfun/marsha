"""Tests for the deposited files create API."""
import json

from django.test import TestCase, override_settings

from marsha.core.factories import (
    OrganizationAccessFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
)
from marsha.core.models import ADMINISTRATOR
from marsha.core.simple_jwt.factories import (
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)
from marsha.core.tests.testing_utils import reload_urlconf
from marsha.deposit.factories import FileDepositoryFactory
from marsha.deposit.models import DepositedFile


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(DEPOSIT_ENABLED=True)
class DepositedFileCreateAPITest(TestCase):
    """Test for the DepositedFile create API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use DEPOSIT_ENABLED
        reload_urlconf()

    def test_api_deposited_file_create_student_with_user_fullname(self):
        """
        A student should be able to create a deposited file
        for an existing file deposit.
        """

        file_depository = FileDepositoryFactory()
        jwt_token = StudentLtiTokenFactory(resource=file_depository)

        response = self.client.post(
            "/api/depositedfiles/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(
                {
                    "size": 123,
                    "filename": "test.pdf",
                }
            ),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(DepositedFile.objects.count(), 1)
        self.assertEqual(
            response.json(),
            {
                "author_name": jwt_token.get("user").get("user_fullname"),
                "file_depository_id": str(file_depository.id),
                "filename": "test.pdf",
                "id": str(DepositedFile.objects.first().id),
                "read": False,
                "size": 123,
                "upload_state": "pending",
                "uploaded_on": None,
                "url": None,
            },
        )

        self.assertEqual(file_depository.deposited_files.count(), 1)
        deposited_file = file_depository.deposited_files.first()
        self.assertEqual(
            deposited_file.author_name,
            jwt_token.get("user").get("user_fullname"),
        )
        self.assertEqual(deposited_file.author_id, jwt_token.get("user").get("id"))

    def test_api_deposited_file_create_student_with_username(self):
        """
        A student should be able to create a deposited file
        for an existing file deposit.
        """

        file_depository = FileDepositoryFactory()
        jwt_token = StudentLtiTokenFactory(
            resource=file_depository, user__user_fullname=None, user__username="student"
        )

        response = self.client.post(
            "/api/depositedfiles/",
            data=json.dumps(
                {
                    "size": 123,
                    "filename": "test.pdf",
                    "file_depository_id": str(file_depository.id),
                }
            ),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        deposited_file = file_depository.deposited_files.first()
        self.assertEqual(
            deposited_file.author_name,
            jwt_token.get("user").get("username"),
        )
        self.assertEqual(deposited_file.author_id, jwt_token.get("user").get("id"))

    def test_api_deposited_file_create_student_without_username(self):
        """
        A student should be able to create a deposited file
        for an existing file deposit.
        """

        file_depository = FileDepositoryFactory()
        jwt_token = StudentLtiTokenFactory(
            resource=file_depository, user__user_fullname=None, user__username=None
        )

        response = self.client.post(
            "/api/depositedfiles/",
            data=json.dumps(
                {
                    "size": 123,
                    "filename": "test.pdf",
                    "file_depository_id": str(file_depository.id),
                }
            ),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        deposited_file = file_depository.deposited_files.first()
        self.assertIsNone(deposited_file.author_name)
        self.assertEqual(deposited_file.author_id, jwt_token.get("user").get("id"))

    def test_api_deposited_file_create_user_access_token(self):
        """
        A user with UserAccessToken should be able to create a deposited file
        for an existing file deposit.
        """
        organization_access = OrganizationAccessFactory()
        playlist = PlaylistFactory(organization=organization_access.organization)
        file_depository = FileDepositoryFactory(playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.post(
            "/api/depositedfiles/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(
                {
                    "size": 123,
                    "filename": "test.pdf",
                    "file_depository_id": str(file_depository.id),
                }
            ),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(DepositedFile.objects.count(), 1)
        self.assertEqual(
            response.json(),
            {
                "author_name": organization_access.user.username,
                "file_depository_id": str(file_depository.id),
                "filename": "test.pdf",
                "id": str(DepositedFile.objects.first().id),
                "read": False,
                "size": 123,
                "upload_state": "pending",
                "uploaded_on": None,
                "url": None,
            },
        )

        self.assertEqual(file_depository.deposited_files.count(), 1)
        deposited_file = file_depository.deposited_files.first()
        self.assertEqual(deposited_file.author_id, str(organization_access.user.id))

    def test_api_deposited_file_create_user_access_token_organization_admin(self):
        """
        An organization administrator should be able to create a deposited file
        for an existing file deposit.
        """
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        file_depository = FileDepositoryFactory(playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.post(
            "/api/depositedfiles/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(
                {
                    "size": 123,
                    "filename": "test.pdf",
                    "file_depository_id": str(file_depository.id),
                }
            ),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(DepositedFile.objects.count(), 1)
        self.assertEqual(
            response.json(),
            {
                "author_name": organization_access.user.username,
                "file_depository_id": str(file_depository.id),
                "filename": "test.pdf",
                "id": str(DepositedFile.objects.first().id),
                "read": False,
                "size": 123,
                "upload_state": "pending",
                "uploaded_on": None,
                "url": None,
            },
        )

        self.assertEqual(file_depository.deposited_files.count(), 1)
        deposited_file = file_depository.deposited_files.first()
        self.assertEqual(deposited_file.author_id, str(organization_access.user.id))

    def test_api_deposited_file_create_user_access_token_playlist_admin(self):
        """
        A playlist administrator should be able to create a deposited file
        for an existing file deposit.
        """
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        file_depository = FileDepositoryFactory(playlist=playlist_access.playlist)
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        response = self.client.post(
            "/api/depositedfiles/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(
                {
                    "size": 123,
                    "filename": "test.pdf",
                    "file_depository_id": str(file_depository.id),
                }
            ),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(DepositedFile.objects.count(), 1)
        self.assertEqual(
            response.json(),
            {
                "author_name": playlist_access.user.username,
                "file_depository_id": str(file_depository.id),
                "filename": "test.pdf",
                "id": str(DepositedFile.objects.first().id),
                "read": False,
                "size": 123,
                "upload_state": "pending",
                "uploaded_on": None,
                "url": None,
            },
        )

        self.assertEqual(file_depository.deposited_files.count(), 1)
        deposited_file = file_depository.deposited_files.first()
        self.assertEqual(deposited_file.author_id, str(playlist_access.user.id))
