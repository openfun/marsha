"""Tests for the file_depositories list API."""
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
