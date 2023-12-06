"""Tests for the Thumbnail initiate-upload API."""
from datetime import datetime, timezone as baseTimezone
import json
from unittest import mock

from django.test import TestCase, override_settings

from marsha.core.api import timezone
from marsha.core.factories import ThumbnailFactory, VideoFactory
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
)


class ThumbnailInitiateUploadApiTest(TestCase):
    """Test the initiate-upload API of the thumbnail object."""

    maxDiff = None

    def _post_url(self, video, thumbnail):
        return f"/api/videos/{video.pk}/thumbnails/{thumbnail.id}/initiate-upload/"

    def test_api_thumbnail_initiate_upload_anonymous(self):
        """Anonymous users are not allowed to initiate an upload."""
        thumbnail = ThumbnailFactory()

        response = self.client.post(self._post_url(thumbnail.video, thumbnail))
        self.assertEqual(response.status_code, 401)

    def test_api_thumbnail_initiate_upload_student(self):
        """Student users should not be allowed to initiate an upload."""
        thumbnail = ThumbnailFactory()
        jwt_token = StudentLtiTokenFactory(playlist=thumbnail.video.playlist)

        response = self.client.post(
            self._post_url(thumbnail.video, thumbnail),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_thumbnail_initiate_upload_instructor(self):
        """Instructor users should not be allowed to initiate an upload."""
        video = VideoFactory(
            id="c10b79b6-9ecc-4aba-bf9d-5aab4765fd40", upload_state="ready"
        )
        thumbnail = ThumbnailFactory(
            id="4ab8079e-ff4d-4d06-9922-4929e4f7a6eb",
            video=video,
            upload_state="ready",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        # Get the upload policy for this thumbnail
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                self._post_url(thumbnail.video, thumbnail),
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content),
            {
                "url": "https://s3.fr-par.scw.cloud/test-marsha",
                "fields": {
                    "acl": "private",
                    "key": (
                        "tmp/c10b79b6-9ecc-4aba-bf9d-5aab4765fd40/thumbnail/1533686400"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "scw-access-key/20180808/fr-par/s3/aws4_request",
                    "x-amz-date": "20180808T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMTgtMDgtMDlUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBbe"
                        "yJhY2wiOiAicHJpdmF0ZSJ9LCBbInN0YXJ0cy13aXRoIiwgIiRDb250ZW50LVR5cGUiLCAiaW"
                        "1hZ2UvIl0sIFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLCAwLCAxMDQ4NTc2MF0sIHsiYnVja2V"
                        "0IjogInRlc3QtbWFyc2hhIn0sIHsia2V5IjogInRtcC9jMTBiNzliNi05ZWNjLTRhYmEtYmY5"
                        "ZC01YWFiNDc2NWZkNDAvdGh1bWJuYWlsLzE1MzM2ODY0MDAifSwgeyJ4LWFtei1hbGdvcml0a"
                        "G0iOiAiQVdTNC1ITUFDLVNIQTI1NiJ9LCB7IngtYW16LWNyZWRlbnRpYWwiOiAic2N3LWFjY2"
                        "Vzcy1rZXkvMjAxODA4MDgvZnItcGFyL3MzL2F3czRfcmVxdWVzdCJ9LCB7IngtYW16LWRhdGU"
                        "iOiAiMjAxODA4MDhUMDAwMDAwWiJ9XX0="
                    ),
                    "x-amz-signature": (
                        "49da85714886e613a6030c62c53d135e275e8940b5b80a9c50dbc5a2fefd1e59"
                    ),
                },
            },
        )

        # The upload_state of the thumbnail should have been reset
        thumbnail.refresh_from_db()
        self.assertEqual(thumbnail.upload_state, "pending")

    def test_api_thumbnail_initiate_upload_instructor_read_only(self):
        """Instructor should not be able to initiate thumbnails upload in a read_only mode."""
        thumbnail = ThumbnailFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=thumbnail.video.playlist,
            permissions__can_update=False,
        )

        response = self.client.post(
            self._post_url(thumbnail.video, thumbnail),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    @override_settings(THUMBNAIL_SOURCE_MAX_SIZE=10)
    def test_api_thumbnail_initiate_upload_file_too_large(self):
        """It should not be possible to upload a thumbnail if its size is too large."""
        video = VideoFactory(upload_state="ready")
        thumbnail = ThumbnailFactory(video=video, upload_state="ready")
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        # Get the upload policy for this thumbnail
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                self._post_url(thumbnail.video, thumbnail),
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data={
                    "filename": "foo",
                    "mimetype": "",
                    "size": 100,
                },
            )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"size": ["File too large, max size allowed is 10 Bytes"]},
        )
