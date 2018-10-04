"""Tests for the SubtitleTrack API of the Marsha project."""
from base64 import b64decode
from datetime import datetime
import json
from unittest import mock

from django.test import TestCase, override_settings

import pytz
from rest_framework_simplejwt.tokens import AccessToken

from ..api import timezone
from ..factories import SubtitleTrackFactory, UserFactory, VideoFactory
from ..models import STATE_CHOICES, SubtitleTrack
from .test_api_video import RSA_KEY_MOCK


# We don't enforce arguments documentation in tests
# pylint: disable=missing-param-doc,missing-type-doc,unused-argument


class SubtitleTrackAPITest(TestCase):
    """Test the API of the subtitle track object."""

    def test_api_subtitle_track_read_detail_anonymous(self):
        """Anonymous users should not be allowed to read a subtitle track detail."""
        subtitle_track = SubtitleTrackFactory()
        response = self.client.get(
            "/api/subtitle-tracks/{!s}/".format(subtitle_track.id)
        )
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_subtitle_track_read_detail_token_user(self):
        """A token user associated to a video can read a subtitle track related to this video."""
        subtitle_track = SubtitleTrackFactory(
            video__resource_id="b8d40ed7-95b8-4848-98c9-50728dfee25d",
            has_closed_captioning=True,
            language="fr",
            uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc),
            state="ready",
        )

        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(subtitle_track.video.id)

        # Get the subtitle track using the JWT token
        response = self.client.get(
            "/api/subtitle-tracks/{!s}/".format(subtitle_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "active_stamp": "1533686400",
                "id": str(subtitle_track.id),
                "has_closed_captioning": True,
                "language": "fr",
                "state": "ready",
                "url": (
                    "https://abc.cloudfront.net/b8d40ed7-95b8-4848-98c9-50728dfee25d/"
                    "subtitles/1533686400_fr_cc.vtt"
                ),
                "video": str(subtitle_track.video.id),
            },
        )

        # Try getting another subtitle_track
        other_subtitle_track = SubtitleTrackFactory()
        response = self.client.get(
            "/api/subtitle-tracks/{!s}/".format(other_subtitle_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_subtitle_track_read_detail_token_user_no_active_stamp(self):
        """A subtitle track with no active stamp should not fail and set a "url" field to None."""
        subtitle_track = SubtitleTrackFactory(uploaded_on=None)
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(subtitle_track.video.id)

        # Get the subtitle track using the JWT token
        response = self.client.get(
            "/api/subtitle-tracks/{!s}/".format(subtitle_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('"url":null', response.content.decode("utf-8"))
        content = json.loads(response.content)
        self.assertIsNone(content["url"])

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_subtitle_track_read_detail_token_user_not_ready(self):
        """A subtitle_track that is not ready should have its "url" field set to `None`."""
        for state, _ in STATE_CHOICES:
            if state == "ready":
                continue

            subtitle_track = SubtitleTrackFactory(
                uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc), state=state
            )
            jwt_token = AccessToken()
            jwt_token.payload["video_id"] = str(subtitle_track.video.id)

            # Get the subtitle_track linked to the JWT token
            response = self.client.get(
                "/api/subtitle-tracks/{!s}/".format(subtitle_track.id),
                HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            )
            self.assertEqual(response.status_code, 200)
            self.assertIn('"url":null', response.content.decode("utf-8"))
            content = json.loads(response.content)
            self.assertIsNone(content["url"])

    @override_settings(
        CLOUDFRONT_SIGNED_URLS_ACTIVE=True,
        CLOUDFRONT_ACCESS_KEY_ID="cloudfront-access-key-id",
    )
    @mock.patch("builtins.open", new_callable=mock.mock_open, read_data=RSA_KEY_MOCK)
    def test_api_subtitle_track_read_detail_token_user_signed_urls(self, mock_open):
        """Activating signed urls should add Cloudfront query string authentication parameters."""
        subtitle_track = SubtitleTrackFactory(
            video__resource_id="b8d40ed7-95b8-4848-98c9-50728dfee25d",
            has_closed_captioning=True,
            language="fr",
            uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc),
            state="ready",
        )
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(subtitle_track.video.id)

        # Get the subtitle_track via the API using the JWT token
        # fix the time so that the url signature is deterministic and can be checked
        now = datetime(2018, 8, 8, tzinfo=pytz.utc)
        with mock.patch.object(timezone, "now", return_value=now):
            response = self.client.get(
                "/api/subtitle-tracks/{!s}/".format(subtitle_track.id),
                HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content["url"],
            (
                "https://abc.cloudfront.net/b8d40ed7-95b8-4848-98c9-50728dfee25d/subtitles/"
                "1533686400_fr_cc.vtt?Expires=1533693600&Signature=MqGQW7V3iI2kIGruCKQWmrKvu7~sdv"
                "owselEZ41j16aberPYcFyUPFAE4KmcfRcbPiF8xee56lFrrm4VC30f0f7TyppTssymn3wVz6afE12BDi"
                "WpP0ED80xBdnbtNmb~hRBpYTIJhJ8UA0geQnh98dK0vm8IO9p6EopmZCVP6sqlorV3It2CP8IR6rmSbE"
                "aQQm2LHdO5AqTLn1BuVolGKBuxTE6CI7L-bzHXpnqEpybKSRHKbr6LwMdHXdY9tp5oZg-mtvNKKMK4b2"
                "YqD6Wd6uWf3koQ9oO6lP2HGgEV68F1t7q7zyxbp5JtkFMzmUStYkIUx-bCFkkWH5drrTjTAA__&"
                "Key-Pair-Id=cloudfront-access-key-id"
            ),
        )

    def test_api_subtitle_track_read_detail_staff_or_user(self):
        """Users authenticated via a session are not allowed to read a subtitle track detail."""
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            subtitle_track = SubtitleTrackFactory()
            response = self.client.get(
                "/api/subtitle-tracks/{!s}/".format(subtitle_track.id)
            )
            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )

    def test_api_subtitle_track_read_list_anonymous(self):
        """Anonymous users should not be able to read a list of subtitle tracks."""
        SubtitleTrackFactory()
        response = self.client.get("/api/subtitle-tracks/")
        self.assertEqual(response.status_code, 401)

    def test_api_subtitle_track_read_list_token_user(self):
        """A token user associated to a video is not able to read a list of subtitle tracks."""
        subtitle_track = SubtitleTrackFactory()
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(subtitle_track.video.id)

        response = self.client.get(
            "/api/subtitle-tracks/", HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token)
        )
        self.assertEqual(response.status_code, 405)

    def test_api_subtitle_track_read_list_staff_or_user(self):
        """Users authenticated via a session can not be able to read a list of subtitle tracks."""
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            SubtitleTrackFactory()
            response = self.client.get("/api/subtitle-tracks/")
            self.assertEqual(response.status_code, 401)

    def test_api_subtitle_track_create_anonymous(self):
        """Anonymous users should not be able to create a new subtitle track."""
        response = self.client.post("/api/subtitle-tracks/")
        self.assertEqual(response.status_code, 401)
        self.assertFalse(SubtitleTrack.objects.exists())

    def test_api_subtitle_track_create_token_user(self):
        """A token user should be able to create a subtitle track for an existing video."""
        video = VideoFactory(id="f8c30d0d-2bb4-440d-9e8d-f4b231511f1f")
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)

        data = {"language": "fr"}
        response = self.client.post(
            "/api/subtitle-tracks/",
            data,
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(SubtitleTrack.objects.count(), 1)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "id": str(SubtitleTrack.objects.first().id),
                "active_stamp": None,
                "has_closed_captioning": False,
                "language": "fr",
                "state": "pending",
                "url": None,
                "video": "f8c30d0d-2bb4-440d-9e8d-f4b231511f1f",
            },
        )

    def test_api_subtitle_track_create_staff_or_user(self):
        """Users authenticated via a session should not be able to create a new subtitle track."""
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            response = self.client.post("/api/subtitle-tracks/")
            self.assertEqual(response.status_code, 401)
            self.assertFalse(SubtitleTrack.objects.exists())

    def test_api_subtitle_track_update_detail_anonymous(self):
        """Anonymous users should not be allowed to update a subtitle_track through the API."""
        subtitle_track = SubtitleTrackFactory(language="fr")
        data = {"language": "en"}
        response = self.client.put(
            "/api/subtitle-tracks/{!s}/".format(subtitle_track.id),
            json.dumps(data),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)
        subtitle_track.refresh_from_db()
        self.assertEqual(subtitle_track.language, "fr")

    def test_api_subtitle_track_update_detail_token_user_language(self):
        """Token users should be able to update the language of their subtitle_track."""
        subtitle_track = SubtitleTrackFactory(language="fr")
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(subtitle_track.video.id)

        data = {"language": "en"}
        response = self.client.put(
            "/api/subtitle-tracks/{!s}/".format(subtitle_track.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        subtitle_track.refresh_from_db()
        self.assertEqual(subtitle_track.language, "en")

    def test_api_subtitle_track_update_detail_token_user_closed_captioning(self):
        """Token users should be able to update the closed captioning flag through the API."""
        subtitle_track = SubtitleTrackFactory(has_closed_captioning=False)
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(subtitle_track.video.id)

        response = self.client.get(
            "/api/subtitle-tracks/{!s}/".format(subtitle_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        data = json.loads(response.content)
        data["has_closed_captioning"] = True
        response = self.client.put(
            "/api/subtitle-tracks/{!s}/".format(subtitle_track.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        subtitle_track.refresh_from_db()
        self.assertEqual(subtitle_track.has_closed_captioning, True)

    def test_api_subtitle_track_update_detail_token_user_uploaded_on(self):
        """Token users should be able to confirm the datetime of upload through the API."""
        subtitle_track = SubtitleTrackFactory()
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(subtitle_track.video.id)

        response = self.client.get(
            "/api/subtitle-tracks/{!s}/".format(subtitle_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        data = json.loads(response.content)
        data["active_stamp"] = "1533686400"

        response = self.client.put(
            "/api/subtitle-tracks/{!s}/".format(subtitle_track.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        subtitle_track.refresh_from_db()
        self.assertEqual(
            subtitle_track.uploaded_on, datetime(2018, 8, 8, tzinfo=pytz.utc)
        )

    def test_api_subtitle_track_update_detail_token_user_state(self):
        """Token users should be able to update the state through the API."""
        subtitle_track = SubtitleTrackFactory(state="pending")
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(subtitle_track.video.id)

        response = self.client.get(
            "/api/subtitle-tracks/{!s}/".format(subtitle_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        data = json.loads(response.content)
        data["state"] = "ready"

        response = self.client.put(
            "/api/subtitle-tracks/{!s}/".format(subtitle_track.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        subtitle_track.refresh_from_db()
        self.assertEqual(subtitle_track.state, "ready")

    def test_api_subtitle_track_update_detail_token_id(self):
        """Token users trying to update the ID of a subtitle track they own should be ignored."""
        subtitle_track = SubtitleTrackFactory()
        original_id = subtitle_track.id
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(subtitle_track.video.id)

        response = self.client.get(
            "/api/subtitle-tracks/{!s}/".format(subtitle_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        data = json.loads(response.content)
        data["id"] = "my new id"

        response = self.client.put(
            "/api/subtitle-tracks/{!s}/".format(subtitle_track.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        subtitle_track.refresh_from_db()
        self.assertEqual(subtitle_track.id, original_id)

    def test_api_subtitle_track_update_detail_token_video(self):
        """Token users trying to update the video of a subtitle track should be ignored."""
        subtitle_track = SubtitleTrackFactory()
        original_video = subtitle_track.video
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(subtitle_track.video.id)

        response = self.client.get(
            "/api/subtitle-tracks/{!s}/".format(subtitle_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        data = json.loads(response.content)
        data["video"] = str(VideoFactory().id)

        response = self.client.put(
            "/api/subtitle-tracks/{!s}/".format(subtitle_track.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        subtitle_track.refresh_from_db()
        self.assertEqual(subtitle_track.video, original_video)

    def test_api_subtitle_track_update_detail_token_user_other_video(self):
        """Token users are not allowed to update a subtitle track related to another video."""
        other_video = VideoFactory()
        subtitle_track_update = SubtitleTrackFactory(language="en")
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(other_video.id)

        data = {"language": "fr"}
        response = self.client.put(
            "/api/subtitle-tracks/{!s}/".format(subtitle_track_update.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        subtitle_track_update.refresh_from_db()
        self.assertEqual(subtitle_track_update.language, "en")

    def test_api_subtitle_track_patch_detail_token_user_uploaded_on_and_state(self):
        """Token users should be able to patch the state and active stamp of their subtitle track.

        Upon successful upload of the subtitle track, AWS will patch just these 2 fields to avoid
        interfering with the user modifying its title for example. In opposition, an update
        requires posting all the required fields and is therefore performed in 2 steps (a GET
        followed by a PUT) which is dangerous.
        """
        subtitle_track = SubtitleTrackFactory()
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(subtitle_track.video.id)
        self.assertEqual(subtitle_track.state, "pending")
        self.assertIsNone(subtitle_track.uploaded_on)

        data = {"active_stamp": "1533686400", "state": "ready"}

        response = self.client.patch(
            "/api/subtitle-tracks/{!s}/".format(subtitle_track.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        subtitle_track.refresh_from_db()
        self.assertEqual(
            subtitle_track.uploaded_on, datetime(2018, 8, 8, tzinfo=pytz.utc)
        )
        self.assertEqual(subtitle_track.state, "ready")

    def test_api_subtitle_track_delete_detail_anonymous(self):
        """Anonymous users should not be allowed to delete a subtitle track."""
        subtitle_track = SubtitleTrackFactory()

        response = self.client.delete(
            "/api/subtitle-tracks/{!s}/".format(subtitle_track.id)
        )

        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )
        self.assertTrue(SubtitleTrack.objects.filter(id=subtitle_track.id).exists())

    def test_api_subtitle_track_delete_detail_token_user(self):
        """A token user associated to a video should not be able to delete its subtitle tracks."""
        subtitle_tracks = SubtitleTrackFactory.create_batch(2)
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(subtitle_tracks[0].video.id)

        # Try deleting the subtitle tracks using the JWT token
        for subtitle_track in subtitle_tracks:
            response = self.client.delete(
                "/api/subtitle-tracks/{!s}/".format(subtitle_track.id),
                HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            )
            self.assertEqual(response.status_code, 405)
            content = json.loads(response.content)
            self.assertEqual(content, {"detail": 'Method "DELETE" not allowed.'})
            self.assertTrue(SubtitleTrack.objects.filter(id=subtitle_track.id).exists())

    def test_api_subtitle_track_delete_detail_staff_or_user(self):
        """Users authenticated via a session should not be able to delete a subtitle track."""
        subtitle_track = SubtitleTrackFactory()
        for user in [
            UserFactory(),
            UserFactory(is_staff=True),
            UserFactory(is_superuser=True),
        ]:
            self.client.login(username=user.username, password="test")

            response = self.client.delete(
                "/api/subtitle-tracks/{!s}/".format(subtitle_track.id)
            )

            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )
        self.assertTrue(SubtitleTrack.objects.filter(id=subtitle_track.id).exists())

    def test_api_subtitle_track_delete_list_anonymous(self):
        """Anonymous users should not be able to delete a list of subtitle tracks."""
        subtitle_track = SubtitleTrackFactory()
        response = self.client.delete("/api/subtitle-tracks/")
        self.assertEqual(response.status_code, 401)
        self.assertTrue(SubtitleTrack.objects.filter(id=subtitle_track.id).exists())

    def test_api_subtitle_track_delete_list_token_user(self):
        """A token user should not be able to delete a list of their subtitle tracks."""
        subtitle_track = SubtitleTrackFactory()
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(subtitle_track.video.id)

        response = self.client.delete(
            "/api/subtitle-tracks/", HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token)
        )
        self.assertEqual(response.status_code, 405)
        self.assertTrue(SubtitleTrack.objects.filter(id=subtitle_track.id).exists())

    def test_api_subtitle_track_delete_list_staff_or_user(self):
        """Users authenticated via session should not be able to delete a list of subtitles."""
        subtitle_track = SubtitleTrackFactory()

        for user in [
            UserFactory(),
            UserFactory(is_staff=True),
            UserFactory(is_superuser=True),
        ]:
            self.client.login(username=user.username, password="test")
            response = self.client.delete("/api/subtitle-tracks/")
            self.assertEqual(response.status_code, 401)

        self.assertTrue(SubtitleTrack.objects.filter(id=subtitle_track.id).exists())

    def test_api_subtitle_track_upload_policy_anonymous_user(self):
        """Anonymous users should not be allowed to retrieve an upload policy."""
        subtitle_track = SubtitleTrackFactory()

        response = self.client.get(
            "/api/subtitle-tracks/{!s}/upload-policy/".format(subtitle_track.id)
        )

        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_subtitle_track_upload_policy_token_user(self):
        """A token user should be able to retrieve an upload policy."""
        subtitle_track = SubtitleTrackFactory(
            id="5c019027-1e1f-4d8c-9f83-c5e20edaad2b",
            video__resource_id="b8d40ed7-95b8-4848-98c9-50728dfee25d",
            language="fr",
            has_closed_captioning=True,
        )
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(subtitle_track.video.id)

        # Get the upload policy for this subtitle track
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=pytz.utc)
        with mock.patch.object(timezone, "now", return_value=now):
            response = self.client.get(
                "/api/subtitle-tracks/{!s}/upload-policy/".format(subtitle_track.id),
                HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        policy = content.pop("policy")
        self.assertEqual(
            json.loads(b64decode(policy)),
            {
                "expiration": "2018-08-09T00:00:00.000Z",
                "conditions": [
                    {"acl": "private"},
                    {"bucket": "test-marsha-source"},
                    {
                        "x-amz-credential": "aws-access-key-id/20180808/eu-west-1/s3/aws4_request"
                    },
                    {"x-amz-algorithm": "AWS4-HMAC-SHA256"},
                    {"x-amz-date": "20180808T000000Z"},
                    {
                        "key": (
                            "b8d40ed7-95b8-4848-98c9-50728dfee25d/subtitletrack/"
                            "5c019027-1e1f-4d8c-9f83-c5e20edaad2b/1533686400_fr_cc"
                        )
                    },
                    ["content-length-range", 0, 1048576],
                ],
            },
        )
        self.assertEqual(
            content,
            {
                "acl": "private",
                "bucket": "test-marsha-source",
                "stamp": "1533686400",
                "key": "{!s}/subtitletrack/{!s}/1533686400_fr_cc".format(
                    subtitle_track.video.resource_id, subtitle_track.id
                ),
                "max_file_size": 1048576,
                "s3_endpoint": "s3.eu-west-1.amazonaws.com",
                "x_amz_algorithm": "AWS4-HMAC-SHA256",
                "x_amz_credential": "aws-access-key-id/20180808/eu-west-1/s3/aws4_request",
                "x_amz_date": "20180808T000000Z",
                "x_amz_expires": 86400,
                "x_amz_signature": (
                    "22e5e75aee4104c3382b584f83adb19a872a12f58f09bc19fbe909b357e28efd"
                ),
            },
        )

        # Try getting the upload policy for another subtitle_track
        other_subtitle_track = SubtitleTrackFactory()
        response = self.client.get(
            "/api/subtitle-tracks/{!s}/upload-policy/".format(other_subtitle_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_subtitle_track_upload_policy_staff_or_user(self):
        """Users authenticated via a session should not be able to retrieve an upload policy."""
        subtitle_track = SubtitleTrackFactory()
        for user in [
            UserFactory(),
            UserFactory(is_staff=True),
            UserFactory(is_superuser=True),
        ]:
            self.client.login(username=user.username, password="test")
            response = self.client.get(
                "/api/subtitle-tracks/{!s}/upload-policy/".format(subtitle_track.id)
            )
            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )
