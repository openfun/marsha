"""Tests for the file_depositories list API."""
from django.test import TestCase, override_settings

from marsha.core.factories import (
    OrganizationAccessFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
    UserFactory,
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
class FileDepositoryListAPITest(TestCase):
    """Test for the FileDepository list API."""

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

    def test_api_file_depository_fetch_list_user_access_token_playlist_admin(self):
        """
        A user with UserAccessToken should be able to fetch a file depository list from a playlist
        he is administrator.
        """
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        file_depositories = FileDepositoryFactory.create_batch(
            3, playlist=playlist_access.playlist
        )
        FileDepositoryFactory()

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        response = self.client.get(
            "/api/filedepositories/?limit=2", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 3,
                "next": "http://testserver/api/filedepositories/?limit=2&offset=2",
                "previous": None,
                "results": [
                    {
                        "description": file_depositories[2].description,
                        "id": str(file_depositories[2].id),
                        "lti_id": str(file_depositories[2].lti_id),
                        "playlist": {
                            "id": str(playlist_access.playlist.id),
                            "lti_id": playlist_access.playlist.lti_id,
                            "title": playlist_access.playlist.title,
                        },
                        "title": file_depositories[2].title,
                    },
                    {
                        "description": file_depositories[1].description,
                        "id": str(file_depositories[1].id),
                        "lti_id": str(file_depositories[1].lti_id),
                        "playlist": {
                            "id": str(playlist_access.playlist.id),
                            "lti_id": playlist_access.playlist.lti_id,
                            "title": playlist_access.playlist.title,
                        },
                        "title": file_depositories[1].title,
                    },
                ],
            },
        )

    def test_api_file_depository_fetch_list_user_access_token_organization_admin(self):
        """A user with UserAccessToken should be able to fetch a file depository list."""
        organization_access_admin = OrganizationAccessFactory(role=ADMINISTRATOR)
        organization_access = OrganizationAccessFactory(
            user=organization_access_admin.user
        )
        playlist_1_a = PlaylistFactory(
            organization=organization_access_admin.organization
        )
        playlist_1_b = PlaylistFactory(
            organization=organization_access_admin.organization
        )
        playlist_2_a = PlaylistFactory(organization=organization_access.organization)
        playlist_2_b = PlaylistFactory(organization=organization_access.organization)
        FileDepositoryFactory.create_batch(3, playlist=playlist_1_a)
        file_depository_1_b = FileDepositoryFactory.create_batch(
            3, playlist=playlist_1_b
        )
        FileDepositoryFactory.create_batch(3, playlist=playlist_2_a)
        FileDepositoryFactory.create_batch(3, playlist=playlist_2_b)
        FileDepositoryFactory()

        jwt_token = UserAccessTokenFactory(user=organization_access_admin.user)

        response = self.client.get(
            "/api/filedepositories/?limit=2", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 6,
                "next": "http://testserver/api/filedepositories/?limit=2&offset=2",
                "previous": None,
                "results": [
                    {
                        "description": file_depository_1_b[2].description,
                        "id": str(file_depository_1_b[2].id),
                        "lti_id": str(file_depository_1_b[2].lti_id),
                        "playlist": {
                            "id": str(playlist_1_b.id),
                            "lti_id": playlist_1_b.lti_id,
                            "title": playlist_1_b.title,
                        },
                        "title": file_depository_1_b[2].title,
                    },
                    {
                        "description": file_depository_1_b[1].description,
                        "id": str(file_depository_1_b[1].id),
                        "lti_id": str(file_depository_1_b[1].lti_id),
                        "playlist": {
                            "id": str(playlist_1_b.id),
                            "lti_id": playlist_1_b.lti_id,
                            "title": playlist_1_b.title,
                        },
                        "title": file_depository_1_b[1].title,
                    },
                ],
            },
        )

    def test_api_file_depository_fetch_list_user_access_token_not_duplicated(self):
        """
        The file depository list must not return duplicated values
        for a user with UserAccessToken and proper rights.
        """
        user = UserFactory()

        organization_access = OrganizationAccessFactory(
            user=user,
            role=ADMINISTRATOR,
        )
        OrganizationAccessFactory.create_batch(
            5, organization=organization_access.organization
        )

        playlist = PlaylistFactory(organization=organization_access.organization)

        PlaylistAccessFactory(
            user=user,
            playlist=playlist,
            role=ADMINISTRATOR,
        )
        PlaylistAccessFactory.create_batch(5, playlist=playlist)

        file_depository = FileDepositoryFactory(playlist=playlist)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            "/api/filedepositories/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
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
                        "description": file_depository.description,
                        "id": str(file_depository.id),
                        "lti_id": str(file_depository.lti_id),
                        "playlist": {
                            "id": str(playlist.id),
                            "lti_id": playlist.lti_id,
                            "title": playlist.title,
                        },
                        "title": file_depository.title,
                    },
                ],
            },
        )

    def test_api_file_depository_fetch_list_user_access_token_filter_organization(self):
        """
        A user with UserAccessToken should be able to filter file depository list
        by organization.
        """
        organization_access_admin_1 = OrganizationAccessFactory(role=ADMINISTRATOR)
        organization_access_admin_2 = OrganizationAccessFactory(
            user=organization_access_admin_1.user, role=ADMINISTRATOR
        )
        playlist_1_a = PlaylistFactory(
            organization=organization_access_admin_1.organization
        )
        playlist_1_b = PlaylistFactory(
            organization=organization_access_admin_1.organization
        )
        playlist_2_a = PlaylistFactory(
            organization=organization_access_admin_2.organization
        )
        playlist_2_b = PlaylistFactory(
            organization=organization_access_admin_2.organization
        )
        FileDepositoryFactory.create_batch(3, playlist=playlist_1_a)
        FileDepositoryFactory.create_batch(3, playlist=playlist_1_b)
        FileDepositoryFactory.create_batch(3, playlist=playlist_2_a)
        file_depository_2_b = FileDepositoryFactory.create_batch(
            3, playlist=playlist_2_b
        )
        FileDepositoryFactory()

        jwt_token = UserAccessTokenFactory(user=organization_access_admin_1.user)

        response = self.client.get(
            "/api/filedepositories/?limit=2"
            f"&organization={organization_access_admin_2.organization.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 6,
                "next": (
                    "http://testserver/api/filedepositories/"
                    f"?limit=2&offset=2&organization={organization_access_admin_2.organization.id}"
                ),
                "previous": None,
                "results": [
                    {
                        "description": file_depository_2_b[2].description,
                        "id": str(file_depository_2_b[2].id),
                        "lti_id": str(file_depository_2_b[2].lti_id),
                        "playlist": {
                            "id": str(playlist_2_b.id),
                            "lti_id": playlist_2_b.lti_id,
                            "title": playlist_2_b.title,
                        },
                        "title": file_depository_2_b[2].title,
                    },
                    {
                        "description": file_depository_2_b[1].description,
                        "id": str(file_depository_2_b[1].id),
                        "lti_id": str(file_depository_2_b[1].lti_id),
                        "playlist": {
                            "id": str(playlist_2_b.id),
                            "lti_id": playlist_2_b.lti_id,
                            "title": playlist_2_b.title,
                        },
                        "title": file_depository_2_b[1].title,
                    },
                ],
            },
        )

    def test_api_file_depository_fetch_list_user_access_token_filter_playlist(self):
        """
        A user with UserAccessToken should be able to filter file depository list
        by playlist.
        """
        organization_access_admin = OrganizationAccessFactory(role=ADMINISTRATOR)
        organization_access = OrganizationAccessFactory(
            user=organization_access_admin.user
        )
        playlist_1_a = PlaylistFactory(
            organization=organization_access_admin.organization
        )
        playlist_1_b = PlaylistFactory(
            organization=organization_access_admin.organization
        )
        playlist_2_a = PlaylistFactory(organization=organization_access.organization)
        playlist_2_b = PlaylistFactory(organization=organization_access.organization)
        FileDepositoryFactory.create_batch(3, playlist=playlist_1_a)
        file_depository_1_b = FileDepositoryFactory.create_batch(
            3, playlist=playlist_1_b
        )
        FileDepositoryFactory.create_batch(3, playlist=playlist_2_a)
        FileDepositoryFactory.create_batch(3, playlist=playlist_2_b)
        FileDepositoryFactory()

        jwt_token = UserAccessTokenFactory(user=organization_access_admin.user)

        response = self.client.get(
            f"/api/filedepositories/?limit=2&playlist={playlist_1_b.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 3,
                "next": (
                    "http://testserver/api/filedepositories/"
                    f"?limit=2&offset=2&playlist={playlist_1_b.id}"
                ),
                "previous": None,
                "results": [
                    {
                        "description": file_depository_1_b[2].description,
                        "id": str(file_depository_1_b[2].id),
                        "lti_id": str(file_depository_1_b[2].lti_id),
                        "playlist": {
                            "id": str(playlist_1_b.id),
                            "lti_id": playlist_1_b.lti_id,
                            "title": playlist_1_b.title,
                        },
                        "title": file_depository_1_b[2].title,
                    },
                    {
                        "description": file_depository_1_b[1].description,
                        "id": str(file_depository_1_b[1].id),
                        "lti_id": str(file_depository_1_b[1].lti_id),
                        "playlist": {
                            "id": str(playlist_1_b.id),
                            "lti_id": playlist_1_b.lti_id,
                            "title": playlist_1_b.title,
                        },
                        "title": file_depository_1_b[1].title,
                    },
                ],
            },
        )
