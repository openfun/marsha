"""Tests for the file_depositories lti-select API."""
from django.test import TestCase, override_settings

from marsha.core import factories as core_factories
from marsha.core.simple_jwt.factories import InstructorOrAdminLtiTokenFactory
from marsha.core.tests.testing_utils import reload_urlconf
from marsha.deposit.factories import FileDepositoryFactory


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(DEPOSIT_ENABLED=True)
class FileDepositoryLTISelectAPITest(TestCase):
    """Test for the FileDepository lti-select API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use DEPOSIT_ENABLED
        reload_urlconf()

    def test_api_select_instructor_no_file_depository(self):
        """An instructor should be able to fetch a file_depository lti select."""
        playlist = core_factories.PlaylistFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=playlist)

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
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=file_depository.playlist)

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
