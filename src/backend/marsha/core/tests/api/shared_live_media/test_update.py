"""Tests for the SharedLiveMedia API of the Marsha project."""
from datetime import datetime
import json
import random
from unittest import mock

from django.test import TestCase, override_settings

from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)

from .. import defaults
from ..api import timezone
from ..factories import (
    OrganizationAccessFactory,
    OrganizationFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
    SharedLiveMediaFactory,
    UserFactory,
    VideoFactory,
)
from ..models import SharedLiveMedia
from ..models.account import ADMINISTRATOR, INSTRUCTOR
from .utils import RSA_KEY_MOCK


# We don't enforce arguments documentation in tests
# pylint: disable=too-many-lines


class SharedLiveMediaAPITest(TestCase):
    """Test the API of the shared live media object."""

    maxDiff = None

    def test_api_shared_live_media_create_anonymous(self):
        """An anonymous user can't create a shared live media."""
        response = self.client.post("/api/sharedlivemedias/")
        self.assertEqual(response.status_code, 401)
        self.assertFalse(SharedLiveMedia.objects.exists())

    def test_api_shared_live_media_create_instructor(self):
        """An instructor should be able to create a shared live media for an existing video."""

        video = VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        response = self.client.post(
            "/api/sharedlivemedias/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(SharedLiveMedia.objects.count(), 1)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "id": str(SharedLiveMedia.objects.first().id),
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
        )

    def test_api_shared_live_media_create_instructor_in_read_only(self):
        """An instructor in read only should not be able to create a shared live media."""
        video = VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            permissions__can_update=False,
        )

        response = self.client.post(
            "/api/sharedlivemedias/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(SharedLiveMedia.objects.exists())

    def test_api_shared_live_media_create_student(self):
        """A student should not be able to create a shared live media."""
        video = VideoFactory()
        jwt_token = StudentLtiTokenFactory(resource=video)

        response = self.client.post(
            "/api/sharedlivemedias/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(SharedLiveMedia.objects.exists())

    def test_api_shared_live_media_create_staff_or_user(self):
        """Users authenticated via a session shouldn't be able to create new shared live medias."""
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            response = self.client.post("/api/sharedlivemedias/")
            self.assertEqual(response.status_code, 401)
            self.assertFalse(SharedLiveMedia.objects.exists())

    def test_api_shared_live_media_create_by_user_with_no_access(self):
        """
        Token user without any access creates a shared live media for a video.

        A user with a user token, without any specific access, cannot create a shared live
        media for any given video.
        """
        video = VideoFactory()

        jwt_token = UserAccessTokenFactory()

        response = self.client.post(
            "/api/sharedlivemedias/",
            {"video": str(video.id)},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(SharedLiveMedia.objects.count(), 0)

    def test_api_shared_live_media_create_by_video_playlist_instructor(self):
        """
        Playlist instructor token user creates a shared live media for a video.

        A user with a user token, who is a playlist instructor, cannot create a shared
        live media for a video that belongs to that playlist.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = PlaylistFactory()
        video = VideoFactory(playlist=playlist)
        PlaylistAccessFactory(user=user, playlist=playlist, role=INSTRUCTOR)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            "/api/sharedlivemedias/",
            {"video": str(video.id)},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(SharedLiveMedia.objects.count(), 0)

    def test_api_shared_live_media_create_by_video_playlist_admin(self):
        """
        Playlist administrator token user creates a shared live media for a video.

        A user with a user token, who is a playlist administrator, can create a shared
        live media for a video that belongs to that playlist.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = PlaylistFactory()
        video = VideoFactory(playlist=playlist)
        PlaylistAccessFactory(user=user, playlist=playlist, role=ADMINISTRATOR)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            "/api/sharedlivemedias/",
            {"video": str(video.id)},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(SharedLiveMedia.objects.count(), 1)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "id": str(SharedLiveMedia.objects.first().id),
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
        )

    def test_api_shared_live_media_create_by_video_organization_instructor(self):
        """
        Organization instructor token user creates a shared live media for a video.

        A user with a user token, who is an organization instructor, cannot create a shared
        live media for a video that belongs to that organization.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        organization = OrganizationFactory()
        playlist = PlaylistFactory(organization=organization)
        video = VideoFactory(playlist=playlist)
        OrganizationAccessFactory(user=user, organization=organization, role=INSTRUCTOR)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            "/api/sharedlivemedias/",
            {"video": str(video.id)},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(SharedLiveMedia.objects.count(), 0)

    def test_api_shared_live_media_create_by_video_organization_admin(self):
        """
        Organization administrator token user creates a shared live media for a video.

        A user with a user token, who is an organization administrator, can create a shared
        live media for a video that belongs to that organization.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        organization = OrganizationFactory()
        playlist = PlaylistFactory(organization=organization)
        video = VideoFactory(playlist=playlist)
        OrganizationAccessFactory(
            user=user, organization=organization, role=ADMINISTRATOR
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            "/api/sharedlivemedias/",
            {"video": str(video.id)},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)

        self.assertEqual(SharedLiveMedia.objects.count(), 1)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "id": str(SharedLiveMedia.objects.first().id),
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
        )

    def test_api_shared_live_media_read_detail_anonymous(self):
        """An anonymous user can not read a shared live media detail"""
        shared_live_media = SharedLiveMediaFactory()

        response = self.client.get(f"/api/sharedlivemedias/{shared_live_media.pk}/")

        self.assertEqual(response.status_code, 401)

    def test_api_shared_live_media_read_detail_student_not_ready_to_show(self):
        """A student can read a shared live media details not ready to show."""
        shared_live_media = SharedLiveMediaFactory(
            upload_state=defaults.PENDING,
            uploaded_on=None,
            nb_pages=None,
        )

        jwt_token = StudentLtiTokenFactory(resource=shared_live_media.video)

        response = self.client.get(
            f"/api/sharedlivemedias/{shared_live_media.pk}/",
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
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=3,
            video__id="d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb",
        )

        jwt_token = StudentLtiTokenFactory(resource=shared_live_media.video)

        response = self.client.get(
            f"/api/sharedlivemedias/{shared_live_media.pk}/",
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
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=3,
            video__id="d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb",
        )

        jwt_token = StudentLtiTokenFactory(resource=shared_live_media.video)

        # fix the time so that the url signature is deterministic and can be checked
        now = datetime(2021, 11, 30, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "builtins.open", new_callable=mock.mock_open, read_data=RSA_KEY_MOCK
        ):
            response = self.client.get(
                f"/api/sharedlivemedias/{shared_live_media.pk}/",
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
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=3,
            video__id="d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb",
        )

        jwt_token = StudentLtiTokenFactory(resource=shared_live_media.video)

        # fix the time so that the url signature is deterministic and can be checked
        now = datetime(2021, 11, 30, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "builtins.open", new_callable=mock.mock_open, read_data=RSA_KEY_MOCK
        ):
            response = self.client.get(
                f"/api/sharedlivemedias/{shared_live_media.pk}/",
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
            resource=shared_live_media.video,
            permissions__can_update=False,
        )

        response = self.client.get(
            f"/api/sharedlivemedias/{shared_live_media.pk}/",
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
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=3,
            video__id="d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb",
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=shared_live_media.video,
            permissions__can_update=False,
        )

        response = self.client.get(
            f"/api/sharedlivemedias/{shared_live_media.pk}/",
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
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=3,
            video__id="d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb",
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=shared_live_media.video,
            permissions__can_update=False,
        )

        # fix the time so that the url signature is deterministic and can be checked
        now = datetime(2021, 11, 30, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "builtins.open", new_callable=mock.mock_open, read_data=RSA_KEY_MOCK
        ):
            response = self.client.get(
                f"/api/sharedlivemedias/{shared_live_media.pk}/",
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
            resource=other_video,
            roles=[random.choice(["instructor", "administrator", "student"])],
        )

        response = self.client.get(
            f"/api/sharedlivemedias/{shared_live_media.pk}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_read_detail_staff_or_user(self):
        """Users authenticated via a session shouldn't be able to read a shared live medias."""
        shared_live_media = SharedLiveMediaFactory()
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            response = self.client.get(f"/api/sharedlivemedias/{shared_live_media.id}/")
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
            f"/api/sharedlivemedias/{shared_live_media.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_read_detail_by_video_playlist_instructor(self):
        """
        Playlist instructor token user read a shared live media for a video.

        A user with a user token, who is a playlist instructor, cannot read a shared
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
            f"/api/sharedlivemedias/{shared_live_media.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

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
            f"/api/sharedlivemedias/{shared_live_media.id}/",
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
            f"/api/sharedlivemedias/{shared_live_media.id}/",
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
            f"/api/sharedlivemedias/{shared_live_media.id}/",
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

    def test_api_shared_live_media_list_anonymous(self):
        """An anonymous user can not list shared live medias."""
        SharedLiveMediaFactory.create_batch(2)

        response = self.client.get("/api/sharedlivemedias/")

        self.assertEqual(response.status_code, 401)

    def test_api_shared_live_media_list_student(self):
        """A student can not list shared live medias details."""
        video = VideoFactory()
        SharedLiveMediaFactory(
            upload_state=defaults.PENDING, uploaded_on=None, nb_pages=None, video=video
        )
        SharedLiveMediaFactory(
            upload_state=defaults.READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=5,
            video=video,
        )
        # This shared_live_media belongs to an other video
        SharedLiveMediaFactory(
            upload_state=defaults.READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=3,
        )

        jwt_token = StudentLtiTokenFactory(resource=video)

        response = self.client.get(
            "/api/sharedlivemedias/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_list_instructor(self):
        """An instructor can list shared live media details."""
        video = VideoFactory()
        shared_live_media = SharedLiveMediaFactory(
            upload_state=defaults.PENDING, uploaded_on=None, nb_pages=None, video=video
        )
        shared_live_media2 = SharedLiveMediaFactory(
            extension="pdf",
            title="python expressions",
            upload_state=defaults.READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=3,
            video=video,
        )

        # This shared_live_media belongs to an other video and should not be in the
        # payload response
        SharedLiveMediaFactory(
            upload_state=defaults.READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=3,
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        response = self.client.get(
            "/api/sharedlivemedias/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "count": 2,
                "next": None,
                "previous": None,
                "results": [
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
                        "video": str(video.id),
                    },
                    {
                        "id": str(shared_live_media2.id),
                        "active_stamp": "1638230400",
                        "filename": "python-expressions.pdf",
                        "is_ready_to_show": True,
                        "nb_pages": 3,
                        "show_download": True,
                        "title": "python expressions",
                        "upload_state": "ready",
                        "urls": {
                            "pages": {
                                "1": (
                                    f"https://abc.cloudfront.net/{video.id}/"
                                    f"sharedlivemedia/{shared_live_media2.id}/1638230400_1.svg"
                                ),
                                "2": (
                                    f"https://abc.cloudfront.net/{video.id}/"
                                    f"sharedlivemedia/{shared_live_media2.id}/1638230400_2.svg"
                                ),
                                "3": (
                                    f"https://abc.cloudfront.net/{video.id}/"
                                    f"sharedlivemedia/{shared_live_media2.id}/1638230400_3.svg"
                                ),
                            }
                        },
                        "video": str(video.id),
                    },
                ],
            },
        )

    def test_api_shared_live_media_list_instructor_other_video(self):
        """
        An instructor trying to list an other video than the one in the token
        should have no result.
        """
        video = VideoFactory()
        SharedLiveMediaFactory(
            upload_state=defaults.PENDING, uploaded_on=None, nb_pages=None, video=video
        )
        SharedLiveMediaFactory(
            upload_state=defaults.READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=3,
            video=video,
        )

        # This shared_live_media belongs to an other video, requesting this video
        # in the query parameters should not return result at all
        other_video = VideoFactory()
        SharedLiveMediaFactory(
            upload_state=defaults.READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=3,
            video=other_video,
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        response = self.client.get(
            f"/api/sharedlivemedias/?video={other_video.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "count": 0,
                "next": None,
                "previous": None,
                "results": [],
            },
        )

    @override_settings(
        CLOUDFRONT_SIGNED_URLS_ACTIVE=True,
        CLOUDFRONT_SIGNED_PUBLIC_KEY_ID="cloudfront-access-key-id",
    )
    def test_api_shared_live_media_list_instructor_ready_to_show_and_signed_url_active(
        self,
    ):
        """An instructor can list shared live media details ready to show and signed url on."""
        video = VideoFactory(id="d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb")
        shared_live_media = SharedLiveMediaFactory(
            id="7520c16b-5846-41ca-822b-52b446a96809",
            extension="pdf",
            title="python expressions",
            upload_state=defaults.READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=3,
            video=video,
        )
        shared_live_media2 = SharedLiveMediaFactory(
            upload_state=defaults.PENDING, uploaded_on=None, nb_pages=None, video=video
        )

        # This shared_live_media belongs to an other video and should not be in the
        # payload response
        SharedLiveMediaFactory(
            upload_state=defaults.READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=3,
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        # fix the time so that the url signature is deterministic and can be checked
        now = datetime(2021, 11, 30, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "builtins.open", new_callable=mock.mock_open, read_data=RSA_KEY_MOCK
        ):
            response = self.client.get(
                "/api/sharedlivemedias/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 200)

        expected_cloudfront_signature = (
            "Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0"
            "cHM6Ly9hYmMuY2xvdWRmcm9udC5uZXQvZDlkNzA0OWMtNWEzZi00MDcwLWE0OTQt"
            "ZTZiZjBiZDhiOWZiLyoiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFX"
            "UzpFcG9jaFRpbWUiOjE2MzgyMzc2MDB9fX1dfQ__&Signature=IVWMFfS7WQVTK"
            "LZl~gKgGES~BS~wVLBIOncSE6yVgg9zIrEI1Epq3AVkOsI7z10dyjgInNbPviArn"
            "xmlV~DQeN-ykgEWmGy7aT4lRCx61oXuHFtNkq8Qx-we~UY87mZ4~UTqmM~JVuuLd"
            "uMiRQB-I3XKaRQGRlsok5yGu0RhvLcZntVFp6QgYui3WtGvxSs2LjW0IakR1qepS"
            "Dl9LXI-F2bgl9Vd1U9eapPBhhoD0okebXm7NGg9gUMLXlmUo-RvsrAzzEteKctPp"
            "0Xzkydk~tcnMkJs4jfbQxKrpyF~N9OuCRYCs68ONhHvypOYU3K-wQEoAFlERBLia"
            "OzDZUzlyA__&Key-Pair-Id=cloudfront-access-key-id"
        )

        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "count": 2,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "id": str(shared_live_media.id),
                        "active_stamp": "1638230400",
                        "filename": "python-expressions.pdf",
                        "is_ready_to_show": True,
                        "nb_pages": 3,
                        "show_download": True,
                        "title": "python expressions",
                        "upload_state": "ready",
                        "urls": {
                            "media": (
                                "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                                "sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/1638230400."
                                "pdf?response-content-disposition=attachment%3B+filename%3Dpython"
                                f"-expressions.pdf&{expected_cloudfront_signature}"
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
                        "video": str(video.id),
                    },
                    {
                        "id": str(shared_live_media2.id),
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
                ],
            },
        )

    def test_api_shared_live_media_list_staff_or_user(self):
        """Users authenticated via a session shouldn't be able to list shared live medias."""
        SharedLiveMediaFactory.create_batch(2)
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            response = self.client.get("/api/sharedlivemedias/")
            self.assertEqual(response.status_code, 401)

    def test_api_shared_live_media_list_by_user_with_no_access(self):
        """
        Token user without any access list shared live medias for a video.

        A user with a user token, without any specific access, cannot list shared live
        medias for any given video.
        """
        SharedLiveMediaFactory.create_batch(2)
        jwt_token = UserAccessTokenFactory()

        response = self.client.get(
            "/api/sharedlivemedias/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_list_by_video_playlist_instructor(self):
        """
        Playlist instructor token user list shared live medias for a video.

        A user with a user token, who is a playlist instructor, cannot list shared
        live medias for a video that belongs to that playlist.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = PlaylistFactory()
        video = VideoFactory(playlist=playlist)
        SharedLiveMediaFactory(video=video)
        PlaylistAccessFactory(user=user, playlist=playlist, role=INSTRUCTOR)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            "/api/sharedlivemedias/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_list_by_video_playlist_admin(self):
        """
        Playlist administrator token user list shared live medias for a video.

        A user with a user token, who is a playlist administrator, can list shared
        live media for a video that belongs to that playlist.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = PlaylistFactory()
        video = VideoFactory(playlist=playlist)
        shared_live_media = SharedLiveMediaFactory(
            upload_state=defaults.PENDING, uploaded_on=None, nb_pages=None, video=video
        )
        shared_live_media2 = SharedLiveMediaFactory(
            extension="pdf",
            title="python extensions",
            upload_state=defaults.READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=3,
            video=video,
        )

        # This shared_live_media belongs to an other video and should not be in the
        # payload response
        SharedLiveMediaFactory(
            upload_state=defaults.READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=5,
        )
        PlaylistAccessFactory(user=user, playlist=playlist, role=ADMINISTRATOR)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/sharedlivemedias/?video={video.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "count": 2,
                "next": None,
                "previous": None,
                "results": [
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
                        "video": str(video.id),
                    },
                    {
                        "id": str(shared_live_media2.id),
                        "active_stamp": "1638230400",
                        "filename": "python-extensions.pdf",
                        "is_ready_to_show": True,
                        "nb_pages": 3,
                        "show_download": True,
                        "title": "python extensions",
                        "upload_state": "ready",
                        "urls": {
                            "pages": {
                                "1": (
                                    f"https://abc.cloudfront.net/{video.id}/"
                                    f"sharedlivemedia/{shared_live_media2.id}/1638230400_1.svg"
                                ),
                                "2": (
                                    f"https://abc.cloudfront.net/{video.id}/"
                                    f"sharedlivemedia/{shared_live_media2.id}/1638230400_2.svg"
                                ),
                                "3": (
                                    f"https://abc.cloudfront.net/{video.id}/"
                                    f"sharedlivemedia/{shared_live_media2.id}/1638230400_3.svg"
                                ),
                            },
                        },
                        "video": str(video.id),
                    },
                ],
            },
        )

    def test_api_shared_live_media_list_by_video_playlist_admin_other_video(self):
        """
        Playlist administrator token user list shared live medias for a video.

        A user with a user token, who is a playlist administrator, can't list shared
        live media for a video that not belongs to that playlist.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = PlaylistFactory()
        video = VideoFactory(playlist=playlist)
        SharedLiveMediaFactory(
            upload_state=defaults.PENDING, uploaded_on=None, nb_pages=None, video=video
        )
        SharedLiveMediaFactory(
            upload_state=defaults.READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=3,
            video=video,
        )

        # This shared_live_media belongs to an other video and should not be in the
        # payload response
        other_video = VideoFactory()
        SharedLiveMediaFactory(
            upload_state=defaults.READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=5,
        )
        PlaylistAccessFactory(user=user, playlist=playlist, role=ADMINISTRATOR)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/sharedlivemedias/?video={other_video.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_list_by_video_organization_instructor(self):
        """
        Organization instructor token user list shared live medias for a video.

        A user with a user token, who is an organization instructor, cannot list shared
        live media for a video that belongs to that organization.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        organization = OrganizationFactory()
        playlist = PlaylistFactory(organization=organization)
        video = VideoFactory(playlist=playlist)
        SharedLiveMediaFactory(video=video)
        OrganizationAccessFactory(user=user, organization=organization, role=INSTRUCTOR)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/sharedlivemedias/?video={video.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_list_by_video_organization_admin(self):
        """
        Organization administrator token user list shared live medias for a video.

        A user with a user token, who is an organization administrator, can list shared
        live medias for a video that belongs to that organization.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        organization = OrganizationFactory()
        playlist = PlaylistFactory(organization=organization)
        video = VideoFactory(playlist=playlist)
        shared_live_media = SharedLiveMediaFactory(
            upload_state=defaults.PENDING, uploaded_on=None, nb_pages=None, video=video
        )
        shared_live_media2 = SharedLiveMediaFactory(
            extension="pdf",
            title="python extensions",
            upload_state=defaults.READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=3,
            video=video,
        )
        OrganizationAccessFactory(
            user=user, organization=organization, role=ADMINISTRATOR
        )

        # This shared_live_media belongs to an other video and should not be in the
        # payload response
        SharedLiveMediaFactory(
            upload_state=defaults.READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=5,
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/sharedlivemedias/?video={video.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "count": 2,
                "next": None,
                "previous": None,
                "results": [
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
                        "video": str(video.id),
                    },
                    {
                        "id": str(shared_live_media2.id),
                        "active_stamp": "1638230400",
                        "filename": "python-extensions.pdf",
                        "is_ready_to_show": True,
                        "nb_pages": 3,
                        "show_download": True,
                        "title": "python extensions",
                        "upload_state": "ready",
                        "urls": {
                            "pages": {
                                "1": (
                                    f"https://abc.cloudfront.net/{video.id}/"
                                    f"sharedlivemedia/{shared_live_media2.id}/1638230400_1.svg"
                                ),
                                "2": (
                                    f"https://abc.cloudfront.net/{video.id}/"
                                    f"sharedlivemedia/{shared_live_media2.id}/1638230400_2.svg"
                                ),
                                "3": (
                                    f"https://abc.cloudfront.net/{video.id}/"
                                    f"sharedlivemedia/{shared_live_media2.id}/1638230400_3.svg"
                                ),
                            }
                        },
                        "video": str(video.id),
                    },
                ],
            },
        )

    def test_api_shared_live_media_list_by_video_organization_admin_other_video(self):
        """
        Organization administrator token user list shared live medias for a video.

        A user with a user token, who is an organization administrator, can't list shared
        live medias for a video that not belongs to that organization.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        organization = OrganizationFactory()
        playlist = PlaylistFactory(organization=organization)
        video = VideoFactory(playlist=playlist)
        SharedLiveMediaFactory(
            upload_state=defaults.PENDING, uploaded_on=None, nb_pages=None, video=video
        )
        SharedLiveMediaFactory(
            upload_state=defaults.READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=3,
            video=video,
        )
        OrganizationAccessFactory(
            user=user, organization=organization, role=ADMINISTRATOR
        )

        # This shared_live_media belongs to an other video and should not be in the
        # payload response
        other_video = VideoFactory()
        SharedLiveMediaFactory(
            upload_state=defaults.READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=5,
            video=other_video,
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/sharedlivemedias/?video={other_video.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_update_anonymous(self):
        """An anonymous user can not update a shared live media."""
        shared_live_media = SharedLiveMediaFactory()

        response = self.client.put(
            f"/api/sharedlivemedias/{shared_live_media.id}/",
            {"title": "you shall not pass!"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 401)

    def test_api_shared_live_media_update_student(self):
        """A student can not update a shared live media."""
        shared_live_media = SharedLiveMediaFactory()

        jwt_token = StudentLtiTokenFactory(resource=shared_live_media.video)

        response = self.client.put(
            f"/api/sharedlivemedias/{shared_live_media.id}/",
            {"title": "you shall not pass!"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_update_instructor(self):
        """An instructor can update a shared live media."""
        shared_live_media = SharedLiveMediaFactory(title="update me!")

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=shared_live_media.video)

        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_shared_live_media"
        ) as mock_dispatch_shared_live_media:
            response = self.client.put(
                f"/api/sharedlivemedias/{shared_live_media.id}/",
                {"title": "Give me the red pill"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )
            mock_dispatch_shared_live_media.assert_called_once_with(shared_live_media)

        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "id": str(shared_live_media.id),
                "active_stamp": None,
                "filename": None,
                "is_ready_to_show": False,
                "nb_pages": shared_live_media.nb_pages,
                "show_download": True,
                "title": "Give me the red pill",
                "upload_state": "pending",
                "urls": None,
                "video": str(shared_live_media.video.id),
            },
        )

    def test_api_shared_live_media_update_staff_or_user(self):
        """Users authenticated via a session shouldn't be able to update a shared live medias."""
        shared_live_media = SharedLiveMediaFactory()
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            response = self.client.put(
                f"/api/sharedlivemedias/{shared_live_media.id}/",
                {"title": "you shall not pass!"},
                content_type="application/json",
            )
            self.assertEqual(response.status_code, 401)

    def test_api_shared_live_media_update_by_user_with_no_access(self):
        """
        Token user without any access updates a shared live medias for a video.

        A user with a user token, without any specific access, cannot update a shared live
        medias for any given video.
        """
        shared_live_media = SharedLiveMediaFactory()

        jwt_token = UserAccessTokenFactory()

        response = self.client.put(
            f"/api/sharedlivemedias/{shared_live_media.id}/",
            {"title": "you shall not pass!"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_update_by_video_playlist_instructor(self):
        """
        Playlist instructor token user updates a shared live medias for a video.

        A user with a user token, who is a playlist instructor, cannot update a shared
        live medias for a video that belongs to that playlist.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = PlaylistFactory()
        video = VideoFactory(playlist=playlist)
        shared_live_media = SharedLiveMediaFactory(video=video)
        PlaylistAccessFactory(user=user, playlist=playlist, role=INSTRUCTOR)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.put(
            f"/api/sharedlivemedias/{shared_live_media.id}/",
            {"title": "you shall not pass!"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_update_by_video_playlist_admin(self):
        """
        Playlist administrator token user updated a shared live medias for a video.

        A user with a user token, who is a playlist administrator, can list update
        a shared live media for a video that belongs to that playlist.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = PlaylistFactory()
        video = VideoFactory(playlist=playlist)
        shared_live_media = SharedLiveMediaFactory(
            upload_state=defaults.PENDING,
            uploaded_on=None,
            nb_pages=None,
            video=video,
            title="update me!",
        )
        PlaylistAccessFactory(user=user, playlist=playlist, role=ADMINISTRATOR)

        jwt_token = UserAccessTokenFactory(user=user)

        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_shared_live_media"
        ) as mock_dispatch_shared_live_media:
            response = self.client.put(
                f"/api/sharedlivemedias/{shared_live_media.id}/",
                {"title": "give me the red pill!"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )
            mock_dispatch_shared_live_media.assert_called_once_with(shared_live_media)

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
                "title": "give me the red pill!",
                "upload_state": "pending",
                "urls": None,
                "video": str(video.id),
            },
        )

    def test_api_shared_live_media_update_by_video_organization_instructor(self):
        """
        Organization instructor token user updates a shared live medias for a video.

        A user with a user token, who is an organization instructor, cannot update a shared
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

        response = self.client.put(
            f"/api/sharedlivemedias/{shared_live_media.id}/",
            {"title": "you shall not pass!"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_update_by_video_organization_admin(self):
        """
        Organization administrator token user updates a shared live medias for a video.

        A user with a user token, who is an organization administrator, can update a shared
        live medias for a video that belongs to that organization.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        organization = OrganizationFactory()
        playlist = PlaylistFactory(organization=organization)
        video = VideoFactory(playlist=playlist)
        shared_live_media = SharedLiveMediaFactory(
            upload_state=defaults.PENDING,
            uploaded_on=None,
            nb_pages=None,
            video=video,
            title="update me!",
        )
        OrganizationAccessFactory(
            user=user, organization=organization, role=ADMINISTRATOR
        )

        jwt_token = UserAccessTokenFactory(user=user)

        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_shared_live_media"
        ) as mock_dispatch_shared_live_media:
            response = self.client.put(
                f"/api/sharedlivemedias/{shared_live_media.id}/",
                {"title": "give me the red pill!"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )
            mock_dispatch_shared_live_media.assert_called_once_with(shared_live_media)

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
                "title": "give me the red pill!",
                "upload_state": "pending",
                "urls": None,
                "video": str(video.id),
            },
        )
