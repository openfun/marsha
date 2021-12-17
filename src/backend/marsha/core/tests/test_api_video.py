"""Tests for the Video API of the Marsha project."""
from datetime import datetime, timedelta
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
    DELETED,
    HARVESTING,
    IDLE,
    JITSI,
    LIVE_CHOICES,
    PAUSED,
    PENDING,
    RAW,
    READY,
    RUNNING,
    STATE_CHOICES,
    STOPPED,
    STOPPING,
)
from ..utils.api_utils import generate_hash
from ..utils.medialive_utils import ManifestMissingException


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
        response = self.client.get(f"/api/videos/{video.id}/")
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_video_read_detail_student(self):
        """Student users should be allowed to read a video detail."""
        video = factories.VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["permissions"] = {"can_update": False}
        # Get the video linked to the JWT token
        response = self.client.get(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

    def test_api_video_read_detail_scheduled_video_student(self):
        """Student users should be allowed to read a scheduled video detail."""
        starting_at = timezone.now() + timedelta(days=100)
        video = factories.VideoFactory(
            live_state=IDLE, live_type=RAW, starting_at=starting_at
        )
        self.assertTrue(video.is_scheduled)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["permissions"] = {"can_update": False}
        # Get the video linked to the JWT token
        response = self.client.get(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

    def test_api_video_read_detail_scheduled_past_video_student(self):
        """Student users can read a video detail with a starting_at date past."""
        initial_starting_at = timezone.now() + timedelta(days=2)
        video = factories.VideoFactory(
            live_state=IDLE, live_type=RAW, starting_at=initial_starting_at
        )
        self.assertTrue(video.is_scheduled)
        # now is set after video.starting_at
        now = initial_starting_at + timedelta(days=10)
        with mock.patch.object(timezone, "now", return_value=now):
            self.assertFalse(video.is_scheduled)
            self.assertEqual(video.live_state, IDLE)
            jwt_token = AccessToken()
            jwt_token.payload["resource_id"] = str(video.id)
            jwt_token.payload["roles"] = ["student"]
            jwt_token.payload["permissions"] = {"can_update": False}
            # Get the video linked to the JWT token
            response = self.client.get(
                f"/api/videos/{video.id}/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            self.assertEqual(response.status_code, 200)

    def test_api_video_read_detail_student_other_video(self):
        """Student users should not be allowed to read an other video detail."""
        video = factories.VideoFactory()
        other_video = factories.VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["permissions"] = {"can_update": False}
        # Get the video linked to the JWT token
        response = self.client.get(
            f"/api/videos/{other_video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

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
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
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
        shared_live_media = factories.SharedLiveMediaFactory(
            video=video,
            extension="pdf",
            title="python structures",
            upload_state=READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=pytz.utc),
            nb_pages=3,
        )
        shared_live_media_2 = factories.SharedLiveMediaFactory(
            nb_pages=None,
            upload_state=PENDING,
            video=video,
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        # Get the video linked to the JWT token
        response = self.client.get(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        thumbnails_template = (
            "https://abc.cloudfront.net/{!s}/thumbnails/1533686400_{!s}.0000000.jpg"
        )
        thumbnails_dict = {
            # pylint: disable=consider-using-f-string
            str(resolution): thumbnails_template.format(video.pk, resolution)
            for resolution in resolutions
        }

        mp4_template = (
            "https://abc.cloudfront.net/{!s}/mp4/1533686400_{!s}.mp4"
            "?response-content-disposition=attachment%3B+filename%3Dfoo-bar_1533686400.mp4"
        )
        mp4_dict = {
            # pylint: disable=consider-using-f-string
            str(resolution): mp4_template.format(video.pk, resolution)
            for resolution in resolutions
        }

        self.assertEqual(
            content,
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "description": video.description,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": "1533686400",
                "is_public": False,
                "is_ready_to_show": True,
                "is_scheduled": False,
                "show_download": True,
                "starting_at": None,
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
                    "id": str(video.playlist.id),
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "shared_live_medias": [
                    {
                        "id": str(shared_live_media_2.id),
                        "active_stamp": None,
                        "filename": None,
                        "is_ready_to_show": False,
                        "nb_pages": None,
                        "show_download": True,
                        "title": None,
                        "upload_state": "pending",
                        "urls": None,
                        "video": str(video.id),
                    },
                    {
                        "id": str(shared_live_media.id),
                        "active_stamp": "1638230400",
                        "filename": "python-structures.pdf",
                        "is_ready_to_show": True,
                        "nb_pages": 3,
                        "show_download": True,
                        "title": "python structures",
                        "upload_state": "ready",
                        "urls": {
                            "pages": {
                                "1": (
                                    f"https://abc.cloudfront.net/{video.id}/"
                                    f"sharedlivemedia/{shared_live_media.id}/1638230400_1.svg"
                                ),
                                "2": (
                                    f"https://abc.cloudfront.net/{video.id}/"
                                    f"sharedlivemedia/{shared_live_media.id}/1638230400_2.svg"
                                ),
                                "3": (
                                    f"https://abc.cloudfront.net/{video.id}/"
                                    f"sharedlivemedia/{shared_live_media.id}/1638230400_3.svg"
                                ),
                            }
                        },
                        "video": str(video.id),
                    },
                ],
                "live_state": None,
                "live_info": {},
                "live_type": None,
                "xmpp": None,
            },
        )

        # Try getting another video
        other_video = factories.VideoFactory()
        response = self.client.get(
            f"/api/videos/{other_video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    @override_settings(
        CLOUDFRONT_SIGNED_URLS_ACTIVE=True,
        CLOUDFRONT_ACCESS_KEY_ID="cloudfront-access-key-id",
    )
    def test_api_video_read_detail_token_user_nested_shared_live_media_urls_signed(
        self,
    ):
        """
        An instructor reading video details with nested shared live media and cloudfront signed
        urls activated should have the urls.media available
        """
        resolutions = [144, 240, 480, 720, 1080]
        video = factories.VideoFactory(
            id="d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb",
            uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc),
            upload_state="ready",
            resolutions=resolutions,
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
        )
        shared_live_media = factories.SharedLiveMediaFactory(
            id="f16dc536-8cba-473c-a85d-0eb88f64d8f9",
            extension="pdf",
            show_download=False,
            title="python expressions",
            upload_state=READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=pytz.utc),
            nb_pages=3,
            video=video,
        )
        shared_live_media_2 = factories.SharedLiveMediaFactory(
            nb_pages=None,
            upload_state=PENDING,
            video=video,
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        # fix the time so that the url signature is deterministic and can be checked
        now = datetime(2021, 11, 30, tzinfo=pytz.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "builtins.open", new_callable=mock.mock_open, read_data=RSA_KEY_MOCK
        ):
            response = self.client.get(
                f"/api/videos/{video.id}/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        thumbnails_template = (
            "https://abc.cloudfront.net/{!s}/thumbnails/1533686400_{!s}.0000000.jpg"
        )
        thumbnails_dict = {
            # pylint: disable=consider-using-f-string
            str(resolution): thumbnails_template.format(video.pk, resolution)
            for resolution in resolutions
        }

        self.assertEqual(
            content,
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "description": video.description,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": "1533686400",
                "is_public": False,
                "is_ready_to_show": True,
                "is_scheduled": False,
                "show_download": True,
                "starting_at": None,
                "upload_state": "ready",
                "thumbnail": None,
                "timed_text_tracks": [],
                "urls": {
                    "mp4": {
                        "144": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/mp4/"
                            "1533686400_144.mp4?response-content-disposition=attachment%3B"
                            "+filename%3Dfoo-bar_1533686400.mp4&Expires=1638237600&Signature=Hn-h"
                            "chOvM-DOA2ThXN2CXlG1lJioPxC8tz2RbMuN9hthqYDsGVKlEvVz9gpa1PDz26Cnxaai"
                            "b-lHXuEDtypQEGypA5E~58iAhCGC-CY8T6W3mRSD2oODAnPCcuaBIpihoXNK81DDGBST"
                            "rXvscORFP87xZRix4C7tRGESSQwuFzi~HERnkcT6cufWL8ydMrv0OsKvSBt79co6XF2c"
                            "409A~9TfVEuXT6DY5UCwLUtscGoDTH5dRSRd~XRW7nS2K1KigA-C8zkiiimh2TwBqE2m"
                            "URR-rOc~e4Kb16IuzRRpnZf0eqrnKHWpG0BGWFEEJzbyD8BwkaaA18Kmr53IWyjTlw__"
                            "&Key-Pair-Id=cloudfront-access-key-id"
                        ),
                        "240": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/mp4/"
                            "1533686400_240.mp4?response-content-disposition=attachment%3B"
                            "+filename%3Dfoo-bar_1533686400.mp4&Expires=1638237600&Signature=KNxe"
                            "uY~6OlOUYpAhSJ5mPqf8hxI6rmnvT34A8B6hROoPTsQZJcKH2b~1hDVmNwX5DOw6TQpm"
                            "9dAufzyWiQZBZcfLcafOWufmzS36RYlZi8-uzq74Nxl1HkeSCrOphLgwNg7CvN89318S"
                            "eeayFeCgfIm3zneUKIaZyX2wEl~WUJCtKRvx3Phnsheu-5qcasN-q7WnCPNm7wWTGaVT"
                            "N624EUNp-8MkmeaSczZLEemXrRWVI7Ekl60SNEMl94fZncouow3nKHp8afy37qdU3jnP"
                            "CuxtDdyVksGsbDPIMUKCoig22YwJko2yaB~~n~QF~Xq5iBtAr~HX1vtxOqT4d9Mv~g__"
                            "&Key-Pair-Id=cloudfront-access-key-id"
                        ),
                        "480": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/mp4/"
                            "1533686400_480.mp4?response-content-disposition=attachment%3B"
                            "+filename%3Dfoo-bar_1533686400.mp4&Expires=1638237600&Signature=HiV0"
                            "2qb-cWi6dQPBruMm8RThvB8yX~rfY5HV4cIznZsitm1gCW5eEREGICOx3PM3zmZ2aLGL"
                            "GKBwlDKbXl3ehVRFXkFKU1-p4PBOkbY9YquPwv1syBLvVlDeNzQyqZZzmt1j4xQGtONv"
                            "oyUqGrRrMkaFa5YPnaOSPYZDLf2SJIQ8OkQr-OEQk6UQVQO7~mMyknG0iTZdQT5HTRus"
                            "qmw5xFTZitoS6RzTS4G2SR~uKoaxV3ZtZznAHcDBb7tbAvHN6ckSNSs7~9i2e~AJblXt"
                            "dsX9O3quO9-IPpQsMpihNASp43M8n-7wa1Uln2dY4jDi~JrYBE6jWG1QkjIBFQkcJg__"
                            "&Key-Pair-Id=cloudfront-access-key-id"
                        ),
                        "720": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/mp4/"
                            "1533686400_720.mp4?response-content-disposition=attachment%3B"
                            "+filename%3Dfoo-bar_1533686400.mp4&Expires=1638237600&Signature=TKVO"
                            "yKTl2gS8m2gx7lDdjKslJK7R9IJ0Sal3HpoTHcY6LsRDsEpPqAJsUpoR3m1VLfXSoFPC"
                            "kQdyFPACwocSceMCDMlEylOZetP102D6SiTFT4OP7Al9MwRtPTVKlh-PDrZ-oQfnBQzX"
                            "JkwQgK~sqIW87QMT4l36homlwkvQWt3oXa4QoxpE58lgY1GkaHrUcVbwEDojE3qF8X9a"
                            "4ENuPifUYZttKyBNaeVrnRYcd2E4yQXXzpDpeU360ykFHvZDqRCZvu~U~pgboO8aRbY6"
                            "4lhdevLVdwgH3ESrOoD6MITKm7jbRwcy85gcU5IpOW~9Wc9Vd3nVvKzdWgnWWr7h~w__"
                            "&Key-Pair-Id=cloudfront-access-key-id"
                        ),
                        "1080": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/mp4/"
                            "1533686400_1080.mp4?response-content-disposition=attachment%3B"
                            "+filename%3Dfoo-bar_1533686400.mp4&Expires=1638237600&Signature=HBHL"
                            "NrEL8xHY~N0kxqdrDtwHLtNq6jsuKMFjU4ro9tyVSUGPlU960c8V23ZMi5KDM1UTvMwF"
                            "p2TY3ZSOefHaNJvHlwCGpfbscg5mcR5RQBTHvUpFTg2XtvvonzblqcWs6UEY7kSr-wAF"
                            "9Kviq94x0EeUj43PH7CAJN6q6nXG32fNi1zwyvsXEYCZT6gXyFF6rY9wK1zsE0zgqaR8"
                            "NLK6dULsuDOg~t2KY33njW51zfQgwH1nW6f9BJwYxyQAAt4UyXUifjOb4ZYEQoEJrSTb"
                            "8PzvtWsqyTdnOwM8juPknv3Yao8QoVyaE0K84I2BhOE4imVH5T0KskykkoZUHvNGkg__"
                            "&Key-Pair-Id=cloudfront-access-key-id"
                        ),
                    },
                    "thumbnails": thumbnails_dict,
                    "manifests": {
                        "hls": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                            "cmaf/1533686400.m3u8"
                        ),
                    },
                    "previews": (
                        "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                        "previews/1533686400_100.jpg"
                    ),
                },
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "shared_live_medias": [
                    {
                        "id": str(shared_live_media_2.id),
                        "active_stamp": None,
                        "filename": None,
                        "is_ready_to_show": False,
                        "nb_pages": None,
                        "show_download": True,
                        "title": None,
                        "upload_state": "pending",
                        "urls": None,
                        "video": str(video.id),
                    },
                    {
                        "id": str(shared_live_media.id),
                        "active_stamp": "1638230400",
                        "filename": "python-expressions.pdf",
                        "is_ready_to_show": True,
                        "nb_pages": 3,
                        "show_download": False,
                        "title": "python expressions",
                        "upload_state": "ready",
                        "urls": {
                            "media": (
                                "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                                "sharedlivemedia/f16dc536-8cba-473c-a85d-0eb88f64d8f9/1638230400/"
                                "1638230400/1638230400.pdf?response-content-disposition=attachment"
                                "%3B+filename%3Dpython-expressions.pdf&Expires=1638237600&Signatur"
                                "e=O3B-Zc9XN1xmS~c05JvXdvHV~yfo1Exf~9vK3xLwlufMUASfLkngGKg4O7ut5di"
                                "Pa7uyTbpU2lfroX0gl3ichbSWvBjPOLK5EZE8QRrp7U2vOE5Z74V1397IvcMMq7kT"
                                "CYP3pH9IDSYhheVO3AurBN4kh6zVm1fjiQWxjqZwF5gBgue-G13OsCldfZBTXDoFe"
                                "ZkY9HCEsZV9jXKkcDAsDLJaGcEodS2RMBi~ZjlmY2CrCipHZ3zOMKJ38bLHo2G1wb"
                                "PbGt8vloPM30kytiMrsK3zTciyhGDreSSvqsgDMuE3MpxeGWM4LWkdLF7CcPPKP6A"
                                "OpCzIp3tnp7M9nT~D8w__&Key-Pair-Id=cloudfront-access-key-id"
                            ),
                            "pages": {
                                "1": (
                                    "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                                    "fb/sharedlivemedia/f16dc536-8cba-473c-a85d-0eb88f64d8f9/16382"
                                    "30400_1.svg?Expires=1638237600&Signature=RH9wkrn-3H3xIyrnr8Jm"
                                    "fL99kADbi-mQuW5~EjainxJh4BjJ6taNWGV3RjCKbErTiqawCCM1WaNJ1iIy~"
                                    "zcnNEZMd1bTUamDACNovRodTK146zmk9hMYyiB4Ly~nBYoNpRYtY9PlG93LeS"
                                    "ydT6alykt6s22oEKD0SURGYkdH2Lqi3KRm~9zie6cf7c~FeRtn3pZ0lcjzjzz"
                                    "zYNiHgH8zQMxEtYscHxsLy-6IR6ZSDgaFSOT2pKi9k2Hp7t2j7Dkr~dUoNwv3"
                                    "r8aG7Gx~KxokFo1zG16kjn~Ypi~h3Dgo4TeUOE~UvjbxJEUvIEFbFlTm6HUrQ"
                                    "LzyYhgn-ksruWUhfg__&Key-Pair-Id=cloudfront-access-key-id"
                                ),
                                "2": (
                                    "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                                    "fb/sharedlivemedia/f16dc536-8cba-473c-a85d-0eb88f64d8f9/16382"
                                    "30400_2.svg?Expires=1638237600&Signature=DQo6REOTI5Y~F~gDTL~g"
                                    "8mw~ibCKB0l1EYKmJLIvd3UrbsCqQ6ogxmOg7uUhakW5u3uZqT3xW~NpBE2Qm"
                                    "AW03X568KJffa6PsyzquvfTd-CQ7aNpARSqX9j8OPw9Z4bmKpk-lbZfib~DV1"
                                    "3IC4oaXmHO9l1L0T4yQewn2Ua2QuKGmHBcbFeJ~GPFKPkc5P1KcRVPAR1oAMY"
                                    "Phmijo-PdARV~hhQtayVBX0k4CBnqesF7ib~A-UzVCaMkrgKUGWbnpAF9Bqn~"
                                    "nk6ibf5uno9wtJVOhdQVlaON2SPQF3PGWvLPB~nmDhYBLKQM215gy79AiF5lF"
                                    "rF8gsl8cjUvcsqnuw__&Key-Pair-Id=cloudfront-access-key-id"
                                ),
                                "3": (
                                    "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                                    "fb/sharedlivemedia/f16dc536-8cba-473c-a85d-0eb88f64d8f9/16382"
                                    "30400_3.svg?Expires=1638237600&Signature=RQrXLWwtI0tOnbo0tkam"
                                    "KBU9OpZRMVoHQFA3UdwE6rBwIQq~8el4oFUc6hUOTEg6JSK~E9U0FWJ8r-RBB"
                                    "59Bh-bHZwPkC7sDeD7bH17hd~B01mCtp2DSPvsLQgRi8lMfnDuWtfamuaFJ5Y"
                                    "GRHVxO~Ad2zG~my1yy1EV4dRDKm80yXg7xufH7ahTzjNiR0RZTEBafsS3IX65"
                                    "nWM78X96lA-aOJFXdpx4srR7CXdFyIMqroY5SMlKvaQBe-tpb2gjqklNOTkF3"
                                    "-MoV7C2xGrkcUrMU-1s89bIeNCPjqzEcpb7e4LWOc5j7ZIg8NggFI3CFkXpf~"
                                    "uykQ25xRFyjWfc2sg__&Key-Pair-Id=cloudfront-access-key-id"
                                ),
                            },
                        },
                        "video": str(video.id),
                    },
                ],
                "live_state": None,
                "live_info": {},
                "live_type": None,
                "xmpp": None,
            },
        )

        # Try getting another video
        other_video = factories.VideoFactory()
        response = self.client.get(
            f"/api/videos/{other_video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    @override_settings(
        CLOUDFRONT_SIGNED_URLS_ACTIVE=True,
        CLOUDFRONT_ACCESS_KEY_ID="cloudfront-access-key-id",
    )
    def test_api_video_read_detail_token_student_user_nested_shared_live_media_urls_signed(
        self,
    ):
        """
        A student reading video details with nested shared live media and cloudfront signed
        urls activated should not have the urls.media available
        """
        resolutions = [144, 240, 480, 720, 1080]
        video = factories.VideoFactory(
            id="d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb",
            uploaded_on=datetime(2018, 8, 8, tzinfo=pytz.utc),
            upload_state="ready",
            resolutions=resolutions,
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
        )
        shared_live_media = factories.SharedLiveMediaFactory(
            id="7d9a2087-79be-4731-bcda-f59c7b8b9699",
            extension="pdf",
            show_download=False,
            title="python expressions",
            upload_state=READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=pytz.utc),
            nb_pages=3,
            video=video,
        )
        shared_live_media_2 = factories.SharedLiveMediaFactory(
            nb_pages=None,
            upload_state=PENDING,
            video=video,
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["permissions"] = {"can_update": False}

        # fix the time so that the url signature is deterministic and can be checked
        now = datetime(2021, 11, 30, tzinfo=pytz.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "builtins.open", new_callable=mock.mock_open, read_data=RSA_KEY_MOCK
        ):
            response = self.client.get(
                f"/api/videos/{video.id}/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        thumbnails_template = (
            "https://abc.cloudfront.net/{!s}/thumbnails/1533686400_{!s}.0000000.jpg"
        )
        thumbnails_dict = {
            # pylint: disable=consider-using-f-string
            str(resolution): thumbnails_template.format(video.pk, resolution)
            for resolution in resolutions
        }

        self.assertEqual(
            content,
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "description": video.description,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": "1533686400",
                "is_public": False,
                "is_ready_to_show": True,
                "is_scheduled": False,
                "show_download": True,
                "starting_at": None,
                "upload_state": "ready",
                "thumbnail": None,
                "timed_text_tracks": [],
                "urls": {
                    "mp4": {
                        "144": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/mp4/"
                            "1533686400_144.mp4?response-content-disposition=attachment%3B"
                            "+filename%3Dfoo-bar_1533686400.mp4&Expires=1638237600&Signature=Hn-h"
                            "chOvM-DOA2ThXN2CXlG1lJioPxC8tz2RbMuN9hthqYDsGVKlEvVz9gpa1PDz26Cnxaai"
                            "b-lHXuEDtypQEGypA5E~58iAhCGC-CY8T6W3mRSD2oODAnPCcuaBIpihoXNK81DDGBST"
                            "rXvscORFP87xZRix4C7tRGESSQwuFzi~HERnkcT6cufWL8ydMrv0OsKvSBt79co6XF2c"
                            "409A~9TfVEuXT6DY5UCwLUtscGoDTH5dRSRd~XRW7nS2K1KigA-C8zkiiimh2TwBqE2m"
                            "URR-rOc~e4Kb16IuzRRpnZf0eqrnKHWpG0BGWFEEJzbyD8BwkaaA18Kmr53IWyjTlw__"
                            "&Key-Pair-Id=cloudfront-access-key-id"
                        ),
                        "240": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/mp4/"
                            "1533686400_240.mp4?response-content-disposition=attachment%3B"
                            "+filename%3Dfoo-bar_1533686400.mp4&Expires=1638237600&Signature=KNxe"
                            "uY~6OlOUYpAhSJ5mPqf8hxI6rmnvT34A8B6hROoPTsQZJcKH2b~1hDVmNwX5DOw6TQpm"
                            "9dAufzyWiQZBZcfLcafOWufmzS36RYlZi8-uzq74Nxl1HkeSCrOphLgwNg7CvN89318S"
                            "eeayFeCgfIm3zneUKIaZyX2wEl~WUJCtKRvx3Phnsheu-5qcasN-q7WnCPNm7wWTGaVT"
                            "N624EUNp-8MkmeaSczZLEemXrRWVI7Ekl60SNEMl94fZncouow3nKHp8afy37qdU3jnP"
                            "CuxtDdyVksGsbDPIMUKCoig22YwJko2yaB~~n~QF~Xq5iBtAr~HX1vtxOqT4d9Mv~g__"
                            "&Key-Pair-Id=cloudfront-access-key-id"
                        ),
                        "480": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/mp4/"
                            "1533686400_480.mp4?response-content-disposition=attachment%3B"
                            "+filename%3Dfoo-bar_1533686400.mp4&Expires=1638237600&Signature=HiV0"
                            "2qb-cWi6dQPBruMm8RThvB8yX~rfY5HV4cIznZsitm1gCW5eEREGICOx3PM3zmZ2aLGL"
                            "GKBwlDKbXl3ehVRFXkFKU1-p4PBOkbY9YquPwv1syBLvVlDeNzQyqZZzmt1j4xQGtONv"
                            "oyUqGrRrMkaFa5YPnaOSPYZDLf2SJIQ8OkQr-OEQk6UQVQO7~mMyknG0iTZdQT5HTRus"
                            "qmw5xFTZitoS6RzTS4G2SR~uKoaxV3ZtZznAHcDBb7tbAvHN6ckSNSs7~9i2e~AJblXt"
                            "dsX9O3quO9-IPpQsMpihNASp43M8n-7wa1Uln2dY4jDi~JrYBE6jWG1QkjIBFQkcJg__"
                            "&Key-Pair-Id=cloudfront-access-key-id"
                        ),
                        "720": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/mp4/"
                            "1533686400_720.mp4?response-content-disposition=attachment%3B"
                            "+filename%3Dfoo-bar_1533686400.mp4&Expires=1638237600&Signature=TKVO"
                            "yKTl2gS8m2gx7lDdjKslJK7R9IJ0Sal3HpoTHcY6LsRDsEpPqAJsUpoR3m1VLfXSoFPC"
                            "kQdyFPACwocSceMCDMlEylOZetP102D6SiTFT4OP7Al9MwRtPTVKlh-PDrZ-oQfnBQzX"
                            "JkwQgK~sqIW87QMT4l36homlwkvQWt3oXa4QoxpE58lgY1GkaHrUcVbwEDojE3qF8X9a"
                            "4ENuPifUYZttKyBNaeVrnRYcd2E4yQXXzpDpeU360ykFHvZDqRCZvu~U~pgboO8aRbY6"
                            "4lhdevLVdwgH3ESrOoD6MITKm7jbRwcy85gcU5IpOW~9Wc9Vd3nVvKzdWgnWWr7h~w__"
                            "&Key-Pair-Id=cloudfront-access-key-id"
                        ),
                        "1080": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/mp4/"
                            "1533686400_1080.mp4?response-content-disposition=attachment%3B"
                            "+filename%3Dfoo-bar_1533686400.mp4&Expires=1638237600&Signature=HBHL"
                            "NrEL8xHY~N0kxqdrDtwHLtNq6jsuKMFjU4ro9tyVSUGPlU960c8V23ZMi5KDM1UTvMwF"
                            "p2TY3ZSOefHaNJvHlwCGpfbscg5mcR5RQBTHvUpFTg2XtvvonzblqcWs6UEY7kSr-wAF"
                            "9Kviq94x0EeUj43PH7CAJN6q6nXG32fNi1zwyvsXEYCZT6gXyFF6rY9wK1zsE0zgqaR8"
                            "NLK6dULsuDOg~t2KY33njW51zfQgwH1nW6f9BJwYxyQAAt4UyXUifjOb4ZYEQoEJrSTb"
                            "8PzvtWsqyTdnOwM8juPknv3Yao8QoVyaE0K84I2BhOE4imVH5T0KskykkoZUHvNGkg__"
                            "&Key-Pair-Id=cloudfront-access-key-id"
                        ),
                    },
                    "thumbnails": thumbnails_dict,
                    "manifests": {
                        "hls": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                            "cmaf/1533686400.m3u8"
                        ),
                    },
                    "previews": (
                        "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                        "previews/1533686400_100.jpg"
                    ),
                },
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "shared_live_medias": [
                    {
                        "id": str(shared_live_media_2.id),
                        "active_stamp": None,
                        "filename": None,
                        "is_ready_to_show": False,
                        "nb_pages": None,
                        "show_download": True,
                        "title": None,
                        "upload_state": "pending",
                        "urls": None,
                        "video": str(video.id),
                    },
                    {
                        "id": str(shared_live_media.id),
                        "active_stamp": "1638230400",
                        "filename": "python-expressions.pdf",
                        "is_ready_to_show": True,
                        "nb_pages": 3,
                        "show_download": False,
                        "title": "python expressions",
                        "upload_state": "ready",
                        "urls": {
                            "pages": {
                                "1": (
                                    "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                                    "fb/sharedlivemedia/7d9a2087-79be-4731-bcda-f59c7b8b9699/16382"
                                    "30400_1.svg?Expires=1638237600&Signature=Dw~pu14UQfhsaqoQL2F3"
                                    "3K6lQRcoI4KYuK~uq9CLjDnCawZKJ8pqv3OKY~O5q~GpUfDfmVH86zXmh1AUI"
                                    "yR9Yme0GUQNviyo2JPXsXlc6aTGYhPEjNaxuM7WWb1dmjFA3p-twKhPEZBGwi"
                                    "LCCVIgydhevFI9MQUOlSu4CdAtceaNcrnlH9Zajpq-U1Hxr7POjAXgXwEZHaz"
                                    "GIw9aQho6WfpqStoS-6BaWUXF3cbtqZjBYKs~zE8kW3W2Z8vUu0PqHa4D72MF"
                                    "7335kH0epyWzpWNdpTNlzDu~LAM-Hn9PZAe-Z5Hp-uG3Envf0bbM8VpCCA1GQ"
                                    "MbaLAb1RU7IfHM7Mg__&Key-Pair-Id=cloudfront-access-key-id"
                                ),
                                "2": (
                                    "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                                    "fb/sharedlivemedia/7d9a2087-79be-4731-bcda-f59c7b8b9699/16382"
                                    "30400_2.svg?Expires=1638237600&Signature=JRTM0xNx-LKy~xsLtE6t"
                                    "cHhVrH4ZTCDcqjCHoXrscUwstr8mQLmUQBtG3GMc5bQnkGWDfBEvM~LK8j-z1"
                                    "i1lPJKrzilLs8wxJMzQS36M6PUrJd5enPnZjO-sNUyGXxEK89kmZWJH-X6oTN"
                                    "6PPKCPEREqPVACFuYcB9JQvMdbxViJWxAKUdIWcYqntBvMKdWiweBVftVTFiV"
                                    "QDIIUjFFg3rLr2gzBXI~DSLcLGkorAwvC2PVdpKAvpinVmktkYlS-ijZXEsvu"
                                    "qgm1-8xw4CQF1BgVc3JWgAoSiNgUfjoQSDnrYfZEf4EGGr-USv82qgO89Fu2B"
                                    "qlt1d3El7PIpE0xQg__&Key-Pair-Id=cloudfront-access-key-id"
                                ),
                                "3": (
                                    "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                                    "fb/sharedlivemedia/7d9a2087-79be-4731-bcda-f59c7b8b9699/16382"
                                    "30400_3.svg?Expires=1638237600&Signature=O0vBJo~JoANdViQISaf9"
                                    "y35U8RE61JXr7LMcDAxZA~5HBwc31-Z7eHXvOP920jKXPJX5PBRmDjcsHC3fp"
                                    "CzHJoHAU9vIn3L62ZxctqXv-~R-5BBjU~yCMhxXxoCK97BbuLagqaH8aqH7ul"
                                    "jLalCsTmcw3PTnNdkmbd6vqpxDR5Wk~KD5qYgKd961xlBPRPY8JdEozKlMU5p"
                                    "MNVC0Rf1F7SPmv5Np-qxLApRwKr~K-faIcvEZpVTUdQ95nvf7JGEjxSimC2-7"
                                    "FMljDvDdppLdDmJSxqXuriSsax98L6eEaXnPHyynHFeULk5~z2S0HbS0BTJO2"
                                    "7yKKBk~gIWHijnijA__&Key-Pair-Id=cloudfront-access-key-id"
                                ),
                            },
                        },
                        "video": str(video.id),
                    },
                ],
                "live_state": None,
                "live_info": {},
                "live_type": None,
                "xmpp": None,
            },
        )

        # Try getting another video
        other_video = factories.VideoFactory()
        response = self.client.get(
            f"/api/videos/{other_video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_video_read_detail_as_instructor_in_read_only(self):
        """An instructor with read_only can read the video."""
        video = factories.VideoFactory(upload_state="ready")

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": False}

        # Get the video linked to the JWT token
        response = self.client.get(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

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
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('"urls":null', response.content.decode("utf-8"))
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "description": video.description,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": None,
                "is_public": False,
                "is_ready_to_show": False,
                "is_scheduled": False,
                "show_download": True,
                "starting_at": None,
                "upload_state": "pending",
                "timed_text_tracks": [],
                "thumbnail": None,
                "urls": None,
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "shared_live_medias": [],
                "live_state": None,
                "live_info": {},
                "live_type": None,
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
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('"urls":null', response.content.decode("utf-8"))
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "description": video.description,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": None,
                "is_public": False,
                "is_ready_to_show": False,
                "is_scheduled": False,
                "show_download": True,
                "starting_at": None,
                "upload_state": state,
                "timed_text_tracks": [],
                "thumbnail": None,
                "urls": None,
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "shared_live_medias": [],
                "live_state": None,
                "live_info": {},
                "live_type": None,
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
                f"/api/videos/{video.id}/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
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
            response = self.client.get(f"/api/videos/{video.id}/")
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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

        response = self.client.get(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": None,
                "description": video.description,
                "has_transcript": False,
                "id": str(video.id),
                "is_public": False,
                "is_ready_to_show": False,
                "is_scheduled": False,
                "live_info": {},
                "live_state": None,
                "live_type": None,
                "playlist": {
                    "id": str(video.playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "shared_live_medias": [],
                "should_use_subtitle_as_transcript": False,
                "show_download": True,
                "starting_at": None,
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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

        response = self.client.get(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": None,
                "description": video.description,
                "has_transcript": False,
                "id": str(video.id),
                "is_public": False,
                "is_ready_to_show": False,
                "is_scheduled": False,
                "live_info": {},
                "live_state": None,
                "live_type": None,
                "playlist": {
                    "id": str(video.playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "shared_live_medias": [],
                "should_use_subtitle_as_transcript": False,
                "show_download": True,
                "starting_at": None,
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
            "/api/videos/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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
                        "active_shared_live_media": None,
                        "active_shared_live_media_page": None,
                        "active_stamp": None,
                        "description": video.description,
                        "has_transcript": False,
                        "id": str(video.id),
                        "is_public": False,
                        "is_ready_to_show": False,
                        "is_scheduled": False,
                        "live_info": {},
                        "live_state": None,
                        "live_type": None,
                        "playlist": {
                            "id": str(organization_playlist_1.id),
                            "lti_id": organization_playlist_1.lti_id,
                            "title": organization_playlist_1.title,
                        },
                        "shared_live_medias": [],
                        "should_use_subtitle_as_transcript": False,
                        "show_download": True,
                        "starting_at": None,
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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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
                        "active_shared_live_media": None,
                        "active_shared_live_media_page": None,
                        "active_stamp": None,
                        "description": video_1.description,
                        "has_transcript": False,
                        "id": str(video_1.id),
                        "is_public": False,
                        "is_ready_to_show": False,
                        "is_scheduled": False,
                        "live_info": {},
                        "live_state": None,
                        "live_type": None,
                        "playlist": {
                            "id": str(organization_1_playlist_1.id),
                            "lti_id": organization_1_playlist_1.lti_id,
                            "title": organization_1_playlist_1.title,
                        },
                        "shared_live_medias": [],
                        "should_use_subtitle_as_transcript": False,
                        "show_download": True,
                        "starting_at": None,
                        "thumbnail": None,
                        "timed_text_tracks": [],
                        "title": video_1.title,
                        "upload_state": "pending",
                        "urls": None,
                        "xmpp": None,
                    },
                    {
                        "active_shared_live_media": None,
                        "active_shared_live_media_page": None,
                        "active_stamp": None,
                        "description": video_2.description,
                        "has_transcript": False,
                        "id": str(video_2.id),
                        "is_public": False,
                        "is_ready_to_show": False,
                        "is_scheduled": False,
                        "live_info": {},
                        "live_state": None,
                        "live_type": None,
                        "playlist": {
                            "id": str(organization_1_playlist_2.id),
                            "lti_id": organization_1_playlist_2.lti_id,
                            "title": organization_1_playlist_2.title,
                        },
                        "shared_live_medias": [],
                        "should_use_subtitle_as_transcript": False,
                        "show_download": True,
                        "starting_at": None,
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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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
                        "active_shared_live_media": None,
                        "active_shared_live_media_page": None,
                        "active_stamp": None,
                        "description": video.description,
                        "has_transcript": False,
                        "id": str(video.id),
                        "is_public": False,
                        "is_ready_to_show": False,
                        "is_scheduled": False,
                        "live_info": {},
                        "live_state": None,
                        "live_type": None,
                        "playlist": {
                            "id": str(first_playlist.id),
                            "lti_id": first_playlist.lti_id,
                            "title": first_playlist.title,
                        },
                        "shared_live_medias": [],
                        "should_use_subtitle_as_transcript": False,
                        "show_download": True,
                        "starting_at": None,
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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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
                        "active_shared_live_media": None,
                        "active_shared_live_media_page": None,
                        "active_stamp": None,
                        "description": video.description,
                        "has_transcript": False,
                        "id": str(video.id),
                        "is_public": False,
                        "is_ready_to_show": False,
                        "is_scheduled": False,
                        "live_info": {},
                        "live_state": None,
                        "live_type": None,
                        "playlist": {
                            "id": str(first_playlist.id),
                            "lti_id": first_playlist.lti_id,
                            "title": first_playlist.title,
                        },
                        "shared_live_medias": [],
                        "should_use_subtitle_as_transcript": False,
                        "show_download": True,
                        "starting_at": None,
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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }
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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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
                        "active_shared_live_media": None,
                        "active_shared_live_media_page": None,
                        "active_stamp": None,
                        "description": video.description,
                        "has_transcript": False,
                        "id": str(video.id),
                        "is_public": False,
                        "is_ready_to_show": False,
                        "is_scheduled": False,
                        "live_info": {},
                        "live_state": None,
                        "live_type": None,
                        "playlist": {
                            "id": str(first_playlist.id),
                            "lti_id": first_playlist.lti_id,
                            "title": first_playlist.title,
                        },
                        "shared_live_medias": [],
                        "should_use_subtitle_as_transcript": False,
                        "show_download": True,
                        "starting_at": None,
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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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
                        "active_shared_live_media": None,
                        "active_shared_live_media_page": None,
                        "active_stamp": None,
                        "description": video_1.description,
                        "has_transcript": False,
                        "id": str(video_1.id),
                        "is_public": False,
                        "is_ready_to_show": False,
                        "is_scheduled": False,
                        "live_info": {},
                        "live_state": None,
                        "live_type": None,
                        "playlist": {
                            "id": str(playlist_1.id),
                            "lti_id": playlist_1.lti_id,
                            "title": playlist_1.title,
                        },
                        "shared_live_medias": [],
                        "should_use_subtitle_as_transcript": False,
                        "show_download": True,
                        "starting_at": None,
                        "thumbnail": None,
                        "timed_text_tracks": [],
                        "title": video_1.title,
                        "upload_state": "pending",
                        "urls": None,
                        "xmpp": None,
                    },
                    {
                        "active_shared_live_media": None,
                        "active_shared_live_media_page": None,
                        "active_stamp": None,
                        "description": video_2.description,
                        "has_transcript": False,
                        "id": str(video_2.id),
                        "is_public": False,
                        "is_ready_to_show": False,
                        "is_scheduled": False,
                        "live_info": {},
                        "live_state": None,
                        "live_type": None,
                        "playlist": {
                            "id": str(playlist_2.id),
                            "lti_id": playlist_2.lti_id,
                            "title": playlist_2.title,
                        },
                        "shared_live_medias": [],
                        "should_use_subtitle_as_transcript": False,
                        "show_download": True,
                        "starting_at": None,
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
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
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
            "/api/videos/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 401)
        self.assertFalse(models.Video.objects.exists())

    def test_api_video_create_student(self):
        """Student users should not be able to create videos."""
        video = factories.VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["permissions"] = {"can_update": False}
        response = self.client.post(
            "/api/videos/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.Video.objects.count(), 1)

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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": None,
                "description": "",
                "has_transcript": False,
                "id": str(models.Video.objects.get().id),
                "is_public": False,
                "is_ready_to_show": False,
                "is_scheduled": False,
                "live_info": {},
                "live_state": None,
                "live_type": None,
                "playlist": {
                    "id": str(playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "shared_live_medias": [],
                "should_use_subtitle_as_transcript": False,
                "show_download": True,
                "starting_at": None,
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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }
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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": None,
                "description": "",
                "has_transcript": False,
                "id": str(models.Video.objects.get().id),
                "is_public": False,
                "is_ready_to_show": False,
                "is_scheduled": False,
                "live_info": {},
                "live_state": None,
                "live_type": None,
                "playlist": {
                    "id": str(playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "shared_live_medias": [],
                "should_use_subtitle_as_transcript": False,
                "show_download": True,
                "starting_at": None,
                "thumbnail": None,
                "timed_text_tracks": [],
                "title": "Some video",
                "upload_state": "pending",
                "urls": None,
                "xmpp": None,
            },
        )

    def test_api_video_create_with_scheduled_date_gets_ignored(self):
        """
        Create video with right access.

        Try to init field starting_at and property is_scheduled on creation. Data are ignored.
        """
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

        self.assertEqual(models.Video.objects.count(), 0)
        # try to set starting_at and is_scheduled
        response = self.client.post(
            "/api/videos/",
            {
                "lti_id": "video_one",
                "playlist": str(playlist.id),
                "title": "Some title",
                "starting_at": timezone.now() + timedelta(days=100),
                "is_scheduled": True,
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(models.Video.objects.count(), 1)
        self.assertEqual(response.status_code, 201)

        # starting_at is None by default, is_scheduled is False
        self.assertEqual(
            response.json(),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": None,
                "description": "",
                "has_transcript": False,
                "id": str(models.Video.objects.get().id),
                "is_public": False,
                "is_ready_to_show": False,
                "is_scheduled": False,
                "live_info": {},
                "live_state": None,
                "live_type": None,
                "playlist": {
                    "id": str(playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "shared_live_medias": [],
                "should_use_subtitle_as_transcript": False,
                "show_download": True,
                "starting_at": None,
                "thumbnail": None,
                "timed_text_tracks": [],
                "title": "Some title",
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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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
            f"/api/videos/{video.id}/",
            data,
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)
        video.refresh_from_db()
        self.assertEqual(video.title, "my title")

    def test_api_video_update_detail_student(self):
        """Student users should not be allowed to update a video through the API."""
        video = factories.VideoFactory(title="my title")
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]

        data = {"title": "my new title"}
        response = self.client.put(
            f"/api/videos/{video.id}/",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )
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
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.title, "my new title")

    def test_api_video_update_detail_token_scheduled_date_future(self):
        """
        Update video with scheduled date.

        Users should be able to update the starting_date of their video through the API
        as long as starting_date is in the future.
        """
        video = factories.VideoFactory(
            title="my title",
            live_state=IDLE,
            live_type=JITSI,
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        # set microseconds to 0 to compare date surely as serializer truncate them
        starting_at = (timezone.now() + timedelta(hours=1)).replace(microsecond=0)
        data = {
            "title": "title required",
            "starting_at": starting_at,
        }
        response = self.client.put(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.starting_at, starting_at)
        self.assertTrue(video.is_scheduled)

    def test_api_video_update_detail_token_scheduled_date_past(self):
        """
        Try to schedule a video with a date in the past.

        Users can't update the starting_date of their video through the API if starting_date
        is in the past.
        """
        init_starting_at = timezone.now() + timedelta(hours=1)
        video = factories.VideoFactory(
            live_state=IDLE,
            live_type=JITSI,
            starting_at=init_starting_at,
            title="my title",
        )
        self.assertTrue(video.is_scheduled)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        # try to set a date in the past
        # set microseconds to 0 to compare date surely as serializer truncate them
        starting_at = (timezone.now() - timedelta(days=10)).replace(microsecond=0)
        data = {"title": "title required", "starting_at": starting_at}
        response = self.client.put(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        # data didn't change and an error is thrown
        self.assertEqual(
            json.loads(response.content),
            {
                "starting_at": [
                    f"{starting_at} is not a valid date, date should be planned after!"
                ]
            },
        )
        video.refresh_from_db()
        self.assertEqual(video.starting_at, init_starting_at)
        self.assertTrue(video.is_scheduled)

    def test_api_video_update_detail_token_scheduled_date_to_none(self):
        """
        Update starting_at to None.

        Users can update the starting_date of their video through the API to None to cancel the
        scheduled mode.
        """
        starting_at = timezone.now() + timedelta(minutes=10)
        video = factories.VideoFactory(
            live_state=IDLE, live_type=JITSI, starting_at=starting_at, title="my title"
        )
        self.assertTrue(video.is_scheduled)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        data = {"title": "title required", "starting_at": None}
        response = self.client.put(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.starting_at, None)
        self.assertFalse(video.is_scheduled)

    def test_api_video_update_detail_token_scheduled_with_previous_starting_at_already_past(
        self,
    ):
        """starting_at is in the past, it can't be updated anymore."""
        intial_starting_at = timezone.now() + timedelta(days=10)
        video = factories.VideoFactory(
            live_state=IDLE, live_type=RAW, starting_at=intial_starting_at
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        # now is set to after initial starting_at
        now = intial_starting_at + timedelta(days=10)
        with mock.patch.object(timezone, "now", return_value=now):
            # even if we try to update the starting_at in the future date, as previous one is past
            # it can't get updated.
            new_starting_at = now + timedelta(days=10)
            response = self.client.put(
                f"/api/videos/{video.id}/",
                {"starting_at": new_starting_at, "title": "Required title"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )
            content = json.loads(response.content)
            self.assertEqual(
                content,
                {
                    "starting_at": [
                        (
                            f"Field starting_at {intial_starting_at} "
                            "is already past and can't be updated!"
                        )
                    ]
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_api_video_update_detail_token_user_description(self):
        """Token users should be able to update the description of their video through the API."""
        video = factories.VideoFactory(description="my description")
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        response = self.client.get(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        data["description"] = "my new description"
        response = self.client.put(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
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
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        self.assertIsNone(data["active_stamp"])
        data["active_stamp"] = "1533686400"

        response = self.client.put(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
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
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        self.assertEqual(data["upload_state"], "pending")
        data["upload_state"] = "ready"

        response = self.client.put(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
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
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_video_patch_video_anonymous(self):
        """Anonymous users should not be allowed to patch a video through the API."""
        video = factories.VideoFactory(title="my title")
        data = {"title": "my new title"}
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            data,
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)
        video.refresh_from_db()
        self.assertEqual(video.title, "my title")

    def test_api_video_patch_video_student(self):
        """Student users should not be allowed to patch a video through the API."""
        video = factories.VideoFactory(title="my title")
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]

        data = {"title": "my new title"}
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )
        video.refresh_from_db()
        self.assertEqual(video.title, "my title")

    def test_api_video_instructor_patch_video_in_read_only(self):
        """An instructor with read_only set to true should not be able to patch the video."""
        video = factories.VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": False}

        data = {"upload_state": "ready"}

        response = self.client.patch(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
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
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
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
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        data["id"] = "my new id"

        response = self.client.put(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
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
            f"/api/videos/{video_update.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
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
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.description, "my new description")

    def test_api_video_patch_detail_token_user_is_public(self):
        """Instructors and administrators should be able to
        patch the public flag of their video through the API."""
        video = factories.VideoFactory(is_public=False)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        data = {"is_public": True}
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertTrue(video.is_public)

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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

        response = self.client.patch(
            f"/api/videos/{video.id}/",
            {"title": "updated title"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        video.refresh_from_db()
        self.assertEqual(video.title, "existing title")

    def test_api_video_patch_by_instructor_scheduling_date_future(self):
        """
        Updating starting_at with date in the future.

        Instructors and administrators with a token should be able to patch fields
        starting_at on their video through the API as long as date is in the future.
        """
        video = factories.VideoFactory(
            live_state=IDLE, live_type=JITSI, starting_at=None
        )

        # starting_at is None there is no event scheduled
        self.assertFalse(video.is_scheduled)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        # starting_at gets updated to a date in the future
        # set microseconds to 0 to compare date surely as serializer truncate them
        starting_at = (timezone.now() + timedelta(hours=1)).replace(microsecond=0)
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            {"starting_at": starting_at, "is_scheduled": False},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        # video is now a scheduled one
        self.assertTrue(video.is_scheduled)
        self.assertEqual(video.live_state, IDLE)
        self.assertEqual(video.starting_at, starting_at)

        # we now try to set starting_at to a date in the past and it musn't be allowed
        past_starting_at = (timezone.now() - timedelta(hours=1)).replace(microsecond=0)
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            {"starting_at": past_starting_at},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        content = json.loads(response.content)
        # data didn't change and an error is thrown
        self.assertEqual(
            content,
            {
                "starting_at": [
                    f"{past_starting_at} is not a valid date, date should be planned after!"
                ]
            },
        )
        video.refresh_from_db()
        self.assertEqual(video.starting_at, starting_at)
        self.assertTrue(video.is_scheduled)

        # we now set the date to null to cancel the event
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            {"starting_at": None},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        # request got approved
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()

        # video is not a scheduled one anymore
        self.assertFalse(video.is_scheduled)
        self.assertEqual(video.starting_at, None)

    def test_api_patch_video_with_previous_starting_at_already_past(self):
        """Date is already set in video and is in the past, it can't be updated anymore."""
        intial_starting_at = timezone.now() + timedelta(days=10)
        video = factories.VideoFactory(
            live_state=IDLE, live_type=RAW, starting_at=intial_starting_at
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        # now is set after video.starting_at
        now = intial_starting_at + timedelta(days=10)
        with mock.patch.object(timezone, "now", return_value=now):
            # even if we try to update the starting_at in the future date, as previous one is past
            # it can't get updated.
            new_starting_at = now + timedelta(days=100)
            response = self.client.patch(
                f"/api/videos/{video.id}/",
                {"starting_at": new_starting_at, "title": "Required title"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )
            content = json.loads(response.content)
            self.assertEqual(
                content,
                {
                    "starting_at": [
                        (
                            f"Field starting_at {intial_starting_at} "
                            "is already past and can't be updated!"
                        )
                    ]
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_api_patch_video_with_live_state_set(self):
        """Check we can't update starting_date if live_state is not IDLE."""
        for live_choice in LIVE_CHOICES:
            if live_choice[0] != IDLE:
                video = factories.VideoFactory(
                    live_state=live_choice[0],
                    live_type=RAW,
                )
                self.assertFalse(video.is_scheduled)

                jwt_token = AccessToken()
                jwt_token.payload["resource_id"] = str(video.id)
                jwt_token.payload["roles"] = [
                    random.choice(["instructor", "administrator"])
                ]
                jwt_token.payload["permissions"] = {"can_update": True}

                starting_at = timezone.now() + timedelta(days=10)
                response = self.client.patch(
                    f"/api/videos/{video.id}/",
                    {"starting_at": starting_at, "title": "Required title"},
                    HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                    content_type="application/json",
                )

                content = json.loads(response.content)
                self.assertEqual(
                    content,
                    {
                        "starting_at": (
                            [
                                (
                                    "Field starting_at can't be changed, video live is not "
                                    "in default mode."
                                )
                            ]
                        )
                    },
                )
                self.assertEqual(response.status_code, 400)

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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

        response = self.client.put(
            f"/api/videos/{video.id}/",
            json.dumps({"title": "updated title"}),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.title, "updated title")

    def test_api_update_video_with_live_state_set(self):
        """Check we can't update starting_date if live_state is not IDLE."""
        for live_choice in LIVE_CHOICES:
            if live_choice[0] != IDLE:
                video = factories.VideoFactory(
                    live_state=live_choice[0],
                    live_type=RAW,
                )
                self.assertFalse(video.is_scheduled)

                jwt_token = AccessToken()
                jwt_token.payload["resource_id"] = str(video.id)
                jwt_token.payload["roles"] = [
                    random.choice(["instructor", "administrator"])
                ]
                jwt_token.payload["permissions"] = {"can_update": True}
                starting_at = timezone.now() + timedelta(hours=1)
                response = self.client.put(
                    f"/api/videos/{video.id}/",
                    {"starting_at": starting_at, "title": "Required title"},
                    HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                    content_type="application/json",
                )

                content = json.loads(response.content)
                self.assertEqual(
                    content,
                    {
                        "starting_at": (
                            [
                                (
                                    "Field starting_at can't be changed, video live is not "
                                    "in default mode."
                                )
                            ]
                        )
                    },
                )
                self.assertEqual(response.status_code, 400)

    def test_api_update_video_with_starting_at_past(self):
        """Check we can update video if starting_at is past"""
        starting_at = (timezone.now() + timedelta(seconds=10)).replace(microsecond=0)
        # first create a scheduled video
        video = factories.VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=starting_at,
        )
        # Video is scheduled
        self.assertTrue(video.starting_at > timezone.now())
        self.assertTrue(video.is_scheduled)
        self.assertEqual(video.live_state, IDLE)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        # Mock now to the future to check video gets set to not scheduled
        future = timezone.now() + timedelta(hours=1)
        with mock.patch.object(timezone, "now", return_value=future):
            self.assertFalse(video.is_scheduled)
            # starting_at is over, we still want to update the video
            response = self.client.put(
                f"/api/videos/{video.id}/",
                {
                    "description": "updated description",
                    "title": "updated title",
                    "starting_at": starting_at,
                },
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )
            self.assertEqual(response.status_code, 200)
            video.refresh_from_db()
            self.assertEqual(video.title, "updated title")
            self.assertEqual(video.description, "updated description")

    def test_api_video_delete_detail_anonymous(self):
        """Anonymous users should not be allowed to delete a video."""
        video = factories.VideoFactory()
        response = self.client.delete(f"/api/videos/{video.id}/")
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
                f"/api/videos/{video.id}/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            self.assertEqual(response.status_code, 403)
            self.assertTrue(models.Video.objects.filter(id=video.id).exists())

    def test_api_video_delete_detail_student(self):
        """Student users should not be able to delete a video."""
        video = factories.VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]

        response = self.client.delete(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_video_delete_detail_staff_or_user(self):
        """Users authenticated via a session should not be able to delete a video."""
        video = factories.VideoFactory()
        for user in [factories.UserFactory(), factories.UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")

            response = self.client.delete(f"/api/videos/{video.id}/")

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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
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
            "/api/videos/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
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

        response = self.client.post(f"/api/videos/{video.id}/initiate-upload/")

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
            f"/api/videos/{video.id}/initiate-upload/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
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
                f"/api/videos/{video.id}/initiate-upload/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
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
            f"/api/videos/{other_video.id}/initiate-upload/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
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

            response = self.client.post(f"/api/videos/{video.id}/initiate-upload/")
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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

        # Get the upload policy for this video
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=pytz.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-upload/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

        # Get the upload policy for this video
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=pytz.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-upload/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

        # Get the upload policy for this video
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=pytz.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-upload/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
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
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }
        # Get the upload policy for this video
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=pytz.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-upload/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
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

        response = self.client.post(f"/api/videos/{video.id}/initiate-live/")

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
            f"/api/videos/{video.id}/initiate-live/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_video_student_initiate_live(self):
        """A student should not be able to initiate a live."""
        video = factories.VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]

        response = self.client.post(
            f"/api/videos/{video.id}/initiate-live/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
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

            response = self.client.post(f"/api/videos/{video.id}/initiate-live/")
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

        response = self.client.post(
            f"/api/videos/{video.id}/initiate-live/",
            {"type": "raw"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "description": video.description,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": None,
                "is_public": False,
                "is_ready_to_show": True,
                "is_scheduled": False,
                "show_download": True,
                "starting_at": None,
                "upload_state": "pending",
                "thumbnail": None,
                "timed_text_tracks": [],
                "urls": None,
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "shared_live_medias": [],
                "live_state": "idle",
                "live_info": {},
                "xmpp": None,
                "live_type": "raw",
            },
        )

    def test_api_video_instructor_initiate_jitsi_live(self):
        """An instructor should be able to initiate a jitsi live."""
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        response = self.client.post(
            f"/api/videos/{video.id}/initiate-live/",
            {"type": "jitsi"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "description": video.description,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": None,
                "is_public": False,
                "is_ready_to_show": True,
                "is_scheduled": False,
                "show_download": True,
                "starting_at": None,
                "upload_state": "pending",
                "thumbnail": None,
                "timed_text_tracks": [],
                "urls": None,
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "shared_live_medias": [],
                "live_state": "idle",
                "live_info": {
                    "jitsi": {
                        "config_overwrite": {},
                        "domain": "meet.jit.si",
                        "external_api_url": "https://meet.jit.si/external_api.js",
                        "interface_config_overwrite": {},
                    }
                },
                "live_type": JITSI,
                "xmpp": None,
            },
        )

    @override_settings(LIVE_CHAT_ENABLED=True)
    @override_settings(XMPP_BOSH_URL="https://xmpp-server.com/http-bind")
    @override_settings(XMPP_CONFERENCE_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_JWT_SHARED_SECRET="xmpp_shared_secret")
    def test_api_instructor_start_non_created_live(self):
        """AWS stack and chat room should be created if not existing yet."""
        video = factories.VideoFactory(
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            upload_state=PENDING,
            live_state=IDLE,
            live_type=JITSI,
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        jwt_token.payload["user"] = {"id": "56255f3807599c377bf0e5bf072359fd"}

        # start a live video,
        with mock.patch.object(api.video, "start_live_channel"), mock.patch.object(
            api.video, "create_live_stream"
        ) as mock_create_live_stream, mock.patch.object(
            api.video, "wait_medialive_channel_is_created"
        ) as mock_wait_medialive_channel_is_created, mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode, mock.patch.object(
            api.video, "create_room"
        ) as mock_create_room:
            mock_jwt_encode.return_value = "xmpp_jwt"
            mock_create_live_stream.return_value = {
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
            }
            response = self.client.post(
                f"/api/videos/{video.id}/start-live/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            mock_create_room.assert_called_with(video.id)
            mock_wait_medialive_channel_is_created.assert_called_with(
                "medialive_channel_1"
            )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "description": video.description,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": None,
                "is_public": False,
                "is_ready_to_show": True,
                "is_scheduled": False,
                "show_download": True,
                "starting_at": None,
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
                    "id": str(video.playlist.id),
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "shared_live_medias": [],
                "live_state": "starting",
                "live_info": {
                    "jitsi": {
                        "config_overwrite": {},
                        "domain": "meet.jit.si",
                        "external_api_url": "https://meet.jit.si/external_api.js",
                        "interface_config_overwrite": {},
                    },
                    "medialive": {
                        "input": {
                            "endpoints": [
                                "https://live_endpoint1",
                                "https://live_endpoint2",
                            ],
                        }
                    },
                },
                "live_type": JITSI,
                "xmpp": {
                    "bosh_url": "https://xmpp-server.com/http-bind?token=xmpp_jwt",
                    "websocket_url": None,
                    "conference_url": f"{video.id}@conference.xmpp-server.com",
                    "jid": "conference.xmpp-server.com",
                },
            },
        )

    @override_settings(LIVE_CHAT_ENABLED=True)
    @override_settings(XMPP_BOSH_URL="https://xmpp-server.com/http-bind")
    @override_settings(XMPP_CONFERENCE_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_JWT_SHARED_SECRET="xmpp_shared_secret")
    def test_api_instructor_start_already_created_live(self):
        """AWS stack and chat room should not be created if already existing."""
        video = factories.VideoFactory(
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            upload_state=PENDING,
            live_state=IDLE,
            live_type=JITSI,
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
        jwt_token.payload["user"] = {"id": "56255f3807599c377bf0e5bf072359fd"}

        # start a live video,
        with mock.patch.object(api.video, "start_live_channel"), mock.patch.object(
            api.video, "create_live_stream"
        ) as mock_create_live_stream, mock.patch.object(
            api.video, "wait_medialive_channel_is_created"
        ), mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode, mock.patch.object(
            api.video, "create_room"
        ) as mock_create_room:
            mock_jwt_encode.return_value = "xmpp_jwt"
            mock_create_live_stream.assert_not_called()
            mock_create_room.assert_not_called()

            response = self.client.post(
                f"/api/videos/{video.id}/start-live/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "description": video.description,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": None,
                "is_public": False,
                "is_ready_to_show": True,
                "is_scheduled": False,
                "show_download": True,
                "starting_at": None,
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
                    "id": str(video.playlist.id),
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "shared_live_medias": [],
                "live_state": "starting",
                "live_info": {
                    "jitsi": {
                        "config_overwrite": {},
                        "domain": "meet.jit.si",
                        "external_api_url": "https://meet.jit.si/external_api.js",
                        "interface_config_overwrite": {},
                    },
                    "medialive": {
                        "input": {
                            "endpoints": [
                                "https://live_endpoint1",
                                "https://live_endpoint2",
                            ],
                        }
                    },
                },
                "live_type": JITSI,
                "xmpp": {
                    "bosh_url": "https://xmpp-server.com/http-bind?token=xmpp_jwt",
                    "websocket_url": None,
                    "conference_url": f"{video.id}@conference.xmpp-server.com",
                    "jid": "conference.xmpp-server.com",
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
        with mock.patch.object(api.video, "start_live_channel"):
            response = self.client.post(
                f"/api/videos/{video.id}/start-live/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        self.assertEqual(response.status_code, 400)

    def test_api_instructor_start_non_idle_or_paused_live(self):
        """An instructor should not start a video its state is not IDLE or PAUSED."""
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=PENDING,
            live_state=random.choice(
                [s[0] for s in LIVE_CHOICES if s[0] not in [PAUSED, IDLE]]
            ),
            live_type=RAW,
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        # start a live video,
        response = self.client.post(
            f"/api/videos/{video.id}/start-live/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)

    def test_api_video_stop_live_anonymous_user(self):
        """Anonymous users are not allowed to stop a live."""
        video = factories.VideoFactory()

        response = self.client.post(f"/api/videos/{video.id}/stop-live/")

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
            f"/api/videos/{video.id}/stop-live/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_video_student_stop_live(self):
        """A student should not be able to stop a live."""
        video = factories.VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]

        response = self.client.post(
            f"/api/videos/{video.id}/stop-live/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
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

            response = self.client.post(f"/api/videos/{video.id}/stop-live/")
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
            live_type=RAW,
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        # start a live video,
        now = datetime(2021, 11, 16, tzinfo=pytz.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch.object(
            api.video, "stop_live_channel"
        ):
            response = self.client.post(
                f"/api/videos/{video.id}/stop-live/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "description": video.description,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": None,
                "is_public": False,
                "is_ready_to_show": True,
                "is_scheduled": False,
                "show_download": True,
                "starting_at": None,
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
                    "id": str(video.playlist.id),
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "shared_live_medias": [],
                "live_state": STOPPING,
                "live_info": {
                    "medialive": {
                        "input": {
                            "endpoints": [
                                "https://live_endpoint1",
                                "https://live_endpoint2",
                            ],
                        }
                    },
                    "paused_at": "1637020800",
                },
                "live_type": RAW,
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
        with mock.patch.object(api.video, "stop_live_channel"):
            response = self.client.post(
                f"/api/videos/{video.id}/stop-live/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        self.assertEqual(response.status_code, 400)

    def test_api_instructor_stop_non_running_live(self):
        """An instructor should not stop a video when not in live state."""
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=PENDING,
            live_state=random.choice([s[0] for s in LIVE_CHOICES if s[0] != "running"]),
            live_type=RAW,
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        # start a live video,
        with mock.patch.object(api.video, "stop_live_channel"):
            response = self.client.post(
                f"/api/videos/{video.id}/stop-live/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        self.assertEqual(response.status_code, 400)

    def test_api_video_end_live_anonymous_user(self):
        """Anonymous users are not allowed to end a live."""
        video = factories.VideoFactory()

        response = self.client.post(f"/api/videos/{video.id}/end-live/")

        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_video_instructor_end_live_in_read_only(self):
        """An instructor with read_only set to true should not be able to end a live."""
        video = factories.VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": False}

        response = self.client.post(
            f"/api/videos/{video.id}/end-live/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_video_student_end_live(self):
        """A student should not be able to end a live."""
        video = factories.VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]

        response = self.client.post(
            f"/api/videos/{video.id}/end-live/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_video_end_live_staff_or_user(self):
        """Users authenticated via a session should not be able to end a live."""
        for user in [factories.UserFactory(), factories.UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            video = factories.VideoFactory()

            response = self.client.post(f"/api/videos/{video.id}/end-live/")
            self.assertEqual(response.status_code, 401)
            content = json.loads(response.content)
            self.assertEqual(
                content, {"detail": "Authentication credentials were not provided."}
            )

    @override_settings(LIVE_CHAT_ENABLED=True)
    def test_api_video_instructor_end_idle_live(self):
        """An instructor can end a live in idle state."""
        video = factories.VideoFactory(
            live_state=IDLE,
            live_type=JITSI,
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        response = self.client.post(
            f"/api/videos/{video.id}/end-live/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "description": video.description,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": None,
                "is_public": False,
                "is_ready_to_show": False,
                "is_scheduled": False,
                "show_download": True,
                "starting_at": None,
                "upload_state": DELETED,
                "thumbnail": None,
                "timed_text_tracks": [],
                "urls": None,
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": video.playlist.title,
                    "lti_id": video.playlist.lti_id,
                },
                "shared_live_medias": [],
                "live_state": None,
                "live_info": {},
                "live_type": None,
                "xmpp": None,
            },
        )

    @override_settings(LIVE_CHAT_ENABLED=True)
    def test_api_video_instructor_end_paused_live(self):
        """An instructor can end a live in paused state"""
        video = factories.VideoFactory(
            live_state=PAUSED,
            live_type=JITSI,
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

        with mock.patch.object(
            api.video, "delete_aws_element_stack"
        ) as mock_delete_aws_element_stack, mock.patch.object(
            api.video, "create_mediapackage_harvest_job"
        ) as mock_create_mediapackage_harvest_job, mock.patch.object(
            api.video, "close_room"
        ) as mock_close_room:
            response = self.client.post(
                f"/api/videos/{video.id}/end-live/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            mock_delete_aws_element_stack.assert_called_once()
            mock_create_mediapackage_harvest_job.assert_called_once()
            mock_close_room.assert_called_once_with(video.id)

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "description": video.description,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": None,
                "is_public": False,
                "is_ready_to_show": True,
                "is_scheduled": False,
                "show_download": True,
                "starting_at": None,
                "upload_state": HARVESTING,
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
                    "id": str(video.playlist.id),
                    "title": video.playlist.title,
                    "lti_id": video.playlist.lti_id,
                },
                "shared_live_medias": [],
                "live_state": STOPPED,
                "live_info": {
                    "medialive": {
                        "input": {
                            "endpoints": [
                                "https://live_endpoint1",
                                "https://live_endpoint2",
                            ],
                        }
                    },
                    "jitsi": {
                        "config_overwrite": {},
                        "domain": "meet.jit.si",
                        "external_api_url": "https://meet.jit.si/external_api.js",
                        "interface_config_overwrite": {},
                    },
                },
                "live_type": JITSI,
                "xmpp": None,
            },
        )

    def test_api_video_instructor_end_paused_live_missing_manifest(self):
        """An instructor ending a live with a missing manifest should delete the video"""
        video = factories.VideoFactory(
            live_state=PAUSED,
            live_type=JITSI,
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
                    "channel": {"id": "channel1"},
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

        with mock.patch.object(
            api.video, "delete_aws_element_stack"
        ) as mock_delete_aws_element_stack, mock.patch.object(
            api.video,
            "create_mediapackage_harvest_job",
            side_effect=ManifestMissingException,
        ) as mock_create_mediapackage_harvest_job, mock.patch(
            "marsha.core.api.video.delete_mediapackage_channel"
        ) as mock_delete_mediapackage_channel:
            response = self.client.post(
                f"/api/videos/{video.id}/end-live/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            mock_delete_aws_element_stack.assert_called_once()
            mock_create_mediapackage_harvest_job.assert_called_once()
            mock_delete_mediapackage_channel.assert_called_once()

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "description": video.description,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": None,
                "is_public": False,
                "is_ready_to_show": False,
                "is_scheduled": False,
                "show_download": True,
                "starting_at": None,
                "upload_state": DELETED,
                "thumbnail": None,
                "timed_text_tracks": [],
                "urls": None,
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": video.playlist.title,
                    "lti_id": video.playlist.lti_id,
                },
                "shared_live_medias": [],
                "live_state": None,
                "live_info": {},
                "live_type": None,
                "xmpp": None,
            },
        )

    def test_api_video_instructor_end_live_wrong_live_state(self):
        """An instructor can not end a live not in IDLE or PAUSED state."""
        video = factories.VideoFactory(
            live_state=random.choice(
                [s[0] for s in LIVE_CHOICES if s[0] not in [PAUSED, IDLE]]
            ),
            live_type=JITSI,
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        response = self.client.post(
            f"/api/videos/{video.id}/end-live/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "error": (
                    "Live video must be stopped before deleting it."
                    f" Current status is {video.live_state}"
                )
            },
        )

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_video_update_live_state(self):
        """Confirm update video live state."""
        # test works with or without a starting_at date
        # set microseconds to 0 to compare date surely as serializer truncate them
        starting_at = random.choice(
            [None, (timezone.now() + timedelta(hours=1)).replace(microsecond=0)]
        )
        video = factories.VideoFactory(
            id="a1a21411-bf2f-4926-b97f-3c48a124d528",
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
                "paused_at": "1637020800",
            },
            live_type=RAW,
            starting_at=starting_at,
        )
        data = {
            "logGroupName": "/aws/lambda/dev-test-marsha-medialive",
            "requestId": "7954d4d1-9dd3-47f4-9542-e7fd5f937fe6",
            "state": "running",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        now = datetime(2018, 8, 8, tzinfo=pytz.utc)
        with mock.patch.object(timezone, "now", return_value=now):
            response = self.client.patch(
                f"/api/videos/{video.id}/update-live-state/",
                data,
                content_type="application/json",
                HTTP_X_MARSHA_SIGNATURE=signature,
            )

        video.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(video.live_state, RUNNING)
        self.assertEqual(video.starting_at, starting_at)
        self.assertEqual(
            video.live_info,
            {
                "medialive": {
                    "input": {
                        "id": "medialive_input_1",
                        "endpoints": [
                            "https://live_endpoint1",
                            "https://live_endpoint2",
                        ],
                    },
                    "channel": {"id": "medialive_channel_1"},
                    "request_ids": ["7954d4d1-9dd3-47f4-9542-e7fd5f937fe6"],
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
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
                "started_at": "1533686400",
            },
        )

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_video_update_live_state_stopped(self):
        """Receiving stopped event should pause the video."""
        # test works with or without a starting_at date
        # set microseconds to 0 to compare date surely as serializer truncate them
        starting_at = random.choice(
            [None, (timezone.now() + timedelta(hours=1)).replace(microsecond=0)]
        )

        video = factories.VideoFactory(
            id="a1a21411-bf2f-4926-b97f-3c48a124d528",
            upload_state=PENDING,
            live_state=STOPPING,
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
                    "request_ids": ["7954d4d1-9dd3-47f4-9542-e7fd5f937fe6"],
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
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
                "started_at": "1533686400",
            },
            live_type=RAW,
            starting_at=starting_at,
        )
        data = {
            "logGroupName": "/aws/lambda/dev-test-marsha-medialive",
            "requestId": "c31c7ce8-705d-4352-b7f0-e60f2bfa2845",
            "state": "stopped",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))

        now = datetime(2018, 8, 8, tzinfo=pytz.utc)
        with mock.patch.object(timezone, "now", return_value=now):
            response = self.client.patch(
                f"/api/videos/{video.id}/update-live-state/",
                data,
                content_type="application/json",
                HTTP_X_MARSHA_SIGNATURE=signature,
            )

        video.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(video.live_state, PAUSED)
        self.assertEqual(video.upload_state, PENDING)
        self.assertEqual(video.starting_at, starting_at)
        self.assertEqual(
            video.live_info,
            {
                "medialive": {
                    "input": {
                        "id": "medialive_input_1",
                        "endpoints": [
                            "https://live_endpoint1",
                            "https://live_endpoint2",
                        ],
                    },
                    "channel": {"id": "medialive_channel_1"},
                    "request_ids": [
                        "7954d4d1-9dd3-47f4-9542-e7fd5f937fe6",
                        "c31c7ce8-705d-4352-b7f0-e60f2bfa2845",
                    ],
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
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
                "started_at": "1533686400",
                "stopped_at": "1533686400",
            },
        )

    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_video_update_live_state_invalid_signature(self):
        """Live state update with an invalid signature should fails."""
        video = factories.VideoFactory(
            id="a1a21411-bf2f-4926-b97f-3c48a124d528",
            upload_state=PENDING,
            live_state=IDLE,
            live_type=RAW,
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
                    "request_ids": ["7954d4d1-9dd3-47f4-9542-e7fd5f937fe6"],
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
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
                "started_at": "1533686400",
            },
        )
        data = {
            "logGroupName": "/aws/lambda/dev-test-marsha-medialive",
            "requestId": "49010b0f-63f5-4d5b-9baa-6fc69bbce3eb",
            "state": "running",
        }
        signature = generate_hash("invalid secret", json.dumps(data).encode("utf-8"))
        response = self.client.patch(
            f"/api/videos/{video.id}/update-live-state/",
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
            live_type=RAW,
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
                    "request_ids": ["7954d4d1-9dd3-47f4-9542-e7fd5f937fe6"],
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
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
                "started_at": "1533686400",
            },
        )
        invalid_state = random.choice(
            [s[0] for s in LIVE_CHOICES if s[0] not in [RUNNING, STOPPED]]
        )
        data = {
            "logGroupName": "/aws/lambda/dev-test-marsha-medialive",
            "requestId": "49010b0f-63f5-4d5b-9baa-6fc69bbce3eb",
            "state": invalid_state,
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        response = self.client.patch(
            f"/api/videos/{video.id}/update-live-state/",
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
            "requestId": "49010b0f-63f5-4d5b-9baa-6fc69bbce3eb",
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
    def test_api_video_update_live_already_saved_request_id(self):
        """Updating with an already saved request id should return a 200 earlier."""
        video = factories.VideoFactory(
            id="a1a21411-bf2f-4926-b97f-3c48a124d528",
            upload_state=PENDING,
            live_state=STOPPED,
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
                    "request_ids": ["7954d4d1-9dd3-47f4-9542-e7fd5f937fe6"],
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
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
                "started_at": "1533686400",
            },
            live_type=RAW,
        )
        data = {
            "logGroupName": "/aws/lambda/dev-test-marsha-medialive",
            "requestId": "7954d4d1-9dd3-47f4-9542-e7fd5f937fe6",
            "state": "stopped",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        now = datetime(2018, 8, 8, tzinfo=pytz.utc)
        with mock.patch.object(timezone, "now", return_value=now):
            response = self.client.patch(
                f"/api/videos/{video.id}/update-live-state/",
                data,
                content_type="application/json",
                HTTP_X_MARSHA_SIGNATURE=signature,
            )

        self.assertEqual(response.status_code, 200)
