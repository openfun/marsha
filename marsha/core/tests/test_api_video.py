"""Tests for the Video API of the Marsha project."""
from datetime import datetime
import json
from unittest import mock

from django.test import TestCase, override_settings

import pytz
from rest_framework_simplejwt.tokens import AccessToken

from ..api import timezone
from ..factories import SubtitleTrackFactory, UserFactory, VideoFactory
from ..models import Video


RSA_KEY_MOCK = b"""
-----BEGIN RSA PRIVATE KEY-----
MIIEoQIBAAKCAQBNUKgvL8k3rd882JuuAwg/3102KEuOgJV47X+cEmaWDKZWbnIL
1r+ondm8xtpLTDtYtZ2IYBZsrfa5DJjhllkIhtSOWpT/YnDJWnV9mHeuh1elfsB+
szs/aCDezf3piNi4WdpDzNwmqcUBopn4rydKpADjup6zXoBXyh7pLtLyLk2Xdnt5
LHlnRTgatBQmCcraLMRrvQfmscD0zA0TRlZyimWmktt/+eEli0bWgNwm2kPkcfG8
SSdIp2GUMpV3rjILlWlybRDpNR0H7qO9Ea6JzjcNAAi+33pKDTJZ472TmetT51G/
ZypymDNyh1wn3CIavQLMGBOp4HtoX0cX7x3/AgMBAAECggEAOsDffjRXOhvEeI23
CK6/NyK7x+spN9qZPDNndSg6ky57vVTjEAIa1b1W+PE4dF4y/z/MvhUfFWnCA3AC
QfQqJqOnpaJKdiTNxwYaIN6bnKK3RUmkaOQ1UwMDb62kljLrVnTZvApTBoKe9pYl
Yelg94TYNDbeYTqgV5Z+lP+DSIx3dg+2Ow90scQt8ZQt20XsL9CANZye9bUwUcLn
JQEjLIE3k+YpGSSDvJz+vbgozBvNfv0M4/BTLGvUvMRBinfqRJVXc09WTqqsDJb9
GJHcP8TSdwm/6CHrkUkVjsDZvzUiVIp8R+DBmZfPO6KfS0ig5H/uA5NwaHhSMRi+
6KSL+QKBgQCRMxdFjcCJFc5T/H3A/uJreAyuH8gn7jiK6pF3bplvnE6zpz9LzhNW
5a+7F5rSZrRYRIQ6Rn67PpRd/T7N9wvMEItIp7cAGqfAwPwhaX/INkkVtmxFGrjg
Muwpxi9zb8cmRYKL/j7WgwtzRsoR+BRqkAd+WqltRxq0dYqrAIExtQKBgQCIUD83
WDoa8fguIj3VHeRnLBEg+5L7IUf7ldOhgzifhde/cEOlqFy7AQuLMnj4NJzmEwa8
IKV+brcbAW1v7e3hElpFBFmVjcj9JSezuK3NS41iX5ZDPlLCGy0b1+3BS7ucMrHv
CLWsDaTVacnD+vLzYk1ssppotAlFOMt4Z+hxYwKBgAw7Yp2AaJTj2mLm5W0py8dD
8MWGdeUvQ2IoiqKmFZT6dQLbdxCaxrROWzSGs4tADbdV5lHGeIyro/IbEHxncH37
ctBnGJqQpEsvts3VxmcGc7e5i3ty2dpBT/Xg9URjSUKnHm1OuNp3ZbKLZyCGZqnn
gkoZtyY2lEBZmpn3S+r1AoGAY+CAYTnY4TNYB9149rU/TEUii8spB658Ap/l/5qZ
G3FDAnbsae2xfCeo4KXrstlB+OYJ8j/tYnUW3set+uwXdukukRE93nGTyb+2ll2D
oz9vaZvmCoEYvDaTV6pf/1hRL4KJkz4LdvRMST6I4nr2FlR5rGI09vCrNjgGBcQE
sUcCgYBgICkGE5v7DltVOA1cT65bjyRh8xso+/LGTM2A6jORVZpC4DnqyxkVpJaA
FjzCJG6LdHZH5df8TbqEz4dl2ddNT5wgYheLizH5YcJ+MyeMeGM+JHHAWyl2p016
ASOu/Da3/eg8PI5Rsh6ubNVlEAMQdDFhL/TpfaHqSwim6mxbrQ==
-----END RSA PRIVATE KEY-----
"""

# We don't enforce arguments documentation in tests
# pylint: disable=missing-param-doc,missing-type-doc,unused-argument


