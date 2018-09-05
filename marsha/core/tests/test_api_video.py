"""Tests for the Video API of the Marsha project."""
from datetime import datetime
import json
from unittest import mock

from django.test import TestCase

import pytz
from rest_framework_simplejwt.tokens import AccessToken

from ..factories import UserFactory, VideoFactory
from ..models import Video
from ..utils.aws_s3 import timezone


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

    def test_api_video_read_detail_token_user(self):
        """A token user associated to a video should be able to read the detail of this video."""
        video = VideoFactory()
        playlist = video.playlist
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)

        # Get the video linked to the JWT token
        response = self.client.get(
            "/api/videos/{!s}/".format(video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        jpeg_dict = {
            "144": "{!s}/jpeg/{!s}_144.0000000.jpg".format(playlist.id, video.id),
            "240": "{!s}/jpeg/{!s}_240.0000000.jpg".format(playlist.id, video.id),
            "480": "{!s}/jpeg/{!s}_480.0000000.jpg".format(playlist.id, video.id),
            "720": "{!s}/jpeg/{!s}_720.0000000.jpg".format(playlist.id, video.id),
            "1080": "{!s}/jpeg/{!s}_1080.0000000.jpg".format(playlist.id, video.id),
        }
        mp4_dict = {
            "144": "{!s}/mp4/{!s}_144.mp4".format(playlist.id, video.id),
            "240": "{!s}/mp4/{!s}_240.mp4".format(playlist.id, video.id),
            "480": "{!s}/mp4/{!s}_480.mp4".format(playlist.id, video.id),
            "720": "{!s}/mp4/{!s}_720.mp4".format(playlist.id, video.id),
            "1080": "{!s}/mp4/{!s}_1080.mp4".format(playlist.id, video.id),
        }
        self.assertEqual(
            content,
            {
                "description": video.description,
                "id": str(video.id),
                "title": video.title,
                "urls": {"jpeg": jpeg_dict, "mp4": mp4_dict},
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
        jwt_token.payload["resource_link_id"] = video.lti_id

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
        data = json.dumps({"title": "my new title"})
        response = self.client.put(
            "/api/videos/{!s}/".format(video.id), data, content_type="application/json"
        )
        self.assertEqual(response.status_code, 401)
        video.refresh_from_db()
        self.assertEqual(video.title, "my title")

    def test_api_video_update_detail_token_user_title(self):
        """Token users should be able to update the title of their video through the API."""
        video = VideoFactory(title="my title")
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)
        data = json.dumps({"title": "my new title"})
        response = self.client.put(
            "/api/videos/{!s}/".format(video.id),
            data,
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
        jwt_token.payload["video_id"] = video_token.lti_id
        data = json.dumps({"title": "my new title"})
        response = self.client.put(
            "/api/videos/{!s}/".format(video_update.id),
            data,
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        video_update.refresh_from_db()
        self.assertEqual(video_update.title, "my title")

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
        jwt_token.payload["video_id"] = videos[0].lti_id

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
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            video = VideoFactory()
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
        """A token user associated to a video should be able to delete a list of videos."""
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_link_id"] = video.lti_id

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
                "key": "{!s}/{!s}".format(video.playlist.id, video.id),
                "max_file_size": 1073741824,
                "policy": (
                    "eyJleHBpcmF0aW9uIjogIjIwMTgtMDgtMDlUMDA6MDA6MDAuMDAwWiIsICJjb25kaXRpb25zIjogW"
                    "3siYnVja2V0IjogInRlc3QtbWFyc2hhLXNvdXJjZSJ9LCB7ImtleSI6ICJmNzZmNmFmZC03MTM1LT"
                    "Q4OGUtOWQ3MC02ZWM1OTlhNjc4MDYvYTJmMjdmZGUtOTczYS00ZTg5LThkY2EtY2M1OWUwMWQyNTV"
                    "jIn0sIHsiYWNsIjogInByaXZhdGUifSwgWyJzdGFydHMtd2l0aCIsICIkQ29udGVudC1UeXBlIiwg"
                    "InZpZGVvLyJdLCBbImNvbnRlbnQtbGVuZ3RoLXJhbmdlIiwgMCwgMTA3Mzc0MTgyNF0sIHsieC1hb"
                    "XotY3JlZGVudGlhbCI6ICJBQ0NFU1NfS0VZX0lELzIwMTgwODA4L2V1LXdlc3QtMS9zMy9hd3M0X3"
                    "JlcXVlc3QifSwgeyJ4LWFtei1hbGdvcml0aG0iOiAiQVdTNC1ITUFDLVNIQTI1NiJ9LCB7IngtYW1"
                    "6LWRhdGUiOiAiMjAxODA4MDhUMDAwMDAwWiJ9XX0="
                ),
                "s3_endpoint": "s3.eu-west-1.amazonaws.com",
                "x_amz_algorithm": "AWS4-HMAC-SHA256",
                "x_amz_credential": "ACCESS_KEY_ID/20180808/eu-west-1/s3/aws4_request",
                "x_amz_date": "20180808T000000Z",
                "x_amz_expires": 86400,
                "x_amz_signature": (
                    "8d7d40f125a70d6cc173130f5985be88291459928126638555694d2295882166"
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
