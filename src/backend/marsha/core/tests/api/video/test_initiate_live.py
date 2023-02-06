"""Tests for the Video API of the Marsha project."""
from datetime import datetime, timedelta
import json
import random
from unittest import mock
import uuid

from django.conf import settings
from django.test import TestCase, override_settings

from boto3.exceptions import Boto3Error

from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    PlaylistLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)

from .. import api, factories, models
from ..api import timezone
from ..defaults import (
    APPROVAL,
    CC_BY,
    CC_BY_SA,
    ENDED,
    HARVESTED,
    HARVESTING,
    IDLE,
    INITIALIZED,
    JITSI,
    JOIN_MODE_CHOICES,
    LIVE_CHOICES,
    PENDING,
    RAW,
    READY,
    RUNNING,
    STARTING,
    STATE_CHOICES,
    STOPPED,
    STOPPING,
)
from ..factories import LiveSessionFactory, VideoFactory
from ..utils.api_utils import generate_hash
from ..utils.medialive_utils import ManifestMissingException
from ..utils.time_utils import to_timestamp
from .utils import RSA_KEY_MOCK


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
        jwt_token = StudentLtiTokenFactory(resource=video)
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
        jwt_token = StudentLtiTokenFactory(resource=video)
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
            jwt_token = StudentLtiTokenFactory(resource=video)
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
        jwt_token = StudentLtiTokenFactory(resource=video)
        # Get the video linked to the JWT token
        response = self.client.get(
            f"/api/videos/{other_video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_video_read_detail_student_join_modes(self):
        """Student users should not be allowed to read jitsi info
        in any join mode."""
        video = factories.VideoFactory(
            join_mode=random.choice([mode for (mode, _) in JOIN_MODE_CHOICES]),
            live_state=RUNNING,
            live_type=JITSI,
        )
        jwt_token = StudentLtiTokenFactory(resource=video)
        # Get the video linked to the JWT token
        response = self.client.get(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get("live_info"), {})

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_video_read_detail_admin_token_user(self):
        """Administrator should be able to read detail of a video."""
        video = factories.VideoFactory(upload_state="pending")

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            roles=["administrator"],
        )

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
            uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc),
            upload_state="ready",
            resolutions=resolutions,
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            tags=["mathematics", "algebra"],
            license=CC_BY,
        )
        timed_text_track = factories.TimedTextTrackFactory(
            video=video,
            mode="cc",
            language="fr",
            uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc),
            upload_state="ready",
            extension="srt",
        )
        shared_live_media = factories.SharedLiveMediaFactory(
            video=video,
            extension="pdf",
            title="python structures",
            upload_state=READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=3,
        )
        shared_live_media_2 = factories.SharedLiveMediaFactory(
            nb_pages=None,
            upload_state=PENDING,
            video=video,
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

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
                "allow_recording": True,
                "description": video.description,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": "1533686400",
                "is_public": False,
                "is_recording": False,
                "is_ready_to_show": True,
                "is_scheduled": False,
                "join_mode": "approval",
                "recording_time": 0,
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
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
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
                "tags": ["mathematics", "algebra"],
                "license": CC_BY,
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
        CLOUDFRONT_SIGNED_PUBLIC_KEY_ID="cloudfront-access-key-id",
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
            uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc),
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
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=3,
            video=video,
        )
        shared_live_media_2 = factories.SharedLiveMediaFactory(
            nb_pages=None,
            upload_state=PENDING,
            video=video,
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        # fix the time so that the url signature is deterministic and can be checked
        now = datetime(2021, 11, 30, tzinfo=timezone.utc)
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

        expected_cloudfront_signature = (
            "Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNl"
            "IjoiaHR0cHM6Ly9hYmMuY2xvdWRmcm9udC5uZXQvZDlkNzA0OWMtNWEzZi00MDcwLWE0"
            "OTQtZTZiZjBiZDhiOWZiLyoiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFX"
            "UzpFcG9jaFRpbWUiOjE2MzgyMzc2MDB9fX1dfQ__&Signature=IVWMFfS7WQVTKLZl~"
            "gKgGES~BS~wVLBIOncSE6yVgg9zIrEI1Epq3AVkOsI7z10dyjgInNbPviArnxmlV~DQe"
            "N-ykgEWmGy7aT4lRCx61oXuHFtNkq8Qx-we~UY87mZ4~UTqmM~JVuuLduMiRQB-I3XKa"
            "RQGRlsok5yGu0RhvLcZntVFp6QgYui3WtGvxSs2LjW0IakR1qepSDl9LXI-F2bgl9Vd1"
            "U9eapPBhhoD0okebXm7NGg9gUMLXlmUo-RvsrAzzEteKctPp0Xzkydk~tcnMkJs4jfbQ"
            "xKrpyF~N9OuCRYCs68ONhHvypOYU3K-wQEoAFlERBLiaOzDZUzlyA__&Key-Pair-Id="
            "cloudfront-access-key-id"
        )

        self.assertEqual(
            content,
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "allow_recording": True,
                "description": video.description,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": "1533686400",
                "is_public": False,
                "is_ready_to_show": True,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "recording_time": 0,
                "show_download": True,
                "starting_at": None,
                "upload_state": "ready",
                "thumbnail": None,
                "timed_text_tracks": [],
                "urls": {
                    "mp4": {
                        "144": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/mp4/"
                            "1533686400_144.mp4?response-content-disposition=attachment%3B+filen"
                            f"ame%3Dfoo-bar_1533686400.mp4&{expected_cloudfront_signature}"
                        ),
                        "240": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/mp4/"
                            "1533686400_240.mp4?response-content-disposition=attachment%3B+filen"
                            f"ame%3Dfoo-bar_1533686400.mp4&{expected_cloudfront_signature}"
                        ),
                        "480": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/mp4/"
                            "1533686400_480.mp4?response-content-disposition=attachment%3B+filen"
                            f"ame%3Dfoo-bar_1533686400.mp4&{expected_cloudfront_signature}"
                        ),
                        "720": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/mp4/"
                            "1533686400_720.mp4?response-content-disposition=attachment%3B+filen"
                            f"ame%3Dfoo-bar_1533686400.mp4&{expected_cloudfront_signature}"
                        ),
                        "1080": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/mp4/"
                            "1533686400_1080.mp4?response-content-disposition=attachment%3B+filen"
                            f"ame%3Dfoo-bar_1533686400.mp4&{expected_cloudfront_signature}"
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
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
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
                                "sharedlivemedia/f16dc536-8cba-473c-a85d-0eb88f64d8f9/1638230400."
                                "pdf?response-content-disposition=attachment%3B+filename%3Dpython"
                                f"-expressions.pdf&{expected_cloudfront_signature}"
                            ),
                            "pages": {
                                "1": (
                                    "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b"
                                    "9fb/sharedlivemedia/f16dc536-8cba-473c-a85d-0eb88f64d8f9/163"
                                    f"8230400_1.svg?{expected_cloudfront_signature}"
                                ),
                                "2": (
                                    "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b"
                                    "9fb/sharedlivemedia/f16dc536-8cba-473c-a85d-0eb88f64d8f9/163"
                                    f"8230400_2.svg?{expected_cloudfront_signature}"
                                ),
                                "3": (
                                    "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b"
                                    "9fb/sharedlivemedia/f16dc536-8cba-473c-a85d-0eb88f64d8f9/163"
                                    f"8230400_3.svg?{expected_cloudfront_signature}"
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
                "tags": [],
                "license": None,
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
        CLOUDFRONT_SIGNED_PUBLIC_KEY_ID="cloudfront-access-key-id",
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
            uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc),
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
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=3,
            video=video,
        )
        shared_live_media_2 = factories.SharedLiveMediaFactory(
            nb_pages=None,
            upload_state=PENDING,
            video=video,
        )

        jwt_token = StudentLtiTokenFactory(resource=video)

        # fix the time so that the url signature is deterministic and can be checked
        now = datetime(2021, 11, 30, tzinfo=timezone.utc)
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

        expected_cloudfront_signature = (
            "Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNl"
            "IjoiaHR0cHM6Ly9hYmMuY2xvdWRmcm9udC5uZXQvZDlkNzA0OWMtNWEzZi00MDcwLWE0"
            "OTQtZTZiZjBiZDhiOWZiLyoiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFX"
            "UzpFcG9jaFRpbWUiOjE2MzgyMzc2MDB9fX1dfQ__&Signature=IVWMFfS7WQVTKLZl~"
            "gKgGES~BS~wVLBIOncSE6yVgg9zIrEI1Epq3AVkOsI7z10dyjgInNbPviArnxmlV~DQe"
            "N-ykgEWmGy7aT4lRCx61oXuHFtNkq8Qx-we~UY87mZ4~UTqmM~JVuuLduMiRQB-I3XKa"
            "RQGRlsok5yGu0RhvLcZntVFp6QgYui3WtGvxSs2LjW0IakR1qepSDl9LXI-F2bgl9Vd1"
            "U9eapPBhhoD0okebXm7NGg9gUMLXlmUo-RvsrAzzEteKctPp0Xzkydk~tcnMkJs4jfbQ"
            "xKrpyF~N9OuCRYCs68ONhHvypOYU3K-wQEoAFlERBLiaOzDZUzlyA__&Key-Pair-Id="
            "cloudfront-access-key-id"
        )

        self.assertEqual(
            content,
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "allow_recording": True,
                "description": video.description,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": "1533686400",
                "is_public": False,
                "is_ready_to_show": True,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "recording_time": 0,
                "show_download": True,
                "starting_at": None,
                "upload_state": "ready",
                "thumbnail": None,
                "timed_text_tracks": [],
                "urls": {
                    "mp4": {
                        "144": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/mp4/"
                            "1533686400_144.mp4?response-content-disposition=attachment%3B+filen"
                            f"ame%3Dfoo-bar_1533686400.mp4&{expected_cloudfront_signature}"
                        ),
                        "240": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/mp4/"
                            "1533686400_240.mp4?response-content-disposition=attachment%3B+filen"
                            f"ame%3Dfoo-bar_1533686400.mp4&{expected_cloudfront_signature}"
                        ),
                        "480": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/mp4/"
                            "1533686400_480.mp4?response-content-disposition=attachment%3B+filen"
                            f"ame%3Dfoo-bar_1533686400.mp4&{expected_cloudfront_signature}"
                        ),
                        "720": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/mp4/"
                            "1533686400_720.mp4?response-content-disposition=attachment%3B+filen"
                            f"ame%3Dfoo-bar_1533686400.mp4&{expected_cloudfront_signature}"
                        ),
                        "1080": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/mp4/"
                            "1533686400_1080.mp4?response-content-disposition=attachment%3B+filen"
                            f"ame%3Dfoo-bar_1533686400.mp4&{expected_cloudfront_signature}"
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
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
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
                                    "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b"
                                    "9fb/sharedlivemedia/7d9a2087-79be-4731-bcda-f59c7b8b9699/163"
                                    f"8230400_1.svg?{expected_cloudfront_signature}"
                                ),
                                "2": (
                                    "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b"
                                    "9fb/sharedlivemedia/7d9a2087-79be-4731-bcda-f59c7b8b9699/163"
                                    f"8230400_2.svg?{expected_cloudfront_signature}"
                                ),
                                "3": (
                                    "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b"
                                    "9fb/sharedlivemedia/7d9a2087-79be-4731-bcda-f59c7b8b9699/163"
                                    f"8230400_3.svg?{expected_cloudfront_signature}"
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
                "tags": [],
                "license": None,
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

    @override_settings(LIVE_CHAT_ENABLED=True)
    @override_settings(XMPP_BOSH_URL="https://xmpp-server.com/http-bind")
    @override_settings(XMPP_CONFERENCE_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_JWT_SHARED_SECRET="xmpp_shared_secret")
    def test_api_video_read_detail_xmpp_enabled_live_state_idle(self):
        """A video in live_state IDLE and with XMPP enabled should not return the XMPP in the
        serialized video."""
        video = factories.VideoFactory(
            live_state=IDLE,
            live_type=JITSI,
        )

        jwt_token = StudentLtiTokenFactory(
            resource=video,
            context_id="Maths",
            consumer_site=str(video.playlist.consumer_site.id),
        )

        # Get the video linked to the JWT token
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
                "allow_recording": True,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "is_public": False,
                "is_ready_to_show": True,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "starting_at": None,
                "description": video.description,
                "id": str(video.id),
                "upload_state": PENDING,
                "timed_text_tracks": [],
                "thumbnail": None,
                "title": video.title,
                "urls": None,
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": video.playlist.title,
                    "lti_id": video.playlist.lti_id,
                },
                "recording_time": 0,
                "shared_live_medias": [],
                "live_state": IDLE,
                "live_info": {},
                "live_type": JITSI,
                "xmpp": None,
                "tags": [],
                "license": None,
            },
        )

    def test_api_video_read_detail_as_instructor_in_read_only(self):
        """An instructor with read_only can read the video."""
        video = factories.VideoFactory(upload_state="ready")

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            permissions__can_update=False,
        )

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
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

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
                "allow_recording": True,
                "description": video.description,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": None,
                "is_public": False,
                "is_ready_to_show": False,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "starting_at": None,
                "upload_state": "pending",
                "timed_text_tracks": [],
                "thumbnail": None,
                "urls": None,
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "recording_time": 0,
                "shared_live_medias": [],
                "live_state": None,
                "live_info": {},
                "live_type": None,
                "xmpp": None,
                "tags": [],
                "license": None,
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
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

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
                "allow_recording": True,
                "description": video.description,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": None,
                "is_public": False,
                "is_ready_to_show": False,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "starting_at": None,
                "upload_state": state,
                "timed_text_tracks": [],
                "thumbnail": None,
                "urls": None,
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "recording_time": 0,
                "shared_live_medias": [],
                "live_state": None,
                "live_info": {},
                "live_type": None,
                "xmpp": None,
                "tags": [],
                "license": None,
            },
        )

    @override_settings(
        CLOUDFRONT_SIGNED_URLS_ACTIVE=True,
        CLOUDFRONT_SIGNED_PUBLIC_KEY_ID="cloudfront-access-key-id",
    )
    @mock.patch("builtins.open", new_callable=mock.mock_open, read_data=RSA_KEY_MOCK)
    def test_api_video_read_detail_token_user_signed_urls(self, mock_open):
        """Activating signed urls should add Cloudfront query string authentication parameters."""
        video = factories.VideoFactory(
            pk="a2f27fde-973a-4e89-8dca-cc59e01d255c",
            uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc),
            upload_state="ready",
            resolutions=[144],
            playlist__title="foo",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        # Get the video linked to the JWT token
        # fix the time so that the url signature is deterministic and can be checked
        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
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
                "https://abc.cloudfront.net/a2f27fde-973a-4e89-8dca-cc59e01d255c/mp4/1533686400_14"
                "4.mp4?response-content-disposition=attachment%3B+filename%3Dfoo_1533686400.mp4&Po"
                "licy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9hYmMuY2xvdWRmcm9udC5uZXQvYTJm"
                "MjdmZGUtOTczYS00ZTg5LThkY2EtY2M1OWUwMWQyNTVjLyoiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUa"
                "GFuIjp7IkFXUzpFcG9jaFRpbWUiOjE1MzM2OTM2MDB9fX1dfQ__&Signature=DMuAMeYCa4sslOKW7X4"
                "R5kXJlYt0k8X49j-4h0x-DTkKN7cYKyDVmsUyEKn1kVBMZLQC1GwnnNjOpbsvyg6hKo7cskwn-zkEr~FM"
                "fpzO3fAh6PHDqCJa7pBf8iiykCtj~Xm3yF0ATesAnuVda1jAmExM3j43YYFsp2ovU9tXRfeZTD8yJ9QXd"
                "cSd6phfPNSOE091Bc1OxhBycMjQu7UgYsYYKRQg6tmizzYzv30jp5dNVKh8DPREd1hL3V1O1XnqrCxI1W"
                "FJ-L680yBs3DzjJyiEeUWsBL2PcjSExKqa0YZkEVhN3N5jYwxmFxWiox1DjBeQg5~mWVF6Of~-xr0XrQ_"
                "_&Key-Pair-Id=cloudfront-access-key-id"
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

        jwt_token = UserAccessTokenFactory(user=user)

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

        jwt_token = UserAccessTokenFactory(user=user)

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
                "allow_recording": True,
                "description": video.description,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "has_transcript": False,
                "id": str(video.id),
                "is_public": False,
                "is_ready_to_show": False,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "live_info": {},
                "live_state": None,
                "live_type": None,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(video.playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "recording_time": 0,
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
                "tags": [],
                "license": None,
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

        jwt_token = UserAccessTokenFactory(user=user)

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

        jwt_token = UserAccessTokenFactory(user=user)

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
                "allow_recording": True,
                "description": video.description,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "has_transcript": False,
                "id": str(video.id),
                "is_public": False,
                "is_ready_to_show": False,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "live_info": {},
                "live_state": None,
                "live_type": None,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(video.playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "recording_time": 0,
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
                "tags": [],
                "license": None,
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
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            permissions__can_update=False,
        )

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
        # An organization with a playlist and one video
        organization = factories.OrganizationFactory()
        organization_playlist = factories.PlaylistFactory(organization=organization)
        factories.VideoFactory(playlist=organization_playlist)
        # A playlist with a video but no organization
        other_playlist = factories.PlaylistFactory()
        factories.VideoFactory(playlist=other_playlist)

        jwt_token = UserAccessTokenFactory()

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

        jwt_token = UserAccessTokenFactory(user=user)

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
                        "allow_recording": True,
                        "description": video.description,
                        "estimated_duration": None,
                        "has_chat": True,
                        "has_live_media": True,
                        "has_transcript": False,
                        "id": str(video.id),
                        "is_public": False,
                        "is_ready_to_show": False,
                        "is_recording": False,
                        "is_scheduled": False,
                        "join_mode": "approval",
                        "live_info": {},
                        "live_state": None,
                        "live_type": None,
                        "participants_asking_to_join": [],
                        "participants_in_discussion": [],
                        "playlist": {
                            "id": str(organization_playlist_1.id),
                            "lti_id": organization_playlist_1.lti_id,
                            "title": organization_playlist_1.title,
                        },
                        "recording_time": 0,
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
                        "tags": [],
                        "license": None,
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

        jwt_token = UserAccessTokenFactory(user=user)

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
                        "allow_recording": True,
                        "description": video_1.description,
                        "estimated_duration": None,
                        "has_chat": True,
                        "has_live_media": True,
                        "has_transcript": False,
                        "id": str(video_1.id),
                        "is_public": False,
                        "is_ready_to_show": False,
                        "is_recording": False,
                        "is_scheduled": False,
                        "join_mode": "approval",
                        "live_info": {},
                        "live_state": None,
                        "live_type": None,
                        "participants_asking_to_join": [],
                        "participants_in_discussion": [],
                        "playlist": {
                            "id": str(organization_1_playlist_1.id),
                            "lti_id": organization_1_playlist_1.lti_id,
                            "title": organization_1_playlist_1.title,
                        },
                        "recording_time": 0,
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
                        "tags": [],
                        "license": None,
                    },
                    {
                        "active_shared_live_media": None,
                        "active_shared_live_media_page": None,
                        "active_stamp": None,
                        "allow_recording": True,
                        "description": video_2.description,
                        "estimated_duration": None,
                        "has_chat": True,
                        "has_live_media": True,
                        "has_transcript": False,
                        "id": str(video_2.id),
                        "is_public": False,
                        "is_ready_to_show": False,
                        "is_recording": False,
                        "is_scheduled": False,
                        "join_mode": "approval",
                        "live_info": {},
                        "live_state": None,
                        "live_type": None,
                        "participants_asking_to_join": [],
                        "participants_in_discussion": [],
                        "playlist": {
                            "id": str(organization_1_playlist_2.id),
                            "lti_id": organization_1_playlist_2.lti_id,
                            "title": organization_1_playlist_2.title,
                        },
                        "recording_time": 0,
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
                        "tags": [],
                        "license": None,
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
        # A playlist, where the user has no access, with a video
        playlist = factories.PlaylistFactory()
        factories.VideoFactory(playlist=playlist)

        jwt_token = UserAccessTokenFactory()

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

        jwt_token = UserAccessTokenFactory(user=user)

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
                        "allow_recording": True,
                        "description": video.description,
                        "estimated_duration": None,
                        "has_chat": True,
                        "has_live_media": True,
                        "has_transcript": False,
                        "id": str(video.id),
                        "is_public": False,
                        "is_ready_to_show": False,
                        "is_recording": False,
                        "is_scheduled": False,
                        "join_mode": "approval",
                        "live_info": {},
                        "live_state": None,
                        "live_type": None,
                        "participants_asking_to_join": [],
                        "participants_in_discussion": [],
                        "playlist": {
                            "id": str(first_playlist.id),
                            "lti_id": first_playlist.lti_id,
                            "title": first_playlist.title,
                        },
                        "recording_time": 0,
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
                        "tags": [],
                        "license": None,
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

        jwt_token = UserAccessTokenFactory(user=user)

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
                        "allow_recording": True,
                        "description": video.description,
                        "estimated_duration": None,
                        "has_chat": True,
                        "has_live_media": True,
                        "has_transcript": False,
                        "id": str(video.id),
                        "is_public": False,
                        "is_ready_to_show": False,
                        "is_recording": False,
                        "is_scheduled": False,
                        "join_mode": "approval",
                        "live_info": {},
                        "live_state": None,
                        "live_type": None,
                        "participants_asking_to_join": [],
                        "participants_in_discussion": [],
                        "playlist": {
                            "id": str(first_playlist.id),
                            "lti_id": first_playlist.lti_id,
                            "title": first_playlist.title,
                        },
                        "recording_time": 0,
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
                        "tags": [],
                        "license": None,
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

        jwt_token = UserAccessTokenFactory(user=user)
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

        jwt_token = UserAccessTokenFactory(user=user)

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
                        "allow_recording": True,
                        "description": video.description,
                        "estimated_duration": None,
                        "has_chat": True,
                        "has_live_media": True,
                        "has_transcript": False,
                        "id": str(video.id),
                        "is_public": False,
                        "is_ready_to_show": False,
                        "is_recording": False,
                        "is_scheduled": False,
                        "join_mode": "approval",
                        "live_info": {},
                        "live_state": None,
                        "live_type": None,
                        "participants_asking_to_join": [],
                        "participants_in_discussion": [],
                        "playlist": {
                            "id": str(first_playlist.id),
                            "lti_id": first_playlist.lti_id,
                            "title": first_playlist.title,
                        },
                        "recording_time": 0,
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
                        "tags": [],
                        "license": None,
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

        jwt_token = UserAccessTokenFactory(user=user)

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
                        "allow_recording": True,
                        "description": video_1.description,
                        "estimated_duration": None,
                        "has_chat": True,
                        "has_live_media": True,
                        "has_transcript": False,
                        "id": str(video_1.id),
                        "is_public": False,
                        "is_ready_to_show": False,
                        "is_recording": False,
                        "is_scheduled": False,
                        "join_mode": "approval",
                        "live_info": {},
                        "live_state": None,
                        "live_type": None,
                        "participants_asking_to_join": [],
                        "participants_in_discussion": [],
                        "playlist": {
                            "id": str(playlist_1.id),
                            "lti_id": playlist_1.lti_id,
                            "title": playlist_1.title,
                        },
                        "recording_time": 0,
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
                        "tags": [],
                        "license": None,
                    },
                    {
                        "active_shared_live_media": None,
                        "active_shared_live_media_page": None,
                        "active_stamp": None,
                        "allow_recording": True,
                        "description": video_2.description,
                        "estimated_duration": None,
                        "has_chat": True,
                        "has_live_media": True,
                        "has_transcript": False,
                        "id": str(video_2.id),
                        "is_public": False,
                        "is_ready_to_show": False,
                        "is_recording": False,
                        "is_scheduled": False,
                        "join_mode": "approval",
                        "live_info": {},
                        "live_state": None,
                        "live_type": None,
                        "participants_asking_to_join": [],
                        "participants_in_discussion": [],
                        "playlist": {
                            "id": str(playlist_2.id),
                            "lti_id": playlist_2.lti_id,
                            "title": playlist_2.title,
                        },
                        "recording_time": 0,
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
                        "tags": [],
                        "license": None,
                    },
                ],
            },
        )

    @override_settings(CLOUDFRONT_SIGNED_URLS_ACTIVE=False)
    def test_api_video_with_a_thumbnail(self):
        """A video with a custom thumbnail should have it in its payload."""
        video = factories.VideoFactory(
            pk="38a91911-9aee-41e2-94dd-573abda6f48f",
            uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc),
            upload_state="ready",
            resolutions=[144, 240, 480, 720, 1080],
        )
        thumbnail = factories.ThumbnailFactory(
            video=video,
            uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc),
            upload_state="ready",
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

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
        jwt_token = UserAccessTokenFactory()
        response = self.client.post(
            "/api/videos/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        # Te user is authenticated, but action is forbidden => 403
        self.assertEqual(response.status_code, 403)
        self.assertFalse(models.Video.objects.exists())

    def test_api_video_create_student(self):
        """Student users should not be able to create videos."""
        video = factories.VideoFactory()
        jwt_token = StudentLtiTokenFactory(resource=video)
        response = self.client.post(
            "/api/videos/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.Video.objects.count(), 1)

    def test_api_video_create_student_with_playlist_token(self):
        """A student with a playlist token should not be able to create a video."""
        jwt_token = PlaylistLtiTokenFactory(roles=["student"])

        response = self.client.post(
            "/api/videos/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.Video.objects.count(), 0)

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

        jwt_token = UserAccessTokenFactory(user=user)

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
                "allow_recording": True,
                "description": "",
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "has_transcript": False,
                "id": str(models.Video.objects.get().id),
                "is_public": False,
                "is_ready_to_show": False,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "live_info": {},
                "live_state": None,
                "live_type": None,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "recording_time": 0,
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
                "tags": [],
                "license": None,
            },
        )

    def test_api_video_create_for_nonexistent_playlist(self):
        """
        Create video for nonexistet playlist.

        Requests with a UUID that does not match an existing playlist should fail.
        """
        some_uuid = uuid.uuid4()

        jwt_token = UserAccessTokenFactory()
        self.assertEqual(models.Video.objects.count(), 0)

        response = self.client.post(
            "/api/videos/",
            {"lti_id": "video_one", "playlist": some_uuid, "title": "Some video"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(models.Video.objects.count(), 0)
        self.assertEqual(response.status_code, 403)

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

        jwt_token = UserAccessTokenFactory(user=user)

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

        jwt_token = UserAccessTokenFactory(user=user)

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
                "allow_recording": True,
                "description": "",
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "has_transcript": False,
                "id": str(models.Video.objects.get().id),
                "is_public": False,
                "is_ready_to_show": False,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "live_info": {},
                "live_state": None,
                "live_type": None,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "recording_time": 0,
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
                "tags": [],
                "license": None,
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

        jwt_token = UserAccessTokenFactory(user=user)

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
                "allow_recording": True,
                "description": "",
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "has_transcript": False,
                "id": str(models.Video.objects.get().id),
                "is_public": False,
                "is_ready_to_show": False,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "live_info": {},
                "live_state": None,
                "live_type": None,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "recording_time": 0,
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
                "tags": [],
                "license": None,
            },
        )

    def test_api_video_create_with_invalid_upload_state(self):
        """
        Create video with right access.

        Creating with an invalid upload state should fails
        """
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)

        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Video.objects.count(), 0)
        # try to set starting_at and is_scheduled
        response = self.client.post(
            "/api/videos/",
            {
                "lti_id": "video_one",
                "playlist": str(playlist.id),
                "title": "Some title",
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "initialized"]
                ),
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(models.Video.objects.count(), 0)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": [{"upload_state": ["initialized is the only accepted value"]}]},
        )

    def test_api_video_create_with_a_valid_upload_state(self):
        """
        Create video with right access and a valid upload state
        """
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)

        jwt_token = UserAccessTokenFactory(user=user)

        self.assertEqual(models.Video.objects.count(), 0)
        # try to set starting_at and is_scheduled
        response = self.client.post(
            "/api/videos/",
            {
                "lti_id": "video_one",
                "playlist": str(playlist.id),
                "title": "Some title",
                "upload_state": INITIALIZED,
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
                "allow_recording": True,
                "description": "",
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "has_transcript": False,
                "id": str(models.Video.objects.get().id),
                "is_public": False,
                "is_ready_to_show": False,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "live_info": {},
                "live_state": None,
                "live_type": None,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "recording_time": 0,
                "shared_live_medias": [],
                "should_use_subtitle_as_transcript": False,
                "show_download": True,
                "starting_at": None,
                "thumbnail": None,
                "timed_text_tracks": [],
                "title": "Some title",
                "upload_state": INITIALIZED,
                "urls": None,
                "xmpp": None,
                "tags": [],
                "license": None,
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

        jwt_token = UserAccessTokenFactory(user=user)

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

    def test_api_video_create_instructor_with_playlist_token(self):
        """
        Create video with playlist token.

        Used in the context of a lti select request (deep linking).
        """
        playlist = factories.PlaylistFactory()

        jwt_token = PlaylistLtiTokenFactory(playlist=playlist)

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
                "allow_recording": True,
                "description": "",
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "has_transcript": False,
                "id": str(models.Video.objects.get().id),
                "is_public": False,
                "is_ready_to_show": False,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "live_info": {},
                "live_state": None,
                "live_type": None,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "recording_time": 0,
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
                "tags": [],
                "license": None,
            },
        )

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
        jwt_token = StudentLtiTokenFactory(resource=video)

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
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)
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

    def test_api_video_update_detail_token_user_title_null(self):
        """Token users can not set a null title."""
        video = factories.VideoFactory(title="my title")
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)
        data = {"title": None}
        response = self.client.put(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"title": ["This field may not be null."]})
        video.refresh_from_db()
        self.assertEqual(video.title, "my title")

    def test_api_video_update_detail_token_user_title_empty(self):
        """Token users can not set an empty title."""
        video = factories.VideoFactory(title="my title")
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)
        data = {"title": " "}
        response = self.client.put(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"title": ["This field may not be blank."]})
        video.refresh_from_db()
        self.assertEqual(video.title, "my title")

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
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)
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

    def test_api_video_update_detail_token_scheduled_date_future_live_session(self):
        """
        Update date of video with scheduled date.

        Live_sessions registered for this video should have their field must_notify
        updated
        """
        video = factories.VideoFactory(
            title="my title",
            live_state=IDLE,
            live_type=JITSI,
        )
        video2 = factories.VideoFactory(
            live_state=IDLE,
            live_type=JITSI,
        )
        ls_must_notify_none = factories.LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            is_registered=True,
            should_send_reminders=True,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        ls_dont_send_reminders = factories.LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            is_registered=True,
            should_send_reminders=False,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="66255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        ls_not_registered = factories.LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            is_registered=False,
            should_send_reminders=False,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="76255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        ls_must_notify_data = factories.LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            email="sarah@openfun.fr",
            must_notify=["SOME_VAL"],
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )
        ls_video2 = factories.LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            email="raoul@openfun.fr",
            must_notify=["SOME_VAL"],
            is_registered=True,
            should_send_reminders=True,
            video=video2,
        )
        # livesession already has the tag, it won't be added
        ls_with_tag = factories.LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            email="with_tag@openfun.fr",
            must_notify=[settings.REMINDER_DATE_UPDATED],
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )
        # livesession has a reminder in error, it won't be added
        ls_with_reminder_error = factories.LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            email="with_error@openfun.fr",
            reminders=[settings.REMINDER_1, settings.REMINDER_ERROR],
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)
        # we only change the title
        response = self.client.put(
            f"/api/videos/{video.id}/",
            {
                "title": "new title",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        # data have been updated but field must_notify has not changed
        self.assertEqual(video.title, "new title")
        ls_must_notify_none.refresh_from_db()
        ls_must_notify_data.refresh_from_db()
        self.assertEqual(ls_must_notify_none.must_notify, [])
        self.assertEqual(ls_must_notify_data.must_notify, ["SOME_VAL"])

        # set microseconds to 0 to compare date surely as serializer truncate them
        starting_at = (timezone.now() + timedelta(days=1)).replace(microsecond=0)
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
        ls_must_notify_data.refresh_from_db()
        ls_must_notify_none.refresh_from_db()
        self.assertEqual(
            ls_must_notify_data.must_notify,
            ["SOME_VAL", settings.REMINDER_DATE_UPDATED],
        )
        self.assertEqual(
            ls_must_notify_none.must_notify, [settings.REMINDER_DATE_UPDATED]
        )

        # these records haven't changed
        ls_dont_send_reminders.refresh_from_db()
        ls_not_registered.refresh_from_db()
        ls_video2.refresh_from_db()
        ls_with_reminder_error.refresh_from_db()
        ls_with_tag.refresh_from_db()
        self.assertEqual(ls_dont_send_reminders.must_notify, [])
        self.assertEqual(ls_not_registered.must_notify, [])
        self.assertEqual(ls_video2.must_notify, ["SOME_VAL"])
        self.assertEqual(ls_with_reminder_error.must_notify, [])
        self.assertEqual(ls_with_tag.must_notify, [settings.REMINDER_DATE_UPDATED])

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
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

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
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

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
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)
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
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

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
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

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
        """Token users should not be able to update "upload_state" through the API."""
        video = factories.VideoFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__title="playlist-002",
            live_state=HARVESTED,
            live_type=JITSI,
            live_info={
                "started_at": "1533686400",
                "stopped_at": "1533686400",
            },
            upload_state=PENDING,
            uploaded_on="2019-09-24 07:24:40+00",
            resolutions=[240, 480, 720],
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

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
        self.assertEqual(
            response.json(),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": "1569309880",
                "allow_recording": True,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "is_public": False,
                "is_ready_to_show": True,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "starting_at": None,
                "description": video.description,
                "id": str(video.id),
                "upload_state": PENDING,
                "timed_text_tracks": [],
                "thumbnail": None,
                "title": video.title,
                "urls": {
                    "mp4": {
                        "240": f"https://abc.cloudfront.net/{video.id}/"
                        "mp4/1569309880_240.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-002_1569309880.mp4",
                        "480": f"https://abc.cloudfront.net/{video.id}/"
                        "mp4/1569309880_480.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-002_1569309880.mp4",
                        "720": f"https://abc.cloudfront.net/{video.id}/"
                        "mp4/1569309880_720.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-002_1569309880.mp4",
                    },
                    "thumbnails": {
                        "240": f"https://abc.cloudfront.net/{video.id}/"
                        "thumbnails/1569309880_240.0000000.jpg",
                        "480": f"https://abc.cloudfront.net/{video.id}/"
                        "thumbnails/1569309880_480.0000000.jpg",
                        "720": f"https://abc.cloudfront.net/{video.id}/"
                        "thumbnails/1569309880_720.0000000.jpg",
                    },
                },
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": "playlist-002",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "recording_time": 0,
                "shared_live_medias": [],
                "live_state": HARVESTED,
                "live_info": {
                    "started_at": "1533686400",
                    "stopped_at": "1533686400",
                    "jitsi": {
                        "config_overwrite": {},
                        "domain": "meet.jit.si",
                        "external_api_url": "https://meet.jit.si/external_api.js",
                        "interface_config_overwrite": {},
                        "room_name": str(video.id),
                    },
                },
                "live_type": JITSI,
                "xmpp": None,
                "tags": [],
                "license": None,
            },
        )
        video.refresh_from_db()
        self.assertEqual(video.upload_state, PENDING)

    def test_api_video_update_detail_token_user_join_mode(self):
        """Token users should be able to update the join mode of their video through the API."""
        video = factories.VideoFactory(
            description="my description",
            join_mode=APPROVAL,
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        response = self.client.get(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        data["join_mode"] = random.choice(
            [mode for (mode, _) in JOIN_MODE_CHOICES if mode != video.join_mode]
        )
        response = self.client.put(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.join_mode, data["join_mode"])

    def test_api_video_instructor_update_video_in_read_only(self):
        """An instructor with read_only set to true should not be able to update the video."""
        video = factories.VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            permissions__can_update=False,
        )

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
        jwt_token = StudentLtiTokenFactory(resource=video)

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
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            permissions__can_update=False,
        )

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
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)
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
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

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
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video_token)

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
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

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
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)
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

    def test_api_video_patch_detail_token_user_allow_recording(self):
        """Instructors and administrators should be able to
        patch the recording flag of their video through the API."""
        video = factories.VideoFactory()
        self.assertTrue(video.allow_recording)

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)
        data = {"allow_recording": False}
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertFalse(video.allow_recording)

    def test_api_video_patch_detail_token_user_tags(self):
        """Instructors and administrators should be able to
        patch tags."""
        video = factories.VideoFactory()
        self.assertEqual(video.tags, [])

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)
        data = {"tags": ["foo", "bar"]}
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.tags, ["foo", "bar"])

    def test_api_video_patch_detail_token_user_license(self):
        """Instructors and administrators should be able to
        patch video license."""
        video = factories.VideoFactory()
        self.assertIsNone(video.license)

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)
        data = {"license": CC_BY_SA}
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.license, CC_BY_SA)

    def test_api_video_patch_detail_token_user_estimated_duration(self):
        """Instructors and administrators should be able to
        patch the estimated_duration field of their video through the API."""
        video = factories.VideoFactory()
        self.assertIsNone(video.estimated_duration)

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)
        estimated_duration = timedelta(seconds=2100)
        data = {"estimated_duration": estimated_duration}
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get("estimated_duration"), "00:35:00")
        video.refresh_from_db()
        self.assertEqual(video.estimated_duration, estimated_duration)

    def test_api_video_patch_detail_token_user_estimated_duration_negative(self):
        """Sending a negative integer for estimated_daration should be rejected."""
        video = factories.VideoFactory()
        self.assertIsNone(video.estimated_duration)

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)
        # from -7 days to -1 second
        estimated_duration = timedelta(seconds=random.randint(-604800, -1))
        data = {"estimated_duration": estimated_duration}
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "estimated_duration": [
                    "Ensure this value is greater than or equal to 0."
                ]
            },
        )
        video.refresh_from_db()
        self.assertIsNone(video.estimated_duration)

    def test_api_video_patch_detail_token_user_estimated_duration_negative_one_second(
        self,
    ):
        """As soon as the estimated_duration is negative, the request should be rejected."""
        video = factories.VideoFactory()
        self.assertIsNone(video.estimated_duration)

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        estimated_duration = timedelta(seconds=-1)
        data = {"estimated_duration": estimated_duration}
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "estimated_duration": [
                    "Ensure this value is greater than or equal to 0."
                ]
            },
        )
        video.refresh_from_db()
        self.assertIsNone(video.estimated_duration)

    def test_api_video_patch_detail_token_user_has_chat(self):
        """Instructors and administrators should be able to
        patch the chat flag of their video through the API."""
        video = factories.VideoFactory()
        self.assertTrue(video.has_chat)

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)
        data = {"has_chat": False}
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertFalse(video.has_chat)

    def test_api_video_patch_detail_token_user_has_live_media(self):
        """Instructors and administrators should be able to
        patch the live media flag of their video through the API."""
        video = factories.VideoFactory()
        self.assertTrue(video.has_live_media)

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)
        data = {"has_live_media": False}
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertFalse(video.has_live_media)

    def test_api_video_patch_by_organization_instructor(self):
        """Organization instructors cannot patch videos on the API."""
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.INSTRUCTOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist, title="existing title")

        jwt_token = UserAccessTokenFactory(user=user)

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

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

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
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)
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

                jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

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

        jwt_token = UserAccessTokenFactory(user=user)

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

        jwt_token = UserAccessTokenFactory(user=user)

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

        jwt_token = UserAccessTokenFactory(user=user)

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

        jwt_token = UserAccessTokenFactory(user=user)

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

        jwt_token = UserAccessTokenFactory(user=user)

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

        jwt_token = UserAccessTokenFactory(user=user)

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

        jwt_token = UserAccessTokenFactory(user=user)

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

                jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)
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
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)
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
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=videos[0])

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
        jwt_token = StudentLtiTokenFactory(resource=video)

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

        jwt_token = UserAccessTokenFactory(user=user)

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

        jwt_token = UserAccessTokenFactory(user=user)

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

        jwt_token = UserAccessTokenFactory(user=user)

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

        jwt_token = UserAccessTokenFactory(user=user)

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
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            permissions__can_update=False,
        )

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
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            permissions__can_update=False,
        )

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

        response = self.client.post(
            f"/api/videos/{video.id}/initiate-upload/",
            {"filename": "video_file", "mimetype": "", "size": 100},
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.json(), {"detail": "Authentication credentials were not provided."}
        )

    def test_api_video_instructor_initiate_upload_in_read_only(self):
        """An instructor with read_only set to true should not be able to initiate an upload."""
        video = factories.VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            permissions__can_update=False,
        )

        response = self.client.post(
            f"/api/videos/{video.id}/initiate-upload/",
            {"filename": "video_file", "mimetype": "", "size": 100},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_video_initiate_upload_token_user(self):
        """A token user associated to a video should be able to retrieve an upload policy."""
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        # Create another video to check that its upload state is unaffected
        other_video = factories.VideoFactory(
            upload_state=random.choice(["ready", "error"])
        )

        # Get the upload policy for this video
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-upload/",
                {"filename": "video_file", "mimetype": "", "size": 100},
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
            {"filename": "video_file", "mimetype": "", "size": 100},
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

            response = self.client.post(
                f"/api/videos/{video.id}/initiate-upload/",
                {"filename": "video_file", "mimetype": "", "size": 100},
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

        jwt_token = UserAccessTokenFactory(user=user)

        # Get the upload policy for this video
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-upload/",
                {"filename": "video_file", "mimetype": "", "size": 100},
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

        jwt_token = UserAccessTokenFactory(user=user)

        # Get the upload policy for this video
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-upload/",
                {"filename": "video_file", "mimetype": "", "size": 100},
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

        jwt_token = UserAccessTokenFactory(user=user)

        # Get the upload policy for this video
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-upload/",
                {"filename": "video_file", "mimetype": "", "size": 100},
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

        jwt_token = UserAccessTokenFactory(user=user)
        # Get the upload policy for this video
        # It should generate a key file with the Unix timestamp of the present time
        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-upload/",
                {"filename": "video_file", "mimetype": "", "size": 100},
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

    def test_api_video_initiate_upload_file_without_size(self):
        "With no size field provided, the request should fail"
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-upload/",
                {"filename": "video_file", "mimetype": ""},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"size": ["This field is required."]},
        )

    @override_settings(VIDEO_SOURCE_MAX_SIZE=10)
    def test_api_video_initiate_upload_file_too_large(self):
        """With a file size too large the request should fail"""
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            upload_state=random.choice(["ready", "error"]),
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-upload/",
                {"filename": "video_file", "mimetype": "", "size": 100},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"size": ["file too large, max size allowed is 10 Bytes"]},
        )

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
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            permissions__can_update=False,
        )

        response = self.client.post(
            f"/api/videos/{video.id}/initiate-live/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_video_student_initiate_live(self):
        """A student should not be able to initiate a live."""
        video = factories.VideoFactory()
        jwt_token = StudentLtiTokenFactory(resource=video)

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
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)
        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video"
        ) as mock_dispatch_video:
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-live/",
                {"type": "raw"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            video.refresh_from_db()
            mock_dispatch_video.assert_called_with(video, to_admin=True)

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "allow_recording": True,
                "description": video.description,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": None,
                "is_public": False,
                "is_ready_to_show": True,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "starting_at": None,
                "upload_state": "pending",
                "thumbnail": None,
                "timed_text_tracks": [],
                "urls": None,
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "recording_time": 0,
                "shared_live_medias": [],
                "live_state": "idle",
                "live_info": {},
                "xmpp": None,
                "live_type": "raw",
                "tags": [],
                "license": None,
            },
        )

    def test_api_video_instructor_initiate_live_with_playlist_token(self):
        """
        Initiate a live with playlist token.

        Used in the context of a lti select request (deep linking).
        """
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
        )
        jwt_token = PlaylistLtiTokenFactory(playlist=video.playlist)
        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video"
        ) as mock_dispatch_video:
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-live/",
                {"type": "raw"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            video.refresh_from_db()
            mock_dispatch_video.assert_called_with(video, to_admin=True)

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "allow_recording": True,
                "description": video.description,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": None,
                "is_public": False,
                "is_ready_to_show": True,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "starting_at": None,
                "upload_state": "pending",
                "thumbnail": None,
                "timed_text_tracks": [],
                "urls": None,
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "recording_time": 0,
                "shared_live_medias": [],
                "live_state": "idle",
                "live_info": {},
                "xmpp": None,
                "live_type": "raw",
                "tags": [],
                "license": None,
            },
        )

    def test_api_video_instructor_initiate_jitsi_live(self):
        """An instructor should be able to initiate a jitsi live."""
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video"
        ) as mock_dispatch_video:
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-live/",
                {"type": "jitsi"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            video.refresh_from_db()
            mock_dispatch_video.assert_called_with(video, to_admin=True)

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "allow_recording": True,
                "description": video.description,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": None,
                "is_public": False,
                "is_ready_to_show": True,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "starting_at": None,
                "upload_state": "pending",
                "thumbnail": None,
                "timed_text_tracks": [],
                "urls": None,
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "recording_time": 0,
                "shared_live_medias": [],
                "live_state": "idle",
                "live_info": {
                    "jitsi": {
                        "config_overwrite": {},
                        "domain": "meet.jit.si",
                        "external_api_url": "https://meet.jit.si/external_api.js",
                        "interface_config_overwrite": {},
                        "room_name": str(video.pk),
                    }
                },
                "live_type": JITSI,
                "xmpp": None,
                "tags": [],
                "license": None,
            },
        )

    @override_settings(JITSI_JWT_APP_ID="jitsi_app_id")
    @override_settings(JITSI_JWT_APP_SECRET="jitsi_jwt_app_secret")
    def test_api_video_instructor_initiate_jitsi_live_with_token(self):
        """Admin or instructor should be able to initiate a jitsi live and generate a token to
        connect to jitsi."""
        video = factories.VideoFactory(
            id="27a23f52-3379-46a2-94fa-697b59cfe3c7",
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        now = datetime(2022, 5, 4, tzinfo=timezone.utc)
        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video"
        ) as mock_dispatch_video, mock.patch.object(timezone, "now", return_value=now):
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-live/",
                {"type": "jitsi"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            video.refresh_from_db()
            mock_dispatch_video.assert_called_with(video, to_admin=True)

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content,
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "allow_recording": True,
                "description": video.description,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "id": str(video.id),
                "title": video.title,
                "active_stamp": None,
                "is_public": False,
                "is_ready_to_show": True,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "starting_at": None,
                "upload_state": "pending",
                "thumbnail": None,
                "timed_text_tracks": [],
                "urls": None,
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "recording_time": 0,
                "shared_live_medias": [],
                "live_state": "idle",
                "live_info": {
                    "jitsi": {
                        "config_overwrite": {},
                        "domain": "meet.jit.si",
                        "external_api_url": "https://meet.jit.si/external_api.js",
                        "interface_config_overwrite": {},
                        "room_name": str(video.pk),
                        "token": (
                            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb250ZXh0Ijp7InVzZXIiOnsiYW"
                            "ZmaWxpYXRpb24iOiJvd25lciJ9fSwiZXhwIjoxNjUxNjIzMDAwLCJpYXQiOjE2NTE2M"
                            "jI0MDAsIm1vZGVyYXRvciI6dHJ1ZSwiYXVkIjoiaml0c2kiLCJpc3MiOiJqaXRzaV9h"
                            "cHBfaWQiLCJzdWIiOiJtZWV0LmppdC5zaSIsInJvb20iOiIyN2EyM2Y1Mi0zMzc5LTQ"
                            "2YTItOTRmYS02OTdiNTljZmUzYzcifQ.JxHCJ4VKfvtEliTyNnR0sj2LGLOUQAcEnmi"
                            "q-vi_MDA"
                        ),
                    }
                },
                "live_type": JITSI,
                "xmpp": None,
                "tags": [],
                "license": None,
            },
        )
