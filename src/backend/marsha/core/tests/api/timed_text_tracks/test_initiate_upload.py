"""Tests for the TimedTextTrack initiate-upload API of the Marsha project."""
from datetime import datetime
import json
import random
from unittest import mock

from django.test import TestCase, override_settings

from marsha.core import factories, models
from marsha.core.api import timezone
from marsha.core.factories import TimedTextTrackFactory, UserFactory
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    UserAccessTokenFactory,
)


class TimedTextTrackInitiateUIploadAPITest(TestCase):
    """Test the initiate-upload API of the timed text track object."""

    maxDiff = None

    def test_api_timed_text_track_initiate_upload_anonymous_user(self):
        """Anonymous users should not be allowed to initiate an upload."""
        timed_text_track = TimedTextTrackFactory()

        response = self.client.post(
            f"/api/timedtexttracks/{timed_text_track.id}/initiate-upload/"
        )

        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_timed_text_track_initiate_upload_token_user(self):
        """A token user should be able to initiate an upload."""
        timed_text_track = TimedTextTrackFactory(
            id="5c019027-1e1f-4d8c-9f83-c5e20edaad2b",
            video__pk="b8d40ed7-95b8-4848-98c9-50728dfee25d",
            language="fr",
            upload_state=random.choice(["ready", "error"]),
            mode="cc",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=timed_text_track.video)

        # Create other timed text tracks to check that their upload state are unaffected
        # Make sure we avoid unicty constraints by setting a different language
        other_ttt_for_same_video = TimedTextTrackFactory(
            video=timed_text_track.video,
            language="en",
            upload_state=random.choice(["ready", "error"]),
        )
        other_ttt_for_other_video = TimedTextTrackFactory(
            upload_state=random.choice(["ready", "error"])
        )

        # Get the upload policy for this timed text track
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/timedtexttracks/{timed_text_track.id}/initiate-upload/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data={
                    "filename": "foo",
                    "mimetype": "",
                    "size": 10,
                },
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content),
            {
                "url": "https://test-marsha-source.s3.amazonaws.com/",
                "fields": {
                    "acl": "private",
                    "key": (
                        "b8d40ed7-95b8-4848-98c9-50728dfee25d/timedtexttrack/5c019027-1e1f-4d8c-"
                        "9f83-c5e20edaad2b/1533686400_fr_cc"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "aws-access-key-id/20180808/eu-west-1/s3/aws4_request",
                    "x-amz-date": "20180808T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMTgtMDgtMDlUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBbe"
                        "yJhY2wiOiAicHJpdmF0ZSJ9LCBbImNvbnRlbnQtbGVuZ3RoLXJhbmdlIiwgMCwgMTA0ODU3Nl"
                        "0sIHsiYnVja2V0IjogInRlc3QtbWFyc2hhLXNvdXJjZSJ9LCB7ImtleSI6ICJiOGQ0MGVkNy0"
                        "5NWI4LTQ4NDgtOThjOS01MDcyOGRmZWUyNWQvdGltZWR0ZXh0dHJhY2svNWMwMTkwMjctMWUx"
                        "Zi00ZDhjLTlmODMtYzVlMjBlZGFhZDJiLzE1MzM2ODY0MDBfZnJfY2MifSwgeyJ4LWFtei1hb"
                        "Gdvcml0aG0iOiAiQVdTNC1ITUFDLVNIQTI1NiJ9LCB7IngtYW16LWNyZWRlbnRpYWwiOiAiYX"
                        "dzLWFjY2Vzcy1rZXktaWQvMjAxODA4MDgvZXUtd2VzdC0xL3MzL2F3czRfcmVxdWVzdCJ9LCB"
                        "7IngtYW16LWRhdGUiOiAiMjAxODA4MDhUMDAwMDAwWiJ9XX0="
                    ),
                    "x-amz-signature": (
                        "bab90cecbb4db4a6bd7d4036a6be95a7c398b0f9eaa78b14c7f10e6bb3349558"
                    ),
                },
            },
        )

        # The upload state of the timed text track should have been reset
        timed_text_track.refresh_from_db()
        self.assertEqual(timed_text_track.upload_state, "pending")

        # Check that the other timed text tracks are not reset
        for ttt in [other_ttt_for_same_video, other_ttt_for_other_video]:
            ttt.refresh_from_db()
            self.assertNotEqual(ttt.upload_state, "pending")

        # Try initiating an upload for a timed_text_track linked to another video
        response = self.client.post(
            f"/api/timedtexttracks/{other_ttt_for_other_video.id}/initiate-upload/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_timed_text_track_initiate_upload_staff_or_user(self):
        """Users authenticated via a session should not be able to initiate an upload."""
        timed_text_track = TimedTextTrackFactory()
        for user in [
            UserFactory(),
            UserFactory(is_staff=True),
            UserFactory(is_superuser=True),
        ]:
            self.client.login(username=user.username, password="test")
            response = self.client.post(
                f"/api/timedtexttracks/{timed_text_track.id}/initiate-upload/"
            )
            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )

    def test_api_timed_text_track_instructor_initiate_upload_in_read_only(self):
        """Instructor should not be able to initiate a timed text track upload in read_only."""
        timed_text_track = TimedTextTrackFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=timed_text_track.video,
            permissions__can_update=False,
        )

        response = self.client.post(
            f"/api/timedtexttracks/{timed_text_track.id}/initiate-upload/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_timed_text_track_initiate_upload_by_user_with_no_access(self):
        """
        Token user without any access initiates upload for a timed text track for a video.

        A user with a user token, without any specific access, cannot initiate an upload
        for any timed text track.
        """
        video = factories.VideoFactory(
            id="b8d40ed7-95b8-4848-98c9-50728dfee25d",
        )
        track = factories.TimedTextTrackFactory(
            id="5c019027-1e1f-4d8c-9f83-c5e20edaad2b",
            language="fr",
            upload_state=random.choice(["ready", "error"]),
            mode="cc",
            video=video,
        )

        jwt_token = UserAccessTokenFactory()

        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/timedtexttracks/{track.id}/initiate-upload/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        self.assertEqual(response.status_code, 403)

    def test_api_timed_text_track_initiate_upload_by_video_playlist_instructor(self):
        """
        Playlist instructor token user initiates upload for a timed text track for a video.

        A user with a user token, who is a playlist instructor, cannot initiate an upload for
        a timed text track for a video that belongs to that playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(
            id="b8d40ed7-95b8-4848-98c9-50728dfee25d", playlist=playlist
        )
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.INSTRUCTOR
        )
        track = factories.TimedTextTrackFactory(
            id="5c019027-1e1f-4d8c-9f83-c5e20edaad2b",
            language="fr",
            upload_state=random.choice(["ready", "error"]),
            mode="cc",
            video=video,
        )

        jwt_token = UserAccessTokenFactory(user=user)

        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/timedtexttracks/{track.id}/initiate-upload/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        self.assertEqual(response.status_code, 403)

    def test_api_timed_text_track_initiate_upload_by_video_playlist_admin(self):
        """
        Playlist administrator token user initiates upload a timed text track for a video.

        A user with a user token, who is a playlist administrator, can initiate an upload for
        a timed text track for a video that belongs to that playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user is an administrator, with a video
        playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(
            id="b8d40ed7-95b8-4848-98c9-50728dfee25d", playlist=playlist
        )
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.ADMINISTRATOR
        )
        track = factories.TimedTextTrackFactory(
            id="5c019027-1e1f-4d8c-9f83-c5e20edaad2b",
            language="fr",
            upload_state=random.choice(["ready", "error"]),
            mode="cc",
            video=video,
        )

        jwt_token = UserAccessTokenFactory(user=user)

        # Get the upload policy for this timed text track
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/timedtexttracks/{track.id}/initiate-upload/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data={
                    "filename": "foo",
                    "mimetype": "",
                    "size": 10,
                },
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content),
            {
                "url": "https://test-marsha-source.s3.amazonaws.com/",
                "fields": {
                    "acl": "private",
                    "key": (
                        "b8d40ed7-95b8-4848-98c9-50728dfee25d/timedtexttrack/5c019027-1e1f-4d8c-"
                        "9f83-c5e20edaad2b/1533686400_fr_cc"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "aws-access-key-id/20180808/eu-west-1/s3/aws4_request",
                    "x-amz-date": "20180808T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMTgtMDgtMDlUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBbe"
                        "yJhY2wiOiAicHJpdmF0ZSJ9LCBbImNvbnRlbnQtbGVuZ3RoLXJhbmdlIiwgMCwgMTA0ODU3Nl"
                        "0sIHsiYnVja2V0IjogInRlc3QtbWFyc2hhLXNvdXJjZSJ9LCB7ImtleSI6ICJiOGQ0MGVkNy0"
                        "5NWI4LTQ4NDgtOThjOS01MDcyOGRmZWUyNWQvdGltZWR0ZXh0dHJhY2svNWMwMTkwMjctMWUx"
                        "Zi00ZDhjLTlmODMtYzVlMjBlZGFhZDJiLzE1MzM2ODY0MDBfZnJfY2MifSwgeyJ4LWFtei1hb"
                        "Gdvcml0aG0iOiAiQVdTNC1ITUFDLVNIQTI1NiJ9LCB7IngtYW16LWNyZWRlbnRpYWwiOiAiYX"
                        "dzLWFjY2Vzcy1rZXktaWQvMjAxODA4MDgvZXUtd2VzdC0xL3MzL2F3czRfcmVxdWVzdCJ9LCB"
                        "7IngtYW16LWRhdGUiOiAiMjAxODA4MDhUMDAwMDAwWiJ9XX0="
                    ),
                    "x-amz-signature": (
                        "bab90cecbb4db4a6bd7d4036a6be95a7c398b0f9eaa78b14c7f10e6bb3349558"
                    ),
                },
            },
        )

    def test_api_timed_text_track_initiate_upload_by_video_organization_instructor(
        self,
    ):
        """
        Organization instructor token user initiates upload for a timed text track for a video.

        A user with a user token, who is an organization instructor, cannot initiate an upload
        for a timed text track for a video that belongs to that playlist.
        """
        user = factories.UserFactory()
        # An organization where the user is an instructor, with a playlist with a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(
            id="b8d40ed7-95b8-4848-98c9-50728dfee25d", playlist=playlist
        )
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.INSTRUCTOR
        )
        track = factories.TimedTextTrackFactory(
            id="5c019027-1e1f-4d8c-9f83-c5e20edaad2b",
            language="fr",
            upload_state=random.choice(["ready", "error"]),
            mode="cc",
            video=video,
        )

        jwt_token = UserAccessTokenFactory(user=user)

        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/timedtexttracks/{track.id}/initiate-upload/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        self.assertEqual(response.status_code, 403)

    def test_api_timed_text_track_initiate_upload_by_video_organization_admin(self):
        """
        Organization administrator token user initiates upload for a timed text track for a video.

        A user with a user token, who is an organization administrator, can initiate an upload
        for a timed text track for a video that belongs to that playlist.
        """
        user = factories.UserFactory()
        # An organization where the user is an admin, with a playlist with a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(
            id="b8d40ed7-95b8-4848-98c9-50728dfee25d", playlist=playlist
        )
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.ADMINISTRATOR
        )
        track = factories.TimedTextTrackFactory(
            id="5c019027-1e1f-4d8c-9f83-c5e20edaad2b",
            language="fr",
            upload_state=random.choice(["ready", "error"]),
            mode="cc",
            video=video,
        )

        jwt_token = UserAccessTokenFactory(user=user)

        # Get the upload policy for this timed text track
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/timedtexttracks/{track.id}/initiate-upload/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data={
                    "filename": "foo",
                    "mimetype": "",
                    "size": 10,
                },
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content),
            {
                "url": "https://test-marsha-source.s3.amazonaws.com/",
                "fields": {
                    "acl": "private",
                    "key": (
                        "b8d40ed7-95b8-4848-98c9-50728dfee25d/timedtexttrack/5c019027-1e1f-4d8c-"
                        "9f83-c5e20edaad2b/1533686400_fr_cc"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "aws-access-key-id/20180808/eu-west-1/s3/aws4_request",
                    "x-amz-date": "20180808T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMTgtMDgtMDlUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBbe"
                        "yJhY2wiOiAicHJpdmF0ZSJ9LCBbImNvbnRlbnQtbGVuZ3RoLXJhbmdlIiwgMCwgMTA0ODU3Nl"
                        "0sIHsiYnVja2V0IjogInRlc3QtbWFyc2hhLXNvdXJjZSJ9LCB7ImtleSI6ICJiOGQ0MGVkNy0"
                        "5NWI4LTQ4NDgtOThjOS01MDcyOGRmZWUyNWQvdGltZWR0ZXh0dHJhY2svNWMwMTkwMjctMWUx"
                        "Zi00ZDhjLTlmODMtYzVlMjBlZGFhZDJiLzE1MzM2ODY0MDBfZnJfY2MifSwgeyJ4LWFtei1hb"
                        "Gdvcml0aG0iOiAiQVdTNC1ITUFDLVNIQTI1NiJ9LCB7IngtYW16LWNyZWRlbnRpYWwiOiAiYX"
                        "dzLWFjY2Vzcy1rZXktaWQvMjAxODA4MDgvZXUtd2VzdC0xL3MzL2F3czRfcmVxdWVzdCJ9LCB"
                        "7IngtYW16LWRhdGUiOiAiMjAxODA4MDhUMDAwMDAwWiJ9XX0="
                    ),
                    "x-amz-signature": (
                        "bab90cecbb4db4a6bd7d4036a6be95a7c398b0f9eaa78b14c7f10e6bb3349558"
                    ),
                },
            },
        )

    @override_settings(SUBTITLE_SOURCE_MAX_SIZE=10)
    def test_api_timed_text_track_initiate_upload_file_too_large(self):
        """
        LTI user with admin role initiates upload for a timed text track for a video.

        A user with admin or instructor role can't initiate an upload
        for a timed text track if its size is too large.
        """
        track = TimedTextTrackFactory(
            id="5c019027-1e1f-4d8c-9f83-c5e20edaad2b",
            video__pk="b8d40ed7-95b8-4848-98c9-50728dfee25d",
            language="fr",
            upload_state=random.choice(["ready", "error"]),
            mode="cc",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=track.video)

        # Get the upload policy for this timed text track
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/timedtexttracks/{track.id}/initiate-upload/",
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
            {"size": ["file too large, max size allowed is 10 Bytes"]},
        )
