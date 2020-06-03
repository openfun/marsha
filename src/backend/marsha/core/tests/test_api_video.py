"""Tests for the Video API of the Marsha project."""
from datetime import datetime
import json
import random
from unittest import mock

from django.test import TestCase, override_settings

import pytz
from rest_framework_simplejwt.tokens import AccessToken

from ..api import timezone
from ..factories import (
    ThumbnailFactory,
    TimedTextTrackFactory,
    UserFactory,
    VideoFactory,
)
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
# pylint: disable=unused-argument


class VideoAPITest(TestCase):
    """Test the API of the video object."""

    maxDiff = None

    def test_api_video_read_detail_anonymous(self):
        """Anonymous users should not be allowed to read a video detail."""
        video = VideoFactory()
        response = self.client.get("/api/videos/{!s}/".format(video.id))
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_video_read_detail_student(self):
        """Student users should not be allowed to read a video detail."""
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["permissions"] = {"can_update": False}
        # Get the video linked to the JWT token
        response = self.client.get(
            "/api/videos/{!s}/".format(video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_video_read_detail_admin_token_user(self):
        """Administrator should be able to read detail of a video."""
        video = VideoFactory(upload_state="pending")

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["administrator"]
        jwt_token.payload["permissions"] = {"can_update": True}

        # Get the video linked to the JWT token
        response = self.client.get(
            "/api/videos/{!s}/".format(video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 200)

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_video_read_detail_token_user(self):
        """Instructors should be able to read the detail of their video."""
        resolutions = [144, 240, 480, 720, 1080]
        video = VideoFactory(
            pk="a2f27fde-973a-4e89-8dca-cc59e01d255c",
            uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc),
            upload_state="ready",
            resolutions=resolutions,
            playlist__title="foo bar",
        )
        timed_text_track = TimedTextTrackFactory(
            video=video,
            mode="cc",
            language="fr",
            uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc),
            upload_state="ready",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        # Get the video linked to the JWT token
        response = self.client.get(
            "/api/videos/{!s}/".format(video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        thumbnails_template = (
            "https://abc.cloudfront.net/{!s}/thumbnails/1533686400_{!s}.0000000.jpg"
        )
        thumbnails_dict = {
            str(resolution): thumbnails_template.format(video.pk, resolution)
            for resolution in resolutions
        }

        mp4_template = (
            "https://abc.cloudfront.net/{!s}/mp4/1533686400_{!s}.mp4"
            "?response-content-disposition=attachment%3B+filename%3Dfoo-bar_1533686400.mp4"
        )
        mp4_dict = {
            str(resolution): mp4_template.format(video.pk, resolution)
            for resolution in resolutions
        }

        self.assertEqual(
            content,
            {
                "description": video.description,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": "1533686400",
                "is_ready_to_show": True,
                "show_download": True,
                "upload_state": "ready",
                "thumbnail": None,
                "timed_text_tracks": [
                    {
                        "active_stamp": "1533686400",
                        "is_ready_to_show": True,
                        "mode": "cc",
                        "id": str(timed_text_track.id),
                        "language": "fr",
                        "upload_state": "ready",
                        "url": (
                            "https://abc.cloudfront.net/a2f27fde-973a-4e89-8dca-cc59e01d255c/"
                            "timedtext/1533686400_fr_cc.vtt"
                        ),
                        "video": str(video.id),
                    }
                ],
                "urls": {
                    "mp4": mp4_dict,
                    "thumbnails": thumbnails_dict,
                    "manifests": {
                        "dash": (
                            "https://abc.cloudfront.net/a2f27fde-973a-4e89-8dca-cc59e01d255c/"
                            "cmaf/1533686400.mpd"
                        ),
                        "hls": (
                            "https://abc.cloudfront.net/a2f27fde-973a-4e89-8dca-cc59e01d255c/"
                            "cmaf/1533686400.m3u8"
                        ),
                    },
                    "previews": (
                        "https://abc.cloudfront.net/a2f27fde-973a-4e89-8dca-cc59e01d255c/"
                        "previews/1533686400_100.jpg"
                    ),
                },
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
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

    def test_api_video_read_detail_as_instructor_in_read_only(self):
        """An instructor with read_only set to True should not be able to read the video."""
        video = VideoFactory(upload_state="ready")

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": False}

        # Get the video linked to the JWT token
        response = self.client.get(
            "/api/videos/{!s}/".format(video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_video_read_detail_token_user_no_active_stamp(self):
        """A video with no active stamp should not fail and its "urls" should be set to `None`."""
        video = VideoFactory(uploaded_on=None)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        # Get the video linked to the JWT token
        response = self.client.get(
            "/api/videos/{!s}/".format(video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('"urls":null', response.content.decode("utf-8"))
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "description": video.description,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": None,
                "is_ready_to_show": False,
                "show_download": True,
                "upload_state": "pending",
                "timed_text_tracks": [],
                "thumbnail": None,
                "urls": None,
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
            },
        )

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_video_read_detail_token_user_not_sucessfully_uploaded(self):
        """A video that has never been uploaded successfully should have no url."""
        state = random.choice(["pending", "error", "ready"])
        video = VideoFactory(uploaded_on=None, upload_state=state)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        # Get the video linked to the JWT token
        response = self.client.get(
            "/api/videos/{!s}/".format(video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('"urls":null', response.content.decode("utf-8"))
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "description": video.description,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": None,
                "is_ready_to_show": False,
                "show_download": True,
                "upload_state": state,
                "timed_text_tracks": [],
                "thumbnail": None,
                "urls": None,
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
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
            pk="a2f27fde-973a-4e89-8dca-cc59e01d255c",
            uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc),
            upload_state="ready",
            resolutions=[144],
            playlist__title="foo",
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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
            content["urls"]["thumbnails"]["144"],
            (
                "https://abc.cloudfront.net/a2f27fde-973a-4e89-8dca-cc59e01d255c/"
                "thumbnails/1533686400_144.0000000.jpg"
            ),
        )
        self.assertEqual(
            content["urls"]["mp4"]["144"],
            (
                "https://abc.cloudfront.net/a2f27fde-973a-4e89-8dca-cc59e01d255c/mp4/1533686400_1"
                "44.mp4?response-content-disposition=attachment%3B+filename%3Dfoo_1533686400.mp4&"
                "Expires=1533693600&Signature=RmAPJfO~TI6aTyL9NJbEwi2Hyn80i3GdbLHdjm78wR~J3HLgVqa"
                "Zdw6U88iMQ9aMsF3vYLsxJ8FH1l8BySSc~UGOPgyT-1qpSnyYmLXsINNHgw8WUKUvxy5syZO8E7sD70-"
                "D~QuxvCAT1UBacZuoRCB~ITZqZlpEKcm7D4UmM7mwQXACdOF5a~6XCISWUYGPRMInUMPXLCPFsEuflx-"
                "QDB~Rxkwybl~vEi31M2FQuU8ab1fwjC~Jy2RLzmQBDJwzvPuJDTRItJEj137Ohcacf6lGJbAZi8Fu63A"
                "6lfKXgqgT~lFdwN-LAoehi4IYomUial7Wh8TkMmLPOMXvf5PgEw__"
                "&Key-Pair-Id=cloudfront-access-key-id"
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
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]

        response = self.client.get(
            "/api/videos/", HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token)
        )
        self.assertEqual(response.status_code, 404)

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_video_with_a_thumbnail(self):
        """A video with a custom thumbnail should have it in its payload."""
        video = VideoFactory(
            pk="38a91911-9aee-41e2-94dd-573abda6f48f",
            uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc),
            upload_state="ready",
            resolutions=[144, 240, 480, 720, 1080],
        )
        thumbnail = ThumbnailFactory(
            video=video,
            uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc),
            upload_state="ready",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        # Get the video linked to the JWT token
        response = self.client.get(
            "/api/videos/{!s}/".format(video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content["thumbnail"],
            {
                "active_stamp": "1533686400",
                "id": str(thumbnail.id),
                "is_ready_to_show": True,
                "upload_state": "ready",
                "urls": {
                    "144": "https://abc.cloudfront.net/38a91911-9aee-41e2-94dd-573abda6f48f/"
                    "thumbnails/1533686400_144.jpg",
                    "240": "https://abc.cloudfront.net/38a91911-9aee-41e2-94dd-573abda6f48f/"
                    "thumbnails/1533686400_240.jpg",
                    "480": "https://abc.cloudfront.net/38a91911-9aee-41e2-94dd-573abda6f48f/"
                    "thumbnails/1533686400_480.jpg",
                    "720": "https://abc.cloudfront.net/38a91911-9aee-41e2-94dd-573abda6f48f/"
                    "thumbnails/1533686400_720.jpg",
                    "1080": "https://abc.cloudfront.net/38a91911-9aee-41e2-94dd-573abda6f48f/"
                    "thumbnails/1533686400_1080.jpg",
                },
                "video": str(video.id),
            },
        )

        self.assertEqual(
            content["urls"]["thumbnails"],
            {
                "144": "https://abc.cloudfront.net/38a91911-9aee-41e2-94dd-573abda6f48f/"
                "thumbnails/1533686400_144.jpg",
                "240": "https://abc.cloudfront.net/38a91911-9aee-41e2-94dd-573abda6f48f/"
                "thumbnails/1533686400_240.jpg",
                "480": "https://abc.cloudfront.net/38a91911-9aee-41e2-94dd-573abda6f48f/"
                "thumbnails/1533686400_480.jpg",
                "720": "https://abc.cloudfront.net/38a91911-9aee-41e2-94dd-573abda6f48f/"
                "thumbnails/1533686400_720.jpg",
                "1080": "https://abc.cloudfront.net/38a91911-9aee-41e2-94dd-573abda6f48f/"
                "thumbnails/1533686400_1080.jpg",
            },
        )

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
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
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
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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
        """Token users trying to update "uploaded_on" through the API should be ignored."""
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        response = self.client.get(
            "/api/videos/{!s}/".format(video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        data = json.loads(response.content)
        self.assertIsNone(data["active_stamp"])
        data["active_stamp"] = "1533686400"

        response = self.client.put(
            "/api/videos/{!s}/".format(video.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.uploaded_on, None)

    def test_api_video_update_detail_token_user_upload_state(self):
        """Token users trying to update "upload_state" through the API should be ignored."""
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        response = self.client.get(
            "/api/videos/{!s}/".format(video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        data = json.loads(response.content)
        self.assertEqual(data["upload_state"], "pending")
        data["upload_state"] = "ready"

        response = self.client.put(
            "/api/videos/{!s}/".format(video.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.upload_state, "pending")

    def test_api_video_instructor_update_video_in_read_only(self):
        """An instructor with read_only set to true should not be able to update the video."""
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": False}

        data = {"upload_state": "ready"}

        response = self.client.put(
            "/api/videos/{!s}/".format(video.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_video_instructor_patch_video_in_read_only(self):
        """An instructor with read_only set to true should not be able to patch the video."""
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": False}

        data = {"upload_state": "ready"}

        response = self.client.patch(
            "/api/videos/{!s}/".format(video.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_video_patch_detail_token_user_stamp_and_state(self):
        """Token users should not be able to patch upload state and active stamp.

        These 2 fields can only be updated by AWS via the separate update-state API endpoint.
        """
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        self.assertEqual(video.upload_state, "pending")
        self.assertIsNone(video.uploaded_on)

        data = {"active_stamp": "1533686400", "upload_state": "ready"}

        response = self.client.patch(
            "/api/videos/{!s}/".format(video.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertIsNone(video.uploaded_on)
        self.assertEqual(video.upload_state, "pending")

    def test_api_video_update_detail_token_user_id(self):
        """Token users trying to update the ID of a video they own should be ignored."""
        video = VideoFactory()
        original_id = video.id
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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
        jwt_token.payload["resource_id"] = str(video_token.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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

    def test_api_video_patch_detail_token_user_description(self):
        """Token users should be able to patch fields on their video through the API."""
        video = VideoFactory(description="my description")
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        data = {"description": "my new description"}

        response = self.client.patch(
            "/api/videos/{!s}/".format(video.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.description, "my new description")

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
        jwt_token.payload["resource_id"] = str(videos[0].id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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

    def test_api_video_instructor_delete_video_in_read_only(self):
        """An instructor with read_only set to true should not be able to delete the video."""
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": False}

        response = self.client.delete(
            "/api/videos/{!s}/".format(video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)

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
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]

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

    def test_api_video_initiate_upload_anonymous_user(self):
        """Anonymous users are not allowed to initiate an upload."""
        video = VideoFactory()

        response = self.client.post(
            "/api/videos/{!s}/initiate-upload/".format(video.id)
        )

        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_video_instructor_initiate_upload_in_read_only(self):
        """An instructor with read_only set to true should not be able to initiate an upload."""
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": False}

        response = self.client.post(
            "/api/videos/{!s}/initiate-upload/".format(video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)

    def test_api_video_initiate_upload_token_user(self):
        """A token user associated to a video should be able to retrieve an upload policy."""
        video = VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        # Create another video to check that its upload state is unaffected
        other_video = VideoFactory(upload_state=random.choice(["ready", "error"]))

        # Get the upload policy for this video
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=pytz.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                "/api/videos/{!s}/initiate-upload/".format(video.id),
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
                        "27a23f52-3379-46a2-94fa-697b59cfe3c7/video/27a23f52-3379-46a2-94fa-"
                        "697b59cfe3c7/1533686400"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "aws-access-key-id/20180808/eu-west-1/s3/aws4_request",
                    "x-amz-date": "20180808T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMTgtMDgtMDlUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBbe"
                        "yJhY2wiOiAicHJpdmF0ZSJ9LCBbInN0YXJ0cy13aXRoIiwgIiRDb250ZW50LVR5cGUiLCAidm"
                        "lkZW8vIl0sIFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLCAwLCAxMDczNzQxODI0XSwgeyJidWN"
                        "rZXQiOiAidGVzdC1tYXJzaGEtc291cmNlIn0sIHsia2V5IjogIjI3YTIzZjUyLTMzNzktNDZh"
                        "Mi05NGZhLTY5N2I1OWNmZTNjNy92aWRlby8yN2EyM2Y1Mi0zMzc5LTQ2YTItOTRmYS02OTdiN"
                        "TljZmUzYzcvMTUzMzY4NjQwMCJ9LCB7IngtYW16LWFsZ29yaXRobSI6ICJBV1M0LUhNQUMtU0"
                        "hBMjU2In0sIHsieC1hbXotY3JlZGVudGlhbCI6ICJhd3MtYWNjZXNzLWtleS1pZC8yMDE4MDg"
                        "wOC9ldS13ZXN0LTEvczMvYXdzNF9yZXF1ZXN0In0sIHsieC1hbXotZGF0ZSI6ICIyMDE4MDgw"
                        "OFQwMDAwMDBaIn1dfQ=="
                    ),
                    "x-amz-signature": (
                        "8db66b80ad0afcaef57542df9da257976ab21bc3b8b0105f3bb6bdafe95964b9"
                    ),
                },
            },
        )

        # The upload state of the timed text track should should have been reset
        video.refresh_from_db()
        self.assertEqual(video.upload_state, "pending")

        # Check that the other timed text tracks are not reset
        other_video.refresh_from_db()
        self.assertNotEqual(other_video.upload_state, "pending")

        # Try initiating an upload for the other video
        response = self.client.post(
            "/api/videos/{!s}/initiate-upload/".format(other_video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_video_initiate_upload_staff_or_user(self):
        """Users authenticated via a session should not be able to retrieve an upload policy."""
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            video = VideoFactory()

            response = self.client.post(
                "/api/videos/{!s}/initiate-upload/".format(video.id)
            )
            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )
