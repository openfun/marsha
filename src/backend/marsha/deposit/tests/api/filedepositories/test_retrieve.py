"""Tests for the file_depositories retrieve API."""
import json

from django.test import TestCase, override_settings

from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
)
from marsha.core.tests.utils import reload_urlconf
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
