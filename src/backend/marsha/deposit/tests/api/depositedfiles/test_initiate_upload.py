"""Tests for the deposited files initiate-upload API."""
from datetime import datetime
import random
from unittest import mock

from django.test import TestCase, override_settings

from marsha.core.api import timezone
from marsha.core.simple_jwt.factories import StudentLtiTokenFactory
from marsha.core.tests.utils import reload_urlconf
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
