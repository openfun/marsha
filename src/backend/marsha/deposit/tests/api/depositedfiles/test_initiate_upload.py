"""Tests for the deposited files initiate-upload API."""

from datetime import datetime, timezone as baseTimezone
import json
import random
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
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)
from marsha.core.tests.testing_utils import reload_urlconf
from marsha.deposit.factories import DepositedFileFactory


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(DEPOSIT_ENABLED=True)
class DepositedFileInitiateUploadAPITest(TestCase):
    """Test for the DepositedFile initiate-upload API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use DEPOSIT_ENABLED
        reload_urlconf()

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
        jwt_token = StudentLtiTokenFactory(
            playlist=deposited_file.file_depository.playlist
        )

        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with (
            mock.patch.object(timezone, "now", return_value=now),
            mock.patch("datetime.datetime") as mock_dt,
        ):
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/filedepositories/{deposited_file.file_depository.id}"
                f"/depositedfiles/{deposited_file.id}/initiate-upload/",
                {"filename": "foo.pdf", "mimetype": "application/pdf", "size": 10},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        response_json = response.json()
        fields = response_json["fields"]

        self.assertEqual(
            response_json["url"], "https://s3.fr-par.scw.cloud/test-marsha"
        )
        self.assertEqual(fields["acl"], "private")
        self.assertEqual(
            fields["key"],
            "filedepository/ed08da34-7447-4141-96ff-5740315d7b99/depositedfile/"
            "27a23f52-3379-46a2-94fa-697b59cfe3c7/foo.pdf",
        )
        self.assertEqual(fields["x-amz-algorithm"], "AWS4-HMAC-SHA256")
        self.assertEqual(
            fields["x-amz-credential"],
            "scw-access-key/20180808/fr-par/s3/aws4_request",
        )
        self.assertEqual(fields["x-amz-date"], "20180808T000000Z")

        deposited_file.refresh_from_db()
        self.assertEqual(deposited_file.filename, "foo.pdf")
        self.assertEqual(deposited_file.upload_state, "pending")

    def test_api_deposited_file_initiate_upload_file_without_size(self):
        "With no size field provided, the request should fail"
        deposited_file = DepositedFileFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
            file_depository__id="ed08da34-7447-4141-96ff-5740315d7b99",
        )
        jwt_token = StudentLtiTokenFactory(
            playlist=deposited_file.file_depository.playlist
        )

        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with (
            mock.patch.object(timezone, "now", return_value=now),
            mock.patch("datetime.datetime") as mock_dt,
        ):
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/filedepositories/{deposited_file.file_depository.id}"
                f"/depositedfiles/{deposited_file.id}/initiate-upload/",
                {"filename": "foo.pdf", "mimetype": "application/pdf"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"size": ["This field is required."]},
        )

    @override_settings(DEPOSITED_FILE_SOURCE_MAX_SIZE=10)
    def test_api_deposited_file_initiate_upload_file_too_large(self):
        """With a file size too large the request should fail"""
        deposited_file = DepositedFileFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
            file_depository__id="ed08da34-7447-4141-96ff-5740315d7b99",
        )
        jwt_token = StudentLtiTokenFactory(
            playlist=deposited_file.file_depository.playlist
        )

        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with (
            mock.patch.object(timezone, "now", return_value=now),
            mock.patch("datetime.datetime") as mock_dt,
        ):
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/filedepositories/{deposited_file.file_depository.id}"
                f"/depositedfiles/{deposited_file.id}/initiate-upload/",
                {"filename": "foo.pdf", "mimetype": "application/pdf", "size": 100},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )
        self.assertEqual(response.status_code, 400)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {"size": ["file too large, max size allowed is 10 Bytes"]},
        )

    def test_api_deposited_file_initiate_upload_user_access_token(self):
        """
        A user with UserAccessToken should be able to initiate an upload for a deposited file.

        Pdf extension should be guessed.
        """
        organization_access = OrganizationAccessFactory()
        playlist = PlaylistFactory(organization=organization_access.organization)
        deposited_file = DepositedFileFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
            file_depository__id="ed08da34-7447-4141-96ff-5740315d7b99",
            file_depository__playlist=playlist,
        )
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with (
            mock.patch.object(timezone, "now", return_value=now),
            mock.patch("datetime.datetime") as mock_dt,
        ):
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/filedepositories/{deposited_file.file_depository.id}"
                f"/depositedfiles/{deposited_file.id}/initiate-upload/",
                {"filename": "foo.pdf", "mimetype": "application/pdf", "size": 10},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        response_json = response.json()
        fields = response_json["fields"]

        self.assertEqual(
            response_json["url"], "https://s3.fr-par.scw.cloud/test-marsha"
        )
        self.assertEqual(fields["acl"], "private")
        self.assertEqual(
            fields["key"],
            "filedepository/ed08da34-7447-4141-96ff-5740315d7b99/depositedfile/"
            "27a23f52-3379-46a2-94fa-697b59cfe3c7/foo.pdf",
        )
        self.assertEqual(fields["x-amz-algorithm"], "AWS4-HMAC-SHA256")
        self.assertEqual(
            fields["x-amz-credential"],
            "scw-access-key/20180808/fr-par/s3/aws4_request",
        )
        self.assertEqual(fields["x-amz-date"], "20180808T000000Z")

        deposited_file.refresh_from_db()
        self.assertEqual(deposited_file.filename, "foo.pdf")
        self.assertEqual(deposited_file.upload_state, "pending")

    def test_api_deposited_file_initiate_upload_user_access_token_organization_admin(
        self,
    ):
        """
        An organization administrator should be able to initiate an upload for a deposited file.

        Pdf extension should be guessed.
        """
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        deposited_file = DepositedFileFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
            file_depository__id="ed08da34-7447-4141-96ff-5740315d7b99",
            file_depository__playlist=playlist,
        )
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with (
            mock.patch.object(timezone, "now", return_value=now),
            mock.patch("datetime.datetime") as mock_dt,
        ):
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/filedepositories/{deposited_file.file_depository.id}"
                f"/depositedfiles/{deposited_file.id}/initiate-upload/",
                {"filename": "foo.pdf", "mimetype": "application/pdf", "size": 10},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        response_json = response.json()
        fields = response_json["fields"]

        self.assertEqual(
            response_json["url"], "https://s3.fr-par.scw.cloud/test-marsha"
        )
        self.assertEqual(fields["acl"], "private")
        self.assertEqual(
            fields["key"],
            "filedepository/ed08da34-7447-4141-96ff-5740315d7b99/depositedfile/"
            "27a23f52-3379-46a2-94fa-697b59cfe3c7/foo.pdf",
        )
        self.assertEqual(fields["x-amz-algorithm"], "AWS4-HMAC-SHA256")
        self.assertEqual(
            fields["x-amz-credential"],
            "scw-access-key/20180808/fr-par/s3/aws4_request",
        )
        self.assertEqual(fields["x-amz-date"], "20180808T000000Z")

        deposited_file.refresh_from_db()
        self.assertEqual(deposited_file.filename, "foo.pdf")
        self.assertEqual(deposited_file.upload_state, "pending")

    def test_api_deposited_file_initiate_upload_user_access_token_playlist_admin(self):
        """
        A playlist administrator should be able to initiate an upload for a deposited file.

        Pdf extension should be guessed.
        """
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        deposited_file = DepositedFileFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
            file_depository__id="ed08da34-7447-4141-96ff-5740315d7b99",
            file_depository__playlist=playlist_access.playlist,
        )
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with (
            mock.patch.object(timezone, "now", return_value=now),
            mock.patch("datetime.datetime") as mock_dt,
        ):
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/filedepositories/{deposited_file.file_depository.id}"
                f"/depositedfiles/{deposited_file.id}/initiate-upload/",
                {"filename": "foo.pdf", "mimetype": "application/pdf", "size": 10},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        response_json = response.json()
        fields = response_json["fields"]

        self.assertEqual(
            response_json["url"], "https://s3.fr-par.scw.cloud/test-marsha"
        )
        self.assertEqual(fields["acl"], "private")
        self.assertEqual(
            fields["key"],
            "filedepository/ed08da34-7447-4141-96ff-5740315d7b99/depositedfile/"
            "27a23f52-3379-46a2-94fa-697b59cfe3c7/foo.pdf",
        )
        self.assertEqual(fields["x-amz-algorithm"], "AWS4-HMAC-SHA256")
        self.assertEqual(
            fields["x-amz-credential"],
            "scw-access-key/20180808/fr-par/s3/aws4_request",
        )
        self.assertEqual(fields["x-amz-date"], "20180808T000000Z")

        deposited_file.refresh_from_db()
        self.assertEqual(deposited_file.filename, "foo.pdf")
        self.assertEqual(deposited_file.upload_state, "pending")
