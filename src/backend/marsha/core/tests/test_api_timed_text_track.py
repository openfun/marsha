"""Tests for the TimedTextTrack API of the Marsha project."""
from base64 import b64decode
from datetime import datetime
import json
from unittest import mock

from django.test import TestCase, override_settings

import pytz
from rest_framework_simplejwt.tokens import AccessToken

from ..api import timezone
from ..factories import TimedTextTrackFactory, UserFactory, VideoFactory
from ..models import STATE_CHOICES, TimedTextTrack
from .test_api_video import RSA_KEY_MOCK


# We don't enforce arguments documentation in tests
# pylint: disable=missing-param-doc,missing-type-doc,unused-argument


class TimedTextTrackAPITest(TestCase):
    """Test the API of the timed text track object."""

    @override_settings(ALL_LANGUAGES=(("af", "Afrikaans"), ("ast", "Asturian")))
    def test_api_timed_text_track_options(self):
        """The details of choices fields should be available via http options."""
        timed_text_track = TimedTextTrackFactory(language="af")
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = ["instructor"]

        response = self.client.options(
            "/api/timedtexttracks/", HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token)
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
        self.assertEqual(
            content["actions"]["POST"]["state"]["choices"],
            [
                {"value": "pending", "display_name": "pending"},
                {"value": "processing", "display_name": "processing"},
                {"value": "error", "display_name": "error"},
                {"value": "ready", "display_name": "ready"},
            ],
        )

    def test_api_timed_text_track_read_detail_anonymous(self):
        """Anonymous users should not be allowed to read a timed text track detail."""
        timed_text_track = TimedTextTrackFactory()
        response = self.client.get(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id)
        )
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_timed_text_track_read_detail_student(self):
        """Student users should not be allowed to read a timed text track detail."""
        timed_text_track = TimedTextTrackFactory()
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = ["student"]
        # Get the timed text track using the JWT token
        response = self.client.get(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Only admin users or object owners are allowed."}
        )

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_timed_text_track_read_detail_token_user(self):
        """A token user associated to a video can read a timed text track related to this video."""
        timed_text_track = TimedTextTrackFactory(
            video__resource_id="b8d40ed7-95b8-4848-98c9-50728dfee25d",
            mode="cc",
            language="fr",
            uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc),
            state="ready",
        )

        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = ["instructor"]

        # Get the timed text track using the JWT token
        response = self.client.get(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "active_stamp": "1533686400",
                "id": str(timed_text_track.id),
                "mode": "cc",
                "language": "fr",
                "state": "ready",
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
            "/api/timedtexttracks/{!s}/".format(other_timed_text_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 404)
        content = json.loads(response.content)
        self.assertEqual(content, {"detail": "Not found."})

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_timed_text_track_read_detail_token_user_no_active_stamp(self):
        """A timed text track with no active stamp should not fail.

        Its "url" field should be set to None.
        """
        timed_text_track = TimedTextTrackFactory(uploaded_on=None)
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = ["instructor"]

        # Get the timed text track using the JWT token
        response = self.client.get(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('"url":null', response.content.decode("utf-8"))
        content = json.loads(response.content)
        self.assertIsNone(content["url"])

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_timed_text_track_read_detail_token_user_not_ready(self):
        """A timed_text_track that is not ready should have its "url" field set to `None`."""
        for state, _ in STATE_CHOICES:
            if state == "ready":
                continue

            timed_text_track = TimedTextTrackFactory(
                uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc), state=state
            )
            jwt_token = AccessToken()
            jwt_token.payload["video_id"] = str(timed_text_track.video.id)
            jwt_token.payload["roles"] = ["instructor"]

            # Get the timed_text_track linked to the JWT token
            response = self.client.get(
                "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
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
    def test_api_timed_text_track_read_detail_token_user_signed_urls(self, mock_open):
        """Activating signed urls should add Cloudfront query string authentication parameters."""
        timed_text_track = TimedTextTrackFactory(
            video__resource_id="b8d40ed7-95b8-4848-98c9-50728dfee25d",
            mode="cc",
            language="fr",
            uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc),
            state="ready",
        )
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = ["instructor"]

        # Get the timed_text_track via the API using the JWT token
        # fix the time so that the url signature is deterministic and can be checked
        now = datetime(2018, 8, 8, tzinfo=pytz.utc)
        with mock.patch.object(timezone, "now", return_value=now):
            response = self.client.get(
                "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
                HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content["url"],
            (
                "https://abc.cloudfront.net/b8d40ed7-95b8-4848-98c9-50728dfee25d/timedtext/"
                "1533686400_fr_cc.vtt?Expires=1533693600&Signature=CWr09YDiSe-j2sKML3f29nKfjCdF8n"
                "UMUeL1~yHPkMkQpxDXGc5mnKDKkelvzLyAhIUmEi1CtZgG18siFD4RzDVCNufOINxKCWzKYmVjN67PJA"
                "itNi2nUazFhOA-QODJ03gEpCPgea7ntwgJemOtqkd1uj7kgay~HeslK1L2HEIRHjbjaYEoCldCISC8l2"
                "FIh~fFryFv9Ptu9ajm4OfIrpc2~oDqe5QkGotQ7IrcZlq8MqMte1tbDaGkaQD-NpURCj7rmkt8vkqpWi"
                "j-IkWxzNWyX38SL1bg2Co762Ab~YKpdiS8jf-WppVS31cCehf1bPdsqypBzSFMCqORZvEBtw__&"
                "Key-Pair-Id=cloudfront-access-key-id"
            ),
        )

    def test_api_timed_text_track_read_detail_staff_or_user(self):
        """Users authenticated via a session are not allowed to read a timed text track detail."""
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            timed_text_track = TimedTextTrackFactory()
            response = self.client.get(
                "/api/timedtexttracks/{!s}/".format(timed_text_track.id)
            )
            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
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

        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(timed_text_track_one.video.id)
        jwt_token.payload["roles"] = ["instructor"]

        response = self.client.get(
            "/api/timedtexttracks/", HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token)
        )
        self.assertEqual(response.status_code, 200)
        timed_text_track_list = json.loads(response.content)
        self.assertEqual(len(timed_text_track_list), 2)
        self.assertTrue(
            str(timed_text_track_one.id) in [ttt["id"] for ttt in timed_text_track_list]
        )
        self.assertTrue(
            str(timed_text_track_two.id) in [ttt["id"] for ttt in timed_text_track_list]
        )

    def test_api_timed_text_track_read_list_staff_or_user(self):
        """Users authenticated via a session shouldn't be able to read timed text tracks."""
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            TimedTextTrackFactory()
            response = self.client.get("/api/timedtexttracks/")
            self.assertEqual(response.status_code, 401)

    def test_api_timed_text_track_create_anonymous(self):
        """Anonymous users should not be able to create a new timed text track."""
        response = self.client.post("/api/timedtexttracks/")
        self.assertEqual(response.status_code, 401)
        self.assertFalse(TimedTextTrack.objects.exists())

    def test_api_timed_text_track_create_token_user(self):
        """A token user should be able to create a timed text track for an existing video."""
        video = VideoFactory(id="f8c30d0d-2bb4-440d-9e8d-f4b231511f1f")
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)
        jwt_token.payload["roles"] = ["instructor"]

        data = {"language": "fr"}
        response = self.client.post(
            "/api/timedtexttracks/",
            data,
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(TimedTextTrack.objects.count(), 1)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "id": str(TimedTextTrack.objects.first().id),
                "active_stamp": None,
                "mode": "st",
                "language": "fr",
                "state": "pending",
                "url": None,
                "video": "f8c30d0d-2bb4-440d-9e8d-f4b231511f1f",
            },
        )

    def test_api_timed_text_track_create_staff_or_user(self):
        """Users authenticated via a session shouldn't be able to create new timed text tracks."""
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            response = self.client.post("/api/timedtexttracks/")
            self.assertEqual(response.status_code, 401)
            self.assertFalse(TimedTextTrack.objects.exists())

    def test_api_timed_text_track_update_detail_anonymous(self):
        """Anonymous users should not be allowed to update a timed_text_track through the API."""
        timed_text_track = TimedTextTrackFactory(language="fr")
        data = {"language": "en"}
        response = self.client.put(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
            json.dumps(data),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)
        timed_text_track.refresh_from_db()
        self.assertEqual(timed_text_track.language, "fr")

    def test_api_timed_text_track_update_detail_token_user_language(self):
        """Token users should be able to update the language of their timed_text_track."""
        timed_text_track = TimedTextTrackFactory(language="fr")
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = ["instructor"]

        data = {"language": "en"}
        response = self.client.put(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        timed_text_track.refresh_from_db()
        self.assertEqual(timed_text_track.language, "en")

    def test_api_timed_text_track_update_detail_token_user_closed_captioning(self):
        """Token users should be able to update the mode flag through the API."""
        timed_text_track = TimedTextTrackFactory(mode="cc")
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = ["instructor"]

        response = self.client.get(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        data = json.loads(response.content)
        data["mode"] = "ts"
        response = self.client.put(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        timed_text_track.refresh_from_db()
        self.assertEqual(timed_text_track.mode, "ts")

    def test_api_timed_text_track_update_detail_token_user_uploaded_on(self):
        """Token users should be able to confirm the datetime of upload through the API."""
        timed_text_track = TimedTextTrackFactory()
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = ["instructor"]

        response = self.client.get(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        data = json.loads(response.content)
        data["active_stamp"] = "1533686400"

        response = self.client.put(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        timed_text_track.refresh_from_db()
        self.assertEqual(
            timed_text_track.uploaded_on, datetime(2018, 8, 8, tzinfo=pytz.utc)
        )

    def test_api_timed_text_track_update_detail_token_user_state(self):
        """Token users should be able to update the state through the API."""
        timed_text_track = TimedTextTrackFactory(state="pending")
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = ["instructor"]

        response = self.client.get(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        data = json.loads(response.content)
        data["state"] = "ready"

        response = self.client.put(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        timed_text_track.refresh_from_db()
        self.assertEqual(timed_text_track.state, "ready")

    def test_api_timed_text_track_update_detail_token_id(self):
        """Token users trying to update the ID of a timed text track they own should be ignored."""
        timed_text_track = TimedTextTrackFactory()
        original_id = timed_text_track.id
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = ["instructor"]

        response = self.client.get(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        data = json.loads(response.content)
        data["id"] = "my new id"

        response = self.client.put(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        timed_text_track.refresh_from_db()
        self.assertEqual(timed_text_track.id, original_id)

    def test_api_timed_text_track_update_detail_token_video(self):
        """Token users trying to update the video of a timed text track should be ignored."""
        timed_text_track = TimedTextTrackFactory()
        original_video = timed_text_track.video
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = ["instructor"]

        response = self.client.get(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        data = json.loads(response.content)
        data["video"] = str(VideoFactory().id)

        response = self.client.put(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        timed_text_track.refresh_from_db()
        self.assertEqual(timed_text_track.video, original_video)

    def test_api_timed_text_track_update_detail_token_user_other_video(self):
        """Token users are not allowed to update a timed text track related to another video."""
        other_video = VideoFactory()
        timed_text_track_update = TimedTextTrackFactory(language="en")
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(other_video.id)
        jwt_token.payload["roles"] = ["instructor"]

        data = {"language": "fr"}
        response = self.client.put(
            "/api/timedtexttracks/{!s}/".format(timed_text_track_update.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 404)
        timed_text_track_update.refresh_from_db()
        self.assertEqual(timed_text_track_update.language, "en")

    def test_api_timed_text_track_patch_detail_token_user_uploaded_on_and_state(self):
        """Token users should be able to patch the state and active stamp of their timed text track.

        Upon successful upload of the timed text track, AWS will patch just these 2 fields to avoid
        interfering with the user modifying its title for example. In opposition, an update
        requires posting all the required fields and is therefore performed in 2 steps (a GET
        followed by a PUT) which is dangerous.
        """
        timed_text_track = TimedTextTrackFactory()
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = ["instructor"]
        self.assertEqual(timed_text_track.state, "pending")
        self.assertIsNone(timed_text_track.uploaded_on)

        data = {"active_stamp": "1533686400", "state": "ready"}

        response = self.client.patch(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        timed_text_track.refresh_from_db()
        self.assertEqual(
            timed_text_track.uploaded_on, datetime(2018, 8, 8, tzinfo=pytz.utc)
        )
        self.assertEqual(timed_text_track.state, "ready")

    def test_api_timed_text_track_delete_detail_anonymous(self):
        """Anonymous users should not be allowed to delete a timed text track."""
        timed_text_track = TimedTextTrackFactory()

        response = self.client.delete(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id)
        )

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
            jwt_token = AccessToken()
            jwt_token.payload["video_id"] = str(timed_text_track.video.id)
            jwt_token.payload["roles"] = ["instructor"]
            response = self.client.delete(
                "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
                HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
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
                "/api/timedtexttracks/{!s}/".format(timed_text_track.id)
            )

            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )
        self.assertTrue(TimedTextTrack.objects.filter(id=timed_text_track.id).exists())

    def test_api_timed_text_track_delete_list_anonymous(self):
        """Anonymous users should not be able to delete a list of timed text tracks."""
        timed_text_track = TimedTextTrackFactory()
        response = self.client.delete("/api/timedtexttracks/")
        self.assertEqual(response.status_code, 401)
        self.assertTrue(TimedTextTrack.objects.filter(id=timed_text_track.id).exists())

    def test_api_timed_text_track_delete_list_token_user(self):
        """A token user should not be able to delete a list of their timed text tracks."""
        timed_text_track = TimedTextTrackFactory()
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = ["instructor"]

        response = self.client.delete(
            "/api/timedtexttracks/", HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token)
        )
        self.assertEqual(response.status_code, 405)
        self.assertTrue(TimedTextTrack.objects.filter(id=timed_text_track.id).exists())

    def test_api_timed_text_track_delete_list_staff_or_user(self):
        """Users authenticated via session should not be allowed to delete timed text tracks."""
        timed_text_track = TimedTextTrackFactory()

        for user in [
            UserFactory(),
            UserFactory(is_staff=True),
            UserFactory(is_superuser=True),
        ]:
            self.client.login(username=user.username, password="test")
            response = self.client.delete("/api/timedtexttracks/")
            self.assertEqual(response.status_code, 401)

        self.assertTrue(TimedTextTrack.objects.filter(id=timed_text_track.id).exists())

    def test_api_timed_text_track_upload_policy_anonymous_user(self):
        """Anonymous users should not be allowed to retrieve an upload policy."""
        timed_text_track = TimedTextTrackFactory()

        response = self.client.get(
            "/api/timedtexttracks/{!s}/upload-policy/".format(timed_text_track.id)
        )

        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_timed_text_track_upload_policy_token_user(self):
        """A token user should be able to retrieve an upload policy."""
        timed_text_track = TimedTextTrackFactory(
            id="5c019027-1e1f-4d8c-9f83-c5e20edaad2b",
            video__resource_id="b8d40ed7-95b8-4848-98c9-50728dfee25d",
            language="fr",
            mode="cc",
        )
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = ["instructor"]

        # Get the upload policy for this timed text track
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=pytz.utc)
        with mock.patch.object(timezone, "now", return_value=now):
            response = self.client.get(
                "/api/timedtexttracks/{!s}/upload-policy/".format(timed_text_track.id),
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
                            "b8d40ed7-95b8-4848-98c9-50728dfee25d/timedtexttrack/"
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
                "key": "{!s}/timedtexttrack/{!s}/1533686400_fr_cc".format(
                    timed_text_track.video.resource_id, timed_text_track.id
                ),
                "max_file_size": 1048576,
                "s3_endpoint": "s3.eu-west-1.amazonaws.com",
                "x_amz_algorithm": "AWS4-HMAC-SHA256",
                "x_amz_credential": "aws-access-key-id/20180808/eu-west-1/s3/aws4_request",
                "x_amz_date": "20180808T000000Z",
                "x_amz_expires": 86400,
                "x_amz_signature": (
                    "90bcd67645f0ba6d949849131178de94e87a0267a1b28be47fd4951360bc58e3"
                ),
            },
        )

        # Try getting the upload policy for another timed_text_track
        other_timed_text_track = TimedTextTrackFactory()
        response = self.client.get(
            "/api/timedtexttracks/{!s}/upload-policy/".format(
                other_timed_text_track.id
            ),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 404)
        content = json.loads(response.content)
        self.assertEqual(content, {"detail": "Not found."})

    def test_api_timed_text_track_upload_policy_staff_or_user(self):
        """Users authenticated via a session should not be able to retrieve an upload policy."""
        timed_text_track = TimedTextTrackFactory()
        for user in [
            UserFactory(),
            UserFactory(is_staff=True),
            UserFactory(is_superuser=True),
        ]:
            self.client.login(username=user.username, password="test")
            response = self.client.get(
                "/api/timedtexttracks/{!s}/upload-policy/".format(timed_text_track.id)
            )
            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )
