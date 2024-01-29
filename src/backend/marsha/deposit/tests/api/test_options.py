"""Tests for the deposited file options API."""

from django.test import TestCase, override_settings

from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
)
from marsha.deposit.factories import FileDepositoryFactory


@override_settings(DEPOSIT_ENABLED=True)
class DepositedFiletCreateAPITest(TestCase):
    """Test for the ClassroomDocument create API."""

    maxDiff = None

    def test_api_deposited_files_options_anonymous(self):
        """Anonymous user can't fetch the deposited files options endpoint"""

        file_depository = FileDepositoryFactory()
        response = self.client.options(
            f"/api/filedepositories/{file_depository.id}/depositedfiles/"
        )

        self.assertEqual(response.status_code, 401)

    @override_settings(DEPOSITED_FILE_SOURCE_MAX_SIZE=10)
    def test_api_deposited_files_options_as_student(self):
        """A student can fetch the deposited files options endpoint"""

        file_depository = FileDepositoryFactory()
        jwt_token = StudentLtiTokenFactory(playlist=file_depository.playlist)
        response = self.client.options(
            f"/api/filedepositories/{file_depository.id}/depositedfiles/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["upload_max_size_bytes"], 10)

    @override_settings(DEPOSITED_FILE_SOURCE_MAX_SIZE=10)
    def test_api_deposited_files_options_instructor(self):
        """An instructor can fetch the deposited files options endpoint"""

        file_depository = FileDepositoryFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=file_depository.playlist)

        response = self.client.options(
            f"/api/filedepositories/{file_depository.id}/depositedfiles/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["upload_max_size_bytes"], 10)
