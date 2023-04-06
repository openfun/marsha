"""Tests for the Markdown image initiate-upload API."""
from datetime import datetime, timezone as baseTimezone
import json
from unittest import mock

from django.test import TestCase

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
from marsha.markdown.api import timezone
from marsha.markdown.factories import MarkdownDocumentFactory, MarkdownImageFactory


class MarkdownImageInitiateUploadApiTest(TestCase):
    """Test the initiate-upload API of the Markdown image object."""

    maxDiff = None

    def test_api_markdown_image_initiate_upload_anonymous(self):
        """Anonymous users are not allowed to initiate an upload."""
        markdown_image = MarkdownImageFactory()

        response = self.client.post(
            f"/api/markdown-images/{markdown_image.id}/initiate-upload/"
        )
        self.assertEqual(response.status_code, 401)

    def test_api_markdown_image_initiate_upload_student(self):
        """Student users should not be allowed to initiate an upload."""
        markdown_image = MarkdownImageFactory()
        jwt_token = StudentLtiTokenFactory(resource=markdown_image.markdown_document)

        response = self.client.post(
            f"/api/markdown-images/{markdown_image.id}/initiate-upload/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_markdown_image_initiate_upload_instructor(self):
        """Instructor users should be allowed to initiate an upload."""
        markdown_document = MarkdownDocumentFactory(
            id="c10b79b6-9ecc-4aba-bf9d-5aab4765fd40",
        )
        markdown_image = MarkdownImageFactory(
            id="4ab8079e-ff4d-4d06-9922-4929e4f7a6eb",
            markdown_document=markdown_document,
            upload_state="ready",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=markdown_document)

        # Get the upload policy for this Markdown image
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/markdown-images/{markdown_image.id}/initiate-upload/",
                data={"filename": "not_used.png", "mimetype": "image/png", "size": 10},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content),
            {
                "url": "https://test-marsha-source.s3.amazonaws.com/",
                "fields": {
                    "acl": "private",
                    "key": (
                        "c10b79b6-9ecc-4aba-bf9d-5aab4765fd40/markdown-image/"
                        "4ab8079e-ff4d-4d06-9922-4929e4f7a6eb/1533686400.png"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "aws-access-key-id/20180808/eu-west-1/s3/aws4_request",
                    "x-amz-date": "20180808T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMTgtMDgtMDlUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiB"
                        "beyJhY2wiOiAicHJpdmF0ZSJ9LCBbInN0YXJ0cy13aXRoIiwgIiRDb250ZW50LVR5cGUiLC"
                        "AiaW1hZ2UvIl0sIFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLCAwLCAxMDQ4NTc2MF0sIHsiY"
                        "nVja2V0IjogInRlc3QtbWFyc2hhLXNvdXJjZSJ9LCB7ImtleSI6ICJjMTBiNzliNi05ZWNj"
                        "LTRhYmEtYmY5ZC01YWFiNDc2NWZkNDAvbWFya2Rvd24taW1hZ2UvNGFiODA3OWUtZmY0ZC0"
                        "0ZDA2LTk5MjItNDkyOWU0ZjdhNmViLzE1MzM2ODY0MDAucG5nIn0sIHsieC1hbXotYWxnb3"
                        "JpdGhtIjogIkFXUzQtSE1BQy1TSEEyNTYifSwgeyJ4LWFtei1jcmVkZW50aWFsIjogImF3c"
                        "y1hY2Nlc3Mta2V5LWlkLzIwMTgwODA4L2V1LXdlc3QtMS9zMy9hd3M0X3JlcXVlc3QifSwg"
                        "eyJ4LWFtei1kYXRlIjogIjIwMTgwODA4VDAwMDAwMFoifV19"
                    ),
                    "x-amz-signature": (
                        "8fbe534d175f3761e883795fe4c9626e3f69d259cfd03f240caca1ef8e968ada"
                    ),
                },
            },
        )

        # The upload_state of the Markdown image should have been reset
        markdown_image.refresh_from_db()
        self.assertEqual(markdown_image.upload_state, "pending")
        self.assertEqual(markdown_image.extension, ".png")

    def test_api_markdown_image_initiate_upload_instructor_read_only(self):
        """Instructor should not be able to initiate Markdown images upload in a read_only mode."""
        markdown_image = MarkdownImageFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=markdown_image.markdown_document,
            permissions__can_update=False,
        )

        response = self.client.post(
            f"/api/markdown-images/{markdown_image.id}/initiate-upload/",
            data={"filename": "not_used.gif", "mimetype": "image/gif", "size": 10},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_markdown_image_initiate_upload_user_access_token(self):
        """A user with UserAccessToken users should not be allowed to initiate an upload."""
        organization_access = OrganizationAccessFactory()
        playlist = PlaylistFactory(organization=organization_access.organization)
        markdown_image = MarkdownImageFactory(markdown_document__playlist=playlist)

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.post(
            f"/api/markdown-images/{markdown_image.id}/initiate-upload/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_markdown_image_initiate_upload_user_access_token_organization_admin(
        self,
    ):
        """An organization administrator should be allowed to initiate an upload."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        markdown_image = MarkdownImageFactory(
            id="4ab8079e-ff4d-4d06-9922-4929e4f7a6eb",
            upload_state="ready",
            markdown_document__id="c10b79b6-9ecc-4aba-bf9d-5aab4765fd40",
            markdown_document__playlist=playlist,
        )

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        # Get the upload policy for this Markdown image
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/markdown-images/{markdown_image.id}/initiate-upload/",
                data={"filename": "not_used.png", "mimetype": "image/png", "size": 10},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content),
            {
                "url": "https://test-marsha-source.s3.amazonaws.com/",
                "fields": {
                    "acl": "private",
                    "key": (
                        "c10b79b6-9ecc-4aba-bf9d-5aab4765fd40/markdown-image/"
                        "4ab8079e-ff4d-4d06-9922-4929e4f7a6eb/1533686400.png"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "aws-access-key-id/20180808/eu-west-1/s3/aws4_request",
                    "x-amz-date": "20180808T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMTgtMDgtMDlUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiB"
                        "beyJhY2wiOiAicHJpdmF0ZSJ9LCBbInN0YXJ0cy13aXRoIiwgIiRDb250ZW50LVR5cGUiLC"
                        "AiaW1hZ2UvIl0sIFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLCAwLCAxMDQ4NTc2MF0sIHsiY"
                        "nVja2V0IjogInRlc3QtbWFyc2hhLXNvdXJjZSJ9LCB7ImtleSI6ICJjMTBiNzliNi05ZWNj"
                        "LTRhYmEtYmY5ZC01YWFiNDc2NWZkNDAvbWFya2Rvd24taW1hZ2UvNGFiODA3OWUtZmY0ZC0"
                        "0ZDA2LTk5MjItNDkyOWU0ZjdhNmViLzE1MzM2ODY0MDAucG5nIn0sIHsieC1hbXotYWxnb3"
                        "JpdGhtIjogIkFXUzQtSE1BQy1TSEEyNTYifSwgeyJ4LWFtei1jcmVkZW50aWFsIjogImF3c"
                        "y1hY2Nlc3Mta2V5LWlkLzIwMTgwODA4L2V1LXdlc3QtMS9zMy9hd3M0X3JlcXVlc3QifSwg"
                        "eyJ4LWFtei1kYXRlIjogIjIwMTgwODA4VDAwMDAwMFoifV19"
                    ),
                    "x-amz-signature": (
                        "8fbe534d175f3761e883795fe4c9626e3f69d259cfd03f240caca1ef8e968ada"
                    ),
                },
            },
        )

        # The upload_state of the Markdown image should have been reset
        markdown_image.refresh_from_db()
        self.assertEqual(markdown_image.upload_state, "pending")
        self.assertEqual(markdown_image.extension, ".png")

    def test_api_markdown_image_initiate_upload_user_access_token_playlist_admin(self):
        """A playlist administrator should be allowed to initiate an upload."""
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        markdown_image = MarkdownImageFactory(
            id="4ab8079e-ff4d-4d06-9922-4929e4f7a6eb",
            upload_state="ready",
            markdown_document__id="c10b79b6-9ecc-4aba-bf9d-5aab4765fd40",
            markdown_document__playlist=playlist_access.playlist,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        # Get the upload policy for this Markdown image
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/markdown-images/{markdown_image.id}/initiate-upload/",
                data={"filename": "not_used.png", "mimetype": "image/png", "size": 10},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content),
            {
                "url": "https://test-marsha-source.s3.amazonaws.com/",
                "fields": {
                    "acl": "private",
                    "key": (
                        "c10b79b6-9ecc-4aba-bf9d-5aab4765fd40/markdown-image/"
                        "4ab8079e-ff4d-4d06-9922-4929e4f7a6eb/1533686400.png"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "aws-access-key-id/20180808/eu-west-1/s3/aws4_request",
                    "x-amz-date": "20180808T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMTgtMDgtMDlUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiB"
                        "beyJhY2wiOiAicHJpdmF0ZSJ9LCBbInN0YXJ0cy13aXRoIiwgIiRDb250ZW50LVR5cGUiLC"
                        "AiaW1hZ2UvIl0sIFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLCAwLCAxMDQ4NTc2MF0sIHsiY"
                        "nVja2V0IjogInRlc3QtbWFyc2hhLXNvdXJjZSJ9LCB7ImtleSI6ICJjMTBiNzliNi05ZWNj"
                        "LTRhYmEtYmY5ZC01YWFiNDc2NWZkNDAvbWFya2Rvd24taW1hZ2UvNGFiODA3OWUtZmY0ZC0"
                        "0ZDA2LTk5MjItNDkyOWU0ZjdhNmViLzE1MzM2ODY0MDAucG5nIn0sIHsieC1hbXotYWxnb3"
                        "JpdGhtIjogIkFXUzQtSE1BQy1TSEEyNTYifSwgeyJ4LWFtei1jcmVkZW50aWFsIjogImF3c"
                        "y1hY2Nlc3Mta2V5LWlkLzIwMTgwODA4L2V1LXdlc3QtMS9zMy9hd3M0X3JlcXVlc3QifSwg"
                        "eyJ4LWFtei1kYXRlIjogIjIwMTgwODA4VDAwMDAwMFoifV19"
                    ),
                    "x-amz-signature": (
                        "8fbe534d175f3761e883795fe4c9626e3f69d259cfd03f240caca1ef8e968ada"
                    ),
                },
            },
        )

        # The upload_state of the Markdown image should have been reset
        markdown_image.refresh_from_db()
        self.assertEqual(markdown_image.upload_state, "pending")
        self.assertEqual(markdown_image.extension, ".png")
