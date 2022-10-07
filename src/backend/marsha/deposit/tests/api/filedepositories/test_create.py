"""Tests for the file_depositories create API."""
from django.test import TestCase, override_settings

from marsha.core import factories as core_factories
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    PlaylistLtiTokenFactory,
    StudentLtiTokenFactory,
)
from marsha.core.tests.utils import reload_urlconf
from marsha.deposit.factories import FileDepositoryFactory
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
