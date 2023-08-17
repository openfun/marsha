"""Tests for the SharedLiveMedia retrieve API of the Marsha project."""
from datetime import datetime, timezone as baseTimezone
import json
import random
from unittest import mock

from django.test import TestCase, override_settings

from marsha.core import defaults
from marsha.core.api import timezone
from marsha.core.factories import (
    OrganizationAccessFactory,
    OrganizationFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
    SharedLiveMediaFactory,
    UserFactory,
    VideoFactory,
)
from marsha.core.models import SharedLiveMedia
from marsha.core.models.account import ADMINISTRATOR, INSTRUCTOR
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)
from marsha.core.tests.testing_utils import RSA_KEY_MOCK


class SharedLiveMediaRetrieveAPITest(TestCase):
    """Test the retrieve API of the shared live media object."""

    def _get_url(self, video, shared_live_media):
        """Return the url to use in tests."""
        return f"/api/videos/{video.pk}/sharedlivemedias/{shared_live_media.pk}/"

    maxDiff = None

    def test_api_shared_live_media_read_detail_anonymous(self):
        """An anonymous user can not read a shared live media detail"""
        shared_live_media = SharedLiveMediaFactory()

        response = self.client.get(
            self._get_url(shared_live_media.video, shared_live_media)
        )

        self.assertEqual(response.status_code, 401)

    def test_api_shared_live_media_read_detail_student_not_ready_to_show(self):
        """A student can read a shared live media details not ready to show."""
        shared_live_media = SharedLiveMediaFactory(
            upload_state=defaults.PENDING,
            uploaded_on=None,
            nb_pages=None,
        )

        jwt_token = StudentLtiTokenFactory(playlist=shared_live_media.video.playlist)

        response = self.client.get(
            self._get_url(shared_live_media.video, shared_live_media),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "id": str(shared_live_media.id),
                "active_stamp": None,
                "filename": None,
                "is_ready_to_show": False,
                "nb_pages": None,
                "show_download": True,
                "title": None,
                "upload_state": "pending",
                "urls": None,
                "video": str(shared_live_media.video.id),
            },
        )

    def test_api_shared_live_media_read_detail_student_ready_to_show(self):
        """A student can read shared live media detail ready to show."""
        shared_live_media = SharedLiveMediaFactory(
            id="7520c16b-5846-41ca-822b-52b446a96809",
            extension="pdf",
            title="python structures",
            upload_state=defaults.PENDING,
            uploaded_on=datetime(2021, 11, 30, tzinfo=baseTimezone.utc),
            nb_pages=3,
            video__id="d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb",
        )

        jwt_token = StudentLtiTokenFactory(playlist=shared_live_media.video.playlist)

        response = self.client.get(
            self._get_url(shared_live_media.video, shared_live_media),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "id": str(shared_live_media.id),
                "active_stamp": "1638230400",
                "filename": "python-structures.pdf",
                "is_ready_to_show": True,
                "nb_pages": 3,
                "show_download": True,
                "title": "python structures",
                "upload_state": "pending",
                "urls": {
                    "pages": {
                        "1": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                            "sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/1638230400_"
                            "1.svg"
                        ),
                        "2": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                            "sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/1638230400_"
                            "2.svg"
                        ),
                        "3": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                            "sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/1638230400_"
                            "3.svg"
                        ),
                    }
                },
                "video": str(shared_live_media.video.id),
            },
        )

    @override_settings(
        CLOUDFRONT_SIGNED_URLS_ACTIVE=True,
        CLOUDFRONT_SIGNED_PUBLIC_KEY_ID="cloudfront-access-key-id",
    )
    def test_api_shared_live_media_read_detail_student_ready_to_show_and_signed_url_active(
        self,
    ):
        """A student can read shared live media detail ready to show and urls are signed."""
        shared_live_media = SharedLiveMediaFactory(
            id="7520c16b-5846-41ca-822b-52b446a96809",
            extension="pdf",
            title="python structures",
            upload_state=defaults.READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=baseTimezone.utc),
            nb_pages=3,
            video__id="d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb",
        )

        jwt_token = StudentLtiTokenFactory(playlist=shared_live_media.video.playlist)

        # fix the time so that the url signature is deterministic and can be checked
        now = datetime(2021, 11, 30, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "builtins.open", new_callable=mock.mock_open, read_data=RSA_KEY_MOCK
        ):
            response = self.client.get(
                self._get_url(shared_live_media.video, shared_live_media),
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 200)

        expected_cloudfront_signture = (
            "Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6L"
            "y9hYmMuY2xvdWRmcm9udC5uZXQvZDlkNzA0OWMtNWEzZi00MDcwLWE0OTQtZTZiZj"
            "BiZDhiOWZiLyoiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9"
            "jaFRpbWUiOjE2MzgyMzc2MDB9fX1dfQ__&Signature=IVWMFfS7WQVTKLZl~gKgG"
            "ES~BS~wVLBIOncSE6yVgg9zIrEI1Epq3AVkOsI7z10dyjgInNbPviArnxmlV~DQeN"
            "-ykgEWmGy7aT4lRCx61oXuHFtNkq8Qx-we~UY87mZ4~UTqmM~JVuuLduMiRQB-I3X"
            "KaRQGRlsok5yGu0RhvLcZntVFp6QgYui3WtGvxSs2LjW0IakR1qepSDl9LXI-F2bg"
            "l9Vd1U9eapPBhhoD0okebXm7NGg9gUMLXlmUo-RvsrAzzEteKctPp0Xzkydk~tcnM"
            "kJs4jfbQxKrpyF~N9OuCRYCs68ONhHvypOYU3K-wQEoAFlERBLiaOzDZUzlyA__&K"
            "ey-Pair-Id=cloudfront-access-key-id"
        )

        content = json.loads(response.content)
        self.assertEqual(
            content,
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
                    "media": (
                        "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/s"
                        "haredlivemedia/7520c16b-5846-41ca-822b-52b446a96809/1638230400.pd"
                        "f?response-content-disposition=attachment%3B+filename%3Dpython-st"
                        f"ructures.pdf&{expected_cloudfront_signture}"
                    ),
                    "pages": {
                        "1": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                            "fb/sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/16382"
                            f"30400_1.svg?{expected_cloudfront_signture}"
                        ),
                        "2": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                            "fb/sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/16382"
                            f"30400_2.svg?{expected_cloudfront_signture}"
                        ),
                        "3": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                            "fb/sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/16382"
                            f"30400_3.svg?{expected_cloudfront_signture}"
                        ),
                    },
                },
                "video": str(shared_live_media.video.id),
            },
        )

    @override_settings(
        CLOUDFRONT_SIGNED_URLS_ACTIVE=True,
        CLOUDFRONT_SIGNED_PUBLIC_KEY_ID="cloudfront-access-key-id",
    )
    def test_api_shared_live_media_read_detail_student_ready_to_show_and_show_download_off(
        self,
    ):
        """
        A student can read shared live media detail ready to show with signed urls activated
        but show download deactivated.
        """
        shared_live_media = SharedLiveMediaFactory(
            id="7520c16b-5846-41ca-822b-52b446a96809",
            extension="pdf",
            show_download=False,
            title="python structures",
            upload_state=defaults.READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=baseTimezone.utc),
            nb_pages=3,
            video__id="d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb",
        )

        jwt_token = StudentLtiTokenFactory(playlist=shared_live_media.video.playlist)

        # fix the time so that the url signature is deterministic and can be checked
        now = datetime(2021, 11, 30, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "builtins.open", new_callable=mock.mock_open, read_data=RSA_KEY_MOCK
        ):
            response = self.client.get(
                self._get_url(shared_live_media.video, shared_live_media),
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 200)

        expect_cloudfront_signature = (
            "Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9hY"
            "mMuY2xvdWRmcm9udC5uZXQvZDlkNzA0OWMtNWEzZi00MDcwLWE0OTQtZTZiZjBi"
            "ZDhiOWZiLyoiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9"
            "jaFRpbWUiOjE2MzgyMzc2MDB9fX1dfQ__&Signature=IVWMFfS7WQVTKLZl~gK"
            "gGES~BS~wVLBIOncSE6yVgg9zIrEI1Epq3AVkOsI7z10dyjgInNbPviArnxmlV~"
            "DQeN-ykgEWmGy7aT4lRCx61oXuHFtNkq8Qx-we~UY87mZ4~UTqmM~JVuuLduMiR"
            "QB-I3XKaRQGRlsok5yGu0RhvLcZntVFp6QgYui3WtGvxSs2LjW0IakR1qepSDl9"
            "LXI-F2bgl9Vd1U9eapPBhhoD0okebXm7NGg9gUMLXlmUo-RvsrAzzEteKctPp0X"
            "zkydk~tcnMkJs4jfbQxKrpyF~N9OuCRYCs68ONhHvypOYU3K-wQEoAFlERBLiaO"
            "zDZUzlyA__&Key-Pair-Id=cloudfront-access-key-id"
        )

        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "id": str(shared_live_media.id),
                "active_stamp": "1638230400",
                "filename": "python-structures.pdf",
                "is_ready_to_show": True,
                "nb_pages": 3,
                "show_download": False,
                "title": "python structures",
                "upload_state": "ready",
                "urls": {
                    "pages": {
                        "1": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                            "sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/1638230400"
                            f"_1.svg?{expect_cloudfront_signature}"
                        ),
                        "2": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                            "sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/1638230400_"
                            f"2.svg?{expect_cloudfront_signature}"
                        ),
                        "3": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                            "sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/1638230400"
                            f"_3.svg?{expect_cloudfront_signature}"
                        ),
                    },
                },
                "video": str(shared_live_media.video.id),
            },
        )

    def test_api_shared_live_media_read_detail_instructor_not_ready_to_show(self):
        """An instructor can read a shared live media details not ready to show."""
        shared_live_media = SharedLiveMediaFactory(
            upload_state=defaults.PENDING,
            uploaded_on=None,
            nb_pages=None,
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=shared_live_media.video.playlist,
            permissions__can_update=False,
        )

        response = self.client.get(
            self._get_url(shared_live_media.video, shared_live_media),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "id": str(shared_live_media.id),
                "active_stamp": None,
                "filename": None,
                "is_ready_to_show": False,
                "nb_pages": None,
                "show_download": True,
                "title": None,
                "upload_state": "pending",
                "urls": None,
                "video": str(shared_live_media.video.id),
            },
        )

    def test_api_shared_live_media_read_detail_instructor_ready_to_show(self):
        """An instructor can read shared live media details ready to show."""
        shared_live_media = SharedLiveMediaFactory(
            id="7520c16b-5846-41ca-822b-52b446a96809",
            extension="pdf",
            title="python compound statements",
            upload_state=defaults.PENDING,
            uploaded_on=datetime(2021, 11, 30, tzinfo=baseTimezone.utc),
            nb_pages=3,
            video__id="d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb",
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=shared_live_media.video.playlist,
            permissions__can_update=False,
        )

        response = self.client.get(
            self._get_url(shared_live_media.video, shared_live_media),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "id": str(shared_live_media.id),
                "active_stamp": "1638230400",
                "filename": "python-compound-statements.pdf",
                "is_ready_to_show": True,
                "nb_pages": 3,
                "show_download": True,
                "title": "python compound statements",
                "upload_state": "pending",
                "urls": {
                    "pages": {
                        "1": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                            "sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/1638230400_"
                            "1.svg"
                        ),
                        "2": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                            "sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/1638230400_"
                            "2.svg"
                        ),
                        "3": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                            "sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/1638230400_"
                            "3.svg"
                        ),
                    },
                },
                "video": str(shared_live_media.video.id),
            },
        )

    @override_settings(
        CLOUDFRONT_SIGNED_URLS_ACTIVE=True,
        CLOUDFRONT_SIGNED_PUBLIC_KEY_ID="cloudfront-access-key-id",
    )
    def test_api_shared_live_media_read_detail_instructor_ready_to_show_and_signed_url_on(
        self,
    ):
        """An instructor can read shared live media details ready to show and urls are signed."""
        shared_live_media = SharedLiveMediaFactory(
            id="7520c16b-5846-41ca-822b-52b446a96809",
            extension="pdf",
            title="python compound statements",
            upload_state=defaults.PENDING,
            uploaded_on=datetime(2021, 11, 30, tzinfo=baseTimezone.utc),
            nb_pages=3,
            video__id="d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb",
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=shared_live_media.video.playlist,
            permissions__can_update=False,
        )

        # fix the time so that the url signature is deterministic and can be checked
        now = datetime(2021, 11, 30, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "builtins.open", new_callable=mock.mock_open, read_data=RSA_KEY_MOCK
        ):
            response = self.client.get(
                self._get_url(shared_live_media.video, shared_live_media),
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 200)

        expected_cloudfront_signature = (
            "Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNl"
            "IjoiaHR0cHM6Ly9hYmMuY2xvdWRmcm9udC5uZXQvZDlkNzA0OWMtNWEzZi00MDcw"
            "LWE0OTQtZTZiZjBiZDhiOWZiLyoiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFu"
            "Ijp7IkFXUzpFcG9jaFRpbWUiOjE2MzgyMzc2MDB9fX1dfQ__&Signature=IVWMF"
            "fS7WQVTKLZl~gKgGES~BS~wVLBIOncSE6yVgg9zIrEI1Epq3AVkOsI7z10dyjgIn"
            "NbPviArnxmlV~DQeN-ykgEWmGy7aT4lRCx61oXuHFtNkq8Qx-we~UY87mZ4~UTqm"
            "M~JVuuLduMiRQB-I3XKaRQGRlsok5yGu0RhvLcZntVFp6QgYui3WtGvxSs2LjW0I"
            "akR1qepSDl9LXI-F2bgl9Vd1U9eapPBhhoD0okebXm7NGg9gUMLXlmUo-RvsrAzz"
            "EteKctPp0Xzkydk~tcnMkJs4jfbQxKrpyF~N9OuCRYCs68ONhHvypOYU3K-wQEoA"
            "FlERBLiaOzDZUzlyA__&Key-Pair-Id=cloudfront-access-key-id"
        )

        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "id": str(shared_live_media.id),
                "active_stamp": "1638230400",
                "filename": "python-compound-statements.pdf",
                "is_ready_to_show": True,
                "nb_pages": 3,
                "show_download": True,
                "title": "python compound statements",
                "upload_state": "pending",
                "urls": {
                    "media": (
                        "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                        "sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/1638230400."
                        "pdf?response-content-disposition=attachment%3B+filename%3Dpython"
                        f"-compound-statements.pdf&{expected_cloudfront_signature}"
                    ),
                    "pages": {
                        "1": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                            "fb/sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/16382"
                            f"30400_1.svg?{expected_cloudfront_signature}"
                        ),
                        "2": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                            "fb/sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/16382"
                            f"30400_2.svg?{expected_cloudfront_signature}"
                        ),
                        "3": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                            "fb/sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/16382"
                            f"30400_3.svg?{expected_cloudfront_signature}"
                        ),
                    },
                },
                "video": str(shared_live_media.video.id),
            },
        )

    def test_api_shared_live_media_read_detail_other_video(self):
        """Reading a shared live media from an other video should fail."""
        shared_live_media = SharedLiveMediaFactory()
        other_video = VideoFactory()

        jwt_token = StudentLtiTokenFactory(
            playlist=other_video.playlist,
            roles=[random.choice(["instructor", "administrator", "student"])],
        )

        response = self.client.get(
            self._get_url(shared_live_media.video, shared_live_media),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_read_detail_staff_or_user(self):
        """Users authenticated via a session shouldn't be able to read a shared live medias."""
        shared_live_media = SharedLiveMediaFactory()
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            response = self.client.get(
                f"/api/videos/{shared_live_media.video.id}/"
                f"sharedlivemedias/{shared_live_media.id}/"
            )
            self.assertEqual(response.status_code, 401)

    def test_api_shared_live_media_read_detail_by_user_with_no_access(self):
        """
        Token user without any access read a shared live media for a video.

        A user with a user token, without any specific access, cannot read a shared live
        media for any given video.
        """
        shared_live_media = SharedLiveMediaFactory()
        jwt_token = UserAccessTokenFactory()

        response = self.client.get(
            self._get_url(shared_live_media.video, shared_live_media),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_read_detail_by_video_playlist_instructor(self):
        """
        Playlist instructor token user read a shared live media for a video.

        A user with a user token, who is a playlist instructor, can read a shared
        live media for a video that belongs to that playlist.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = PlaylistFactory()
        video = VideoFactory(playlist=playlist)
        shared_live_media = SharedLiveMediaFactory(video=video)
        PlaylistAccessFactory(user=user, playlist=playlist, role=INSTRUCTOR)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            self._get_url(shared_live_media.video, shared_live_media),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "id": str(SharedLiveMedia.objects.first().id),
                "active_stamp": None,
                "filename": None,
                "is_ready_to_show": False,
                "nb_pages": shared_live_media.nb_pages,
                "show_download": True,
                "title": None,
                "upload_state": "pending",
                "urls": None,
                "video": str(video.id),
            },
        )

    def test_api_shared_live_media_read_detail_by_video_playlist_admin(self):
        """
        Playlist administrator token user read a shared live media for a video.

        A user with a user token, who is a playlist administrator, can read a shared
        live media for a video that belongs to that playlist.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = PlaylistFactory()
        video = VideoFactory(playlist=playlist)
        shared_live_media = SharedLiveMediaFactory(video=video)
        PlaylistAccessFactory(user=user, playlist=playlist, role=ADMINISTRATOR)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            self._get_url(shared_live_media.video, shared_live_media),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "id": str(SharedLiveMedia.objects.first().id),
                "active_stamp": None,
                "filename": None,
                "is_ready_to_show": False,
                "nb_pages": shared_live_media.nb_pages,
                "show_download": True,
                "title": None,
                "upload_state": "pending",
                "urls": None,
                "video": str(video.id),
            },
        )

    def test_api_shared_live_media_read_detail_by_video_organization_instructor(self):
        """
        Organization instructor token user read a shared live media for a video.

        A user with a user token, who is an organization instructor, cannot read a shared
        live media for a video that belongs to that organization.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        organization = OrganizationFactory()
        playlist = PlaylistFactory(organization=organization)
        video = VideoFactory(playlist=playlist)
        shared_live_media = SharedLiveMediaFactory(video=video)
        OrganizationAccessFactory(user=user, organization=organization, role=INSTRUCTOR)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            self._get_url(shared_live_media.video, shared_live_media),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_read_detail_by_video_organization_admin(self):
        """
        Organization administrator token user read a shared live media for a video.

        A user with a user token, who is an organization administrator, can read a shared
        live media for a video that belongs to that organization.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        organization = OrganizationFactory()
        playlist = PlaylistFactory(organization=organization)
        video = VideoFactory(playlist=playlist)
        shared_live_media = SharedLiveMediaFactory(video=video)
        OrganizationAccessFactory(
            user=user, organization=organization, role=ADMINISTRATOR
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            self._get_url(shared_live_media.video, shared_live_media),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "id": str(SharedLiveMedia.objects.first().id),
                "active_stamp": None,
                "filename": None,
                "is_ready_to_show": False,
                "nb_pages": shared_live_media.nb_pages,
                "show_download": True,
                "title": None,
                "upload_state": "pending",
                "urls": None,
                "video": str(video.id),
            },
        )
