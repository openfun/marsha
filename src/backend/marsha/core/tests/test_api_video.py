"""Tests for the Video API of the Marsha project."""
from datetime import datetime
import json
import random
from unittest import mock
import uuid

from django.test import TestCase, override_settings

import pytz
from rest_framework_simplejwt.tokens import AccessToken

from .. import api, factories, models
from ..api import timezone
from ..defaults import (
    CREATING,
    HARVESTING,
    IDLE,
    LIVE_CHOICES,
    PENDING,
    RUNNING,
    STATE_CHOICES,
    STOPPED,
    STOPPING,
)
from ..utils.api_utils import generate_hash


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
# pylint: disable=unused-argument,too-many-lines


class VideoAPITest(TestCase):
    """Test the API of the video object."""

    maxDiff = None

    def test_api_video_read_detail_anonymous(self):
        """Anonymous users should not be allowed to read a video detail."""
        video = factories.VideoFactory()
        response = self.client.get("/api/videos/{!s}/".format(video.id))
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_video_read_detail_student(self):
        """Student users should not be allowed to read a video detail."""
        video = factories.VideoFactory()
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
        video = factories.VideoFactory(upload_state="pending")

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
        video = factories.VideoFactory(
            pk="a2f27fde-973a-4e89-8dca-cc59e01d255c",
            uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc),
            upload_state="ready",
            resolutions=resolutions,
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
        )
        timed_text_track = factories.TimedTextTrackFactory(
            video=video,
            mode="cc",
            language="fr",
            uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc),
            upload_state="ready",
            extension="srt",
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
                        "source_url": (
                            "https://abc.cloudfront.net/a2f27fde-973a-4e89-8dca-cc59e01d255c/"
                            "timedtext/source/1533686400_fr_cc?response-content-disposition=a"
                            "ttachment%3B+filename%3Dfoo-bar_1533686400.srt"
                        ),
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
                "playlist": {
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "live_state": None,
                "live_info": {},
                "xmpp": None,
            },
        )

        # Try getting another video
        other_video = factories.VideoFactory()
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
        video = factories.VideoFactory(upload_state="ready")

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
        video = factories.VideoFactory(
            uploaded_on=None,
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
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
                "playlist": {
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "live_state": None,
                "live_info": {},
                "xmpp": None,
            },
        )

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_video_read_detail_token_user_not_sucessfully_uploaded(self):
        """A video that has never been uploaded successfully should have no url."""
        state = random.choice(["pending", "error", "ready"])
        video = factories.VideoFactory(
            uploaded_on=None,
            upload_state=state,
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
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
                "playlist": {
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "live_state": None,
                "live_info": {},
                "xmpp": None,
            },
        )

    @override_settings(
        CLOUDFRONT_SIGNED_URLS_ACTIVE=True,
        CLOUDFRONT_ACCESS_KEY_ID="cloudfront-access-key-id",
    )
    @mock.patch("builtins.open", new_callable=mock.mock_open, read_data=RSA_KEY_MOCK)
    def test_api_video_read_detail_token_user_signed_urls(self, mock_open):
        """Activating signed urls should add Cloudfront query string authentication parameters."""
        video = factories.VideoFactory(
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
        for user in [factories.UserFactory(), factories.UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            video = factories.VideoFactory()
            response = self.client.get("/api/videos/{!s}/".format(video.id))
            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )

    def test_api_video_read_detail_by_organization_instructor(self):
        """Organization instructors cannot get individual videos."""
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.INSTRUCTOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        response = self.client.get(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_video_read_detail_by_organization_admin(self):
        """Organization admins can get individual videos."""
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        response = self.client.get(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "active_stamp": None,
                "description": video.description,
                "has_transcript": False,
                "id": str(video.id),
                "is_ready_to_show": False,
                "live_info": {},
                "live_state": None,
                "playlist": {"lti_id": playlist.lti_id, "title": playlist.title},
                "should_use_subtitle_as_transcript": False,
                "show_download": True,
                "thumbnail": None,
                "timed_text_tracks": [],
                "title": video.title,
                "upload_state": "pending",
                "urls": None,
                "xmpp": None,
            },
        )

    def test_api_video_read_detail_by_playlist_instructor(self):
        """Playlist instructors cannot get individual videos."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.INSTRUCTOR, playlist=playlist, user=user
        )
        video = factories.VideoFactory(playlist=playlist)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        response = self.client.get(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_video_read_detail_by_playlist_admin(self):
        """Playlist admins can get individual videos."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.ADMINISTRATOR, playlist=playlist, user=user
        )
        video = factories.VideoFactory(playlist=playlist)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        response = self.client.get(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "active_stamp": None,
                "description": video.description,
                "has_transcript": False,
                "id": str(video.id),
                "is_ready_to_show": False,
                "live_info": {},
                "live_state": None,
                "playlist": {"lti_id": playlist.lti_id, "title": playlist.title},
                "should_use_subtitle_as_transcript": False,
                "show_download": True,
                "thumbnail": None,
                "timed_text_tracks": [],
                "title": video.title,
                "upload_state": "pending",
                "urls": None,
                "xmpp": None,
            },
        )

    def test_api_video_read_list_anonymous(self):
        """Anonymous users should not be able to read a list of videos."""
        factories.VideoFactory()
        response = self.client.get("/api/videos/")
        self.assertEqual(response.status_code, 401)

    def test_api_video_read_list_token_user(self):
        """
        Token user lists videos.

        A token user associated to a video should be able to read a list of videos.
        It should however be empty as they have no rights on lists of videos.
        """
        video = factories.VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]

        response = self.client.get(
            "/api/videos/", HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token)
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(), {"count": 0, "next": None, "previous": None, "results": []}
        )

    def test_api_video_read_list_user_with_no_access(self):
        """
        Token user lists videos.

        A user with a user token, with no playlist or organization access should not
        get any videos in response to video list requests.
        """
        user = factories.UserFactory()
        # An organization with a playlist and one video
        organization = factories.OrganizationFactory()
        organization_playlist = factories.PlaylistFactory(organization=organization)
        factories.VideoFactory(playlist=organization_playlist)
        # A playlist with a video but no organization
        other_playlist = factories.PlaylistFactory()
        factories.VideoFactory(playlist=other_playlist)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        response = self.client.get(
            "/api/videos/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(), {"count": 0, "next": None, "previous": None, "results": []}
        )

    def test_api_video_read_list_user_with_playlist_access(self):
        """
        Token user with playlist access lists videos.

        A user with a user token, with access to a playlist should get only videos from that
        playlist, and not from other playlists, even if they are from the same organization.
        """
        user = factories.UserFactory()
        # An organization where the user has no access
        organization = factories.OrganizationFactory()
        # In this organization, a playlist where the user has access
        organization_playlist_1 = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=organization_playlist_1)
        factories.PlaylistAccessFactory(user=user, playlist=organization_playlist_1)
        # In the same organization, a playlist where the user has no access
        organization_playlist_2 = factories.PlaylistFactory(organization=organization)
        factories.VideoFactory(playlist=organization_playlist_2)
        # An unrelated playlist where the user has no access
        other_playlist = factories.PlaylistFactory()
        factories.VideoFactory(playlist=other_playlist)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        response = self.client.get(
            "/api/videos/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 1,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "active_stamp": None,
                        "description": video.description,
                        "has_transcript": False,
                        "id": str(video.id),
                        "is_ready_to_show": False,
                        "live_info": {},
                        "live_state": None,
                        "playlist": {
                            "lti_id": organization_playlist_1.lti_id,
                            "title": organization_playlist_1.title,
                        },
                        "should_use_subtitle_as_transcript": False,
                        "show_download": True,
                        "thumbnail": None,
                        "timed_text_tracks": [],
                        "title": video.title,
                        "upload_state": "pending",
                        "urls": None,
                        "xmpp": None,
                    }
                ],
            },
        )

    def test_api_video_read_list_user_with_organization_access(self):
        """
        Token user with organization access lists videos.

        A user with a user token, with access to an organization should get only videos from
        that organization no matter the playlist they are in, and not from other playlists or
        organizations.
        """
        user = factories.UserFactory()
        # An organization where the user has access
        organization_1 = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(user=user, organization=organization_1)
        # In this organization, two playlists where the user has no direct access
        organization_1_playlist_1 = factories.PlaylistFactory(
            organization=organization_1
        )
        video_1 = factories.VideoFactory(
            playlist=organization_1_playlist_1, title="First video"
        )
        organization_1_playlist_2 = factories.PlaylistFactory(
            organization=organization_1
        )
        video_2 = factories.VideoFactory(
            playlist=organization_1_playlist_2, title="Second video"
        )
        # An unrelated organization with a playlist where the user has no access
        organization_2 = factories.OrganizationFactory()
        other_playlist = factories.PlaylistFactory(organization=organization_2)
        factories.VideoFactory(playlist=other_playlist)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        response = self.client.get(
            "/api/videos/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 2,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "active_stamp": None,
                        "description": video_1.description,
                        "has_transcript": False,
                        "id": str(video_1.id),
                        "is_ready_to_show": False,
                        "live_info": {},
                        "live_state": None,
                        "playlist": {
                            "lti_id": organization_1_playlist_1.lti_id,
                            "title": organization_1_playlist_1.title,
                        },
                        "should_use_subtitle_as_transcript": False,
                        "show_download": True,
                        "thumbnail": None,
                        "timed_text_tracks": [],
                        "title": video_1.title,
                        "upload_state": "pending",
                        "urls": None,
                        "xmpp": None,
                    },
                    {
                        "active_stamp": None,
                        "description": video_2.description,
                        "has_transcript": False,
                        "id": str(video_2.id),
                        "is_ready_to_show": False,
                        "live_info": {},
                        "live_state": None,
                        "playlist": {
                            "lti_id": organization_1_playlist_2.lti_id,
                            "title": organization_1_playlist_2.title,
                        },
                        "should_use_subtitle_as_transcript": False,
                        "show_download": True,
                        "thumbnail": None,
                        "timed_text_tracks": [],
                        "title": video_2.title,
                        "upload_state": "pending",
                        "urls": None,
                        "xmpp": None,
                    },
                ],
            },
        )

    def test_api_video_read_list_by_playlist_user_with_no_access(self):
        """
        Token user lists videos by playlist.

        A user with a user token, with no playlist or organization access should not
        get any videos in response to requests to list videos by playlist.
        """
        user = factories.UserFactory()
        # A playlist, where the user has no access, with a video
        playlist = factories.PlaylistFactory()
        factories.VideoFactory(playlist=playlist)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        response = self.client.get(
            f"/api/videos/?playlist={playlist.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(), {"count": 0, "next": None, "previous": None, "results": []}
        )

    def test_api_video_read_list_by_playlist_user_with_playlist_access(self):
        """
        Token user with playlist access lists videos by playlist.

        A user with a user token, with a playlist access, can list videos for this playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user has access, with a video
        first_playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(playlist=first_playlist)
        factories.PlaylistAccessFactory(user=user, playlist=first_playlist)
        # Another one where the user has no access, with a video
        other_playlist = factories.PlaylistFactory()
        factories.VideoFactory(playlist=other_playlist)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        response = self.client.get(
            f"/api/videos/?playlist={first_playlist.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 1,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "active_stamp": None,
                        "description": video.description,
                        "has_transcript": False,
                        "id": str(video.id),
                        "is_ready_to_show": False,
                        "live_info": {},
                        "live_state": None,
                        "playlist": {
                            "lti_id": first_playlist.lti_id,
                            "title": first_playlist.title,
                        },
                        "should_use_subtitle_as_transcript": False,
                        "show_download": True,
                        "thumbnail": None,
                        "timed_text_tracks": [],
                        "title": video.title,
                        "upload_state": "pending",
                        "urls": None,
                        "xmpp": None,
                    }
                ],
            },
        )

    def test_api_video_read_list_by_playlist_user_with_org_access(self):
        """
        Token user with organization access lists videos by playlist.

        A user with a user token, with an organization access, can list videos
        for a playlist that belongs to that organization.
        """
        user = factories.UserFactory()
        # An organization where the user has access, with a playlist with a video
        first_organization = factories.OrganizationFactory()
        first_playlist = factories.PlaylistFactory(organization=first_organization)
        video = factories.VideoFactory(playlist=first_playlist)
        factories.OrganizationAccessFactory(user=user, organization=first_organization)
        # Another one where the user has no access, with a video
        other_organization = factories.OrganizationFactory()
        other_playlist = factories.PlaylistFactory(organization=other_organization)
        factories.VideoFactory(playlist=other_playlist)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        response = self.client.get(
            f"/api/videos/?playlist={first_playlist.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 1,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "active_stamp": None,
                        "description": video.description,
                        "has_transcript": False,
                        "id": str(video.id),
                        "is_ready_to_show": False,
                        "live_info": {},
                        "live_state": None,
                        "playlist": {
                            "lti_id": first_playlist.lti_id,
                            "title": first_playlist.title,
                        },
                        "should_use_subtitle_as_transcript": False,
                        "show_download": True,
                        "thumbnail": None,
                        "timed_text_tracks": [],
                        "title": video.title,
                        "upload_state": "pending",
                        "urls": None,
                        "xmpp": None,
                    }
                ],
            },
        )

    def test_api_video_read_list_by_org_user_with_no_access(self):
        """
        Token user lists videos by organization.

        A user with a user token, with no playlist or organization access should not
        get any videos in response to requests to list videos by organization.
        """
        user = factories.UserFactory()
        # An organization where the user has no access, with a playlist and a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        factories.VideoFactory(playlist=playlist)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        response = self.client.get(
            f"/api/videos/?organization={organization.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(), {"count": 0, "next": None, "previous": None, "results": []}
        )

    def test_api_video_read_list_by_org_user_with_playlist_access(self):
        """
        Token user with playlist access lists videos by organization.

        A user with a user token, with a playlist access, can list videos for the organization
        linked to the playlist, and get only those they have access to, and not videos for
        other organization playlists.
        """
        user = factories.UserFactory()
        # The organization for both our playlists
        organization = factories.OrganizationFactory()
        # A playlist where the user has access, with a video
        first_playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=first_playlist)
        factories.PlaylistAccessFactory(user=user, playlist=first_playlist)
        # Another one where the user has no access, with a video
        other_playlist = factories.PlaylistFactory(organization=organization)
        factories.VideoFactory(playlist=other_playlist)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        response = self.client.get(
            f"/api/videos/?organization={organization.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 1,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "active_stamp": None,
                        "description": video.description,
                        "has_transcript": False,
                        "id": str(video.id),
                        "is_ready_to_show": False,
                        "live_info": {},
                        "live_state": None,
                        "playlist": {
                            "lti_id": first_playlist.lti_id,
                            "title": first_playlist.title,
                        },
                        "should_use_subtitle_as_transcript": False,
                        "show_download": True,
                        "thumbnail": None,
                        "timed_text_tracks": [],
                        "title": video.title,
                        "upload_state": "pending",
                        "urls": None,
                        "xmpp": None,
                    }
                ],
            },
        )

    def test_api_video_read_list_by_org_user_with_org_access(self):
        """
        Token user with organization access lists videos by organization.

        A user with a user token, with an organization access, can list videos for the
        organization, no matter the playlist they belong to.
        """
        user = factories.UserFactory()
        # The organization for both our playlists
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(organization=organization, user=user)
        # Two separate playlists for the organization, with a video each
        playlist_1 = factories.PlaylistFactory(organization=organization)
        video_1 = factories.VideoFactory(playlist=playlist_1, title="First video")
        playlist_2 = factories.PlaylistFactory(organization=organization)
        video_2 = factories.VideoFactory(playlist=playlist_2, title="Second video")

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        response = self.client.get(
            f"/api/videos/?organization={organization.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 2,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "active_stamp": None,
                        "description": video_1.description,
                        "has_transcript": False,
                        "id": str(video_1.id),
                        "is_ready_to_show": False,
                        "live_info": {},
                        "live_state": None,
                        "playlist": {
                            "lti_id": playlist_1.lti_id,
                            "title": playlist_1.title,
                        },
                        "should_use_subtitle_as_transcript": False,
                        "show_download": True,
                        "thumbnail": None,
                        "timed_text_tracks": [],
                        "title": video_1.title,
                        "upload_state": "pending",
                        "urls": None,
                        "xmpp": None,
                    },
                    {
                        "active_stamp": None,
                        "description": video_2.description,
                        "has_transcript": False,
                        "id": str(video_2.id),
                        "is_ready_to_show": False,
                        "live_info": {},
                        "live_state": None,
                        "playlist": {
                            "lti_id": playlist_2.lti_id,
                            "title": playlist_2.title,
                        },
                        "should_use_subtitle_as_transcript": False,
                        "show_download": True,
                        "thumbnail": None,
                        "timed_text_tracks": [],
                        "title": video_2.title,
                        "upload_state": "pending",
                        "urls": None,
                        "xmpp": None,
                    },
                ],
            },
        )

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_video_with_a_thumbnail(self):
        """A video with a custom thumbnail should have it in its payload."""
        video = factories.VideoFactory(
            pk="38a91911-9aee-41e2-94dd-573abda6f48f",
            uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc),
            upload_state="ready",
            resolutions=[144, 240, 480, 720, 1080],
        )
        thumbnail = factories.ThumbnailFactory(
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
        for user in [factories.UserFactory(), factories.UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            factories.VideoFactory()
            response = self.client.get("/api/videos/")
            self.assertEqual(response.status_code, 401)

    def test_api_video_create_anonymous(self):
        """Anonymous users should not be able to create a new video."""
        response = self.client.post("/api/videos/")
        self.assertEqual(response.status_code, 401)
        self.assertFalse(models.Video.objects.exists())

    def test_api_video_create_token_user_playlist_preexists(self):
        """A token user should not be able to create a video."""
        jwt_token = AccessToken()
        response = self.client.post(
            "/api/videos/", HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token)
        )
        self.assertEqual(response.status_code, 401)
        self.assertFalse(models.Video.objects.exists())

    def test_api_video_create_staff_or_user(self):
        """Users authenticated via a session should not be able to create videos."""
        for user in [factories.UserFactory(), factories.UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            response = self.client.post("/api/videos/")
            self.assertEqual(response.status_code, 401)
            self.assertFalse(models.Video.objects.exists())

    def test_api_video_create_by_playlist_admin(self):
        """
        Create video with playlist admin access.

        Users with an administrator role on a playlist should be able to create videos
        for it.
        """
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.ADMINISTRATOR, playlist=playlist, user=user
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        self.assertEqual(models.Video.objects.count(), 0)

        response = self.client.post(
            "/api/videos/",
            {
                "lti_id": "video_one",
                "playlist": str(playlist.id),
                "title": "Some video",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(models.Video.objects.count(), 1)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            response.json(),
            {
                "active_stamp": None,
                "description": "",
                "has_transcript": False,
                "id": str(models.Video.objects.get().id),
                "is_ready_to_show": False,
                "live_info": {},
                "live_state": None,
                "playlist": {"lti_id": playlist.lti_id, "title": playlist.title},
                "should_use_subtitle_as_transcript": False,
                "show_download": True,
                "thumbnail": None,
                "timed_text_tracks": [],
                "title": "Some video",
                "upload_state": "pending",
                "urls": None,
                "xmpp": None,
            },
        )

    def test_api_video_create_for_nonexistent_playlist(self):
        """
        Create video for nonexistet playlist.

        Requests with a UUID that does not match an existing playlist should fail.
        """
        user = factories.UserFactory()
        some_uuid = uuid.uuid4()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        self.assertEqual(models.Video.objects.count(), 0)

        response = self.client.post(
            "/api/videos/",
            {"lti_id": "video_one", "playlist": some_uuid, "title": "Some video"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(models.Video.objects.count(), 0)
        self.assertEqual(response.status_code, 403)

    def test_api_video_create_by_playlist_admin_missing_title(self):
        """
        Create video with missing parameter.

        Requests from an authorized user with a missing mandatory property should result
        in an error message.
        """
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.ADMINISTRATOR, playlist=playlist, user=user
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        self.assertEqual(models.Video.objects.count(), 0)

        response = self.client.post(
            "/api/videos/",
            {"playlist": str(playlist.id)},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(models.Video.objects.count(), 0)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": [{"title": ["This field is required."]}]},
        )

    def test_api_video_create_by_playlist_instructor(self):
        """
        Create video with playlist instructor access.

        Users with an instructor role on a playlist should not be able to create videos
        for it.
        """
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.INSTRUCTOR, playlist=playlist, user=user
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        self.assertEqual(models.Video.objects.count(), 0)

        response = self.client.post(
            "/api/videos/",
            {
                "lti_id": "video_one",
                "playlist": str(playlist.id),
                "title": "Some video",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(models.Video.objects.count(), 0)
        self.assertEqual(response.status_code, 403)

    def test_api_video_create_by_organization_admin(self):
        """
        Create video with organization admin access.

        Users with an administrator role on an organization should be able to create videos
        for playlists linked to that organization.
        """
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        self.assertEqual(models.Video.objects.count(), 0)

        response = self.client.post(
            "/api/videos/",
            {
                "lti_id": "video_one",
                "playlist": str(playlist.id),
                "title": "Some video",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(models.Video.objects.count(), 1)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            response.json(),
            {
                "active_stamp": None,
                "description": "",
                "has_transcript": False,
                "id": str(models.Video.objects.get().id),
                "is_ready_to_show": False,
                "live_info": {},
                "live_state": None,
                "playlist": {"lti_id": playlist.lti_id, "title": playlist.title},
                "should_use_subtitle_as_transcript": False,
                "show_download": True,
                "thumbnail": None,
                "timed_text_tracks": [],
                "title": "Some video",
                "upload_state": "pending",
                "urls": None,
                "xmpp": None,
            },
        )

    def test_api_video_create_by_organization_instructor(self):
        """
        Create video with organization instructor access.

        Users with an instructor role on an organization should not be able to create videos
        for playlists linked to that organization.
        """
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.INSTRUCTOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        self.assertEqual(models.Video.objects.count(), 0)

        response = self.client.post(
            "/api/videos/",
            {
                "lti_id": "video_one",
                "playlist": str(playlist.id),
                "title": "Some video",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(models.Video.objects.count(), 0)
        self.assertEqual(response.status_code, 403)

    def test_api_video_update_detail_anonymous(self):
        """Anonymous users should not be allowed to update a video through the API."""
        video = factories.VideoFactory(title="my title")
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
        video = factories.VideoFactory(title="my title")
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
        video = factories.VideoFactory(description="my description")
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
        video = factories.VideoFactory()
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
        """Token users should be able to update "upload_state" of their video through the API."""
        video = factories.VideoFactory()
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
        self.assertEqual(video.upload_state, "ready")

    def test_api_video_instructor_update_video_in_read_only(self):
        """An instructor with read_only set to true should not be able to update the video."""
        video = factories.VideoFactory()
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
        video = factories.VideoFactory()
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

    def test_api_video_patch_detail_token_user_stamp(self):
        """Token users should not be able to patch active stamp.

        this field can only be updated by AWS via the separate update-state API endpoint.
        """
        video = factories.VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        self.assertIsNone(video.uploaded_on)

        data = {"active_stamp": "1533686400"}

        response = self.client.patch(
            "/api/videos/{!s}/".format(video.id),
            json.dumps(data),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertIsNone(video.uploaded_on)

    def test_api_video_update_detail_token_user_id(self):
        """Token users trying to update the ID of a video they own should be ignored."""
        video = factories.VideoFactory()
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
        video_token = factories.VideoFactory()
        video_update = factories.VideoFactory(title="my title")
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
        video = factories.VideoFactory(description="my description")
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

    def test_api_video_patch_by_organization_instructor(self):
        """Organization instructors cannot patch videos on the API."""
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.INSTRUCTOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist, title="existing title")

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        response = self.client.patch(
            f"/api/videos/{video.id}/",
            json.dumps({"title": "updated title"}),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        video.refresh_from_db()
        self.assertEqual(video.title, "existing title")

    def test_api_video_patch_by_organization_admin(self):
        """Organization admins can patch videos on the API."""
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist, title="existing title")

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        response = self.client.patch(
            f"/api/videos/{video.id}/",
            json.dumps({"title": "updated title"}),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.title, "updated title")

    def test_api_video_patch_by_playlist_instructor(self):
        """Playlist instructors cannot patch videos on the API."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.INSTRUCTOR, playlist=playlist, user=user
        )
        video = factories.VideoFactory(playlist=playlist, title="existing title")

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        response = self.client.patch(
            f"/api/videos/{video.id}/",
            json.dumps({"title": "updated title"}),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        video.refresh_from_db()
        self.assertEqual(video.title, "existing title")

    def test_api_video_patch_by_playlist_admin(self):
        """Playlist admins can patch videos on the API."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.ADMINISTRATOR, playlist=playlist, user=user
        )
        video = factories.VideoFactory(playlist=playlist, title="existing title")

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        response = self.client.patch(
            f"/api/videos/{video.id}/",
            json.dumps({"title": "updated title"}),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.title, "updated title")

    def test_api_video_put_by_organization_instructor(self):
        """Organization instructors cannot update videos on the API."""
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.INSTRUCTOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist, title="existing title")

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        response = self.client.put(
            f"/api/videos/{video.id}/",
            json.dumps({"title": "updated title"}),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        video.refresh_from_db()
        self.assertEqual(video.title, "existing title")

    def test_api_video_put_by_organization_admin(self):
        """Organization admins can update videos on the API."""
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist, title="existing title")

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        response = self.client.put(
            f"/api/videos/{video.id}/",
            json.dumps({"title": "updated title"}),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.title, "updated title")

    def test_api_video_put_by_playlist_instructor(self):
        """Playlist instructors cannot update videos on the API."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.INSTRUCTOR, playlist=playlist, user=user
        )
        video = factories.VideoFactory(playlist=playlist, title="existing title")

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        response = self.client.put(
            f"/api/videos/{video.id}/",
            json.dumps({"title": "updated title"}),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        video.refresh_from_db()
        self.assertEqual(video.title, "existing title")

    def test_api_video_put_by_playlist_admin(self):
        """Playlist admins can update videos on the API."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.ADMINISTRATOR, playlist=playlist, user=user
        )
        video = factories.VideoFactory(playlist=playlist, title="existing title")

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        response = self.client.put(
            f"/api/videos/{video.id}/",
            json.dumps({"title": "updated title"}),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.title, "updated title")

    def test_api_video_delete_detail_anonymous(self):
        """Anonymous users should not be allowed to delete a video."""
        video = factories.VideoFactory()
        response = self.client.delete("/api/videos/{!s}/".format(video.id))
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )
        self.assertTrue(models.Video.objects.filter(id=video.id).exists())

    def test_api_video_delete_detail_token_user(self):
        """A token user associated to a video should not be able to delete it or any other."""
        videos = factories.VideoFactory.create_batch(2)
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
            self.assertEqual(response.status_code, 403)
            self.assertTrue(models.Video.objects.filter(id=video.id).exists())

    def test_api_video_delete_detail_staff_or_user(self):
        """Users authenticated via a session should not be able to delete a video."""
        video = factories.VideoFactory()
        for user in [factories.UserFactory(), factories.UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")

            response = self.client.delete("/api/videos/{!s}/".format(video.id))

            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )
        self.assertTrue(models.Video.objects.filter(id=video.id).exists())

    def test_api_video_delete_by_playlist_admin(self):
        """
        Delete video by playlist admin.

        Users with an administrator role on a playlist should be able to delete videos.
        """
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.ADMINISTRATOR, playlist=playlist, user=user
        )
        video = factories.VideoFactory(playlist=playlist)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        self.assertEqual(models.Video.objects.count(), 1)

        response = self.client.delete(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(models.Video.objects.count(), 0)
        self.assertEqual(response.status_code, 204)

    def test_api_video_delete_by_playlist_instructor(self):
        """
        Delete video by playlist instructor.

        Users with an instructor role on a playlist should not be able to delete videos.
        """
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.INSTRUCTOR, playlist=playlist, user=user
        )
        video = factories.VideoFactory(playlist=playlist)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        self.assertEqual(models.Video.objects.count(), 1)

        response = self.client.delete(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(models.Video.objects.count(), 1)
        self.assertEqual(response.status_code, 403)

    def test_api_video_delete_by_organization_admin(self):
        """
        Delete video by organization admin.

        Users with an administrator role on an organization should be able to
        delete videos from playlists linked to that organization.
        """
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        self.assertEqual(models.Video.objects.count(), 1)

        response = self.client.delete(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(models.Video.objects.count(), 0)
        self.assertEqual(response.status_code, 204)

    def test_api_video_delete_by_organization_instructor(self):
        """
        Delete video by organization instructor.

        Users with an instructor role on an organization should not be able to
        delete videos from playlists linked to that organization.
        """
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.INSTRUCTOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

        self.assertEqual(models.Video.objects.count(), 1)

        response = self.client.delete(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(models.Video.objects.count(), 1)
        self.assertEqual(response.status_code, 403)

    def test_api_video_instructor_delete_video_in_read_only(self):
        """An instructor with read_only set to true should not be able to delete the video."""
        video = factories.VideoFactory()
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
        video = factories.VideoFactory()

        response = self.client.delete("/api/videos/")

        self.assertEqual(response.status_code, 401)
        self.assertTrue(models.Video.objects.filter(id=video.id).exists())

    def test_api_video_delete_list_token_user(self):
        """A token user associated to a video should not be able to delete a list of videos."""
        video = factories.VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]

        response = self.client.delete(
            "/api/videos/", HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token)
        )
        self.assertEqual(response.status_code, 403)
        self.assertTrue(models.Video.objects.filter(id=video.id).exists())

    def test_api_video_delete_list_staff_or_user(self):
        """Users authenticated via a session should not be able to delete a list of videos."""
        video = factories.VideoFactory()
        for user in [factories.UserFactory(), factories.UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")

            response = self.client.delete("/api/videos/")

            self.assertEqual(response.status_code, 401)
        self.assertTrue(models.Video.objects.filter(id=video.id).exists())

    def test_api_video_initiate_upload_anonymous_user(self):
        """Anonymous users are not allowed to initiate an upload."""
        video = factories.VideoFactory()

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
        video = factories.VideoFactory()
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
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        # Create another video to check that its upload state is unaffected
        other_video = factories.VideoFactory(
            upload_state=random.choice(["ready", "error"])
        )

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
        for user in [factories.UserFactory(), factories.UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            video = factories.VideoFactory()

            response = self.client.post(
                "/api/videos/{!s}/initiate-upload/".format(video.id)
            )
            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )

    def test_api_video_initiate_upload_by_organization_instructor(self):
        """Organization instructors cannot retrieve an upload policy."""
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.INSTRUCTOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            playlist=playlist,
            upload_state="ready",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

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
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            json.loads(response.content),
            {"detail": "You do not have permission to perform this action."},
        )

        # The upload state of the video has not changed
        video.refresh_from_db()
        self.assertEqual(video.upload_state, "ready")

    def test_api_video_initiate_upload_by_organization_admin(self):
        """Organization admins can retrieve an upload policy."""
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            playlist=playlist,
            upload_state="ready",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

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

        # The upload state of the video has been reset
        video.refresh_from_db()
        self.assertEqual(video.upload_state, "pending")

    def test_api_video_initiate_upload_by_playlist_instructor(self):
        """Playlist instructors cannot retrieve an upload policy."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.INSTRUCTOR, playlist=playlist, user=user
        )
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            playlist=playlist,
            upload_state="ready",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

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
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            json.loads(response.content),
            {"detail": "You do not have permission to perform this action."},
        )

        # The upload state of the video has not changed
        video.refresh_from_db()
        self.assertEqual(video.upload_state, "ready")

    def test_api_video_initiate_upload_by_playlist_admin(self):
        """Playlist admins can retrieve an upload policy."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.ADMINISTRATOR, playlist=playlist, user=user
        )
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            playlist=playlist,
            upload_state="ready",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user_id"] = str(user.id)

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

        # The upload state of the video has been reset
        video.refresh_from_db()
        self.assertEqual(video.upload_state, "pending")

    def test_api_video_initiate_live_anonymous_user(self):
        """Anonymous users are not allowed to initiate a live."""
        video = factories.VideoFactory()

        response = self.client.post("/api/videos/{!s}/initiate-live/".format(video.id))

        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_video_instructor_initiate_live_in_read_only(self):
        """An instructor with read_only set to true should not be able to initiate a live."""
        video = factories.VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": False}

        response = self.client.post(
            "/api/videos/{!s}/initiate-live/".format(video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)

    def test_api_video_student_initiate_live(self):
        """A student should not be able to initiate a live."""
        video = factories.VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]

        response = self.client.post(
            "/api/videos/{!s}/initiate-live/".format(video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )

        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_video_initiate_live_staff_or_user(self):
        """Users authenticated via a session should not be able to initiate a live."""
        for user in [factories.UserFactory(), factories.UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            video = factories.VideoFactory()

            response = self.client.post(
                "/api/videos/{!s}/initiate-live/".format(video.id)
            )
            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )

    def test_api_video_instructor_initiate_live(self):
        """An instructor should be able to initiate a live."""
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        # initiate a live video,
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=pytz.utc)
        live_info = {
            "medialive": {
                "input": {
                    "id": "medialive_input_1",
                    "endpoints": ["https://live_endpoint1", "https://live_endpoint2"],
                },
                "channel": {"id": "medialive_channel_1"},
            },
            "mediapackage": {
                "id": "mediapackage_channel_1",
                "endpoints": {
                    "hls": {
                        "id": "endpoint1",
                        "url": "https://channel_endpoint1/live.m3u8",
                    },
                },
            },
        }
        with mock.patch.object(timezone, "now", return_value=now), mock.patch.object(
            api, "create_live_stream", return_value=live_info
        ):
            response = self.client.post(
                "/api/videos/{!s}/initiate-live/".format(video.id),
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
                "is_ready_to_show": False,
                "show_download": True,
                "upload_state": "pending",
                "thumbnail": None,
                "timed_text_tracks": [],
                "urls": {
                    "manifests": {
                        "hls": "https://channel_endpoint1/live.m3u8",
                    },
                    "mp4": {},
                    "thumbnails": {},
                },
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "playlist": {
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "live_state": "creating",
                "live_info": {
                    "medialive": {
                        "input": {
                            "endpoints": [
                                "https://live_endpoint1",
                                "https://live_endpoint2",
                            ],
                        }
                    }
                },
                "xmpp": None,
            },
        )

    def test_api_video_start_live_anonymous_user(self):
        """Anonymous users are not allowed to start a live."""
        video = factories.VideoFactory()

        response = self.client.post("/api/videos/{!s}/start-live/".format(video.id))

        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_video_instructor_start_live_in_read_only(self):
        """An instructor with read_only set to true should not be able to start a live."""
        video = factories.VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": False}

        response = self.client.post(
            "/api/videos/{!s}/start-live/".format(video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)

    def test_api_video_student_start_live(self):
        """A student should not be able to start a live."""
        video = factories.VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]

        response = self.client.post(
            "/api/videos/{!s}/start-live/".format(video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )

        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_video_start_live_staff_or_user(self):
        """Users authenticated via a session should not be able to start a live."""
        for user in [factories.UserFactory(), factories.UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            video = factories.VideoFactory()

            response = self.client.post("/api/videos/{!s}/start-live/".format(video.id))
            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )

    @override_settings(LIVE_CHAT_ENABLED=True)
    @override_settings(XMPP_BOSH_URL="https://xmpp-server.com/http-bind")
    @override_settings(XMPP_CONFERENCE_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_DOMAIN="xmpp-server.com")
    @override_settings(XMPP_JWT_SHARED_SECRET="xmpp_shared_secret")
    def test_api_video_instructor_start_live(self):
        """An instructor should be able to start a live with a chat room."""
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            upload_state=PENDING,
            live_state=IDLE,
            live_info={
                "medialive": {
                    "input": {
                        "id": "medialive_input_1",
                        "endpoints": [
                            "https://live_endpoint1",
                            "https://live_endpoint2",
                        ],
                    },
                    "channel": {"id": "medialive_channel_1"},
                },
                "mediapackage": {
                    "id": "mediapackage_channel_1",
                    "endpoints": {
                        "hls": {
                            "id": "endpoint1",
                            "url": "https://channel_endpoint1/live.m3u8",
                        },
                    },
                },
            },
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        jwt_token.payload["user_id"] = "56255f3807599c377bf0e5bf072359fd"

        # start a live video,
        with mock.patch.object(api, "start_live_channel"), mock.patch.object(
            api, "create_room"
        ) as mock_create_room, mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode:
            mock_jwt_encode.return_value = "xmpp_jwt"
            response = self.client.post(
                "/api/videos/{!s}/start-live/".format(video.id),
                HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            )
            mock_create_room.assert_called_once_with(video.id)
        self.assertEqual(response.status_code, 200)
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
                "thumbnail": None,
                "timed_text_tracks": [],
                "urls": {
                    "manifests": {
                        "hls": "https://channel_endpoint1/live.m3u8",
                    },
                    "mp4": {},
                    "thumbnails": {},
                },
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "playlist": {
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "live_state": "starting",
                "live_info": {
                    "medialive": {
                        "input": {
                            "endpoints": [
                                "https://live_endpoint1",
                                "https://live_endpoint2",
                            ],
                        }
                    }
                },
                "xmpp": {
                    "bosh_url": "https://xmpp-server.com/http-bind?token=xmpp_jwt",
                    "conference_url": f"{video.id}@conference.xmpp-server.com",
                    "jid": "xmpp-server.com",
                },
            },
        )

    def test_api_instructor_start_non_live_video(self):
        """An instructor should not start a video when not in live mode."""
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        # start a live video,
        with mock.patch.object(api, "start_live_channel"):
            response = self.client.post(
                "/api/videos/{!s}/start-live/".format(video.id),
                HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            )
        self.assertEqual(response.status_code, 400)

    def test_api_instructor_start_non_idle_live(self):
        """An instructor should not start a video when not in live mode."""
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=PENDING,
            live_state=random.choice([s[0] for s in LIVE_CHOICES if s[0] != "idle"]),
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        # start a live video,
        with mock.patch.object(api, "start_live_channel"):
            response = self.client.post(
                "/api/videos/{!s}/start-live/".format(video.id),
                HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            )
        self.assertEqual(response.status_code, 400)

    def test_api_video_stop_live_anonymous_user(self):
        """Anonymous users are not allowed to stop a live."""
        video = factories.VideoFactory()

        response = self.client.post("/api/videos/{!s}/stop-live/".format(video.id))

        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_video_instructor_stop_live_in_read_only(self):
        """An instructor with read_only set to true should not be able to stop a live."""
        video = factories.VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": False}

        response = self.client.post(
            "/api/videos/{!s}/stop-live/".format(video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )
        self.assertEqual(response.status_code, 403)

    def test_api_video_student_stop_live(self):
        """A student should not be able to stop a live."""
        video = factories.VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]

        response = self.client.post(
            "/api/videos/{!s}/stop-live/".format(video.id),
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
        )

        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_video_stop_live_staff_or_user(self):
        """Users authenticated via a session should not be able to stop a live."""
        for user in [factories.UserFactory(), factories.UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            video = factories.VideoFactory()

            response = self.client.post("/api/videos/{!s}/stop-live/".format(video.id))
            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )

    @override_settings(LIVE_CHAT_ENABLED=False)
    def test_api_video_instructor_stop_live(self):
        """An instructor should be able to stop a live."""
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            upload_state=PENDING,
            live_state=RUNNING,
            live_info={
                "medialive": {
                    "input": {
                        "id": "medialive_input_1",
                        "endpoints": [
                            "https://live_endpoint1",
                            "https://live_endpoint2",
                        ],
                    },
                    "channel": {"id": "medialive_channel_1"},
                },
                "mediapackage": {
                    "id": "mediapackage_channel_1",
                    "endpoints": {
                        "hls": {
                            "id": "endpoint1",
                            "url": "https://channel_endpoint1/live.m3u8",
                        },
                    },
                },
            },
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        # start a live video,
        with mock.patch.object(api, "stop_live_channel"):
            response = self.client.post(
                "/api/videos/{!s}/stop-live/".format(video.id),
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
                "is_ready_to_show": False,
                "show_download": True,
                "upload_state": PENDING,
                "thumbnail": None,
                "timed_text_tracks": [],
                "urls": {
                    "manifests": {
                        "hls": "https://channel_endpoint1/live.m3u8",
                    },
                    "mp4": {},
                    "thumbnails": {},
                },
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "playlist": {
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "live_state": STOPPING,
                "live_info": {
                    "medialive": {
                        "input": {
                            "endpoints": [
                                "https://live_endpoint1",
                                "https://live_endpoint2",
                            ],
                        }
                    }
                },
                "xmpp": None,
            },
        )

    def test_api_instructor_stop_non_live_video(self):
        """An instructor should not stop a video when not in live mode."""
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        # start a live video,
        with mock.patch.object(api, "stop_live_channel"):
            response = self.client.post(
                "/api/videos/{!s}/stop-live/".format(video.id),
                HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            )
        self.assertEqual(response.status_code, 400)

    def test_api_instructor_stop_non_running_live(self):
        """An instructor should not stop a video when not in live state."""
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=PENDING,
            live_state=random.choice([s[0] for s in LIVE_CHOICES if s[0] != "running"]),
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        # start a live video,
        with mock.patch.object(api, "stop_live_channel"):
            response = self.client.post(
                "/api/videos/{!s}/stop-live/".format(video.id),
                HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            )
        self.assertEqual(response.status_code, 400)

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_video_update_live_state(self):
        """Confirm update video live state."""
        video = factories.VideoFactory(
            id="a1a21411-bf2f-4926-b97f-3c48a124d528",
            upload_state=PENDING,
            live_state=IDLE,
            live_info={},
        )
        data = {
            "logGroupName": "/aws/lambda/dev-test-marsha-medialive",
            "state": "running",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        now = datetime(2018, 8, 8, tzinfo=pytz.utc)
        with mock.patch.object(timezone, "now", return_value=now):
            response = self.client.patch(
                "/api/videos/{!s}/update-live-state/".format(video.id),
                data,
                content_type="application/json",
                HTTP_X_MARSHA_SIGNATURE=signature,
            )

        video.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(video.live_state, RUNNING)
        self.assertEqual(
            video.live_info,
            {
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
                "started_at": "1533686400",
            },
        )

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    @override_settings(LIVE_CHAT_ENABLED=True)
    def test_api_video_update_live_state_stopped(self):
        """Updating state to stopped should delete all the AWS elemental stack."""
        video = factories.VideoFactory(
            id="a1a21411-bf2f-4926-b97f-3c48a124d528",
            upload_state=PENDING,
            live_state=STOPPING,
            live_info={},
        )
        data = {
            "logGroupName": "/aws/lambda/dev-test-marsha-medialive",
            "state": "stopped",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))

        now = datetime(2018, 8, 8, tzinfo=pytz.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "marsha.core.api.delete_aws_element_stack"
        ) as delete_aws_element_stack_mock, mock.patch(
            "marsha.core.api.create_mediapackage_harvest_job"
        ) as create_mediapackage_harvest_job_mock, mock.patch.object(
            api, "close_room"
        ) as mock_close_room:
            response = self.client.patch(
                "/api/videos/{!s}/update-live-state/".format(video.id),
                data,
                content_type="application/json",
                HTTP_X_MARSHA_SIGNATURE=signature,
            )
            delete_aws_element_stack_mock.assert_called_once()
            create_mediapackage_harvest_job_mock.assert_called_once()
            mock_close_room.assert_called_once_with(video.id)

        video.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(video.live_state, STOPPED)
        self.assertEqual(video.upload_state, HARVESTING)
        self.assertEqual(
            video.live_info,
            {
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
                "stopped_at": "1533686400",
            },
        )

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_video_update_live_state_idle(self):
        """Updating state to idle."""
        video = factories.VideoFactory(
            id="a1a21411-bf2f-4926-b97f-3c48a124d528",
            upload_state=PENDING,
            live_state=CREATING,
            live_info={},
        )
        data = {
            "logGroupName": "/aws/lambda/dev-test-marsha-medialive",
            "state": "idle",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        response = self.client.patch(
            "/api/videos/{!s}/update-live-state/".format(video.id),
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=signature,
        )

        video.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(video.live_state, IDLE)
        self.assertEqual(
            video.live_info,
            {
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
            },
        )

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_video_update_live_state_invalid_signature(self):
        """Live state update with an invalid signature should fails."""
        video = factories.VideoFactory(
            id="a1a21411-bf2f-4926-b97f-3c48a124d528",
            upload_state=PENDING,
            live_state=IDLE,
        )
        data = {
            "logGroupName": "/aws/lambda/dev-test-marsha-medialive",
            "state": "running",
        }
        signature = generate_hash("invalid secret", json.dumps(data).encode("utf-8"))
        response = self.client.patch(
            "/api/videos/{!s}/update-live-state/".format(video.id),
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=signature,
        )
        video.refresh_from_db()

        self.assertEqual(response.status_code, 403)
        self.assertEqual(video.live_state, IDLE)

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_video_update_live_state_invalid_state(self):
        """Live state update with an invalid state should fails."""
        video = factories.VideoFactory(
            id="a1a21411-bf2f-4926-b97f-3c48a124d528",
            upload_state=PENDING,
            live_state=IDLE,
        )
        invalid_state = random.choice(
            [s[0] for s in LIVE_CHOICES if s[0] not in [IDLE, RUNNING, STOPPED]]
        )
        data = {
            "logGroupName": "/aws/lambda/dev-test-marsha-medialive",
            "state": invalid_state,
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        response = self.client.patch(
            "/api/videos/{!s}/update-live-state/".format(video.id),
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=signature,
        )
        video.refresh_from_db()

        self.assertEqual(response.status_code, 400)
        self.assertEqual(video.live_state, IDLE)
        self.assertEqual(
            json.loads(response.content),
            {"state": [f'"{invalid_state}" is not a valid choice.']},
        )

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_video_update_live_state_unknown_video(self):
        """Live state update with an unknown video should fails."""
        data = {
            "logGroupName": "/aws/lambda/dev-test-marsha-medialive",
            "state": "running",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        response = self.client.patch(
            "/api/videos/9087c52d-cb87-4fd0-9b57-d9f28a0c69cb/update-live-state/",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=signature,
        )

        self.assertEqual(response.status_code, 404)

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_video_update_live_state_same_state(self):
        """Updating with exact same live state should return earlier a status code 200."""
        video = factories.VideoFactory(
            id="a1a21411-bf2f-4926-b97f-3c48a124d528",
            upload_state=PENDING,
            live_state=STOPPED,
            live_info={},
        )
        data = {
            "logGroupName": "/aws/lambda/dev-test-marsha-medialive",
            "state": "stopped",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        now = datetime(2018, 8, 8, tzinfo=pytz.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "marsha.core.api.delete_aws_element_stack"
        ) as delete_aws_element_stack_mock, mock.patch(
            "marsha.core.api.create_mediapackage_harvest_job"
        ) as create_mediapackage_harvest_job_mock:
            response = self.client.patch(
                "/api/videos/{!s}/update-live-state/".format(video.id),
                data,
                content_type="application/json",
                HTTP_X_MARSHA_SIGNATURE=signature,
            )
            delete_aws_element_stack_mock.assert_not_called()
            create_mediapackage_harvest_job_mock.assert_not_called()

        self.assertEqual(response.status_code, 200)
