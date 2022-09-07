"""Tests for the file_depositories API."""
from datetime import datetime
import json
import random
from unittest import mock

from django.test import TestCase, override_settings

from marsha.core import factories as core_factories
from marsha.core.api import timezone
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    PlaylistLtiTokenFactory,
    StudentLtiTokenFactory,
)
from marsha.core.tests.utils import reload_urlconf

from ...core.tests.test_api_video import RSA_KEY_MOCK
from ..factories import DepositedFileFactory, FileDepositoryFactory
from ..models import DepositedFile, FileDepository


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(DEPOSIT_ENABLED=True)
class FileDepositoryAPITest(TestCase):
    """Test for the FileDepository API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use DEPOSIT_ENABLED
        reload_urlconf()

    def test_api_file_depository_fetch_list_anonymous(self):
        """An anonymous should not be able to fetch a list of file_depository."""
        response = self.client.get("/api/filedepositories/")
        self.assertEqual(response.status_code, 401)

    def test_api_file_depository_fetch_list_student(self):
        """A student should not be able to fetch a list of file_depository."""
        file_depository = FileDepositoryFactory()
        jwt_token = StudentLtiTokenFactory(
            resource=file_depository,
            permissions__can_update=True,
        )

        response = self.client.get(
            "/api/filedepositories/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_file_depository_fetch_list_instructor(self):
        """An instructor should not be able to fetch a file_depository list."""
        file_depository = FileDepositoryFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=file_depository)

        response = self.client.get(
            "/api/filedepositories/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_file_depository_fetch_student(self):
        """A student should be allowed to fetch a file_depository."""
        file_depository = FileDepositoryFactory()
        jwt_token = StudentLtiTokenFactory(resource=file_depository)

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

    def test_api_file_depository_fetch_instructor(self):
        """An instructor should be able to fetch a file_depository."""
        file_depository = FileDepositoryFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=file_depository)

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

    def test_api_file_depository_create_anonymous(self):
        """An anonymous should not be able to create a file_depository."""
        response = self.client.post("/api/filedepositories/")
        self.assertEqual(response.status_code, 401)

    def test_api_file_depository_create_student(self):
        """A student should not be able to create a file_depository."""
        jwt_token = StudentLtiTokenFactory()

        response = self.client.post(
            "/api/filedepositories/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_file_depository_create_student_with_playlist_token(self):
        """A student with a playlist token should not be able to create a file_depository."""
        jwt_token = PlaylistLtiTokenFactory(
            roles=["student"],
            permissions__can_update=True,
        )

        response = self.client.post(
            "/api/filedepositories/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(FileDepository.objects.count(), 0)

    def test_api_file_depository_create_instructor(self):
        """An instructor without playlist token should not be able to create a file_depository."""
        file_depository = FileDepositoryFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=file_depository)

        response = self.client.post(
            "/api/filedepositories/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_file_depository_create_instructor_with_playlist_token(self):
        """
        Create file_depository with playlist token.

        Used in the context of a lti select request (deep linking).
        """
        playlist = core_factories.PlaylistFactory()
        jwt_token = PlaylistLtiTokenFactory(playlist=playlist)

        self.assertEqual(FileDepository.objects.count(), 0)

        response = self.client.post(
            "/api/filedepositories/",
            {
                "lti_id": "file_depository_one",
                "playlist": str(playlist.id),
                "title": "Some file_depository",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(FileDepository.objects.count(), 1)
        self.assertEqual(response.status_code, 201)
        file_depository = FileDepository.objects.first()
        self.assertEqual(
            response.json(),
            {
                "description": "",
                "id": str(file_depository.id),
                "lti_id": "file_depository_one",
                "playlist": {
                    "id": str(playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "title": "Some file_depository",
            },
        )

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

    def test_api_select_instructor_no_file_depository(self):
        """An instructor should be able to fetch a file_depository lti select."""
        playlist = core_factories.PlaylistFactory()
        jwt_token = PlaylistLtiTokenFactory(playlist=playlist)

        response = self.client.get(
            "/api/filedepositories/lti-select/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            {
                "new_url": "http://testserver/lti/filedepositories/",
                "file_depositories": [],
            },
            response.json(),
        )

    def test_api_select_instructor(self):
        """An instructor should be able to fetch a file_depository lti select."""
        file_depository = FileDepositoryFactory()
        jwt_token = PlaylistLtiTokenFactory(playlist=file_depository.playlist)

        response = self.client.get(
            "/api/filedepositories/lti-select/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            {
                "new_url": "http://testserver/lti/filedepositories/",
                "file_depositories": [
                    {
                        "id": str(file_depository.id),
                        "lti_id": str(file_depository.lti_id),
                        "lti_url": "http://testserver/lti/filedepositories/"
                        + str(file_depository.id),
                        "title": file_depository.title,
                        "description": file_depository.description,
                        "playlist": {
                            "id": str(file_depository.playlist_id),
                            "title": file_depository.playlist.title,
                            "lti_id": file_depository.playlist.lti_id,
                        },
                    }
                ],
            },
            response.json(),
        )

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
            resource=file_depository,
            permissions__can_update=True,
            user__id=owned_deposited_file.author_id,
            user__full_username=owned_deposited_file.author_name,
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
                        "file_depository": str(file_depository.id),
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
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=file_depository)

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
                        "file_depository": str(file_depository.id),
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
                        "file_depository": str(file_depository.id),
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
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=file_depository)

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
                        "file_depository": str(file_depository.id),
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
                        "file_depository": str(file_depository.id),
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
                        "file_depository": str(file_depository.id),
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
                        "file_depository": str(file_depository.id),
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
                        "file_depository": str(file_depository.id),
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
                        "file_depository": str(file_depository.id),
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
                        "file_depository": str(file_depository.id),
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
                        "file_depository": str(file_depository.id),
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
        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        deposited_files = DepositedFileFactory.create_batch(
            3, file_depository=file_depository, uploaded_on=now
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=file_depository)

        now = datetime(2021, 11, 30, tzinfo=timezone.utc)
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
                "count": 3,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "author_name": deposited_files[2].author_name,
                        "file_depository": str(file_depository.id),
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
                        "file_depository": str(file_depository.id),
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
                        "file_depository": str(file_depository.id),
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


@override_settings(DEPOSIT_ENABLED=True)
class DepositedFileAPITest(TestCase):
    """Test for the DepositedFile API."""

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
                "file_depository": str(file_depository.id),
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
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        deposited_file = file_depository.deposited_files.first()
        self.assertIsNone(deposited_file.author_name)
        self.assertEqual(deposited_file.author_id, jwt_token.get("user").get("id"))

    def test_api_deposited_file_initiate_upload_student(self):
        """
        A student should be able to initiate an upload for a deposited file.

        Pdf extension should be guessed.
        """
        deposited_file = DepositedFileFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
            file_depository__id="ed08da34-7447-4141-96ff-5740315d7b99",
        )
        jwt_token = StudentLtiTokenFactory(resource=deposited_file.file_depository)

        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/depositedfiles/{deposited_file.id}/initiate-upload/",
                {"filename": "foo.pdf", "mimetype": "application/pdf"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "url": "https://test-marsha-source.s3.amazonaws.com/",
                "fields": {
                    "acl": "private",
                    "key": (
                        "ed08da34-7447-4141-96ff-5740315d7b99/depositedfile/"
                        "27a23f52-3379-46a2-94fa-697b59cfe3c7/1533686400.pdf"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "aws-access-key-id/20180808/eu-west-1/s3/aws4_request",
                    "x-amz-date": "20180808T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMTgtMDgtMDlUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBb"
                        "eyJhY2wiOiAicHJpdmF0ZSJ9LCBbImVxIiwgIiRDb250ZW50LVR5cGUiLCAiYXBwbGljYXRp"
                        "b24vcGRmIl0sIFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLCAwLCAxMDczNzQxODI0XSwgeyJi"
                        "dWNrZXQiOiAidGVzdC1tYXJzaGEtc291cmNlIn0sIHsia2V5IjogImVkMDhkYTM0LTc0NDct"
                        "NDE0MS05NmZmLTU3NDAzMTVkN2I5OS9kZXBvc2l0ZWRmaWxlLzI3YTIzZjUyLTMzNzktNDZh"
                        "Mi05NGZhLTY5N2I1OWNmZTNjNy8xNTMzNjg2NDAwLnBkZiJ9LCB7IngtYW16LWFsZ29yaXRo"
                        "bSI6ICJBV1M0LUhNQUMtU0hBMjU2In0sIHsieC1hbXotY3JlZGVudGlhbCI6ICJhd3MtYWNj"
                        "ZXNzLWtleS1pZC8yMDE4MDgwOC9ldS13ZXN0LTEvczMvYXdzNF9yZXF1ZXN0In0sIHsieC1h"
                        "bXotZGF0ZSI6ICIyMDE4MDgwOFQwMDAwMDBaIn1dfQ=="
                    ),
                    "x-amz-signature": (
                        "c8e119c968d586a465ee73b391c8533a4664d2849fb07381e390413f2952887f"
                    ),
                },
            },
        )
        deposited_file.refresh_from_db()
        self.assertEqual(deposited_file.filename, "foo.pdf")
        self.assertEqual(deposited_file.upload_state, "pending")

    def test_api_deposited_file_update_student(self):
        """A student user should not be able to update a deposited_file."""
        deposited_file = DepositedFileFactory()
        jwt_token = StudentLtiTokenFactory(resource=deposited_file.file_depository)
        data = {"read": True}

        response = self.client.patch(
            f"/api/depositedfiles/{deposited_file.id}/",
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
            f"/api/depositedfiles/{deposited_file.id!s}/",
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
