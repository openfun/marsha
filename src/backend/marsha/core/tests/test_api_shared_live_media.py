"""Tests for the SharedLiveMedia API of the Marsha project."""
from datetime import datetime
import json
import random
from unittest import mock

from django.test import TestCase, override_settings

from rest_framework_simplejwt.tokens import AccessToken

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
from .test_api_video import RSA_KEY_MOCK


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
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": False}

        response = self.client.post(
            "/api/sharedlivemedias/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(SharedLiveMedia.objects.exists())

    def test_api_shared_live_media_create_student(self):
        """A student should not be able to create a shared live media."""
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]

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
        user = UserFactory()
        video = VideoFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(shared_live_media.video.id)
        jwt_token.payload["roles"] = ["student"]

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(shared_live_media.video.id)
        jwt_token.payload["roles"] = ["student"]

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
        CLOUDFRONT_ACCESS_KEY_ID="cloudfront-access-key-id",
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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(shared_live_media.video.id)
        jwt_token.payload["roles"] = ["student"]

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
                        "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                        "sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/1638230400."
                        "pdf?response-content-disposition=attachment%3B+filename%3Dpython"
                        "-structures.pdf&Expires=1638237600&Signature=Sm8I4Mnuc6e8sn9mxYY"
                        "Vt53G6wpBeGEBQCKdkpXpd2Keyq9U-Vcm7pkYVjoHpqyeUcfpFBfkYXb1iwQAZvJ"
                        "SxIP0-4wtO~118oDd11SzjkoQWXA8~ksCK13YR0WqrBH78SaUmwx3mCkE4IAHqZA"
                        "R46o2ATZ7YTo9rA4qme9wYoKEj1dOgc~FNVv~ROuc-~xFzh~te39ngxoTw4E2ZRe"
                        "8zLOvwfAri1yzaBk4EjZlCI90lp-Kyv~sLjpO47uIZ2k1g-llTFwscyH8rRpQSDv"
                        "Rn1yzlrlrGa3yhdieH-hElr1iaHZUAQx-FdH11HXBSwe1eUeRrk1iOoxowEKS9rP"
                        "DWA__&Key-Pair-Id=cloudfront-access-key-id"
                    ),
                    "pages": {
                        "1": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                            "fb/sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/16382"
                            "30400_1.svg?Expires=1638237600&Signature=HhuTM-~v5kxNnQ4tPeI0"
                            "yh8xvmJTwJa3AhedgDYWnpalIQcC~uEeU1yLO1gecVwzq4R0UaGf8rmbWvGwj"
                            "cfG6T-5An7eRfK3JLz9-K7hRXSTFe-dyu9Xzy6vjP6WRj9qJWm7N7EIl8gj~I"
                            "3E17IIALCfcXZ1oLYrrmKpikOZZfRUnzFKpiMVJ2yr0pM31T4rzjR-yiyupBp"
                            "DfHomKsi8tS-b7D3Eymm9nKxjXK6zJ6sVE25kL1PejFUQnTQ55gNqsA5IhNuW"
                            "rYOItpXHeFXoa9b2uGagyp1D3EPpv8p5fk5lizMq8fUykViloSWWR1DsQ6MND"
                            "YU0L3TezfR4EUCMvQ__&Key-Pair-Id=cloudfront-access-key-id"
                        ),
                        "2": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                            "fb/sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/16382"
                            "30400_2.svg?Expires=1638237600&Signature=PPHBoj50fbVYCokpkFZT"
                            "cOUNGGabqokah2A9FbiOv3j82hWerD8-X95pClUAfNp3-DuMg1VMA4XOEB~Am"
                            "7DSDxXshO72BPE0Qh~C-5IFOYfztmQfQg2bdfVTOSMfz8dP1jdkSZ~PVd8hQa"
                            "4jlAm4yVbUwVtAlIDIJNNGcAB-ORBda1qClW2i1KDJONf8CI9lGo9LKK3AhtA"
                            "3WKe27YPFJcsR7NIlYx3kfV-XccwjlmQ0fkEw5DG2SRkMm~qyw5HIxzadjMXr"
                            "9~mbdLZ7GPnnoUmHBfuiYeHCBhv2-7jXAOkx7h8OChGdwqr-hlhkTolTuDrkM"
                            "7zTfF8Slq85ZSYYBA__&Key-Pair-Id=cloudfront-access-key-id"
                        ),
                        "3": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                            "fb/sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/16382"
                            "30400_3.svg?Expires=1638237600&Signature=P2XH0MDnottQ~kXpXLBb"
                            "wp9h2SGU5R~b~-~zZKsajdjhdacMfO66p5pLaA3YW2m7nsMcLEigRJR0aZpp~"
                            "SwPTAl43anzhgsDPttg4-PH6dloE43FHkfW0su8RvfkTjuSFL~Y8old1OY3W6"
                            "NU92axsVqFvZPQSOFVJS7elt8--t0bY1zwJoOfqR3pw3Ru2TzBE~qvegLdzTA"
                            "4-emEkr2rI1VpQnAH2jBPqNLFb3AwghjIwY927m0g0YF9HXJyM~t4nSQ5oap5"
                            "D6hei1Xg7do6BcFH4RBNMB1II70961MnAz-mG39hWHK7v2o2xmui~zJISSZZT"
                            "I7k68LYfRzEbuA64A__&Key-Pair-Id=cloudfront-access-key-id"
                        ),
                    },
                },
                "video": str(shared_live_media.video.id),
            },
        )

    @override_settings(
        CLOUDFRONT_SIGNED_URLS_ACTIVE=True,
        CLOUDFRONT_ACCESS_KEY_ID="cloudfront-access-key-id",
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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(shared_live_media.video.id)
        jwt_token.payload["roles"] = ["student"]

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
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                            "fb/sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/16382"
                            "30400_1.svg?Expires=1638237600&Signature=HhuTM-~v5kxNnQ4tPeI0"
                            "yh8xvmJTwJa3AhedgDYWnpalIQcC~uEeU1yLO1gecVwzq4R0UaGf8rmbWvGwj"
                            "cfG6T-5An7eRfK3JLz9-K7hRXSTFe-dyu9Xzy6vjP6WRj9qJWm7N7EIl8gj~I"
                            "3E17IIALCfcXZ1oLYrrmKpikOZZfRUnzFKpiMVJ2yr0pM31T4rzjR-yiyupBp"
                            "DfHomKsi8tS-b7D3Eymm9nKxjXK6zJ6sVE25kL1PejFUQnTQ55gNqsA5IhNuW"
                            "rYOItpXHeFXoa9b2uGagyp1D3EPpv8p5fk5lizMq8fUykViloSWWR1DsQ6MND"
                            "YU0L3TezfR4EUCMvQ__&Key-Pair-Id=cloudfront-access-key-id"
                        ),
                        "2": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                            "fb/sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/16382"
                            "30400_2.svg?Expires=1638237600&Signature=PPHBoj50fbVYCokpkFZT"
                            "cOUNGGabqokah2A9FbiOv3j82hWerD8-X95pClUAfNp3-DuMg1VMA4XOEB~Am"
                            "7DSDxXshO72BPE0Qh~C-5IFOYfztmQfQg2bdfVTOSMfz8dP1jdkSZ~PVd8hQa"
                            "4jlAm4yVbUwVtAlIDIJNNGcAB-ORBda1qClW2i1KDJONf8CI9lGo9LKK3AhtA"
                            "3WKe27YPFJcsR7NIlYx3kfV-XccwjlmQ0fkEw5DG2SRkMm~qyw5HIxzadjMXr"
                            "9~mbdLZ7GPnnoUmHBfuiYeHCBhv2-7jXAOkx7h8OChGdwqr-hlhkTolTuDrkM"
                            "7zTfF8Slq85ZSYYBA__&Key-Pair-Id=cloudfront-access-key-id"
                        ),
                        "3": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                            "fb/sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/16382"
                            "30400_3.svg?Expires=1638237600&Signature=P2XH0MDnottQ~kXpXLBb"
                            "wp9h2SGU5R~b~-~zZKsajdjhdacMfO66p5pLaA3YW2m7nsMcLEigRJR0aZpp~"
                            "SwPTAl43anzhgsDPttg4-PH6dloE43FHkfW0su8RvfkTjuSFL~Y8old1OY3W6"
                            "NU92axsVqFvZPQSOFVJS7elt8--t0bY1zwJoOfqR3pw3Ru2TzBE~qvegLdzTA"
                            "4-emEkr2rI1VpQnAH2jBPqNLFb3AwghjIwY927m0g0YF9HXJyM~t4nSQ5oap5"
                            "D6hei1Xg7do6BcFH4RBNMB1II70961MnAz-mG39hWHK7v2o2xmui~zJISSZZT"
                            "I7k68LYfRzEbuA64A__&Key-Pair-Id=cloudfront-access-key-id"
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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(shared_live_media.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(shared_live_media.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]

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
        CLOUDFRONT_ACCESS_KEY_ID="cloudfront-access-key-id",
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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(shared_live_media.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]

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
                        "-compound-statements.pdf&Expires=1638237600&Signature=FfdLhpZUfM"
                        "Iu5NtKTZFCcu7GmrlmwL356YwnFAO4nW8hSQ6KxiZfsOoo47vWhtztMFOhPKQHTn"
                        "ayQvM574G-usHhfyih9Anw22mziKALfAh5l6sDgoRTSZNA1vt7C1wC-k~pJoIYBD"
                        "2FOohrJnFXHhipHDIzlCYu3d6u5Dgs~QHmLufbNBYth6SsE9AI7kMt1bXhSZTGf6"
                        "UqWRkQvmfUVNgSE1VQAQgRIBgcB8xLbxMdPcXkld~qkyyxqw7k7ZJbbTabqhzsno"
                        "wBRH6L44pird2l0r5rWtCT088ecXSOQEUvDpUpgLVoGt0Dzj-~pjc9gQOJcps2l5"
                        "MUl0ufvjGspA__&Key-Pair-Id=cloudfront-access-key-id"
                    ),
                    "pages": {
                        "1": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                            "fb/sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/16382"
                            "30400_1.svg?Expires=1638237600&Signature=HhuTM-~v5kxNnQ4tPeI0"
                            "yh8xvmJTwJa3AhedgDYWnpalIQcC~uEeU1yLO1gecVwzq4R0UaGf8rmbWvGwj"
                            "cfG6T-5An7eRfK3JLz9-K7hRXSTFe-dyu9Xzy6vjP6WRj9qJWm7N7EIl8gj~I"
                            "3E17IIALCfcXZ1oLYrrmKpikOZZfRUnzFKpiMVJ2yr0pM31T4rzjR-yiyupBp"
                            "DfHomKsi8tS-b7D3Eymm9nKxjXK6zJ6sVE25kL1PejFUQnTQ55gNqsA5IhNuW"
                            "rYOItpXHeFXoa9b2uGagyp1D3EPpv8p5fk5lizMq8fUykViloSWWR1DsQ6MND"
                            "YU0L3TezfR4EUCMvQ__&Key-Pair-Id=cloudfront-access-key-id"
                        ),
                        "2": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                            "fb/sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/16382"
                            "30400_2.svg?Expires=1638237600&Signature=PPHBoj50fbVYCokpkFZT"
                            "cOUNGGabqokah2A9FbiOv3j82hWerD8-X95pClUAfNp3-DuMg1VMA4XOEB~Am"
                            "7DSDxXshO72BPE0Qh~C-5IFOYfztmQfQg2bdfVTOSMfz8dP1jdkSZ~PVd8hQa"
                            "4jlAm4yVbUwVtAlIDIJNNGcAB-ORBda1qClW2i1KDJONf8CI9lGo9LKK3AhtA"
                            "3WKe27YPFJcsR7NIlYx3kfV-XccwjlmQ0fkEw5DG2SRkMm~qyw5HIxzadjMXr"
                            "9~mbdLZ7GPnnoUmHBfuiYeHCBhv2-7jXAOkx7h8OChGdwqr-hlhkTolTuDrkM"
                            "7zTfF8Slq85ZSYYBA__&Key-Pair-Id=cloudfront-access-key-id"
                        ),
                        "3": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                            "fb/sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/16382"
                            "30400_3.svg?Expires=1638237600&Signature=P2XH0MDnottQ~kXpXLBb"
                            "wp9h2SGU5R~b~-~zZKsajdjhdacMfO66p5pLaA3YW2m7nsMcLEigRJR0aZpp~"
                            "SwPTAl43anzhgsDPttg4-PH6dloE43FHkfW0su8RvfkTjuSFL~Y8old1OY3W6"
                            "NU92axsVqFvZPQSOFVJS7elt8--t0bY1zwJoOfqR3pw3Ru2TzBE~qvegLdzTA"
                            "4-emEkr2rI1VpQnAH2jBPqNLFb3AwghjIwY927m0g0YF9HXJyM~t4nSQ5oap5"
                            "D6hei1Xg7do6BcFH4RBNMB1II70961MnAz-mG39hWHK7v2o2xmui~zJISSZZT"
                            "I7k68LYfRzEbuA64A__&Key-Pair-Id=cloudfront-access-key-id"
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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(other_video.id)
        jwt_token.payload["roles"] = [
            random.choice(["instructor", "administrator", "student"])
        ]

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
        user = UserFactory()
        shared_live_media = SharedLiveMediaFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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
        CLOUDFRONT_ACCESS_KEY_ID="cloudfront-access-key-id",
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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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
                                "-expressions.pdf&Expires=1638237600&Signature=FrElaE~yVca9D~Phjo"
                                "cqk2FOGPXqWe7Aq3Jga74i9A~RxjA3qjXy436X6Mu0RMV~iYRqrOUYNlPYq7rYX9"
                                "zsXwGeiJ9K12PIs~KsbjnOG5cv9aJrO0vn3JOrgNtjnK-L6ggrNbb8eAmQrdcdKb"
                                "jjrAa1r2b0g8-vuR0XCztIGOQCfVDjA-7qdL9WPKiCCILrCV2qOkSmA41ENW1wrd"
                                "F6~19Yn3YLvlJ3edBqI1Uvoo-5nY5ry8vLmh0TXUz2Mn7RjEmNb-j0UHkNlf93Fs"
                                "a3oXZiL97KiilZkWD7MlPMMTH0Mv9~QuQsR~8fqJNFMyD7FE2yJaKckNGNp2YVOa"
                                "vU7A__&Key-Pair-Id=cloudfront-access-key-id"
                            ),
                            "pages": {
                                "1": (
                                    "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                                    "fb/sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/16382"
                                    "30400_1.svg?Expires=1638237600&Signature=HhuTM-~v5kxNnQ4tPeI0"
                                    "yh8xvmJTwJa3AhedgDYWnpalIQcC~uEeU1yLO1gecVwzq4R0UaGf8rmbWvGwj"
                                    "cfG6T-5An7eRfK3JLz9-K7hRXSTFe-dyu9Xzy6vjP6WRj9qJWm7N7EIl8gj~I"
                                    "3E17IIALCfcXZ1oLYrrmKpikOZZfRUnzFKpiMVJ2yr0pM31T4rzjR-yiyupBp"
                                    "DfHomKsi8tS-b7D3Eymm9nKxjXK6zJ6sVE25kL1PejFUQnTQ55gNqsA5IhNuW"
                                    "rYOItpXHeFXoa9b2uGagyp1D3EPpv8p5fk5lizMq8fUykViloSWWR1DsQ6MND"
                                    "YU0L3TezfR4EUCMvQ__&Key-Pair-Id=cloudfront-access-key-id"
                                ),
                                "2": (
                                    "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                                    "fb/sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/16382"
                                    "30400_2.svg?Expires=1638237600&Signature=PPHBoj50fbVYCokpkFZT"
                                    "cOUNGGabqokah2A9FbiOv3j82hWerD8-X95pClUAfNp3-DuMg1VMA4XOEB~Am"
                                    "7DSDxXshO72BPE0Qh~C-5IFOYfztmQfQg2bdfVTOSMfz8dP1jdkSZ~PVd8hQa"
                                    "4jlAm4yVbUwVtAlIDIJNNGcAB-ORBda1qClW2i1KDJONf8CI9lGo9LKK3AhtA"
                                    "3WKe27YPFJcsR7NIlYx3kfV-XccwjlmQ0fkEw5DG2SRkMm~qyw5HIxzadjMXr"
                                    "9~mbdLZ7GPnnoUmHBfuiYeHCBhv2-7jXAOkx7h8OChGdwqr-hlhkTolTuDrkM"
                                    "7zTfF8Slq85ZSYYBA__&Key-Pair-Id=cloudfront-access-key-id"
                                ),
                                "3": (
                                    "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                                    "fb/sharedlivemedia/7520c16b-5846-41ca-822b-52b446a96809/16382"
                                    "30400_3.svg?Expires=1638237600&Signature=P2XH0MDnottQ~kXpXLBb"
                                    "wp9h2SGU5R~b~-~zZKsajdjhdacMfO66p5pLaA3YW2m7nsMcLEigRJR0aZpp~"
                                    "SwPTAl43anzhgsDPttg4-PH6dloE43FHkfW0su8RvfkTjuSFL~Y8old1OY3W6"
                                    "NU92axsVqFvZPQSOFVJS7elt8--t0bY1zwJoOfqR3pw3Ru2TzBE~qvegLdzTA"
                                    "4-emEkr2rI1VpQnAH2jBPqNLFb3AwghjIwY927m0g0YF9HXJyM~t4nSQ5oap5"
                                    "D6hei1Xg7do6BcFH4RBNMB1II70961MnAz-mG39hWHK7v2o2xmui~zJISSZZT"
                                    "I7k68LYfRzEbuA64A__&Key-Pair-Id=cloudfront-access-key-id"
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
        user = UserFactory()
        SharedLiveMediaFactory.create_batch(2)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(shared_live_media.video.id)
        jwt_token.payload["roles"] = ["student"]

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(shared_live_media.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        response = self.client.put(
            f"/api/sharedlivemedias/{shared_live_media.id}/",
            {"title": "Give me the red pill"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
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
        user = UserFactory()
        shared_live_media = SharedLiveMediaFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

        response = self.client.put(
            f"/api/sharedlivemedias/{shared_live_media.id}/",
            {"title": "give me the red pill!"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

        response = self.client.put(
            f"/api/sharedlivemedias/{shared_live_media.id}/",
            {"title": "give me the red pill!"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
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
                "title": "give me the red pill!",
                "upload_state": "pending",
                "urls": None,
                "video": str(video.id),
            },
        )

    def test_api_shared_live_media_delete_anonymous(self):
        """An anonymous user can not delete a shared live media."""
        shared_live_media = SharedLiveMediaFactory()

        response = self.client.delete(
            f"/api/sharedlivemedias/{shared_live_media.id}/",
        )

        self.assertEqual(response.status_code, 401)

    def test_api_shared_live_media_delete_student(self):
        """A student can not delete a shared live media."""
        shared_live_media = SharedLiveMediaFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(shared_live_media.video.id)
        jwt_token.payload["roles"] = ["student"]

        response = self.client.delete(
            f"/api/sharedlivemedias/{shared_live_media.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_delete_instructor(self):
        """An instructor can delete a shared live media."""
        shared_live_media = SharedLiveMediaFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(shared_live_media.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        self.assertTrue(SharedLiveMedia.objects.exists())

        response = self.client.delete(
            f"/api/sharedlivemedias/{shared_live_media.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 204)
        self.assertFalse(SharedLiveMedia.objects.exists())

    def test_api_shared_live_media_delete_staff_or_user(self):
        """Users authenticated via a session shouldn't be able to delete a shared live medias."""
        shared_live_media = SharedLiveMediaFactory()
        for user in [UserFactory(), UserFactory(is_staff=True)]:

            self.client.login(username=user.username, password="test")
            response = self.client.delete(
                f"/api/sharedlivemedias/{shared_live_media.id}/",
                content_type="application/json",
            )
            self.assertEqual(response.status_code, 401)

    def test_api_shared_live_media_delete_by_user_with_no_access(self):
        """
        Token user without any access deletes a shared live medias for a video.

        A user with a user token, without any specific access, cannot delete a shared live
        medias for any given video.
        """
        user = UserFactory()
        shared_live_media = SharedLiveMediaFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

        response = self.client.delete(
            f"/api/sharedlivemedias/{shared_live_media.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_delete_by_video_playlist_instructor(self):
        """
        Playlist instructor token user deletes a shared live medias for a video.

        A user with a user token, who is a playlist instructor, cannot delete a shared
        live medias for a video that belongs to that playlist.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = PlaylistFactory()
        video = VideoFactory(playlist=playlist)
        shared_live_media = SharedLiveMediaFactory(video=video)
        PlaylistAccessFactory(user=user, playlist=playlist, role=INSTRUCTOR)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

        response = self.client.delete(
            f"/api/sharedlivemedias/{shared_live_media.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_delete_by_video_playlist_admin(self):
        """
        Playlist administrator token user deletes a shared live medias for a video.

        A user with a user token, who is a playlist administrator, can delete
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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

        self.assertTrue(SharedLiveMedia.objects.exists())

        response = self.client.delete(
            f"/api/sharedlivemedias/{shared_live_media.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 204)
        self.assertFalse(SharedLiveMedia.objects.exists())

    def test_api_shared_live_media_delete_by_video_organization_instructor(self):
        """
        Organization instructor token user deletes a shared live medias for a video.

        A user with a user token, who is an organization instructor, cannot delete a shared
        live media for a video that belongs to that organization.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        organization = OrganizationFactory()
        playlist = PlaylistFactory(organization=organization)
        video = VideoFactory(playlist=playlist)
        shared_live_media = SharedLiveMediaFactory(video=video)
        OrganizationAccessFactory(user=user, organization=organization, role=INSTRUCTOR)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

        response = self.client.delete(
            f"/api/sharedlivemedias/{shared_live_media.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_delete_by_video_organization_admin(self):
        """
        Organization administrator token user deletes a shared live medias for a video.

        A user with a user token, who is an organization administrator, can delete a shared
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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

        self.assertTrue(SharedLiveMedia.objects.exists())

        response = self.client.delete(
            f"/api/sharedlivemedias/{shared_live_media.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 204)
        self.assertFalse(SharedLiveMedia.objects.exists())

    def test_api_shared_live_media_delete_active(self):
        """
        Playlist instructor token user deletes an active shared live medias for a video.

        When the active shared_live_media is deleted,
        related video active_shared_live_media is set to None.
        """
        shared_live_media = SharedLiveMediaFactory(nb_pages=5)
        video = VideoFactory(
            active_shared_live_media=shared_live_media, active_shared_live_media_page=3
        )
        video.shared_live_medias.set([shared_live_media])

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(shared_live_media.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        self.assertTrue(SharedLiveMedia.objects.exists())

        response = self.client.delete(
            f"/api/sharedlivemedias/{shared_live_media.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 204)
        self.assertFalse(SharedLiveMedia.objects.exists())
        video.refresh_from_db()
        self.assertIsNone(video.active_shared_live_media)
        self.assertIsNone(video.active_shared_live_media_page)

    def test_api_shared_live_media_initiate_upload_anonymous(self):
        """An anonymous user can not initiate an upload."""

        shared_live_media = SharedLiveMediaFactory()

        response = self.client.post(
            f"/api/sharedlivemedias/{shared_live_media.id}/initiate-upload/",
            {"filename": "python extensions.pdf", "mimetype": "application/pdf"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 401)

    def test_api_shared_live_media_initiate_upload_student(self):
        """A student user can not initiate an upload."""

        shared_live_media = SharedLiveMediaFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(shared_live_media.video.id)
        jwt_token.payload["roles"] = ["student"]

        response = self.client.post(
            f"/api/sharedlivemedias/{shared_live_media.id}/initiate-upload/",
            {"filename": "python extensions.pdf", "mimetype": "application/pdf"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_initiate_upload_instructor(self):
        """An instructor can initiate an upload."""
        shared_live_media = SharedLiveMediaFactory(
            id="c5cad053-111a-4e0e-8f78-fe43dec11512",
            upload_state=random.choice(["ready", "error"]),
            video__id="ed08da34-7447-4141-96ff-5740315d7b99",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(shared_live_media.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        now = datetime(2021, 12, 2, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/sharedlivemedias/{shared_live_media.id}/initiate-upload/",
                {"filename": "python extensions.pdf", "mimetype": "application/pdf"},
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "url": "https://test-marsha-source.s3.amazonaws.com/",
                "fields": {
                    "acl": "private",
                    "key": (
                        "ed08da34-7447-4141-96ff-5740315d7b99/sharedlivemedia/"
                        "c5cad053-111a-4e0e-8f78-fe43dec11512/1638403200.pdf"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "aws-access-key-id/20211202/eu-west-1/s3/aws4_request",
                    "x-amz-date": "20211202T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMjEtMTItMDNUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBb"
                        "eyJhY2wiOiAicHJpdmF0ZSJ9LCBbImVxIiwgIiRDb250ZW50LVR5cGUiLCAiYXBwbGljYXRp"
                        "b24vcGRmIl0sIFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLCAwLCAzMTQ1NzI4MDBdLCB7ImJ1"
                        "Y2tldCI6ICJ0ZXN0LW1hcnNoYS1zb3VyY2UifSwgeyJrZXkiOiAiZWQwOGRhMzQtNzQ0Ny00"
                        "MTQxLTk2ZmYtNTc0MDMxNWQ3Yjk5L3NoYXJlZGxpdmVtZWRpYS9jNWNhZDA1My0xMTFhLTRl"
                        "MGUtOGY3OC1mZTQzZGVjMTE1MTIvMTYzODQwMzIwMC5wZGYifSwgeyJ4LWFtei1hbGdvcml0"
                        "aG0iOiAiQVdTNC1ITUFDLVNIQTI1NiJ9LCB7IngtYW16LWNyZWRlbnRpYWwiOiAiYXdzLWFj"
                        "Y2Vzcy1rZXktaWQvMjAyMTEyMDIvZXUtd2VzdC0xL3MzL2F3czRfcmVxdWVzdCJ9LCB7Ingt"
                        "YW16LWRhdGUiOiAiMjAyMTEyMDJUMDAwMDAwWiJ9XX0="
                    ),
                    "x-amz-signature": (
                        "db00ba70403f098597777a3cfb9ba5433eecbbe67ebefdf17987f368dec70a5d"
                    ),
                },
            },
        )

        shared_live_media.refresh_from_db()
        self.assertEqual(shared_live_media.upload_state, "pending")

    def test_api_shared_live_media_initiate_upload_file_without_extension(self):
        """An extension should be guessed from the mimetype."""
        shared_live_media = SharedLiveMediaFactory(
            id="c5cad053-111a-4e0e-8f78-fe43dec11512",
            upload_state=random.choice(["ready", "error"]),
            video__id="ed08da34-7447-4141-96ff-5740315d7b99",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(shared_live_media.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        now = datetime(2021, 12, 2, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/sharedlivemedias/{shared_live_media.id}/initiate-upload/",
                {"filename": "python extensions", "mimetype": "application/pdf"},
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "url": "https://test-marsha-source.s3.amazonaws.com/",
                "fields": {
                    "acl": "private",
                    "key": (
                        "ed08da34-7447-4141-96ff-5740315d7b99/sharedlivemedia/"
                        "c5cad053-111a-4e0e-8f78-fe43dec11512/1638403200.pdf"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "aws-access-key-id/20211202/eu-west-1/s3/aws4_request",
                    "x-amz-date": "20211202T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMjEtMTItMDNUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBb"
                        "eyJhY2wiOiAicHJpdmF0ZSJ9LCBbImVxIiwgIiRDb250ZW50LVR5cGUiLCAiYXBwbGljYXRp"
                        "b24vcGRmIl0sIFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLCAwLCAzMTQ1NzI4MDBdLCB7ImJ1"
                        "Y2tldCI6ICJ0ZXN0LW1hcnNoYS1zb3VyY2UifSwgeyJrZXkiOiAiZWQwOGRhMzQtNzQ0Ny00"
                        "MTQxLTk2ZmYtNTc0MDMxNWQ3Yjk5L3NoYXJlZGxpdmVtZWRpYS9jNWNhZDA1My0xMTFhLTRl"
                        "MGUtOGY3OC1mZTQzZGVjMTE1MTIvMTYzODQwMzIwMC5wZGYifSwgeyJ4LWFtei1hbGdvcml0"
                        "aG0iOiAiQVdTNC1ITUFDLVNIQTI1NiJ9LCB7IngtYW16LWNyZWRlbnRpYWwiOiAiYXdzLWFj"
                        "Y2Vzcy1rZXktaWQvMjAyMTEyMDIvZXUtd2VzdC0xL3MzL2F3czRfcmVxdWVzdCJ9LCB7Ingt"
                        "YW16LWRhdGUiOiAiMjAyMTEyMDJUMDAwMDAwWiJ9XX0="
                    ),
                    "x-amz-signature": (
                        "db00ba70403f098597777a3cfb9ba5433eecbbe67ebefdf17987f368dec70a5d"
                    ),
                },
            },
        )

        shared_live_media.refresh_from_db()
        self.assertEqual(shared_live_media.upload_state, "pending")

    def test_api_shared_live_media_initiate_upload_file_without_mimetype(self):
        """With no mimetype the request should fails."""
        shared_live_media = SharedLiveMediaFactory(
            id="c5cad053-111a-4e0e-8f78-fe43dec11512",
            upload_state=random.choice(["ready", "error"]),
            video__id="ed08da34-7447-4141-96ff-5740315d7b99",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(shared_live_media.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        now = datetime(2021, 12, 2, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/sharedlivemedias/{shared_live_media.id}/initiate-upload/",
                {"filename": "python extensions", "mimetype": ""},
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 400)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {"mimetype": ["mimetype not guessable"]},
        )

    def test_api_shared_live_media_initiate_upload_file_wrong_mimetype(self):
        """With a wrong mimetype the request should fails."""
        shared_live_media = SharedLiveMediaFactory(
            id="c5cad053-111a-4e0e-8f78-fe43dec11512",
            upload_state=random.choice(["ready", "error"]),
            video__id="ed08da34-7447-4141-96ff-5740315d7b99",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(shared_live_media.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        now = datetime(2021, 12, 2, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/sharedlivemedias/{shared_live_media.id}/initiate-upload/",
                {"filename": "python extensions", "mimetype": "application/wrong-type"},
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 400)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {"mimetype": ["application/wrong-type is not a supported mimetype"]},
        )

    def test_api_shared_live_media_initiate_upload_staff_or_user(self):
        """
        Users authenticated via a session shouldn't be able to intiate an upload
        for a shared live medias.
        """
        shared_live_media = SharedLiveMediaFactory()
        for user in [UserFactory(), UserFactory(is_staff=True)]:

            self.client.login(username=user.username, password="test")
            response = self.client.post(
                f"/api/sharedlivemedias/{shared_live_media.id}/initiate-upload/",
                {"filename": "python extensions.pdf", "mimetype": "application/pdf"},
                content_type="application/json",
            )
            self.assertEqual(response.status_code, 401)

    def test_api_shared_live_media_initiate_upload_by_user_with_no_access(self):
        """
        Token user without any access initiates an upload on a shared live medias for a video.

        A user with a user token, without any specific access, cannot initiate an upload
        on shared live medias for any given video.
        """
        user = UserFactory()
        shared_live_media = SharedLiveMediaFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

        response = self.client.post(
            f"/api/sharedlivemedias/{shared_live_media.id}/initiate-upload/",
            {"filename": "python extensions.pdf", "mimetype": "application/pdf"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_initiate_upload_by_video_playlist_instructor(self):
        """
        Playlist instructor token user initiates an upload on a shared live medias for a video.

        A user with a user token, who is a playlist instructor, cannot initiate an upload
        on  a shared live medias for a video that belongs to that playlist.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = PlaylistFactory()
        video = VideoFactory(playlist=playlist)
        shared_live_media = SharedLiveMediaFactory(video=video)
        PlaylistAccessFactory(user=user, playlist=playlist, role=INSTRUCTOR)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

        response = self.client.post(
            f"/api/sharedlivemedias/{shared_live_media.id}/initiate-upload/",
            {"filename": "python extensions.pdf", "mimetype": "application/pdf"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_initiate_upload_by_video_playlist_admin(self):
        """
        Playlist administrator token user initiates an upload on a shared live medias for a video.

        A user with a user token, who is a playlist administrator, can initiate an upload
        on a shared live media for a video that belongs to that playlist.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = PlaylistFactory()
        video = VideoFactory(
            id="ed08da34-7447-4141-96ff-5740315d7b99", playlist=playlist
        )
        shared_live_media = SharedLiveMediaFactory(
            id="c5cad053-111a-4e0e-8f78-fe43dec11512",
            upload_state=defaults.READY,
            uploaded_on=None,
            nb_pages=3,
            video=video,
            title="update me!",
        )
        PlaylistAccessFactory(user=user, playlist=playlist, role=ADMINISTRATOR)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

        now = datetime(2021, 12, 2, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/sharedlivemedias/{shared_live_media.id}/initiate-upload/",
                {"filename": "python extensions.pdf", "mimetype": "application/pdf"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "url": "https://test-marsha-source.s3.amazonaws.com/",
                "fields": {
                    "acl": "private",
                    "key": (
                        "ed08da34-7447-4141-96ff-5740315d7b99/sharedlivemedia/"
                        "c5cad053-111a-4e0e-8f78-fe43dec11512/1638403200.pdf"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "aws-access-key-id/20211202/eu-west-1/s3/aws4_request",
                    "x-amz-date": "20211202T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMjEtMTItMDNUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBb"
                        "eyJhY2wiOiAicHJpdmF0ZSJ9LCBbImVxIiwgIiRDb250ZW50LVR5cGUiLCAiYXBwbGljYXRp"
                        "b24vcGRmIl0sIFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLCAwLCAzMTQ1NzI4MDBdLCB7ImJ1"
                        "Y2tldCI6ICJ0ZXN0LW1hcnNoYS1zb3VyY2UifSwgeyJrZXkiOiAiZWQwOGRhMzQtNzQ0Ny00"
                        "MTQxLTk2ZmYtNTc0MDMxNWQ3Yjk5L3NoYXJlZGxpdmVtZWRpYS9jNWNhZDA1My0xMTFhLTRl"
                        "MGUtOGY3OC1mZTQzZGVjMTE1MTIvMTYzODQwMzIwMC5wZGYifSwgeyJ4LWFtei1hbGdvcml0"
                        "aG0iOiAiQVdTNC1ITUFDLVNIQTI1NiJ9LCB7IngtYW16LWNyZWRlbnRpYWwiOiAiYXdzLWFj"
                        "Y2Vzcy1rZXktaWQvMjAyMTEyMDIvZXUtd2VzdC0xL3MzL2F3czRfcmVxdWVzdCJ9LCB7Ingt"
                        "YW16LWRhdGUiOiAiMjAyMTEyMDJUMDAwMDAwWiJ9XX0="
                    ),
                    "x-amz-signature": (
                        "db00ba70403f098597777a3cfb9ba5433eecbbe67ebefdf17987f368dec70a5d"
                    ),
                },
            },
        )

        shared_live_media.refresh_from_db()
        self.assertEqual(shared_live_media.upload_state, defaults.PENDING)

    def test_api_shared_live_media_initiate_upload_by_video_organization_instructor(
        self,
    ):
        """
        Organization instructor token user initiates an upload on a shared live medias
        for a video.

        A user with a user token, who is an organization instructor, cannot initiate an upload
        on a shared live media for a video that belongs to that organization.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        organization = OrganizationFactory()
        playlist = PlaylistFactory(organization=organization)
        video = VideoFactory(playlist=playlist)
        shared_live_media = SharedLiveMediaFactory(video=video)
        OrganizationAccessFactory(user=user, organization=organization, role=INSTRUCTOR)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

        response = self.client.post(
            f"/api/sharedlivemedias/{shared_live_media.id}/initiate-upload/",
            {"filename": "python extensions.pdf", "mimetype": "application/pdf"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_shared_live_media_initiate_upload_by_video_organization_admin(self):
        """
        Organization administrator token user initiates an upload
        on a shared live medias for a video.

        A user with a user token, who is an organization administrator, can initiate an upload
        on a shared live medias for a video that belongs to that organization.
        """
        user = UserFactory()
        # A playlist where the user is an instructor, with a video
        organization = OrganizationFactory()
        playlist = PlaylistFactory(organization=organization)
        video = VideoFactory(
            id="ed08da34-7447-4141-96ff-5740315d7b99", playlist=playlist
        )
        shared_live_media = SharedLiveMediaFactory(
            id="c5cad053-111a-4e0e-8f78-fe43dec11512",
            upload_state=defaults.READY,
            uploaded_on=None,
            nb_pages=3,
            video=video,
            title="update me!",
        )
        OrganizationAccessFactory(
            user=user, organization=organization, role=ADMINISTRATOR
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {"id": str(user.id)}

        now = datetime(2021, 12, 2, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now), mock.patch(
            "datetime.datetime"
        ) as mock_dt:
            mock_dt.utcnow = mock.Mock(return_value=now)
            response = self.client.post(
                f"/api/sharedlivemedias/{shared_live_media.id}/initiate-upload/",
                {"filename": "python extensions.pdf", "mimetype": "application/pdf"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "url": "https://test-marsha-source.s3.amazonaws.com/",
                "fields": {
                    "acl": "private",
                    "key": (
                        "ed08da34-7447-4141-96ff-5740315d7b99/sharedlivemedia/"
                        "c5cad053-111a-4e0e-8f78-fe43dec11512/1638403200.pdf"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "aws-access-key-id/20211202/eu-west-1/s3/aws4_request",
                    "x-amz-date": "20211202T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMjEtMTItMDNUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBb"
                        "eyJhY2wiOiAicHJpdmF0ZSJ9LCBbImVxIiwgIiRDb250ZW50LVR5cGUiLCAiYXBwbGljYXRp"
                        "b24vcGRmIl0sIFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLCAwLCAzMTQ1NzI4MDBdLCB7ImJ1"
                        "Y2tldCI6ICJ0ZXN0LW1hcnNoYS1zb3VyY2UifSwgeyJrZXkiOiAiZWQwOGRhMzQtNzQ0Ny00"
                        "MTQxLTk2ZmYtNTc0MDMxNWQ3Yjk5L3NoYXJlZGxpdmVtZWRpYS9jNWNhZDA1My0xMTFhLTRl"
                        "MGUtOGY3OC1mZTQzZGVjMTE1MTIvMTYzODQwMzIwMC5wZGYifSwgeyJ4LWFtei1hbGdvcml0"
                        "aG0iOiAiQVdTNC1ITUFDLVNIQTI1NiJ9LCB7IngtYW16LWNyZWRlbnRpYWwiOiAiYXdzLWFj"
                        "Y2Vzcy1rZXktaWQvMjAyMTEyMDIvZXUtd2VzdC0xL3MzL2F3czRfcmVxdWVzdCJ9LCB7Ingt"
                        "YW16LWRhdGUiOiAiMjAyMTEyMDJUMDAwMDAwWiJ9XX0="
                    ),
                    "x-amz-signature": (
                        "db00ba70403f098597777a3cfb9ba5433eecbbe67ebefdf17987f368dec70a5d"
                    ),
                },
            },
        )

        shared_live_media.refresh_from_db()
        self.assertEqual(shared_live_media.upload_state, defaults.PENDING)
