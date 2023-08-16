"""Tests for the file_depositories create API."""
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
from marsha.deposit.models import FileDepository


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(DEPOSIT_ENABLED=True)
class FileDepositoryCreateAPITest(TestCase):
    """Test for the FileDepository create API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use DEPOSIT_ENABLED
        reload_urlconf()

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

    def test_api_file_depository_create_instructor(self):
        """An instructor should be able to create a file_depository."""
        playlist = core_factories.PlaylistFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=playlist)

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

    def test_api_file_depository_create_user_access_token(self):
        """A user with UserAccessToken should not be able to create a file depository."""
        organization_access = OrganizationAccessFactory()
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.post(
            "/api/filedepositories/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_file_depository_create_user_access_token_organization_admin(self):
        """An organization administrator should be able to create a file depository."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

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

        response2 = self.client.post(
            "/api/filedepositories/",
            {
                "lti_id": "file_depository_two",
                "playlist": str(playlist.id),
                "title": "file_depository two",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(FileDepository.objects.count(), 2)
        self.assertEqual(response2.status_code, 201)
        file_depository2 = FileDepository.objects.latest("created_on")
        self.assertEqual(
            response2.json(),
            {
                "description": "",
                "id": str(file_depository2.id),
                "lti_id": "file_depository_two",
                "playlist": {
                    "id": str(playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "title": "file_depository two",
            },
        )

    def test_api_file_depository_create_user_access_token_playlist_admin(self):
        """A playlist administrator should be able to create a file depository."""
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        self.assertEqual(FileDepository.objects.count(), 0)

        response = self.client.post(
            "/api/filedepositories/",
            {
                "lti_id": "file_depository_one",
                "playlist": str(playlist_access.playlist.id),
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
                    "id": str(playlist_access.playlist.id),
                    "lti_id": playlist_access.playlist.lti_id,
                    "title": playlist_access.playlist.title,
                },
                "title": "Some file_depository",
            },
        )

        response2 = self.client.post(
            "/api/filedepositories/",
            {
                "lti_id": "file_depository_two",
                "playlist": str(playlist_access.playlist.id),
                "title": "file_depository two",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(FileDepository.objects.count(), 2)
        self.assertEqual(response2.status_code, 201)
        file_depository2 = FileDepository.objects.latest("created_on")
        self.assertEqual(
            response2.json(),
            {
                "description": "",
                "id": str(file_depository2.id),
                "lti_id": "file_depository_two",
                "playlist": {
                    "id": str(playlist_access.playlist.id),
                    "lti_id": playlist_access.playlist.lti_id,
                    "title": playlist_access.playlist.title,
                },
                "title": "file_depository two",
            },
        )
