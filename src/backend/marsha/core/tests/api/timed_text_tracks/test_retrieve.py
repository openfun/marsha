"""Tests for the TimedTextTrack retrieve API of the Marsha project."""
from datetime import datetime, timezone as baseTimezone
import json
import random
from unittest import mock

from django.test import TestCase, override_settings

from marsha.core import factories, models
from marsha.core.api import timezone
from marsha.core.factories import TimedTextTrackFactory, UserFactory
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)
from marsha.core.tests.testing_utils import RSA_KEY_MOCK


class TimedTextTrackRetrieveAPITest(TestCase):
    """Test the retrieve API of the timed text track object."""

    maxDiff = None

    def _get_url(self, video, track):
        """Return the url to retrieve a timed text track."""
        return f"/api/videos/{video.pk}/timedtexttracks/{track.id}/"

    def test_api_timed_text_track_read_detail_anonymous(self):
        """Anonymous users should not be allowed to read a timed text track detail."""
        timed_text_track = TimedTextTrackFactory()
        response = self.client.get(
            self._get_url(timed_text_track.video, timed_text_track)
        )
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_timed_text_track_read_detail_student(self):
        """Student users should not be allowed to read a timed text track detail."""
        timed_text_track = TimedTextTrackFactory()
        jwt_token = StudentLtiTokenFactory(resource=timed_text_track.video.playlist)
        # Get the timed text track using the JWT token
        response = self.client.get(
            self._get_url(timed_text_track.video, timed_text_track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_timed_text_track_read_detail_token_user(self):
        """A token user associated to a video can read a timed text track related to this video."""
        timed_text_track = TimedTextTrackFactory(
            video__pk="b8d40ed7-95b8-4848-98c9-50728dfee25d",
            video__playlist__title="foo",
            mode="cc",
            language="fr",
            uploaded_on=datetime(2018, 8, 8, tzinfo=baseTimezone.utc),
            upload_state="ready",
            extension="srt",
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=timed_text_track.video.playlist
        )

        # Get the timed text track using the JWT token
        response = self.client.get(
            self._get_url(timed_text_track.video, timed_text_track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "active_stamp": "1533686400",
                "is_ready_to_show": True,
                "id": str(timed_text_track.id),
                "mode": "cc",
                "language": "fr",
                "upload_state": "ready",
                "source_url": (
                    "https://abc.cloudfront.net/b8d40ed7-95b8-4848-98c9-50728dfee25d/"
                    "timedtext/source/1533686400_fr_cc?response-content-disposition=a"
                    "ttachment%3B+filename%3Dfoo_1533686400.srt"
                ),
                "url": (
                    "https://abc.cloudfront.net/b8d40ed7-95b8-4848-98c9-50728dfee25d/"
                    "timedtext/1533686400_fr_cc.vtt"
                ),
                "video": str(timed_text_track.video.id),
            },
        )

        # Try getting another timed_text_track
        other_timed_text_track = TimedTextTrackFactory()
        response = self.client.get(
            f"/api/videos/{other_timed_text_track.video.id}/"
            f"timedtexttracks/{other_timed_text_track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_timed_text_track_without_extension_read_detail_token_user(self):
        """A timed text track without extension should return empty source url."""
        timed_text_track = TimedTextTrackFactory(
            video__pk="b8d40ed7-95b8-4848-98c9-50728dfee25d",
            video__playlist__title="foo",
            mode="cc",
            language="fr",
            uploaded_on=datetime(2018, 8, 8, tzinfo=baseTimezone.utc),
            upload_state="ready",
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=timed_text_track.video.playlist
        )

        # Get the timed text track using the JWT token
        response = self.client.get(
            self._get_url(timed_text_track.video, timed_text_track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "active_stamp": "1533686400",
                "is_ready_to_show": True,
                "id": str(timed_text_track.id),
                "mode": "cc",
                "language": "fr",
                "upload_state": "ready",
                "source_url": None,
                "url": (
                    "https://abc.cloudfront.net/b8d40ed7-95b8-4848-98c9-50728dfee25d/"
                    "timedtext/1533686400_fr_cc.vtt"
                ),
                "video": str(timed_text_track.video.id),
            },
        )

        # Try getting another timed_text_track
        other_timed_text_track = TimedTextTrackFactory()
        response = self.client.get(
            f"/api/videos/{other_timed_text_track.video.id}/"
            f"timedtexttracks/{other_timed_text_track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_timed_text_track_read_detail_admin_user(self):
        """Admin user associated to a video can read a timed text track related to this video."""
        timed_text_track = TimedTextTrackFactory(
            video__pk="b8d40ed7-95b8-4848-98c9-50728dfee25d",
            video__playlist__title="foo",
            mode="cc",
            language="fr",
            uploaded_on=datetime(2018, 8, 8, tzinfo=baseTimezone.utc),
            upload_state="ready",
            extension="srt",
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=timed_text_track.video.playlist,
            roles=["administrator"],
        )

        # Get the timed text track using the JWT token
        response = self.client.get(
            self._get_url(timed_text_track.video, timed_text_track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "active_stamp": "1533686400",
                "is_ready_to_show": True,
                "id": str(timed_text_track.id),
                "mode": "cc",
                "language": "fr",
                "upload_state": "ready",
                "source_url": (
                    "https://abc.cloudfront.net/b8d40ed7-95b8-4848-98c9-50728dfee25d/timedtext/"
                    "source/1533686400_fr_cc?response-content-disposition=attachment%3B+filenam"
                    "e%3Dfoo_1533686400.srt"
                ),
                "url": (
                    "https://abc.cloudfront.net/b8d40ed7-95b8-4848-98c9-50728dfee25d/timedtext/"
                    "1533686400_fr_cc.vtt"
                ),
                "video": str(timed_text_track.video.id),
            },
        )

        # Try getting another timed_text_track
        other_timed_text_track = TimedTextTrackFactory()
        response = self.client.get(
            f"/api/videos/{other_timed_text_track.video.id}/"
            f"timedtexttracks/{other_timed_text_track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_timed_text_track_read_instructor_in_read_only(self):
        """Instructor should not be able to read a timed text track in read_only mode."""
        timed_text_track = TimedTextTrackFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=timed_text_track.video.playlist,
            permissions__can_update=False,
        )

        response = self.client.get(
            self._get_url(timed_text_track.video, timed_text_track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_timed_text_track_read_detail_token_user_no_active_stamp(self):
        """A timed text track with no active stamp should not fail.

        Its "url" field should be set to None.
        """
        timed_text_track = TimedTextTrackFactory(uploaded_on=None)
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=timed_text_track.video.playlist
        )

        # Get the timed text track using the JWT token
        response = self.client.get(
            self._get_url(timed_text_track.video, timed_text_track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('"url":null', response.content.decode("utf-8"))
        content = json.loads(response.content)
        self.assertIsNone(content["url"])

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_timed_text_track_read_detail_token_user_not_ready(self):
        """A timed_text_track that has never been uploaded successfully should have no url."""
        timed_text_track = TimedTextTrackFactory(
            uploaded_on=None, upload_state=random.choice(["pending", "error", "ready"])
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=timed_text_track.video.playlist
        )

        # Get the timed_text_track linked to the JWT token
        response = self.client.get(
            self._get_url(timed_text_track.video, timed_text_track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('"url":null', response.content.decode("utf-8"))
        content = json.loads(response.content)
        self.assertIsNone(content["url"])

    @override_settings(
        CLOUDFRONT_SIGNED_URLS_ACTIVE=True,
        CLOUDFRONT_SIGNED_PUBLIC_KEY_ID="cloudfront-access-key-id",
    )
    @mock.patch("builtins.open", new_callable=mock.mock_open, read_data=RSA_KEY_MOCK)
    def test_api_timed_text_track_read_detail_token_user_signed_urls(self, _mock_open):
        """Activating signed urls should add Cloudfront query string authentication parameters."""
        timed_text_track = TimedTextTrackFactory(
            video__pk="b8d40ed7-95b8-4848-98c9-50728dfee25d",
            video__playlist__title="foo",
            mode="cc",
            language="fr",
            uploaded_on=datetime(2018, 8, 8, tzinfo=baseTimezone.utc),
            upload_state="ready",
            extension="srt",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=timed_text_track.video.playlist
        )

        # Get the timed_text_track via the API using the JWT token
        # fix the time so that the url signature is deterministic and can be checked
        now = datetime(2018, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now):
            response = self.client.get(
                self._get_url(timed_text_track.video, timed_text_track),
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        expected_cloudfront_signature = (
            "Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6"
            "Ly9hYmMuY2xvdWRmcm9udC5uZXQvYjhkNDBlZDctOTViOC00ODQ4LTk4YzktNTA3MjhkZmVlM"
            "jVkLyoiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE1Mz"
            "M2OTM2MDB9fX1dfQ__&Signature=PkRZOcfOxbalcuNG9XN6wO72enDenSetWgTthNjR4Nsy"
            "UvCao1rZ9s4MZbqU61NDxB8Q3yDoWZUm-PP0uFa6v2Rz9g6XSTCA~-x8Yhh72-jc1J5NZOavh"
            "~HT6lbC2HnPAesaxbVG4EejSDuXjncE8kBiUdT6YNotAv1JzbqidXuOBdkSjR32PEav98PT0r"
            "UKmXohNAL-RFdwHL1cKGhy17CoxABn4ToDJ-t0Z4cT4husb5HebH~6nOmhlDDdFMSdmD7FjZ~"
            "qaJwagJ3sAqG1ph9NcTX45bDn2rcrDXUy0jHWxBPYUId6NGbKCITp1SFj0QAsoxsXnh90Ibkr"
            "GQ4XUA__&Key-Pair-Id=cloudfront-access-key-id"
        )

        self.assertEqual(
            content["url"],
            (
                "https://abc.cloudfront.net/b8d40ed7-95b8-4848-98c9-50728dfee25d/timedtext"
                f"/1533686400_fr_cc.vtt?{expected_cloudfront_signature}"
            ),
        )
        self.assertEqual(
            content["source_url"],
            (
                "https://abc.cloudfront.net/b8d40ed7-95b8-4848-98c9-50728dfee25d/timedtext"
                "/source/1533686400_fr_cc?response-content-disposition=attachment%3B+filen"
                f"ame%3Dfoo_1533686400.srt&{expected_cloudfront_signature}"
            ),
        )

    def test_api_timed_text_track_read_detail_staff_or_user(self):
        """Users authenticated via a session are not allowed to read a timed text track detail."""
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            timed_text_track = TimedTextTrackFactory()
            response = self.client.get(
                self._get_url(timed_text_track.video, timed_text_track)
            )
            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )

    def test_api_timed_text_track_read_detail_by_user_with_no_access(self):
        """
        Token user without any access gets a single timed text track.

        A user with a user token, without any specific access, cannot get
        a single timed text track.
        """
        user = factories.UserFactory()
        video = factories.VideoFactory()
        track = TimedTextTrackFactory(video=video)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            self._get_url(track.video, track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_timed_text_track_read_detail_by_video_playlist_instructor(self):
        """
        Playlist instructor token user gets a single timed text track.

        A user with a user token, who is a playlist instructor, can get
        a single timed text track linked to a video in that playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(playlist=playlist)
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.INSTRUCTOR
        )
        track = TimedTextTrackFactory(mode="cc", video=video)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            self._get_url(track.video, track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "active_stamp": None,
                "id": str(track.id),
                "is_ready_to_show": False,
                "language": track.language,
                "mode": "cc",
                "source_url": None,
                "upload_state": "pending",
                "url": None,
                "video": str(video.id),
            },
        )

    def test_api_timed_text_track_read_detail_by_video_playlist_admin(self):
        """
        Playlist administrator token user gets a single timed text track.

        A user with a user token, who is a playlist administrator, can get
        a single timed text track linked to a video in that playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user is an administrator, with a video
        playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(playlist=playlist)
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.ADMINISTRATOR
        )
        track = TimedTextTrackFactory(mode="cc", video=video)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            self._get_url(track.video, track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "active_stamp": None,
                "id": str(track.id),
                "is_ready_to_show": False,
                "language": track.language,
                "mode": "cc",
                "source_url": None,
                "upload_state": "pending",
                "url": None,
                "video": str(video.id),
            },
        )

    def test_api_timed_text_track_read_detail_by_video_organization_instructor(self):
        """
        Organization instructor token user gets a single timed text track.

        A user with a user token, who is an organization instructor, cannot get
        a single timed text track linked to a video in that organization.
        """
        user = factories.UserFactory()
        # An organization where the user is an instructor, with a playlist with a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.INSTRUCTOR
        )
        track = TimedTextTrackFactory(mode="cc", video=video)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            self._get_url(track.video, track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_timed_text_track_read_detail_by_video_organization_admin(self):
        """
        Organization administrator token user gets a single timed text track.

        A user with a user token, who is an organization administrator, can get
        a single timed text track linked to a video in that organization.
        """
        user = factories.UserFactory()
        # An organization where the user is an admin, with a playlist with a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.ADMINISTRATOR
        )
        track = TimedTextTrackFactory(mode="cc", video=video)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            self._get_url(track.video, track),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "active_stamp": None,
                "id": str(track.id),
                "is_ready_to_show": False,
                "language": track.language,
                "mode": "cc",
                "source_url": None,
                "upload_state": "pending",
                "url": None,
                "video": str(video.id),
            },
        )