class VideoAPITest(TestCase):
    """Test the API of the video object."""

    def test_api_video_read_detail_anonymous(self):
        """Anonymous users should not be allowed to read a video detail."""
        video = VideoFactory()
        response = self.client.get("/api/videos/{!s}/".format(video.id))
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_video_read_detail_token_user(self):
        """A token user associated to a video should be able to read the detail of this video."""
        video = VideoFactory(
            id="a2f27fde-973a-4e89-8dca-cc59e01d255c",
            playlist__id="f76f6afd-7135-488e-9d70-6ec599a67806",
            uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc),
            state="ready",
        )
        playlist = video.playlist
        subtitle = SubtitleTrackFactory(
            id="e8ed0374-ffaa-4693-9ea9-03f0d2cbe627",
            video=video,
            has_closed_captioning=True,
            language="fr",
            uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc),
            state="ready",
        )

        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)

        # Get the video linked to the JWT token
        response = self.client.get(
            "/api/videos/{!s}/".format(video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        thumbnails_template = (
            "https://abc.cloudfront.net/"
            "{!s}/{!s}/thumbnails/1533686400_{!s}.0000000.jpg"
        )
        thumbnails_dict = {
            str(rate): thumbnails_template.format(playlist.id, video.id, rate)
            for rate in [144, 240, 480, 720, 1080]
        }

        mp4_template = "https://abc.cloudfront.net/{!s}/{!s}/videos/1533686400_{!s}.mp4"
        mp4_dict = {
            str(rate): mp4_template.format(playlist.id, video.id, rate)
            for rate in [144, 240, 480, 720, 1080]
        }
        self.assertEqual(
            content,
            {
                "description": video.description,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": "1533686400",
                "state": "ready",
                "subtitle_tracks": [
                    {
                        "active_stamp": "1533686400",
                        "has_closed_captioning": True,
                        "id": str(subtitle.id),
                        "language": "fr",
                        "state": "ready",
                        "url": (
                            "https://abc.cloudfront.net/f76f6afd-7135-488e-9d70-6ec599a67806/"
                            "a2f27fde-973a-4e89-8dca-cc59e01d255c/subtitles/"
                            "e8ed0374-ffaa-4693-9ea9-03f0d2cbe627/1533686400_fr_cc.vtt"
                        ),
                        "video": "a2f27fde-973a-4e89-8dca-cc59e01d255c",
                    }
                ],
                "urls": json.dumps({"mp4": mp4_dict, "thumbnails": thumbnails_dict}),
            },
        )

        # Try getting another video
        other_video = VideoFactory()
        response = self.client.get(
            "/api/videos/{!s}/".format(other_video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_video_read_detail_token_user_no_active_stamp(self):
        """A video with no active stamp should not fail and its "urls" should be set to `None`."""
        video = VideoFactory(uploaded_on=None)
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)

        # Get the video linked to the JWT token
        response = self.client.get(
            "/api/videos/{!s}/".format(video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "description": video.description,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": None,
                "state": "pending",
                "subtitle_tracks": [],
                "urls": None,
            },
        )

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_video_read_detail_token_user_not_ready(self):
        """A video that is not ready should have its "urls" set to `None`."""
        for state, _ in Video.STATE_CHOICES:
            if state == "ready":
                continue

            video = VideoFactory(
                uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc), state=state
            )
            jwt_token = AccessToken()
            jwt_token.payload["video_id"] = str(video.id)

            # Get the video linked to the JWT token
            response = self.client.get(
                "/api/videos/{!s}/".format(video.id),
                HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            )
            self.assertEqual(response.status_code, 200)
            content = json.loads(response.content)
            self.assertEqual(
                content,
                {
                    "description": video.description,
                    "id": str(video.id),
                    "title": video.title,
                    "active_stamp": "1533686400",
                    "state": state,
                    "subtitle_tracks": [],
                    "urls": None,
                },
            )

    @override_settings(
        CLOUDFRONT_SIGNED_URLS_ACTIVE=True,
        CLOUDFRONT_ACCESS_KEY_ID="cloudfront-access-key-id",
    )
    @mock.patch("builtins.open", new_callable=mock.mock_open, read_data=RSA_KEY_MOCK)
    def test_api_video_read_detail_token_user_signed_urls(self, mock_open):
        """Activating signed urls should add Cloudfront query string authentication parameters."""
        video = VideoFactory(
            id="a2f27fde-973a-4e89-8dca-cc59e01d255c",
            playlist__id="f76f6afd-7135-488e-9d70-6ec599a67806",
            uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc),
            state="ready",
        )
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)

        # Get the video linked to the JWT token
        # fix the time so that the url signature is deterministic and can be checked
        now = datetime(2018, 8, 8, tzinfo=pytz.utc)
        with mock.patch.object(timezone, "now", return_value=now):
            response = self.client.get(
                "/api/videos/{!s}/".format(video.id),
                HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            json.loads(content["urls"])["thumbnails"]["144"],
            (
                "https://abc.cloudfront.net/f76f6afd-7135-488e-9d70-6ec599a67806/"
                "a2f27fde-973a-4e89-8dca-cc59e01d255c/thumbnails/1533686400_144.0000000.jpg?"
                "Expires=1533693600&Signature=MMm0VE8kDAOHrTJiVAa7cWQIn8sdF9lT6TOulfncbgf~AF3WgnLU"
                "S2-OFvE0xbqi4MjxYBWZ1MkzZKDuRGTR6~YViYTz4WcomTPnVVc4euKM~HZYXxQDPKFVAcJ7hwsqhOEgn"
                "X9npz-6uiXDgqjIlFbMcK~NkaZz3drwguWMdu6I5UUYFiLlwMpMjT0ecFtmTV9yDjIhan~k8HYWagjyAf"
                "WtpfJsaSMlPJ2y4Gd4aaVYM16fspO6REZQzb4cC62aHB7ycpqUpmbThYH1saSuMtOcCemLcqzSVNNS7MX"
                "YT-vNoSRbLNf5ydmtIGqvHv9YAJHQJKdBluwd~AUU3hmtPA__&"
                "Key-Pair-Id=cloudfront-access-key-id"
            ),
        )
        self.assertEqual(
            json.loads(content["urls"])["mp4"]["144"],
            (
                "https://abc.cloudfront.net/f76f6afd-7135-488e-9d70-6ec599a67806/"
                "a2f27fde-973a-4e89-8dca-cc59e01d255c/videos/1533686400_144.mp4?"
                "Expires=1533693600&Signature=SPadcxIoCVoLQbKk3hp2LdtgZY899OXJMjInxUiGnSVivMBKkXfT"
                "yRn3wA9J~2mumU3PCZnIUguAKmvRUAgpbnSHj-f695OPiJtncPZufGmXCcnLcn7OhFy8SnqfOX9zK~K8m"
                "A6AQKfI2TXKVl5wy6JTZYxGwkMpLM~CsGwJAWo-dxbIGPtRW9H2xKAEhC5glP5of4bjOQryvrzo1PGHJV"
                "cUMcBL23eGSh9HAZHQFleI01ypQu75L~Z6BlbncjHO6tE0hKCqVU08rkdnoEDMRPRzMCVg~SdJvzZ7sth"
                "8bu4iTv-v08pWDlSXhkmO-uBfKui0CI10eALwFLZ5cMpiRQ__&"
                "Key-Pair-Id=cloudfront-access-key-id"
            ),
        )

    def test_api_video_read_detail_staff_or_user(self):
        """Users authenticated via a session should not be allowed to read a video detail."""
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            video = VideoFactory()
            response = self.client.get("/api/videos/{!s}/".format(video.id))
            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )

    def test_api_video_read_list_anonymous(self):
        """Anonymous users should not be able to read a list of videos."""
        VideoFactory()
        response = self.client.get("/api/videos/")
        self.assertEqual(response.status_code, 404)

    def test_api_video_read_list_token_user(self):
        """A token user associated to a video should not be able to read a list of videos."""
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)

        response = self.client.get(
            "/api/videos/", HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token)
        )
        self.assertEqual(response.status_code, 404)

    def test_api_video_read_list_staff_or_user(self):
        """Users authenticated via a session should not be able to read a list of videos."""
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            VideoFactory()
            response = self.client.get("/api/videos/")
            self.assertEqual(response.status_code, 404)

    def test_api_video_create_anonymous(self):
        """Anonymous users should not be able to create a new video."""
        response = self.client.post("/api/videos/")
        self.assertEqual(response.status_code, 404)
        self.assertFalse(Video.objects.exists())

    def test_api_video_create_token_user_playlist_preexists(self):
        """A token user should not be able to create a video."""
        jwt_token = AccessToken()
        response = self.client.post(
            "/api/videos/", HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token)
        )
        self.assertEqual(response.status_code, 404)
        self.assertFalse(Video.objects.exists())

    def test_api_video_create_staff_or_user(self):
        """Users authenticated via a session should not be able to create videos."""
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            response = self.client.post("/api/videos/")
            self.assertEqual(response.status_code, 404)
            self.assertFalse(Video.objects.exists())

    def test_api_video_update_detail_anonymous(self):
        """Anonymous users should not be allowed to update a video through the API."""
        video = VideoFactory(title="my title")
        data = {"title": "my new title"}
        response = self.client.put(
            "/api/videos/{!s}/".format(video.id),
            json.dumps(data),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)
        video.refresh_from_db()
        self.assertEqual(video.title, "my title")

    def test_api_video_update_detail_token_user_title(self):
        """Token users should be able to update the title of their video through the API."""
        video = VideoFactory(title="my title")
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)
        data = {"title": "my new title"}
        response = self.client.put(
            "/api/videos/{!s}/".format(video.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.title, "my new title")

    def test_api_video_update_detail_token_user_description(self):
        """Token users should be able to update the description of their video through the API."""
        video = VideoFactory(description="my description")
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)

        response = self.client.get(
            "/api/videos/{!s}/".format(video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        data = json.loads(response.content)
        data["description"] = "my new description"
        response = self.client.put(
            "/api/videos/{!s}/".format(video.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.description, "my new description")

    def test_api_video_update_detail_token_user_uploaded_on(self):
        """Token users should be able to confirm the datetime of upload through the API."""
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)

        response = self.client.get(
            "/api/videos/{!s}/".format(video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        data = json.loads(response.content)
        data["active_stamp"] = "1533686400"

        response = self.client.put(
            "/api/videos/{!s}/".format(video.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.uploaded_on, datetime(2018, 8, 8, tzinfo=pytz.utc))

    def test_api_video_update_detail_token_user_state(self):
        """Token users should be able to update the state through the API."""
        video = VideoFactory(state="pending")
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)

        response = self.client.get(
            "/api/videos/{!s}/".format(video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        data = json.loads(response.content)
        data["state"] = "ready"

        response = self.client.put(
            "/api/videos/{!s}/".format(video.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.state, "ready")

    def test_api_video_update_detail_token_user_id(self):
        """Token users trying to update the ID of a video they own should be ignored."""
        video = VideoFactory()
        original_id = video.id
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)

        response = self.client.get(
            "/api/videos/{!s}/".format(video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        data = json.loads(response.content)
        data["id"] = "my new id"

        response = self.client.put(
            "/api/videos/{!s}/".format(video.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.id, original_id)

    def test_api_video_update_detail_token_user_other_video(self):
        """Token users should not be allowed to update another video through the API."""
        video_token = VideoFactory()
        video_update = VideoFactory(title="my title")
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video_token.id)

        data = {"title": "my new title"}
        response = self.client.put(
            "/api/videos/{!s}/".format(video_update.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        video_update.refresh_from_db()
        self.assertEqual(video_update.title, "my title")

    def test_api_video_patch_detail_token_user_uploaded_on_and_state(self):
        """Token users should be able to patch the state and stamp of their video through the API.

        The `confirm` lambda in AWS will patch just these 2 fields to avoid interfering with the
        user modifying its title for example. In opposition, an update requires posting all the
        required fields like `title` and is therefore performed in 2 steps (a GET followed by a
        PUT) which is dangerous.
        """
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)
        self.assertEqual(video.state, "pending")
        self.assertIsNone(video.uploaded_on)

        data = {"active_stamp": "1533686400", "state": "ready"}

        response = self.client.patch(
            "/api/videos/{!s}/".format(video.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.uploaded_on, datetime(2018, 8, 8, tzinfo=pytz.utc))
        self.assertEqual(video.state, "ready")

    def test_api_video_delete_detail_anonymous(self):
        """Anonymous users should not be allowed to delete a video."""
        video = VideoFactory()
        response = self.client.delete("/api/videos/{!s}/".format(video.id))
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )
        self.assertTrue(Video.objects.filter(id=video.id).exists())

    def test_api_video_delete_detail_token_user(self):
        """A token user associated to a video should not be able to delete it or any other."""
        videos = VideoFactory.create_batch(2)
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(videos[0].id)

        # Try deleting the video linked to the JWT token and the other one
        for video in videos:
            response = self.client.delete(
                "/api/videos/{!s}/".format(video.id),
                HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            )
            self.assertEqual(response.status_code, 405)
            content = json.loads(response.content)
            self.assertEqual(content, {"detail": 'Method "DELETE" not allowed.'})
            self.assertTrue(Video.objects.filter(id=video.id).exists())

    def test_api_video_delete_detail_staff_or_user(self):
        """Users authenticated via a session should not be able to delete a video."""
        video = VideoFactory()
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")

            response = self.client.delete("/api/videos/{!s}/".format(video.id))

            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )
        self.assertTrue(Video.objects.filter(id=video.id).exists())

    def test_api_video_delete_list_anonymous(self):
        """Anonymous users should not be able to delete a list of videos."""
        video = VideoFactory()

        response = self.client.delete("/api/videos/")

        self.assertEqual(response.status_code, 404)
        self.assertTrue(Video.objects.filter(id=video.id).exists())

    def test_api_video_delete_list_token_user(self):
        """A token user associated to a video should not be able to delete a list of videos."""
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)

        response = self.client.delete(
            "/api/videos/", HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token)
        )
        self.assertEqual(response.status_code, 404)
        self.assertTrue(Video.objects.filter(id=video.id).exists())

    def test_api_video_delete_list_staff_or_user(self):
        """Users authenticated via a session should not be able to delete a list of videos."""
        video = VideoFactory()
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")

            response = self.client.delete("/api/videos/")

            self.assertEqual(response.status_code, 404)
        self.assertTrue(Video.objects.filter(id=video.id).exists())

    def test_api_video_upload_policy_anonymous_user(self):
        """Anonymous users are not allowed to retrieve an upload policy."""
        video = VideoFactory()

        response = self.client.get("/api/videos/{!s}/upload-policy/".format(video.id))

        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_video_upload_policy_token_user(self):
        """A token user associated to a video should be able to retrieve an upload policy."""
        video = VideoFactory(
            id="a2f27fde-973a-4e89-8dca-cc59e01d255c",
            playlist__id="f76f6afd-7135-488e-9d70-6ec599a67806",
        )
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)

        # Get the upload policy for this video
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=pytz.utc)
        with mock.patch.object(timezone, "now", return_value=now):
            response = self.client.get(
                "/api/videos/{!s}/upload-policy/".format(video.id),
                HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "acl": "private",
                "bucket": "test-marsha-source",
                "stamp": "1533686400",
                "key": "{!s}/{!s}/videos/1533686400".format(
                    video.playlist.id, video.id
                ),
                "max_file_size": 1073741824,
                "policy": (
                    "eyJleHBpcmF0aW9uIjogIjIwMTgtMDgtMDlUMDA6MDA6MDAuMDAwWiIsICJjb25kaXRpb25zIjog"
                    "W3siYWNsIjogInByaXZhdGUifSwgeyJidWNrZXQiOiAidGVzdC1tYXJzaGEtc291cmNlIn0sIHsi"
                    "eC1hbXotY3JlZGVudGlhbCI6ICJhd3MtYWNjZXNzLWtleS1pZC8yMDE4MDgwOC9ldS13ZXN0LTEv"
                    "czMvYXdzNF9yZXF1ZXN0In0sIHsieC1hbXotYWxnb3JpdGhtIjogIkFXUzQtSE1BQy1TSEEyNTYi"
                    "fSwgeyJ4LWFtei1kYXRlIjogIjIwMTgwODA4VDAwMDAwMFoifSwgeyJrZXkiOiAiZjc2ZjZhZmQt"
                    "NzEzNS00ODhlLTlkNzAtNmVjNTk5YTY3ODA2L2EyZjI3ZmRlLTk3M2EtNGU4OS04ZGNhLWNjNTll"
                    "MDFkMjU1Yy92aWRlb3MvMTUzMzY4NjQwMCJ9LCBbInN0YXJ0cy13aXRoIiwgIiRDb250ZW50LVR5"
                    "cGUiLCAidmlkZW8vIl0sIFsic3RhcnRzLXdpdGgiLCAiJHgtYW16LW1ldGEtand0IiwgIiJdLCBb"
                    "ImNvbnRlbnQtbGVuZ3RoLXJhbmdlIiwgMCwgMTA3Mzc0MTgyNF1dfQ=="
                ),
                "s3_endpoint": "s3.eu-west-1.amazonaws.com",
                "x_amz_algorithm": "AWS4-HMAC-SHA256",
                "x_amz_credential": "aws-access-key-id/20180808/eu-west-1/s3/aws4_request",
                "x_amz_date": "20180808T000000Z",
                "x_amz_expires": 86400,
                "x_amz_signature": (
                    "15d0c4fc6b5264c96cfb237346b53dd99e6570f2c475fe149630029479b879ea"
                ),
            },
        )

        # Try getting the upload policy for another video
        other_video = VideoFactory()
        response = self.client.get(
            "/api/videos/{!s}/upload-policy/".format(other_video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_video_upload_policy_staff_or_user(self):
        """Users authenticated via a session should not be able to retrieve an upload policy."""
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            video = VideoFactory()

            response = self.client.get(
                "/api/videos/{!s}/upload-policy/".format(video.id)
            )
            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )
