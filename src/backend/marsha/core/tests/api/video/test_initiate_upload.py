"""Tests for the Video initiate upload API of the Marsha project."""
from datetime import datetime, timezone as baseTimezone
import json
import random
from unittest import mock

from django.test import TestCase, override_settings

from marsha.core import factories, models
from marsha.core.api import timezone
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    UserAccessTokenFactory,
)


class VideoInitiateUploadAPITest(TestCase):
    """Test the "initiate upload" API of the video object."""

    maxDiff = None

    def test_api_video_initiate_upload_anonymous_user(self):
        """Anonymous users are not allowed to initiate an upload."""
        video = factories.VideoFactory()

        response = self.client.post(
            f"/api/videos/{video.id}/initiate-upload/",
            {"filename": "video_file", "mimetype": "", "size": 100},
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.json(), {"detail": "Authentication credentials were not provided."}
        )

    def test_api_video_instructor_initiate_upload_in_read_only(self):
        """An instructor with read_only set to true should not be able to initiate an upload."""
        video = factories.VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=video.playlist,
            permissions__can_update=False,
        )

        response = self.client.post(
            f"/api/videos/{video.id}/initiate-upload/",
            {"filename": "video_file", "mimetype": "", "size": 100},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_video_initiate_upload_token_user(self):
        """A token user associated to a video should be able to retrieve an upload policy."""
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        # Create another video to check that its upload state is unaffected
        other_video = factories.VideoFactory(
            upload_state=random.choice(["ready", "error"])
        )

        # Get the upload policy for this video
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-upload/",
                {"filename": "video_file", "mimetype": "", "size": 100},
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
                        "tmp/27a23f52-3379-46a2-94fa-697b59cfe3c7/video/1533686400"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "scw-access-key/20180808/fr-par/s3/aws4_request",
                    "x-amz-date": "20180808T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMTgtMDgtMDlUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBbe"
                        "yJhY2wiOiAicHJpdmF0ZSJ9LCBbInN0YXJ0cy13aXRoIiwgIiRDb250ZW50LVR5cGUiLCAidm"
                        "lkZW8vIl0sIFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLCAwLCAxMDczNzQxODI0XSwgeyJidWN"
                        "rZXQiOiAidGVzdC1tYXJzaGEifSwgeyJrZXkiOiAidG1wLzI3YTIzZjUyLTMzNzktNDZhMi05"
                        "NGZhLTY5N2I1OWNmZTNjNy92aWRlby8xNTMzNjg2NDAwIn0sIHsieC1hbXotYWxnb3JpdGhtI"
                        "jogIkFXUzQtSE1BQy1TSEEyNTYifSwgeyJ4LWFtei1jcmVkZW50aWFsIjogInNjdy1hY2Nlc3"
                        "Mta2V5LzIwMTgwODA4L2ZyLXBhci9zMy9hd3M0X3JlcXVlc3QifSwgeyJ4LWFtei1kYXRlIjo"
                        "gIjIwMTgwODA4VDAwMDAwMFoifV19"
                    ),
                    "x-amz-signature": (
                        "55c0c60a093f00b2936a14f8ac2629b150488c8078cbcbbbe7a1599134405825"
                    ),
                },
            },
        )

        # The upload state of the timed text track should have been reset
        video.refresh_from_db()
        self.assertEqual(video.upload_state, "pending")

        # Check that the other timed text tracks are not reset
        other_video.refresh_from_db()
        self.assertNotEqual(other_video.upload_state, "pending")

        # Try initiating an upload for the other video
        response = self.client.post(
            f"/api/videos/{other_video.id}/initiate-upload/",
            {"filename": "video_file", "mimetype": "", "size": 100},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_video_initiate_upload_staff_or_user(self):
        """Users authenticated via a session should not be able to retrieve an upload policy."""
        for user in [factories.UserFactory(), factories.UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            video = factories.VideoFactory()

            response = self.client.post(
                f"/api/videos/{video.id}/initiate-upload/",
                {"filename": "video_file", "mimetype": "", "size": 100},
            )
            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )

    def test_api_video_initiate_upload_by_organization_instructor(self):
        """Organization instructors cannot retrieve an upload policy."""
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.INSTRUCTOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            playlist=playlist,
            upload_state="ready",
        )

        jwt_token = UserAccessTokenFactory(user=user)

        # Get the upload policy for this video
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-upload/",
                {"filename": "video_file", "mimetype": "", "size": 100},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            json.loads(response.content),
            {"detail": "You do not have permission to perform this action."},
        )

        # The upload state of the video has not changed
        video.refresh_from_db()
        self.assertEqual(video.upload_state, "ready")
        self.assertEqual(video.transcode_pipeline, None)

    def test_api_video_initiate_upload_by_organization_admin(self):
        """Organization admins can retrieve an upload policy."""
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            playlist=playlist,
            upload_state="ready",
        )

        jwt_token = UserAccessTokenFactory(user=user)

        # Get the upload policy for this video
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-upload/",
                {"filename": "video_file", "mimetype": "", "size": 100},
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
                        "tmp/27a23f52-3379-46a2-94fa-697b59cfe3c7/video/1533686400"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "scw-access-key/20180808/fr-par/s3/aws4_request",
                    "x-amz-date": "20180808T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMTgtMDgtMDlUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBbe"
                        "yJhY2wiOiAicHJpdmF0ZSJ9LCBbInN0YXJ0cy13aXRoIiwgIiRDb250ZW50LVR5cGUiLCAidm"
                        "lkZW8vIl0sIFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLCAwLCAxMDczNzQxODI0XSwgeyJidWN"
                        "rZXQiOiAidGVzdC1tYXJzaGEifSwgeyJrZXkiOiAidG1wLzI3YTIzZjUyLTMzNzktNDZhMi05"
                        "NGZhLTY5N2I1OWNmZTNjNy92aWRlby8xNTMzNjg2NDAwIn0sIHsieC1hbXotYWxnb3JpdGhtI"
                        "jogIkFXUzQtSE1BQy1TSEEyNTYifSwgeyJ4LWFtei1jcmVkZW50aWFsIjogInNjdy1hY2Nlc3"
                        "Mta2V5LzIwMTgwODA4L2ZyLXBhci9zMy9hd3M0X3JlcXVlc3QifSwgeyJ4LWFtei1kYXRlIjo"
                        "gIjIwMTgwODA4VDAwMDAwMFoifV19"
                    ),
                    "x-amz-signature": (
                        "55c0c60a093f00b2936a14f8ac2629b150488c8078cbcbbbe7a1599134405825"
                    ),
                },
            },
        )

        # The upload state of the video has been reset
        video.refresh_from_db()
        self.assertEqual(video.upload_state, "pending")

    def test_api_video_initiate_upload_by_playlist_instructor(self):
        """Playlist instructors cannot retrieve an upload policy."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.INSTRUCTOR, playlist=playlist, user=user
        )
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            playlist=playlist,
            upload_state="ready",
        )

        jwt_token = UserAccessTokenFactory(user=user)

        # Get the upload policy for this video
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-upload/",
                {"filename": "video_file", "mimetype": "", "size": 100},
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
                        "tmp/27a23f52-3379-46a2-94fa-697b59cfe3c7/video/1533686400"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "scw-access-key/20180808/fr-par/s3/aws4_request",
                    "x-amz-date": "20180808T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMTgtMDgtMDlUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBbe"
                        "yJhY2wiOiAicHJpdmF0ZSJ9LCBbInN0YXJ0cy13aXRoIiwgIiRDb250ZW50LVR5cGUiLCAidm"
                        "lkZW8vIl0sIFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLCAwLCAxMDczNzQxODI0XSwgeyJidWN"
                        "rZXQiOiAidGVzdC1tYXJzaGEifSwgeyJrZXkiOiAidG1wLzI3YTIzZjUyLTMzNzktNDZhMi05"
                        "NGZhLTY5N2I1OWNmZTNjNy92aWRlby8xNTMzNjg2NDAwIn0sIHsieC1hbXotYWxnb3JpdGhtI"
                        "jogIkFXUzQtSE1BQy1TSEEyNTYifSwgeyJ4LWFtei1jcmVkZW50aWFsIjogInNjdy1hY2Nlc3"
                        "Mta2V5LzIwMTgwODA4L2ZyLXBhci9zMy9hd3M0X3JlcXVlc3QifSwgeyJ4LWFtei1kYXRlIjo"
                        "gIjIwMTgwODA4VDAwMDAwMFoifV19"
                    ),
                    "x-amz-signature": (
                        "55c0c60a093f00b2936a14f8ac2629b150488c8078cbcbbbe7a1599134405825"
                    ),
                },
            },
        )

        # The upload state of the video has been reset
        video.refresh_from_db()
        self.assertEqual(video.upload_state, "pending")

    def test_api_video_initiate_upload_by_playlist_admin(self):
        """Playlist admins can retrieve an upload policy."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.ADMINISTRATOR, playlist=playlist, user=user
        )
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            playlist=playlist,
            upload_state="ready",
        )

        jwt_token = UserAccessTokenFactory(user=user)
        # Get the upload policy for this video
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-upload/",
                {"filename": "video_file", "mimetype": "", "size": 100},
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
                        "tmp/27a23f52-3379-46a2-94fa-697b59cfe3c7/video/1533686400"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "scw-access-key/20180808/fr-par/s3/aws4_request",
                    "x-amz-date": "20180808T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMTgtMDgtMDlUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBbe"
                        "yJhY2wiOiAicHJpdmF0ZSJ9LCBbInN0YXJ0cy13aXRoIiwgIiRDb250ZW50LVR5cGUiLCAidm"
                        "lkZW8vIl0sIFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLCAwLCAxMDczNzQxODI0XSwgeyJidWN"
                        "rZXQiOiAidGVzdC1tYXJzaGEifSwgeyJrZXkiOiAidG1wLzI3YTIzZjUyLTMzNzktNDZhMi05"
                        "NGZhLTY5N2I1OWNmZTNjNy92aWRlby8xNTMzNjg2NDAwIn0sIHsieC1hbXotYWxnb3JpdGhtI"
                        "jogIkFXUzQtSE1BQy1TSEEyNTYifSwgeyJ4LWFtei1jcmVkZW50aWFsIjogInNjdy1hY2Nlc3"
                        "Mta2V5LzIwMTgwODA4L2ZyLXBhci9zMy9hd3M0X3JlcXVlc3QifSwgeyJ4LWFtei1kYXRlIjo"
                        "gIjIwMTgwODA4VDAwMDAwMFoifV19"
                    ),
                    "x-amz-signature": (
                        "55c0c60a093f00b2936a14f8ac2629b150488c8078cbcbbbe7a1599134405825"
                    ),
                },
            },
        )

        # The upload state of the video has been reset
        video.refresh_from_db()
        self.assertEqual(video.upload_state, "pending")

    def test_api_video_initiate_upload_file_without_size(self):
        "With no size field provided, the request should fail"
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-upload/",
                {"filename": "video_file", "mimetype": ""},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"size": ["This field is required."]},
        )

    @override_settings(VIDEO_SOURCE_MAX_SIZE=10)
    def test_api_video_initiate_upload_file_too_large(self):
        """With a file size too large the request should fail"""
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-upload/",
                {"filename": "video_file", "mimetype": "", "size": 100},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"size": ["file too large, max size allowed is 10 Bytes"]},
        )
