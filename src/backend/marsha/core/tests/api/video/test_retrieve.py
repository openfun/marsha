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
