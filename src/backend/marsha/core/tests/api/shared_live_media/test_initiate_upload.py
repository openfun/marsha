"""Tests for the SharedLiveMedia initiate-upload API of the Marsha project."""
from datetime import datetime, timezone as baseTimezone
import json
import random
from unittest import mock

from django.test import TestCase

from marsha.core import defaults
from marsha.core.api import timezone
from marsha.core.factories import (
    OrganizationAccessFactory,
    OrganizationFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
    SharedLiveMediaFactory,
    UserFactory,
    VideoFactory,
)
from marsha.core.models.account import ADMINISTRATOR, INSTRUCTOR
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)


class SharedLiveMediaInitiateUploadAPITest(TestCase):
    """Test the initiate-upload API of the shared live media object."""

    def _post_url(self, video, shared_live_media):
        """Return the url to use in tests."""
        return f"/api/videos/{video.id}/sharedlivemedias/{shared_live_media.id}/initiate-upload/"

    maxDiff = None

    def test_api_shared_live_media_initiate_upload_anonymous(self):
        """An anonymous user can not initiate an upload."""

        shared_live_media = SharedLiveMediaFactory()

        response = self.client.post(
            self._post_url(shared_live_media.video, shared_live_media),
            {
                "filename": "python extensions.pdf",
                "mimetype": "application/pdf",
                "size": 10,
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 401)

    def test_api_shared_live_media_initiate_upload_student(self):
        """A student user can not initiate an upload."""

        shared_live_media = SharedLiveMediaFactory()

        jwt_token = StudentLtiTokenFactory(playlist=shared_live_media.video.playlist)

        response = self.client.post(
            self._post_url(shared_live_media.video, shared_live_media),
            {
                "filename": "python extensions.pdf",
                "mimetype": "application/pdf",
                "size": 10,
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_initiate_upload_instructor(self):
        """An instructor can initiate an upload."""
        shared_live_media = SharedLiveMediaFactory(
            id="c5cad053-111a-4e0e-8f78-fe43dec11512",
            upload_state=random.choice(["ready", "error"]),
            video__id="ed08da34-7447-4141-96ff-5740315d7b99",
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=shared_live_media.video.playlist
        )

        now = datetime(2021, 12, 2, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                self._post_url(shared_live_media.video, shared_live_media),
                {
                    "filename": "python extensions.pdf",
                    "mimetype": "application/pdf",
                    "size": 10,
                },
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "url": "https://s3.fr-par.scw.cloud/test-marsha",
                "fields": {
                    "acl": "private",
                    "key": (
                        "tmp/ed08da34-7447-4141-96ff-5740315d7b99/sharedlivemedia/"
                        "c5cad053-111a-4e0e-8f78-fe43dec11512/1638403200"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "scw-access-key/20211202/fr-par/s3/aws4_request",
                    "x-amz-date": "20211202T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMjEtMTItMDNUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBbe"
                        "yJhY2wiOiAicHJpdmF0ZSJ9LCBbImVxIiwgIiRDb250ZW50LVR5cGUiLCAiYXBwbGljYXRpb2"
                        "4vcGRmIl0sIFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLCAwLCAzMTQ1NzI4MDBdLCB7ImJ1Y2t"
                        "ldCI6ICJ0ZXN0LW1hcnNoYSJ9LCB7ImtleSI6ICJ0bXAvZWQwOGRhMzQtNzQ0Ny00MTQxLTk2"
                        "ZmYtNTc0MDMxNWQ3Yjk5L3NoYXJlZGxpdmVtZWRpYS9jNWNhZDA1My0xMTFhLTRlMGUtOGY3O"
                        "C1mZTQzZGVjMTE1MTIvMTYzODQwMzIwMCJ9LCB7IngtYW16LWFsZ29yaXRobSI6ICJBV1M0LU"
                        "hNQUMtU0hBMjU2In0sIHsieC1hbXotY3JlZGVudGlhbCI6ICJzY3ctYWNjZXNzLWtleS8yMDI"
                        "xMTIwMi9mci1wYXIvczMvYXdzNF9yZXF1ZXN0In0sIHsieC1hbXotZGF0ZSI6ICIyMDIxMTIw"
                        "MlQwMDAwMDBaIn1dfQ=="
                    ),
                    "x-amz-signature": (
                        "6b92b2ce1d92c6efe9cef543488b77ad3c6300d5a963b8ea025db06a34aa2419"
                    ),
                },
            },
        )

        shared_live_media.refresh_from_db()
        self.assertEqual(shared_live_media.upload_state, "pending")

    def test_api_shared_live_media_initiate_upload_file_without_extension(self):
        """An extension should be guessed from the mimetype."""
        shared_live_media = SharedLiveMediaFactory(
            id="c5cad053-111a-4e0e-8f78-fe43dec11512",
            upload_state=random.choice(["ready", "error"]),
            video__id="ed08da34-7447-4141-96ff-5740315d7b99",
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=shared_live_media.video.playlist
        )

        now = datetime(2021, 12, 2, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                self._post_url(shared_live_media.video, shared_live_media),
                {
                    "filename": "python extensions",
                    "mimetype": "application/pdf",
                    "size": 10,
                },
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "url": "https://s3.fr-par.scw.cloud/test-marsha",
                "fields": {
                    "acl": "private",
                    "key": (
                        "tmp/ed08da34-7447-4141-96ff-5740315d7b99/sharedlivemedia/"
                        "c5cad053-111a-4e0e-8f78-fe43dec11512/1638403200"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "scw-access-key/20211202/fr-par/s3/aws4_request",
                    "x-amz-date": "20211202T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMjEtMTItMDNUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBbe"
                        "yJhY2wiOiAicHJpdmF0ZSJ9LCBbImVxIiwgIiRDb250ZW50LVR5cGUiLCAiYXBwbGljYXRpb2"
                        "4vcGRmIl0sIFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLCAwLCAzMTQ1NzI4MDBdLCB7ImJ1Y2t"
                        "ldCI6ICJ0ZXN0LW1hcnNoYSJ9LCB7ImtleSI6ICJ0bXAvZWQwOGRhMzQtNzQ0Ny00MTQxLTk2"
                        "ZmYtNTc0MDMxNWQ3Yjk5L3NoYXJlZGxpdmVtZWRpYS9jNWNhZDA1My0xMTFhLTRlMGUtOGY3O"
                        "C1mZTQzZGVjMTE1MTIvMTYzODQwMzIwMCJ9LCB7IngtYW16LWFsZ29yaXRobSI6ICJBV1M0LU"
                        "hNQUMtU0hBMjU2In0sIHsieC1hbXotY3JlZGVudGlhbCI6ICJzY3ctYWNjZXNzLWtleS8yMDI"
                        "xMTIwMi9mci1wYXIvczMvYXdzNF9yZXF1ZXN0In0sIHsieC1hbXotZGF0ZSI6ICIyMDIxMTIw"
                        "MlQwMDAwMDBaIn1dfQ=="
                    ),
                    "x-amz-signature": (
                        "6b92b2ce1d92c6efe9cef543488b77ad3c6300d5a963b8ea025db06a34aa2419"
                    ),
                },
            },
        )

        shared_live_media.refresh_from_db()
        self.assertEqual(shared_live_media.upload_state, "pending")

    def test_api_shared_live_media_initiate_upload_file_without_mimetype(self):
        """With no mimetype the request should fail."""
        shared_live_media = SharedLiveMediaFactory(
            id="c5cad053-111a-4e0e-8f78-fe43dec11512",
            upload_state=random.choice(["ready", "error"]),
            video__id="ed08da34-7447-4141-96ff-5740315d7b99",
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=shared_live_media.video.playlist
        )

        now = datetime(2021, 12, 2, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                self._post_url(shared_live_media.video, shared_live_media),
                {"filename": "python extensions", "mimetype": "", "size": 10},
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 400)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {"mimetype": ["mimetype not guessable"]},
        )

    def test_api_shared_live_media_initiate_upload_file_wrong_mimetype(self):
        """With a wrong mimetype the request should fail."""
        shared_live_media = SharedLiveMediaFactory(
            id="c5cad053-111a-4e0e-8f78-fe43dec11512",
            upload_state=random.choice(["ready", "error"]),
            video__id="ed08da34-7447-4141-96ff-5740315d7b99",
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=shared_live_media.video.playlist
        )

        now = datetime(2021, 12, 2, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                self._post_url(shared_live_media.video, shared_live_media),
                {
                    "filename": "python extensions",
                    "mimetype": "application/wrong-type",
                    "size": 10,
                },
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 400)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {"mimetype": ["application/wrong-type is not a supported mimetype"]},
        )

    def test_api_shared_live_media_initiate_upload_staff_or_user(self):
        """
        Users authenticated via a session shouldn't be able to intiate an upload
        for a shared live medias.
        """
        shared_live_media = SharedLiveMediaFactory()
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            response = self.client.post(
                self._post_url(shared_live_media.video, shared_live_media),
                {
                    "filename": "python extensions.pdf",
                    "mimetype": "application/pdf",
                    "size": 10,
                },
                content_type="application/json",
            )
            self.assertEqual(response.status_code, 401)

    def test_api_shared_live_media_initiate_upload_by_user_with_no_access(self):
        """
        Token user without any access initiates an upload on a shared live medias for a video.

        A user with a user token, without any specific access, cannot initiate an upload
        on shared live medias for any given video.
        """
        shared_live_media = SharedLiveMediaFactory()

        jwt_token = UserAccessTokenFactory()

        response = self.client.post(
            self._post_url(shared_live_media.video, shared_live_media),
            {
                "filename": "python extensions.pdf",
                "mimetype": "application/pdf",
                "size": 10,
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_initiate_upload_by_video_playlist_instructor(self):
        """
        Playlist instructor token user initiates an upload on a shared live medias for a video.

        A user with a user token, who is a playlist instructor, can initiate an upload
        on  a shared live medias for a video that belongs to that playlist.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = PlaylistFactory()
        video = VideoFactory(
            id="ed08da34-7447-4141-96ff-5740315d7b99", playlist=playlist
        )
        shared_live_media = SharedLiveMediaFactory(
            id="c5cad053-111a-4e0e-8f78-fe43dec11512",
            upload_state=defaults.READY,
            uploaded_on=None,
            nb_pages=3,
            video=video,
            title="update me!",
        )
        PlaylistAccessFactory(user=user, playlist=playlist, role=INSTRUCTOR)

        jwt_token = UserAccessTokenFactory(user=user)

        now = datetime(2021, 12, 2, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                self._post_url(shared_live_media.video, shared_live_media),
                {
                    "filename": "python extensions.pdf",
                    "mimetype": "application/pdf",
                    "size": 10,
                },
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "url": "https://s3.fr-par.scw.cloud/test-marsha",
                "fields": {
                    "acl": "private",
                    "key": (
                        "tmp/ed08da34-7447-4141-96ff-5740315d7b99/sharedlivemedia/"
                        "c5cad053-111a-4e0e-8f78-fe43dec11512/1638403200"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "scw-access-key/20211202/fr-par/s3/aws4_request",
                    "x-amz-date": "20211202T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMjEtMTItMDNUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBbe"
                        "yJhY2wiOiAicHJpdmF0ZSJ9LCBbImVxIiwgIiRDb250ZW50LVR5cGUiLCAiYXBwbGljYXRpb2"
                        "4vcGRmIl0sIFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLCAwLCAzMTQ1NzI4MDBdLCB7ImJ1Y2t"
                        "ldCI6ICJ0ZXN0LW1hcnNoYSJ9LCB7ImtleSI6ICJ0bXAvZWQwOGRhMzQtNzQ0Ny00MTQxLTk2"
                        "ZmYtNTc0MDMxNWQ3Yjk5L3NoYXJlZGxpdmVtZWRpYS9jNWNhZDA1My0xMTFhLTRlMGUtOGY3O"
                        "C1mZTQzZGVjMTE1MTIvMTYzODQwMzIwMCJ9LCB7IngtYW16LWFsZ29yaXRobSI6ICJBV1M0LU"
                        "hNQUMtU0hBMjU2In0sIHsieC1hbXotY3JlZGVudGlhbCI6ICJzY3ctYWNjZXNzLWtleS8yMDI"
                        "xMTIwMi9mci1wYXIvczMvYXdzNF9yZXF1ZXN0In0sIHsieC1hbXotZGF0ZSI6ICIyMDIxMTIw"
                        "MlQwMDAwMDBaIn1dfQ=="
                    ),
                    "x-amz-signature": (
                        "6b92b2ce1d92c6efe9cef543488b77ad3c6300d5a963b8ea025db06a34aa2419"
                    ),
                },
            },
        )

        shared_live_media.refresh_from_db()
        self.assertEqual(shared_live_media.upload_state, defaults.PENDING)

    def test_api_shared_live_media_initiate_upload_by_video_playlist_admin(self):
        """
        Playlist administrator token user initiates an upload on a shared live medias for a video.

        A user with a user token, who is a playlist administrator, can initiate an upload
        on a shared live media for a video that belongs to that playlist.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = PlaylistFactory()
        video = VideoFactory(
            id="ed08da34-7447-4141-96ff-5740315d7b99", playlist=playlist
        )
        shared_live_media = SharedLiveMediaFactory(
            id="c5cad053-111a-4e0e-8f78-fe43dec11512",
            upload_state=defaults.READY,
            uploaded_on=None,
            nb_pages=3,
            video=video,
            title="update me!",
        )
        PlaylistAccessFactory(user=user, playlist=playlist, role=ADMINISTRATOR)

        jwt_token = UserAccessTokenFactory(user=user)

        now = datetime(2021, 12, 2, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                self._post_url(shared_live_media.video, shared_live_media),
                {
                    "filename": "python extensions.pdf",
                    "mimetype": "application/pdf",
                    "size": 10,
                },
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "url": "https://s3.fr-par.scw.cloud/test-marsha",
                "fields": {
                    "acl": "private",
                    "key": (
                        "tmp/ed08da34-7447-4141-96ff-5740315d7b99/sharedlivemedia/"
                        "c5cad053-111a-4e0e-8f78-fe43dec11512/1638403200"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "scw-access-key/20211202/fr-par/s3/aws4_request",
                    "x-amz-date": "20211202T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMjEtMTItMDNUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBbe"
                        "yJhY2wiOiAicHJpdmF0ZSJ9LCBbImVxIiwgIiRDb250ZW50LVR5cGUiLCAiYXBwbGljYXRpb2"
                        "4vcGRmIl0sIFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLCAwLCAzMTQ1NzI4MDBdLCB7ImJ1Y2t"
                        "ldCI6ICJ0ZXN0LW1hcnNoYSJ9LCB7ImtleSI6ICJ0bXAvZWQwOGRhMzQtNzQ0Ny00MTQxLTk2"
                        "ZmYtNTc0MDMxNWQ3Yjk5L3NoYXJlZGxpdmVtZWRpYS9jNWNhZDA1My0xMTFhLTRlMGUtOGY3O"
                        "C1mZTQzZGVjMTE1MTIvMTYzODQwMzIwMCJ9LCB7IngtYW16LWFsZ29yaXRobSI6ICJBV1M0LU"
                        "hNQUMtU0hBMjU2In0sIHsieC1hbXotY3JlZGVudGlhbCI6ICJzY3ctYWNjZXNzLWtleS8yMDI"
                        "xMTIwMi9mci1wYXIvczMvYXdzNF9yZXF1ZXN0In0sIHsieC1hbXotZGF0ZSI6ICIyMDIxMTIw"
                        "MlQwMDAwMDBaIn1dfQ=="
                    ),
                    "x-amz-signature": (
                        "6b92b2ce1d92c6efe9cef543488b77ad3c6300d5a963b8ea025db06a34aa2419"
                    ),
                },
            },
        )

        shared_live_media.refresh_from_db()
        self.assertEqual(shared_live_media.upload_state, defaults.PENDING)

    def test_api_shared_live_media_initiate_upload_by_video_organization_instructor(
        self,
    ):
        """
        Organization instructor token user initiates an upload on a shared live medias
        for a video.

        A user with a user token, who is an organization instructor, cannot initiate an upload
        on a shared live media for a video that belongs to that organization.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        organization = OrganizationFactory()
        playlist = PlaylistFactory(organization=organization)
        video = VideoFactory(playlist=playlist)
        shared_live_media = SharedLiveMediaFactory(video=video)
        OrganizationAccessFactory(user=user, organization=organization, role=INSTRUCTOR)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            self._post_url(shared_live_media.video, shared_live_media),
            {
                "filename": "python extensions.pdf",
                "mimetype": "application/pdf",
                "size": 10,
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_initiate_upload_by_video_organization_admin(self):
        """
        Organization administrator token user initiates an upload
        on a shared live medias for a video.

        A user with a user token, who is an organization administrator, can initiate an upload
        on a shared live medias for a video that belongs to that organization.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        organization = OrganizationFactory()
        playlist = PlaylistFactory(organization=organization)
        video = VideoFactory(
            id="ed08da34-7447-4141-96ff-5740315d7b99", playlist=playlist
        )
        shared_live_media = SharedLiveMediaFactory(
            id="c5cad053-111a-4e0e-8f78-fe43dec11512",
            upload_state=defaults.READY,
            uploaded_on=None,
            nb_pages=3,
            video=video,
            title="update me!",
        )
        OrganizationAccessFactory(
            user=user, organization=organization, role=ADMINISTRATOR
        )

        jwt_token = UserAccessTokenFactory(user=user)

        now = datetime(2021, 12, 2, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                self._post_url(shared_live_media.video, shared_live_media),
                {
                    "filename": "python extensions.pdf",
                    "mimetype": "application/pdf",
                    "size": 10,
                },
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "url": "https://s3.fr-par.scw.cloud/test-marsha",
                "fields": {
                    "acl": "private",
                    "key": (
                        "tmp/ed08da34-7447-4141-96ff-5740315d7b99/sharedlivemedia/"
                        "c5cad053-111a-4e0e-8f78-fe43dec11512/1638403200"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "scw-access-key/20211202/fr-par/s3/aws4_request",
                    "x-amz-date": "20211202T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMjEtMTItMDNUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBbe"
                        "yJhY2wiOiAicHJpdmF0ZSJ9LCBbImVxIiwgIiRDb250ZW50LVR5cGUiLCAiYXBwbGljYXRpb2"
                        "4vcGRmIl0sIFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLCAwLCAzMTQ1NzI4MDBdLCB7ImJ1Y2t"
                        "ldCI6ICJ0ZXN0LW1hcnNoYSJ9LCB7ImtleSI6ICJ0bXAvZWQwOGRhMzQtNzQ0Ny00MTQxLTk2"
                        "ZmYtNTc0MDMxNWQ3Yjk5L3NoYXJlZGxpdmVtZWRpYS9jNWNhZDA1My0xMTFhLTRlMGUtOGY3O"
                        "C1mZTQzZGVjMTE1MTIvMTYzODQwMzIwMCJ9LCB7IngtYW16LWFsZ29yaXRobSI6ICJBV1M0LU"
                        "hNQUMtU0hBMjU2In0sIHsieC1hbXotY3JlZGVudGlhbCI6ICJzY3ctYWNjZXNzLWtleS8yMDI"
                        "xMTIwMi9mci1wYXIvczMvYXdzNF9yZXF1ZXN0In0sIHsieC1hbXotZGF0ZSI6ICIyMDIxMTIw"
                        "MlQwMDAwMDBaIn1dfQ=="
                    ),
                    "x-amz-signature": (
                        "6b92b2ce1d92c6efe9cef543488b77ad3c6300d5a963b8ea025db06a34aa2419"
                    ),
                },
            },
        )

        shared_live_media.refresh_from_db()
        self.assertEqual(shared_live_media.upload_state, defaults.PENDING)
