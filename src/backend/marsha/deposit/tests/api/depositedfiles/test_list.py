"""Tests for the file_depositories depositedfiles API."""

from datetime import datetime, timezone as baseTimezone
from unittest import mock

from django.test import TestCase, override_settings

from marsha.core.api import timezone
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
from marsha.core.tests.testing_utils import RSA_KEY_MOCK, reload_urlconf
from marsha.deposit.factories import DepositedFileFactory, FileDepositoryFactory


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(DEPOSIT_ENABLED=True)
class FileDepositoryDepositedfilesAPITest(TestCase):
    """Test for the FileDepository depositedfiles API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use DEPOSIT_ENABLED
        reload_urlconf()

    def test_api_file_depository_list_deposited_files_anonymous(self):
        """An anonymous should not be able to fetch a list of deposited files."""
        file_depository = FileDepositoryFactory()
        response = self.client.get(
            f"/api/filedepositories/{file_depository.id}/depositedfiles/"
        )
        self.assertEqual(response.status_code, 401)

    def test_api_file_depository_list_deposited_files_student(self):
        """A student should be able to fetch a list of his own deposited files."""
        file_depository = FileDepositoryFactory()
        DepositedFileFactory.create_batch(3, file_depository=file_depository)
        owned_deposited_file = DepositedFileFactory(file_depository=file_depository)
        jwt_token = StudentLtiTokenFactory(
            playlist=file_depository.playlist,
            permissions__can_update=True,
            user__id=owned_deposited_file.author_id,
            user__full_username=owned_deposited_file.author_name,
        )

        # Same author as an other deposited file on an other file depository. Should not be listed
        other_file_depository = FileDepositoryFactory()
        DepositedFileFactory(
            file_depository=other_file_depository,
            author_id=owned_deposited_file.author_id,
        )

        response = self.client.get(
            f"/api/filedepositories/{file_depository.id}/depositedfiles/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 1,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "author_name": owned_deposited_file.author_name,
                        "file_depository_id": str(file_depository.id),
                        "filename": owned_deposited_file.filename,
                        "id": str(owned_deposited_file.id),
                        "read": False,
                        "size": owned_deposited_file.size,
                        "upload_state": "pending",
                        "uploaded_on": None,
                        "url": None,
                    }
                ],
            },
        )

    def test_api_file_depository_list_deposited_files_instructor(self):
        """An instructor should be able to fetch list of deposited files."""
        file_depository = FileDepositoryFactory()
        deposited_files = DepositedFileFactory.create_batch(
            3, file_depository=file_depository
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=file_depository.playlist)

        # Other deposited files should not be listed
        other_file_depository = FileDepositoryFactory()
        DepositedFileFactory.create_batch(3, file_depository=other_file_depository)

        response = self.client.get(
            f"/api/filedepositories/{file_depository.id}/depositedfiles/?limit=2",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 3,
                "next": f"http://testserver/api/filedepositories/{file_depository.id}"
                "/depositedfiles/?limit=2&offset=2",
                "previous": None,
                "results": [
                    {
                        "author_name": deposited_files[2].author_name,
                        "file_depository_id": str(file_depository.id),
                        "filename": deposited_files[2].filename,
                        "id": str(deposited_files[2].id),
                        "read": False,
                        "size": deposited_files[2].size,
                        "upload_state": "pending",
                        "uploaded_on": None,
                        "url": None,
                    },
                    {
                        "author_name": deposited_files[1].author_name,
                        "file_depository_id": str(file_depository.id),
                        "filename": deposited_files[1].filename,
                        "id": str(deposited_files[1].id),
                        "read": False,
                        "size": deposited_files[1].size,
                        "upload_state": "pending",
                        "uploaded_on": None,
                        "url": None,
                    },
                ],
            },
        )

    def test_api_file_depository_list_deposited_files_instructor_filtered(self):
        """An instructor should be able to fetch list of deposited files."""
        file_depository = FileDepositoryFactory()
        deposited_files_read = DepositedFileFactory.create_batch(
            2, file_depository=file_depository, read=True
        )
        deposited_files_new = DepositedFileFactory.create_batch(
            2, file_depository=file_depository
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=file_depository.playlist)

        response = self.client.get(
            f"/api/filedepositories/{file_depository.id}/depositedfiles/?limit=10",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 4,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "author_name": deposited_files_new[1].author_name,
                        "file_depository_id": str(file_depository.id),
                        "filename": deposited_files_new[1].filename,
                        "id": str(deposited_files_new[1].id),
                        "read": False,
                        "size": deposited_files_new[1].size,
                        "upload_state": "pending",
                        "uploaded_on": None,
                        "url": None,
                    },
                    {
                        "author_name": deposited_files_new[0].author_name,
                        "file_depository_id": str(file_depository.id),
                        "filename": deposited_files_new[0].filename,
                        "id": str(deposited_files_new[0].id),
                        "read": False,
                        "size": deposited_files_new[0].size,
                        "upload_state": "pending",
                        "uploaded_on": None,
                        "url": None,
                    },
                    {
                        "author_name": deposited_files_read[1].author_name,
                        "file_depository_id": str(file_depository.id),
                        "filename": deposited_files_read[1].filename,
                        "id": str(deposited_files_read[1].id),
                        "read": True,
                        "size": deposited_files_read[1].size,
                        "upload_state": "pending",
                        "uploaded_on": None,
                        "url": None,
                    },
                    {
                        "author_name": deposited_files_read[0].author_name,
                        "file_depository_id": str(file_depository.id),
                        "filename": deposited_files_read[0].filename,
                        "id": str(deposited_files_read[0].id),
                        "read": True,
                        "size": deposited_files_read[0].size,
                        "upload_state": "pending",
                        "uploaded_on": None,
                        "url": None,
                    },
                ],
            },
        )

        response = self.client.get(
            f"/api/filedepositories/{file_depository.id}/depositedfiles/?read=True&limit=10",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 2,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "author_name": deposited_files_read[1].author_name,
                        "file_depository_id": str(file_depository.id),
                        "filename": deposited_files_read[1].filename,
                        "id": str(deposited_files_read[1].id),
                        "read": True,
                        "size": deposited_files_read[1].size,
                        "upload_state": "pending",
                        "uploaded_on": None,
                        "url": None,
                    },
                    {
                        "author_name": deposited_files_read[0].author_name,
                        "file_depository_id": str(file_depository.id),
                        "filename": deposited_files_read[0].filename,
                        "id": str(deposited_files_read[0].id),
                        "read": True,
                        "size": deposited_files_read[0].size,
                        "upload_state": "pending",
                        "uploaded_on": None,
                        "url": None,
                    },
                ],
            },
        )

        response = self.client.get(
            f"/api/filedepositories/{file_depository.id}/depositedfiles/?read=False&limit=10",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 2,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "author_name": deposited_files_new[1].author_name,
                        "file_depository_id": str(file_depository.id),
                        "filename": deposited_files_new[1].filename,
                        "id": str(deposited_files_new[1].id),
                        "read": False,
                        "size": deposited_files_new[1].size,
                        "upload_state": "pending",
                        "uploaded_on": None,
                        "url": None,
                    },
                    {
                        "author_name": deposited_files_new[0].author_name,
                        "file_depository_id": str(file_depository.id),
                        "filename": deposited_files_new[0].filename,
                        "id": str(deposited_files_new[0].id),
                        "read": False,
                        "size": deposited_files_new[0].size,
                        "upload_state": "pending",
                        "uploaded_on": None,
                        "url": None,
                    },
                ],
            },
        )

    @override_settings(
        CLOUDFRONT_SIGNED_URLS_ACTIVE=True,
        CLOUDFRONT_SIGNED_PUBLIC_KEY_ID="cloudfront-access-key-id",
    )
    def test_api_file_depository_list_deposited_files_instructor_signed_urls(self):
        """All deposited files should have the same signature."""
        file_depository = FileDepositoryFactory(
            id="4e126eac-9ca8-47b1-8dcd-157686b43c60"
        )
        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        deposited_files = DepositedFileFactory.create_batch(
            3, file_depository=file_depository, uploaded_on=now
        )
        unicode_deposited_file = DepositedFileFactory(
            file_depository=file_depository, uploaded_on=now, filename="test’.pdf"
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=file_depository.playlist)

        now = datetime(2021, 11, 30, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "builtins.open", new_callable=mock.mock_open, read_data=RSA_KEY_MOCK
        ):
            response = self.client.get(
                f"/api/filedepositories/{file_depository.id}/depositedfiles/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        self.assertEqual(response.status_code, 200)

        expected_cloudfront_signature = (
            "Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9hYmMuY2xvdWRmcm9udC5uZXQvNGUxM"
            "jZlYWMtOWNhOC00N2IxLThkY2QtMTU3Njg2YjQzYzYwLyoiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuI"
            "jp7IkFXUzpFcG9jaFRpbWUiOjE2MzgyMzc2MDB9fX1dfQ__&Signature=BGMvqnlKwJW~PwkL1Om4Pp7Pk5"
            "ZLlJGgS~q5c02NIL5--QBssu6C-gbhBgfGVQOY8~YwEqkJVSFfsqX54jOvzjVi-0t4mDANocv0hD5CQAy103"
            "79gj14UQ5-4i2lcPoDdEcpsTekrtC9W1oRzZlyKSygNnL5NJKSjLy7St3TN8AK7sHbOMYTiFEpnxvuz8CaIh"
            "DLf0xG~IbILgw83w9D1xlmAFu9Mxe5KXXQZa6Z60dXcXf67AS9vO1YRTK4CxtfF5EkDI31DeOm-Fm78VZzFE"
            "j4MtdzMRQV1ag~4SruE7RMS10nIgHLN7CxpdHpybqAK4V-OWXlMsx8vSxC1bLHcQ__"
            "&Key-Pair-Id=cloudfront-access-key-id"
        )

        self.assertEqual(
            response.json(),
            {
                "count": 4,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "author_name": unicode_deposited_file.author_name,
                        "file_depository_id": str(file_depository.id),
                        "filename": unicode_deposited_file.filename,
                        "id": str(unicode_deposited_file.id),
                        "read": False,
                        "size": unicode_deposited_file.size,
                        "upload_state": "pending",
                        "uploaded_on": "2018-08-08T00:00:00Z",
                        "url": (
                            f"https://abc.cloudfront.net/{file_depository.id}/depositedfile/"
                            f"{unicode_deposited_file.id}/1533686400?response-content-disposition"
                            "=attachment%3B+filename%3Dtest%25E2%2580%2599.pdf"
                            f"&{expected_cloudfront_signature}"
                        ),
                    },
                    {
                        "author_name": deposited_files[2].author_name,
                        "file_depository_id": str(file_depository.id),
                        "filename": deposited_files[2].filename,
                        "id": str(deposited_files[2].id),
                        "read": False,
                        "size": deposited_files[2].size,
                        "upload_state": "pending",
                        "uploaded_on": "2018-08-08T00:00:00Z",
                        "url": (
                            f"https://abc.cloudfront.net/{file_depository.id}/depositedfile/"
                            f"{deposited_files[2].id}/1533686400?response-content-disposition"
                            f"=attachment%3B+filename%3D{deposited_files[2].filename}"
                            f"&{expected_cloudfront_signature}"
                        ),
                    },
                    {
                        "author_name": deposited_files[1].author_name,
                        "file_depository_id": str(file_depository.id),
                        "filename": deposited_files[1].filename,
                        "id": str(deposited_files[1].id),
                        "read": False,
                        "size": deposited_files[1].size,
                        "upload_state": "pending",
                        "uploaded_on": "2018-08-08T00:00:00Z",
                        "url": (
                            f"https://abc.cloudfront.net/{file_depository.id}/depositedfile/"
                            f"{deposited_files[1].id}/1533686400?response-content-disposition"
                            f"=attachment%3B+filename%3D{deposited_files[1].filename}"
                            f"&{expected_cloudfront_signature}"
                        ),
                    },
                    {
                        "author_name": deposited_files[0].author_name,
                        "file_depository_id": str(file_depository.id),
                        "filename": deposited_files[0].filename,
                        "id": str(deposited_files[0].id),
                        "read": False,
                        "size": deposited_files[0].size,
                        "upload_state": "pending",
                        "uploaded_on": "2018-08-08T00:00:00Z",
                        "url": (
                            f"https://abc.cloudfront.net/{file_depository.id}/depositedfile/"
                            f"{deposited_files[0].id}/1533686400?response-content-disposition"
                            f"=attachment%3B+filename%3D{deposited_files[0].filename}"
                            f"&{expected_cloudfront_signature}"
                        ),
                    },
                ],
            },
        )

    def test_api_file_depository_list_deposited_files_user_access_token(self):
        """A user with UserAccessToken should not be able to fetch a list of deposited files."""
        organization_access = OrganizationAccessFactory()
        playlist = PlaylistFactory(organization=organization_access.organization)
        file_depository = FileDepositoryFactory(playlist=playlist)

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.get(
            f"/api/filedepositories/{file_depository.id}/depositedfiles/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_file_depository_list_deposited_files_user_access_token_organization_admin(
        self,
    ):
        """An organization administrator should be able to fetch a list of deposited files."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        file_depository = FileDepositoryFactory(playlist=playlist)
        deposited_files = DepositedFileFactory.create_batch(
            3, file_depository=file_depository
        )

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.get(
            f"/api/filedepositories/{file_depository.id}/depositedfiles/?limit=2",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 3,
                "next": f"http://testserver/api/filedepositories/{file_depository.id}"
                "/depositedfiles/?limit=2&offset=2",
                "previous": None,
                "results": [
                    {
                        "author_name": deposited_files[2].author_name,
                        "file_depository_id": str(file_depository.id),
                        "filename": deposited_files[2].filename,
                        "id": str(deposited_files[2].id),
                        "read": False,
                        "size": deposited_files[2].size,
                        "upload_state": "pending",
                        "uploaded_on": None,
                        "url": None,
                    },
                    {
                        "author_name": deposited_files[1].author_name,
                        "file_depository_id": str(file_depository.id),
                        "filename": deposited_files[1].filename,
                        "id": str(deposited_files[1].id),
                        "read": False,
                        "size": deposited_files[1].size,
                        "upload_state": "pending",
                        "uploaded_on": None,
                        "url": None,
                    },
                ],
            },
        )

    def test_api_file_depository_list_deposited_files_user_access_token_playlist_admin(
        self,
    ):
        """A playlist administrator should be able to fetch a list of deposited files."""
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        file_depository = FileDepositoryFactory(playlist=playlist_access.playlist)
        deposited_files = DepositedFileFactory.create_batch(
            3, file_depository=file_depository
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        response = self.client.get(
            f"/api/filedepositories/{file_depository.id}/depositedfiles/?limit=2",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 3,
                "next": f"http://testserver/api/filedepositories/{file_depository.id}"
                "/depositedfiles/?limit=2&offset=2",
                "previous": None,
                "results": [
                    {
                        "author_name": deposited_files[2].author_name,
                        "file_depository_id": str(file_depository.id),
                        "filename": deposited_files[2].filename,
                        "id": str(deposited_files[2].id),
                        "read": False,
                        "size": deposited_files[2].size,
                        "upload_state": "pending",
                        "uploaded_on": None,
                        "url": None,
                    },
                    {
                        "author_name": deposited_files[1].author_name,
                        "file_depository_id": str(file_depository.id),
                        "filename": deposited_files[1].filename,
                        "id": str(deposited_files[1].id),
                        "read": False,
                        "size": deposited_files[1].size,
                        "upload_state": "pending",
                        "uploaded_on": None,
                        "url": None,
                    },
                ],
            },
        )
