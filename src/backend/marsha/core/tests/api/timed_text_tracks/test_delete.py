"""Tests for the TimedTextTrack API of the Marsha project."""
from datetime import datetime
import json
import random
from unittest import mock

from django.test import TestCase, override_settings

from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)

from .. import factories, models
from ..api import timezone
from ..factories import TimedTextTrackFactory, UserFactory, VideoFactory
from ..models import TimedTextTrack
from .testing_utils import RSA_KEY_MOCK


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument,too-many-lines


class TimedTextTrackAPITest(TestCase):
    """Test the API of the timed text track object."""

    maxDiff = None

    @override_settings(ALL_LANGUAGES=(("af", "Afrikaans"), ("ast", "Asturian")))
    def test_api_timed_text_track_options_as_instructor(self):
        """The details of choices fields should be available via http options for an instructor."""
        timed_text_track = TimedTextTrackFactory(language="af")
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=timed_text_track.video,
            permissions__can_update=False,
        )

        response = self.client.options(
            "/api/timedtexttracks/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        content = json.loads(response.content)
        self.assertEqual(
            content["actions"]["POST"]["mode"]["choices"],
            [
                {"value": "st", "display_name": "Subtitle"},
                {"value": "ts", "display_name": "Transcript"},
                {"value": "cc", "display_name": "Closed captioning"},
            ],
        )
        self.assertEqual(
            content["actions"]["POST"]["language"]["choices"],
            [
                {"value": "af", "display_name": "Afrikaans"},
                {"value": "ast", "display_name": "Asturian"},
            ],
        )

    @override_settings(ALL_LANGUAGES=(("af", "Afrikaans"), ("ast", "Asturian")))
    def test_api_timed_text_track_options_as_student(self):
        """The details of choices fields should be available via http options for a student."""
        timed_text_track = TimedTextTrackFactory(language="af")
        jwt_token = StudentLtiTokenFactory(resource=timed_text_track.video)

        response = self.client.options(
            "/api/timedtexttracks/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        content = json.loads(response.content)
        self.assertEqual(
            content["actions"]["POST"]["mode"]["choices"],
            [
                {"value": "st", "display_name": "Subtitle"},
                {"value": "ts", "display_name": "Transcript"},
                {"value": "cc", "display_name": "Closed captioning"},
            ],
        )
        self.assertEqual(
            content["actions"]["POST"]["language"]["choices"],
            [
                {"value": "af", "display_name": "Afrikaans"},
                {"value": "ast", "display_name": "Asturian"},
            ],
        )

    @override_settings(ALL_LANGUAGES=(("af", "Afrikaans"), ("ast", "Asturian")))
    def test_api_timed_text_track_options_as_administrator(self):
        """The details of choices fields should be available via http options for an admin."""
        timed_text_track = TimedTextTrackFactory(language="af")
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=timed_text_track.video,
            permissions__can_update=False,
            roles=["administrator"],
        )

        response = self.client.options(
            "/api/timedtexttracks/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        content = json.loads(response.content)
        self.assertEqual(
            content["actions"]["POST"]["mode"]["choices"],
            [
                {"value": "st", "display_name": "Subtitle"},
                {"value": "ts", "display_name": "Transcript"},
                {"value": "cc", "display_name": "Closed captioning"},
            ],
        )
        self.assertEqual(
            content["actions"]["POST"]["language"]["choices"],
            [
                {"value": "af", "display_name": "Afrikaans"},
                {"value": "ast", "display_name": "Asturian"},
            ],
        )

    def test_api_timed_text_track_options_anonymous(self):
        """The details of choices fields should be available via http options for a student."""
        response = self.client.options("/api/timedtexttracks/")
        self.assertEqual(response.status_code, 401)

    def test_api_timed_text_track_read_detail_anonymous(self):
        """Anonymous users should not be allowed to read a timed text track detail."""
        timed_text_track = TimedTextTrackFactory()
        response = self.client.get(f"/api/timedtexttracks/{timed_text_track.id}/")
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_timed_text_track_read_detail_student(self):
        """Student users should not be allowed to read a timed text track detail."""
        timed_text_track = TimedTextTrackFactory()
        jwt_token = StudentLtiTokenFactory(resource=timed_text_track.video)
        # Get the timed text track using the JWT token
        response = self.client.get(
            f"/api/timedtexttracks/{timed_text_track.id}/",
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
            uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc),
            upload_state="ready",
            extension="srt",
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=timed_text_track.video)

        # Get the timed text track using the JWT token
        response = self.client.get(
            f"/api/timedtexttracks/{timed_text_track.id}/",
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
            f"/api/timedtexttracks/{other_timed_text_track.id}/",
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
            uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc),
            upload_state="ready",
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=timed_text_track.video)

        # Get the timed text track using the JWT token
        response = self.client.get(
            f"/api/timedtexttracks/{timed_text_track.id}/",
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
            f"/api/timedtexttracks/{other_timed_text_track.id}/",
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
            uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc),
            upload_state="ready",
            extension="srt",
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=timed_text_track.video,
            roles=["administrator"],
        )

        # Get the timed text track using the JWT token
        response = self.client.get(
            f"/api/timedtexttracks/{timed_text_track.id}/",
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
            f"/api/timedtexttracks/{other_timed_text_track.id}/",
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
            resource=timed_text_track.video,
            permissions__can_update=False,
        )

        response = self.client.get(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_timed_text_track_read_detail_token_user_no_active_stamp(self):
        """A timed text track with no active stamp should not fail.

        Its "url" field should be set to None.
        """
        timed_text_track = TimedTextTrackFactory(uploaded_on=None)
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=timed_text_track.video)

        # Get the timed text track using the JWT token
        response = self.client.get(
            f"/api/timedtexttracks/{timed_text_track.id}/",
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
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=timed_text_track.video)

        # Get the timed_text_track linked to the JWT token
        response = self.client.get(
            f"/api/timedtexttracks/{timed_text_track.id}/",
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
    def test_api_timed_text_track_read_detail_token_user_signed_urls(self, mock_open):
        """Activating signed urls should add Cloudfront query string authentication parameters."""
        timed_text_track = TimedTextTrackFactory(
            video__pk="b8d40ed7-95b8-4848-98c9-50728dfee25d",
            video__playlist__title="foo",
            mode="cc",
            language="fr",
            uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc),
            upload_state="ready",
            extension="srt",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=timed_text_track.video)

        # Get the timed_text_track via the API using the JWT token
        # fix the time so that the url signature is deterministic and can be checked
        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now):
            response = self.client.get(
                f"/api/timedtexttracks/{timed_text_track.id}/",
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
            response = self.client.get(f"/api/timedtexttracks/{timed_text_track.id}/")
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
            f"/api/timedtexttracks/{track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_timed_text_track_read_detail_by_video_playlist_instructor(self):
        """
        Playlist instructor token user gets a single timed text track.

        A user with a user token, who is a playlist instructor, cannot get
        a single timed text track linked to a video in that playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(playlist=playlist)
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.INSTRUCTOR
        )
        track = TimedTextTrackFactory(video=video)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/timedtexttracks/{track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

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
            f"/api/timedtexttracks/{track.id}/",
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
            f"/api/timedtexttracks/{track.id}/",
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
            f"/api/timedtexttracks/{track.id}/",
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

    def test_api_timed_text_track_read_list_anonymous(self):
        """Anonymous users should not be able to read a list of timed text tracks."""
        TimedTextTrackFactory()
        response = self.client.get("/api/timedtexttracks/")
        self.assertEqual(response.status_code, 401)

    def test_api_timed_text_track_read_list_token_user(self):
        """A token user associated to a video is able to read a list of timed text tracks."""
        # Make sure modes differ to avoid random failures as attempting to create a TTT with the
        # same language and mode as an existing one raises an exception.
        timed_text_track_one = TimedTextTrackFactory(mode="st")
        timed_text_track_two = TimedTextTrackFactory(
            mode="cc", video=timed_text_track_one.video
        )
        # Add a timed text track for another video
        TimedTextTrackFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=timed_text_track_one.video
        )

        response = self.client.get(
            "/api/timedtexttracks/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 200)
        timed_text_track_list = json.loads(response.content)
        self.assertEqual(len(timed_text_track_list["results"]), 2)
        self.assertEqual(timed_text_track_list["count"], 2)
        self.assertTrue(
            str(timed_text_track_one.id)
            in (ttt["id"] for ttt in timed_text_track_list["results"])
        )
        self.assertTrue(
            str(timed_text_track_two.id)
            in (ttt["id"] for ttt in timed_text_track_list["results"])
        )

    def test_api_timed_text_track_read_list_staff_or_user(self):
        """Users authenticated via a session shouldn't be able to read timed text tracks."""
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            TimedTextTrackFactory()
            response = self.client.get("/api/timedtexttracks/")
            self.assertEqual(response.status_code, 401)

    def test_api_timed_text_track_read_list_by_user_with_no_access(self):
        """
        Token user without any access lists timed text tracks by video.

        A user with a user token, without any specific access, cannot list
        timed text tracks for a video.
        """
        video = factories.VideoFactory()

        TimedTextTrackFactory(mode="st", video=video)
        TimedTextTrackFactory(mode="cc", video=video)
        # Add a timed text track for another video
        TimedTextTrackFactory()

        jwt_token = UserAccessTokenFactory()

        response = self.client.get(
            f"/api/timedtexttracks/?video={video.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_timed_text_track_read_list_by_video_playlist_instructor(self):
        """
        Playlist instructor token user lists timed text tracks by video.

        A user with a user token, who is a playlist instructor, cannot list timed
        text tracks for a video that belongs to that playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(playlist=playlist)
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.INSTRUCTOR
        )

        TimedTextTrackFactory(mode="st", video=video)
        TimedTextTrackFactory(mode="cc", video=video)
        # Add a timed text track for another video
        TimedTextTrackFactory()

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/timedtexttracks/?video={video.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_timed_text_track_read_list_by_video_playlist_admin(self):
        """
        Playlist admin token user lists timed text tracks by video.

        A user with a user token, who is a playlist administrator, can list timed
        text tracks for a video that belongs to that playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user is an admin, with a video
        playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(playlist=playlist)
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.ADMINISTRATOR
        )

        timed_text_track_one = TimedTextTrackFactory(mode="st", video=video)
        timed_text_track_two = TimedTextTrackFactory(mode="cc", video=video)
        # Add a timed text track for another video
        TimedTextTrackFactory()

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/timedtexttracks/?video={video.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        timed_text_track_list = json.loads(response.content)
        self.assertEqual(len(timed_text_track_list["results"]), 2)
        self.assertEqual(timed_text_track_list["count"], 2)
        self.assertTrue(
            str(timed_text_track_one.id)
            in (ttt["id"] for ttt in timed_text_track_list["results"])
        )
        self.assertTrue(
            str(timed_text_track_two.id)
            in (ttt["id"] for ttt in timed_text_track_list["results"])
        )

    def test_api_timed_text_track_read_list_by_video_organization_instructor(self):
        """
        Organization instructor token user lists timed text tracks by video.

        A user with a user token, who is an organization instructor, cannot list timed
        text tracks for a video that belongs to that organization.
        """
        user = factories.UserFactory()
        # An organization where the user is an instructor, with a playlist with a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.INSTRUCTOR
        )

        TimedTextTrackFactory(mode="st", video=video)
        TimedTextTrackFactory(mode="cc", video=video)
        # Add a timed text track for another video
        TimedTextTrackFactory()

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/timedtexttracks/?video={video.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_timed_text_track_read_list_by_video_organization_admin(self):
        """
        Organization admin token user lists timed text tracks by video.

        A user with a user token, who is an organization administrator, can list timed
        text tracks for a video that belongs to that organization.
        """
        user = factories.UserFactory()
        # An organization where the user is an admin, with a playlist with a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.ADMINISTRATOR
        )

        timed_text_track_one = TimedTextTrackFactory(mode="st", video=video)
        timed_text_track_two = TimedTextTrackFactory(mode="cc", video=video)
        # Add a timed text track for another video
        TimedTextTrackFactory()

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/timedtexttracks/?video={video.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        timed_text_track_list = json.loads(response.content)
        self.assertEqual(len(timed_text_track_list["results"]), 2)
        self.assertEqual(timed_text_track_list["count"], 2)
        self.assertTrue(
            str(timed_text_track_one.id)
            in (ttt["id"] for ttt in timed_text_track_list["results"])
        )
        self.assertTrue(
            str(timed_text_track_two.id)
            in (ttt["id"] for ttt in timed_text_track_list["results"])
        )

    def test_api_timed_text_track_read_list_by_admin_without_video_filter(self):
        """
        Token user with organization access lists timed text tracks without the video filter.

        A user with a user token, with an organization access, cannot list timed text
        tracks without a filter, as they have no basis to have permission to do so.
        """
        user = factories.UserFactory()
        # An organization where the user has access, with a playlist with a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.ADMINISTRATOR
        )

        TimedTextTrackFactory(mode="st", video=video)
        TimedTextTrackFactory(mode="cc", video=video)
        # Add a timed text track for another video
        TimedTextTrackFactory()

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            "/api/timedtexttracks/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_timed_text_track_create_anonymous(self):
        """Anonymous users should not be able to create a new timed text track."""
        response = self.client.post("/api/timedtexttracks/")
        self.assertEqual(response.status_code, 401)
        self.assertFalse(TimedTextTrack.objects.exists())

    def test_api_timed_text_track_create_token_user(self):
        """A token user should be able to create a timed text track for an existing video."""
        video = VideoFactory(id="f8c30d0d-2bb4-440d-9e8d-f4b231511f1f")
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        data = {"language": "fr", "size": 10}
        response = self.client.post(
            "/api/timedtexttracks/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(TimedTextTrack.objects.count(), 1)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "id": str(TimedTextTrack.objects.first().id),
                "active_stamp": None,
                "is_ready_to_show": False,
                "mode": "st",
                "language": "fr",
                "upload_state": "pending",
                "source_url": None,
                "url": None,
                "video": "f8c30d0d-2bb4-440d-9e8d-f4b231511f1f",
            },
        )

    def test_api_timed_text_create_token_user_track_no_size(self):
        """A token user shouldn't be able to create a track if size param is not specified"""
        video = VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        data = {"language": "fr"}
        response = self.client.post(
            "/api/timedtexttracks/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {"size": ["File size is required"]},
        )

    @override_settings(SUBTITLE_SOURCE_MAX_SIZE=10)
    def test_api_timed_text_track_create_token_user_file_too_large(self):
        """A token user shouldn't be able to create a timed text track with a too large size"""
        video = VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        data = {"language": "fr", "video": str(video.pk), "size": 100}
        response = self.client.post(
            "/api/timedtexttracks/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {"size": ["File too large, max size allowed is 10 Bytes"]},
        )

    def test_api_timed_text_track_create_instructor_in_read_only(self):
        """Instructor should not be able to create a timed text track in read_only mode."""
        timed_text_track = TimedTextTrackFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=timed_text_track.video,
            permissions__can_update=False,
        )

        response = self.client.post(
            "/api/timedtexttracks/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_timed_text_track_create_staff_or_user(self):
        """Users authenticated via a session shouldn't be able to create new timed text tracks."""
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            response = self.client.post("/api/timedtexttracks/")
            self.assertEqual(response.status_code, 401)
            self.assertFalse(TimedTextTrack.objects.exists())

    def test_api_timed_text_track_create_by_user_with_no_access(self):
        """
        Token user without any access creates a timed text track for a video.

        A user with a user token, without any specific access, cannot create a timed text
        track for any given video.
        """
        video = factories.VideoFactory()

        jwt_token = UserAccessTokenFactory()

        response = self.client.post(
            "/api/timedtexttracks/",
            {"language": "fr", "video": str(video.id), "size": 10},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(TimedTextTrack.objects.count(), 0)

    def test_api_timed_text_track_create_by_video_playlist_instructor(self):
        """
        Playlist instructor token user creates a timed text track for a video.

        A user with a user token, who is a playlist instructor, cannot create a timed
        text track for a video that belongs to that playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(playlist=playlist)
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.INSTRUCTOR
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            "/api/timedtexttracks/",
            {"language": "fr", "video": str(video.id), "size": 10},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(TimedTextTrack.objects.count(), 0)

    def test_api_timed_text_track_create_by_video_playlist_admin(self):
        """
        Playlist administrator token user creates a timed text track for a video.

        A user with a user token, who is a playlist administrator, can create a timed
        text track for a video that belongs to that playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(playlist=playlist)
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.ADMINISTRATOR
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            "/api/timedtexttracks/",
            {"language": "fr", "video": str(video.id), "size": 10},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(TimedTextTrack.objects.count(), 1)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "id": str(TimedTextTrack.objects.first().id),
                "active_stamp": None,
                "is_ready_to_show": False,
                "mode": "st",
                "language": "fr",
                "upload_state": "pending",
                "source_url": None,
                "url": None,
                "video": str(video.id),
            },
        )

    def test_api_timed_text_track_create_by_video_organization_instructor(self):
        """
        Organization instructor token user creates a timed text track for a video.

        A user with a user token, who is an organization instructor, cannot create a timed
        text track for a video that belongs to that organization.
        """
        user = factories.UserFactory()
        # A playlist where the user is an instructor, with a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.INSTRUCTOR
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            "/api/timedtexttracks/",
            {"language": "fr", "video": str(video.id), "size": 10},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(TimedTextTrack.objects.count(), 0)

    def test_api_timed_text_track_create_by_video_organization_admin(self):
        """
        Organization administrator token user creates a timed text track for a video.

        A user with a user token, who is an organization administrator, can create a timed
        text track for a video that belongs to that organization.
        """
        user = factories.UserFactory()
        # A playlist where the user is an instructor, with a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.ADMINISTRATOR
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            "/api/timedtexttracks/",
            data={"language": "fr", "video": str(video.id), "size": 10},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(TimedTextTrack.objects.count(), 1)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "id": str(TimedTextTrack.objects.first().id),
                "active_stamp": None,
                "is_ready_to_show": False,
                "mode": "st",
                "language": "fr",
                "upload_state": "pending",
                "source_url": None,
                "url": None,
                "video": str(video.id),
            },
        )

    def test_api_timed_text_track_update_detail_anonymous(self):
        """Anonymous users should not be allowed to update a timed_text_track through the API."""
        timed_text_track = TimedTextTrackFactory(language="fr")
        data = {"language": "en", "size": 10}
        response = self.client.put(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            json.dumps(data),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)
        timed_text_track.refresh_from_db()
        self.assertEqual(timed_text_track.language, "fr")

    def test_api_timed_text_track_update_detail_token_user_language(self):
        """Token users should be able to update the language of their timed_text_track."""
        timed_text_track = TimedTextTrackFactory(language="fr")
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=timed_text_track.video)

        response = self.client.get(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        data["language"] = "en"
        response = self.client.put(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        timed_text_track.refresh_from_db()
        self.assertEqual(timed_text_track.language, "en")

    def test_api_timed_text_track_update_detail_token_user_closed_captioning(self):
        """Token users should be able to update the mode flag through the API."""
        timed_text_track = TimedTextTrackFactory(mode="cc")
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=timed_text_track.video)

        response = self.client.get(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        data["mode"] = "ts"
        response = self.client.put(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        timed_text_track.refresh_from_db()
        self.assertEqual(timed_text_track.mode, "ts")

    def test_api_timed_text_track_update_detail_token_user_active_stamp(self):
        """Token users trying to update "active_stamp" through the API should be ignored."""
        timed_text_track = TimedTextTrackFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=timed_text_track.video)

        response = self.client.get(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        self.assertIsNone(data["active_stamp"])
        data["active_stamp"] = "1533686400"

        response = self.client.put(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        timed_text_track.refresh_from_db()
        self.assertIsNone(timed_text_track.uploaded_on)

    def test_api_timed_text_track_update_detail_token_user_upload_state(self):
        """Token users trying to update "upload_state" through the API should be ignored."""
        timed_text_track = TimedTextTrackFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=timed_text_track.video)

        response = self.client.get(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        self.assertEqual(data["upload_state"], "pending")
        data["upload_state"] = "ready"

        response = self.client.put(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        timed_text_track.refresh_from_db()
        self.assertEqual(timed_text_track.upload_state, "pending")

    def test_api_timed_text_track_update_instructor_in_read_only(self):
        """Instructor should not be able to update a timed text track in read_only mode."""
        timed_text_track = TimedTextTrackFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=timed_text_track.video,
            permissions__can_update=False,
        )

        response = self.client.put(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_timed_text_track_update_by_user_with_no_access(self):
        """
        Token user without any access updates a single timed text track.

        A user with a user token, without any specific access, cannot update
        a single timed text track.
        """
        track = factories.TimedTextTrackFactory(language="fr")

        jwt_token = UserAccessTokenFactory()

        response = self.client.get(
            f"/api/timedtexttracks/{track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        data["language"] = "en"

        response = self.client.put(
            f"/api/timedtexttracks/{track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        track.refresh_from_db()
        self.assertEqual(track.language, "fr")

    def test_api_timed_text_track_update_by_video_playlist_instructor(self):
        """
        Playlist instructor token user updates a timed text track.

        A user with a user token, who is a playlist instructor, cannot update
        a timed text track for a video that belongs to that playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(playlist=playlist)
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.INSTRUCTOR
        )
        track = factories.TimedTextTrackFactory(language="fr", video=video)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/timedtexttracks/{track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        data["language"] = "en"

        response = self.client.put(
            f"/api/timedtexttracks/{track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        track.refresh_from_db()
        self.assertEqual(track.language, "fr")

    def test_api_timed_text_track_update_by_video_playlist_admin(self):
        """
        Playlist administrator token user updates a timed text track.

        A user with a user token, who is a playlist administrator, can update
        a timed text track for a video that belongs to that playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user is an administrator, with a video
        playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(playlist=playlist)
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.ADMINISTRATOR
        )
        track = factories.TimedTextTrackFactory(language="fr", video=video)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/timedtexttracks/{track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        data["language"] = "en"

        response = self.client.put(
            f"/api/timedtexttracks/{track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        track.refresh_from_db()
        self.assertEqual(track.language, "en")

    def test_api_timed_text_track_update_by_video_organization_instructor(self):
        """
        Organization instructor token user updates a timed text track.

        A user with a user token, who is an organization instructor, cannot update
        a timed text track for a video that belongs to that organization.
        """
        user = factories.UserFactory()
        # An organization where the user is an instructor, with a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.INSTRUCTOR
        )
        track = factories.TimedTextTrackFactory(language="fr", video=video)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/timedtexttracks/{track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        data["language"] = "en"

        response = self.client.put(
            f"/api/timedtexttracks/{track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        track.refresh_from_db()
        self.assertEqual(track.language, "fr")

    def test_api_timed_text_track_update_by_video_organization_admin(self):
        """
        Organization administrator token user updates a timed text track.

        A user with a user token, who is an organization administrator, can update
        a timed text track for a video that belongs to that organization.
        """
        user = factories.UserFactory()
        # An organization where the user is an administrator, with a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.ADMINISTRATOR
        )
        track = factories.TimedTextTrackFactory(language="fr", video=video)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/timedtexttracks/{track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        data["language"] = "en"

        response = self.client.put(
            f"/api/timedtexttracks/{track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        track.refresh_from_db()
        self.assertEqual(track.language, "en")

    def test_api_timed_text_track_patch_detail_token_user_stamp_and_state(self):
        """Token users should not be able to patch upload state and active stamp.

        These 2 fields can only be updated by AWS via the separate update-state API endpoint.
        """
        timed_text_track = TimedTextTrackFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=timed_text_track.video)
        self.assertEqual(timed_text_track.upload_state, "pending")
        self.assertIsNone(timed_text_track.uploaded_on)

        data = {"active_stamp": "1533686400", "upload_state": "ready"}

        response = self.client.patch(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        timed_text_track.refresh_from_db()
        self.assertIsNone(timed_text_track.uploaded_on)
        self.assertEqual(timed_text_track.upload_state, "pending")

    def test_api_timed_text_track_update_detail_token_id(self):
        """Token users trying to update the ID of a timed text track they own should be ignored."""
        timed_text_track = TimedTextTrackFactory()
        original_id = timed_text_track.id
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=timed_text_track.video)

        response = self.client.get(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        data["id"] = "my new id"

        response = self.client.put(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        timed_text_track.refresh_from_db()
        self.assertEqual(timed_text_track.id, original_id)

    def test_api_timed_text_track_update_detail_token_video(self):
        """Token users trying to update the video of a timed text track should be ignored."""
        timed_text_track = TimedTextTrackFactory()
        original_video = timed_text_track.video
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=timed_text_track.video)

        response = self.client.get(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        data["video"] = str(VideoFactory().id)

        response = self.client.put(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        timed_text_track.refresh_from_db()
        self.assertEqual(timed_text_track.video, original_video)

    def test_api_timed_text_track_update_detail_token_user_other_video(self):
        """Token users are not allowed to update a timed text track related to another video."""
        other_video = VideoFactory()
        timed_text_track_update = TimedTextTrackFactory(language="en")
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=other_video)

        data = {"language": "fr", "size": 10}
        response = self.client.put(
            f"/api/timedtexttracks/{timed_text_track_update.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        timed_text_track_update.refresh_from_db()
        self.assertEqual(timed_text_track_update.language, "en")

    def test_api_timed_text_track_patch_instructor_in_read_only(self):
        """Instructor should not be able to patch a timed text track in read_only mode."""
        timed_text_track = TimedTextTrackFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=timed_text_track.video,
            permissions__can_update=False,
        )

        response = self.client.patch(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_timed_text_track_patch_by_user_with_no_access(self):
        """
        Token user without any access patches a single timed text track.

        A user with a user token, without any specific access, cannot patch
        a single timed text track.
        """
        track = factories.TimedTextTrackFactory(language="fr")

        jwt_token = UserAccessTokenFactory()

        data = {"language": "en", "size": 10}

        response = self.client.patch(
            f"/api/timedtexttracks/{track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        track.refresh_from_db()
        self.assertEqual(track.language, "fr")

    def test_api_timed_text_track_patch_by_video_playlist_instructor(self):
        """
        Playlist instructor token user patches a timed text track.

        A user with a user token, who is a playlist instructor, cannot patch
        a timed text track for a video that belongs to that playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(playlist=playlist)
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.INSTRUCTOR
        )
        track = factories.TimedTextTrackFactory(language="fr", video=video)

        jwt_token = UserAccessTokenFactory(user=user)

        data = {"language": "en", "size": 10}

        response = self.client.patch(
            f"/api/timedtexttracks/{track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        track.refresh_from_db()
        self.assertEqual(track.language, "fr")

    def test_api_timed_text_track_patch_by_video_playlist_admin(self):
        """
        Playlist administrator token user patches a timed text track.

        A user with a user token, who is a playlist administrator, can patch
        a timed text track for a video that belongs to that playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user is an administrator, with a video
        playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(playlist=playlist)
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.ADMINISTRATOR
        )
        track = factories.TimedTextTrackFactory(language="fr", video=video)

        jwt_token = UserAccessTokenFactory(user=user)

        data = {"language": "en", "size": 10}

        response = self.client.patch(
            f"/api/timedtexttracks/{track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        track.refresh_from_db()
        self.assertEqual(track.language, "en")

    def test_api_timed_text_track_patch_by_video_organization_instructor(self):
        """
        Organization instructor token user patches a timed text track.

        A user with a user token, who is an organization instructor, cannot patch
        a timed text track for a video that belongs to that organization.
        """
        user = factories.UserFactory()
        # An organization where the user is an instructor, with a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.INSTRUCTOR
        )
        track = factories.TimedTextTrackFactory(language="fr", video=video)

        jwt_token = UserAccessTokenFactory(user=user)

        data = {"language": "en", "size": 10}

        response = self.client.patch(
            f"/api/timedtexttracks/{track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        track.refresh_from_db()
        self.assertEqual(track.language, "fr")

    def test_api_timed_text_track_patch_by_video_organization_admin(self):
        """
        Organization administrator token user patches a timed text track.

        A user with a user token, who is an organization administrator, can patch
        a timed text track for a video that belongs to that organization.
        """
        user = factories.UserFactory()
        # An organization where the user is an administrator, with a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.ADMINISTRATOR
        )
        track = factories.TimedTextTrackFactory(language="fr", video=video)

        jwt_token = UserAccessTokenFactory(user=user)

        data = {"language": "en", "size": 10}

        response = self.client.patch(
            f"/api/timedtexttracks/{track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        track.refresh_from_db()
        self.assertEqual(track.language, "en")

    def test_api_timed_text_track_delete_detail_anonymous(self):
        """Anonymous users should not be allowed to delete a timed text track."""
        timed_text_track = TimedTextTrackFactory()

        response = self.client.delete(f"/api/timedtexttracks/{timed_text_track.id}/")

        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )
        self.assertTrue(TimedTextTrack.objects.filter(id=timed_text_track.id).exists())

    def test_api_timed_text_track_delete_detail_token_user(self):
        """A token user linked to a video should be allowed to delete its timed text tracks."""
        timed_text_tracks = TimedTextTrackFactory.create_batch(2)

        # Delete the timed text tracks using the JWT token
        for timed_text_track in timed_text_tracks:
            jwt_token = InstructorOrAdminLtiTokenFactory(
                resource=timed_text_track.video
            )
            response = self.client.delete(
                f"/api/timedtexttracks/{timed_text_track.id}/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            self.assertEqual(response.status_code, 204)
            self.assertFalse(
                TimedTextTrack.objects.filter(id=timed_text_track.id).exists()
            )

    def test_api_timed_text_track_delete_detail_staff_or_user(self):
        """Users authenticated via a session should not be able to delete a timed text track."""
        timed_text_track = TimedTextTrackFactory()
        for user in [
            UserFactory(),
            UserFactory(is_staff=True),
            UserFactory(is_superuser=True),
        ]:
            self.client.login(username=user.username, password="test")

            response = self.client.delete(
                f"/api/timedtexttracks/{timed_text_track.id}/"
            )

            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )
        self.assertTrue(TimedTextTrack.objects.filter(id=timed_text_track.id).exists())

    def test_api_timed_text_track_delete_instructor_in_read_only(self):
        """Instructor should not be able to delete a timed text track in read_only mode."""
        timed_text_track = TimedTextTrackFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=timed_text_track.video,
            permissions__can_update=False,
        )

        response = self.client.delete(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_timed_text_track_delete_by_user_with_no_access(self):
        """
        Token user without any access deletes a single timed text track.

        A user with a user token, without any specific access, cannot delete
        a single timed text track.
        """
        video = factories.VideoFactory()

        track = TimedTextTrackFactory(video=video)
        self.assertEqual(TimedTextTrack.objects.count(), 1)

        jwt_token = UserAccessTokenFactory()

        response = self.client.delete(
            f"/api/timedtexttracks/{track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(TimedTextTrack.objects.count(), 1)

    def test_api_timed_text_track_delete_by_video_playlist_instructor(self):
        """
        Playlist instructor token user deletes a timed text track for a video.

        A user with a user token, who is a playlist instructor, cannot delete a timed
        text track for a video that belongs to that playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(playlist=playlist)
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.INSTRUCTOR
        )

        track = factories.TimedTextTrackFactory(video=video)
        self.assertEqual(TimedTextTrack.objects.count(), 1)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.delete(
            f"/api/timedtexttracks/{track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(TimedTextTrack.objects.count(), 1)

    def test_api_timed_text_track_delete_by_video_playlist_admin(self):
        """
        Playlist administrator token user deletes a timed text track for a video.

        A user with a user token, who is a playlist administrator, can delete a timed
        text track for a video that belongs to that playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user is an administrator, with a video
        playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(playlist=playlist)
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.ADMINISTRATOR
        )

        track = factories.TimedTextTrackFactory(video=video)
        self.assertEqual(TimedTextTrack.objects.count(), 1)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.delete(
            f"/api/timedtexttracks/{track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(TimedTextTrack.objects.count(), 0)

    def test_api_timed_text_track_delete_by_video_organization_instructor(self):
        """
        Organization instructor token user deletes a timed text track for a video.

        A user with a user token, who is an organization instructor, cannot delete a
        timed text track for a video that belongs to that playlist.
        """
        user = factories.UserFactory()
        # An organization where the user is an instructor, with a playlist with a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.INSTRUCTOR
        )

        track = factories.TimedTextTrackFactory(video=video)
        self.assertEqual(TimedTextTrack.objects.count(), 1)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.delete(
            f"/api/timedtexttracks/{track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(TimedTextTrack.objects.count(), 1)

    def test_api_timed_text_track_delete_by_video_organization_admin(self):
        """
        Organization administrator token user deletes a timed text track for a video.

        A user with a user token, who is an organization administrator, can delete a
        timed text track for a video that belongs to that playlist.
        """
        user = factories.UserFactory()
        # An organization where the user is an admin, with a playlist with a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.ADMINISTRATOR
        )

        track = factories.TimedTextTrackFactory(video=video)
        self.assertEqual(TimedTextTrack.objects.count(), 1)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.delete(
            f"/api/timedtexttracks/{track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(TimedTextTrack.objects.count(), 0)
