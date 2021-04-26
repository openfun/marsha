"""Tests for the TimedTextTrack API of the Marsha project."""
from datetime import datetime
import json
import random
from unittest import mock

from django.test import TestCase, override_settings

import pytz
from rest_framework_simplejwt.tokens import AccessToken

from ..api import timezone
from ..factories import TimedTextTrackFactory, UserFactory, VideoFactory
from ..models import TimedTextTrack
from .test_api_video import RSA_KEY_MOCK


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument,too-many-lines


class TimedTextTrackAPITest(TestCase):
    """Test the API of the timed text track object."""

    maxDiff = None

    @override_settings(ALL_LANGUAGES=(("af", "Afrikaans"), ("ast", "Asturian")))
    def test_api_timed_text_track_options_as_instructor(self):
        """The details of choices fields should be available via http options for an instructor."""
        timed_text_track = TimedTextTrackFactory(language="af")
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]

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

    @override_settings(ALL_LANGUAGES=(("af", "Afrikaans"), ("ast", "Asturian")))
    def test_api_timed_text_track_options_as_student(self):
        """The details of choices fields should be available via http options for a student."""
        timed_text_track = TimedTextTrackFactory(language="af")
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = ["student"]

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

    @override_settings(ALL_LANGUAGES=(("af", "Afrikaans"), ("ast", "Asturian")))
    def test_api_timed_text_track_options_as_administrator(self):
        """The details of choices fields should be available via http options for an admin."""
        timed_text_track = TimedTextTrackFactory(language="af")
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = ["administrator"]

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

    def test_api_timed_text_track_options_anonymous(self):
        """The details of choices fields should be available via http options for a student."""
        response = self.client.options("/api/timedtexttracks/")
        self.assertEqual(response.status_code, 401)

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
        jwt_token.payload["resource_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = ["student"]
        # Get the timed text track using the JWT token
        response = self.client.get(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
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
            uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc),
            upload_state="ready",
            extension="srt",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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
            "/api/timedtexttracks/{!s}/".format(other_timed_text_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
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
            uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc),
            upload_state="ready",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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
            "/api/timedtexttracks/{!s}/".format(other_timed_text_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
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
            uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc),
            upload_state="ready",
            extension="srt",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = ["administrator"]
        jwt_token.payload["permissions"] = {"can_update": True}

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
            "/api/timedtexttracks/{!s}/".format(other_timed_text_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_timed_text_track_read_instructor_in_read_only(self):
        """Instructor should not be able to read a timed text track in read_only mode."""
        timed_text_track = TimedTextTrackFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": False}

        response = self.client.get(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_timed_text_track_read_detail_token_user_no_active_stamp(self):
        """A timed text track with no active stamp should not fail.

        Its "url" field should be set to None.
        """
        timed_text_track = TimedTextTrackFactory(uploaded_on=None)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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
        """A timed_text_track that has never been uploaded successfully should have no url."""
        timed_text_track = TimedTextTrackFactory(
            uploaded_on=None, upload_state=random.choice(["pending", "error", "ready"])
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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
            video__pk="b8d40ed7-95b8-4848-98c9-50728dfee25d",
            video__playlist__title="foo",
            mode="cc",
            language="fr",
            uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc),
            upload_state="ready",
            extension="srt",
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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
                "https://abc.cloudfront.net/b8d40ed7-95b8-4848-98c9-50728dfee25d/timedtext"
                "/1533686400_fr_cc.vtt?Expires=1533693600&Signature=CWr09YDiSe-j2sKML3f29n"
                "KfjCdF8nUMUeL1~yHPkMkQpxDXGc5mnKDKkelvzLyAhIUmEi1CtZgG18siFD4RzDVCNufOINx"
                "KCWzKYmVjN67PJAitNi2nUazFhOA-QODJ03gEpCPgea7ntwgJemOtqkd1uj7kgay~HeslK1L2"
                "HEIRHjbjaYEoCldCISC8l2FIh~fFryFv9Ptu9ajm4OfIrpc2~oDqe5QkGotQ7IrcZlq8MqMte"
                "1tbDaGkaQD-NpURCj7rmkt8vkqpWij-IkWxzNWyX38SL1bg2Co762Ab~YKpdiS8jf-WppVS31"
                "cCehf1bPdsqypBzSFMCqORZvEBtw__&Key-Pair-Id=cloudfront-access-key-id"
            ),
        )
        self.assertEqual(
            content["source_url"],
            (
                "https://abc.cloudfront.net/b8d40ed7-95b8-4848-98c9-50728dfee25d/timedtext"
                "/source/1533686400_fr_cc?response-content-disposition=attachment%3B+filen"
                "ame%3Dfoo_1533686400.srt&Expires=1533693600&Signature=Fcb5y9wuTPBPQ2PETBZ"
                "qAnlMYKTHWkv9fCm5uItq4t28GMMtITGKjpjzlnnUmRvlP0DI6IUjDKXWkZEFN8mM70z4oSn9"
                "NSh9OLIOG0mAyXRq3XNPh4P0UG8RBkbq2JLSJHgzsDy~AS06LS6i14IQonXoTLsvXGoELNVuN"
                "sIImqHh2jeH0qaOo34pTWc~GXROYKwwYGEhkmuI1LhX5tJ14aFAEq9ggcm1YRu-aFabQj6yin"
                "ZkZAgfEqIOScVyG78h5NNDWdU4JbPoQgUr-r97uN91FuoZYn2nJDTxYS0wQQVAc5LGNFB4pjq"
                "57uxu-aKIRDzKaxOiTrOn75GztmV4OA__&Key-Pair-Id=cloudfront-access-key-id"
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
        jwt_token.payload["resource_id"] = str(timed_text_track_one.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        response = self.client.get(
            "/api/timedtexttracks/", HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token)
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

    def test_api_timed_text_track_create_anonymous(self):
        """Anonymous users should not be able to create a new timed text track."""
        response = self.client.post("/api/timedtexttracks/")
        self.assertEqual(response.status_code, 401)
        self.assertFalse(TimedTextTrack.objects.exists())

    def test_api_timed_text_track_create_token_user(self):
        """A token user should be able to create a timed text track for an existing video."""
        video = VideoFactory(id="f8c30d0d-2bb4-440d-9e8d-f4b231511f1f")
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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
                "is_ready_to_show": False,
                "mode": "st",
                "language": "fr",
                "upload_state": "pending",
                "source_url": None,
                "url": None,
                "video": "f8c30d0d-2bb4-440d-9e8d-f4b231511f1f",
            },
        )

    def test_api_timed_text_track_create_instructor_in_read_only(self):
        """Instructor should not be able to create a timed text track in read_only mode."""
        timed_text_track = TimedTextTrackFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": False}

        response = self.client.post(
            "/api/timedtexttracks/", HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token)
        )
        self.assertEqual(response.status_code, 403)

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
        jwt_token.payload["resource_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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
        jwt_token.payload["resource_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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

    def test_api_timed_text_track_update_detail_token_user_active_stamp(self):
        """Token users trying to update "active_stamp" through the API should be ignored."""
        timed_text_track = TimedTextTrackFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        response = self.client.get(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        data = json.loads(response.content)
        self.assertIsNone(data["active_stamp"])
        data["active_stamp"] = "1533686400"

        response = self.client.put(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        timed_text_track.refresh_from_db()
        self.assertIsNone(timed_text_track.uploaded_on)

    def test_api_timed_text_track_update_detail_token_user_upload_state(self):
        """Token users trying to update "upload_state" through the API should be ignored."""
        timed_text_track = TimedTextTrackFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        response = self.client.get(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        data = json.loads(response.content)
        self.assertEqual(data["upload_state"], "pending")
        data["upload_state"] = "ready"

        response = self.client.put(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        timed_text_track.refresh_from_db()
        self.assertEqual(timed_text_track.upload_state, "pending")

    def test_api_timed_text_track_update_instructor_in_read_only(self):
        """Instructor should not be able to update a timed text track in read_only mode."""
        timed_text_track = TimedTextTrackFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": False}

        response = self.client.put(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)

    def test_api_timed_text_track_patch_detail_token_user_stamp_and_state(self):
        """Token users should not be able to patch upload state and active stamp.

        These 2 fields can only be updated by AWS via the separate update-state API endpoint.
        """
        timed_text_track = TimedTextTrackFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        self.assertEqual(timed_text_track.upload_state, "pending")
        self.assertIsNone(timed_text_track.uploaded_on)

        data = {"active_stamp": "1533686400", "upload_state": "ready"}

        response = self.client.patch(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
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
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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
        jwt_token.payload["resource_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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
        jwt_token.payload["resource_id"] = str(other_video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        data = {"language": "fr"}
        response = self.client.put(
            "/api/timedtexttracks/{!s}/".format(timed_text_track_update.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        timed_text_track_update.refresh_from_db()
        self.assertEqual(timed_text_track_update.language, "en")

    def test_api_timed_text_track_patch_instructor_in_read_only(self):
        """Instructor should not be able to patch a timed text track in read_only mode."""
        timed_text_track = TimedTextTrackFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": False}

        response = self.client.patch(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)

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
            jwt_token.payload["resource_id"] = str(timed_text_track.video.id)
            jwt_token.payload["roles"] = [
                random.choice(["instructor", "administrator"])
            ]
            jwt_token.payload["permissions"] = {"can_update": True}
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
        jwt_token.payload["resource_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        response = self.client.delete(
            "/api/timedtexttracks/", HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token)
        )
        self.assertEqual(response.status_code, 403)
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

    def test_api_timed_text_track_delete_instructor_in_read_only(self):
        """Instructor should not be able to delete a timed text track in read_only mode."""
        timed_text_track = TimedTextTrackFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": False}

        response = self.client.delete(
            "/api/timedtexttracks/{!s}/".format(timed_text_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)

    def test_api_timed_text_track_initiate_upload_anonymous_user(self):
        """Anonymous users should not be allowed to initiate an upload."""
        timed_text_track = TimedTextTrackFactory()

        response = self.client.post(
            "/api/timedtexttracks/{!s}/initiate-upload/".format(timed_text_track.id)
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
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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
        now = datetime(2018, 8, 8, tzinfo=pytz.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                "/api/timedtexttracks/{!s}/initiate-upload/".format(
                    timed_text_track.id
                ),
                HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
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
            "/api/timedtexttracks/{!s}/initiate-upload/".format(
                other_ttt_for_other_video.id
            ),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
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
                "/api/timedtexttracks/{!s}/initiate-upload/".format(timed_text_track.id)
            )
            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )

    def test_api_timed_text_track_instructor_initiate_upload_in_read_only(self):
        """Instructor should not be able to initiate a timed text track upload in read_only."""
        timed_text_track = TimedTextTrackFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(timed_text_track.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": False}

        response = self.client.post(
            "/api/timedtexttracks/{!s}/initiate-upload/".format(timed_text_track.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)
