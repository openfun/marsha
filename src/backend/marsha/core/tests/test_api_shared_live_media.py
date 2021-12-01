"""Tests for the SharedLiveMedia API of the Marsha project."""
from datetime import datetime
import json
import random
from unittest import mock

from django.test import TestCase, override_settings

import pytz
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
            uploaded_on=datetime(2021, 11, 30, tzinfo=pytz.utc),
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
                            "sharedlivemedias/7520c16b-5846-41ca-822b-52b446a96809/1638230400/"
                            "1.png"
                        ),
                        "2": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                            "sharedlivemedias/7520c16b-5846-41ca-822b-52b446a96809/1638230400/"
                            "2.png"
                        ),
                        "3": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                            "sharedlivemedias/7520c16b-5846-41ca-822b-52b446a96809/1638230400/"
                            "3.png"
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
            uploaded_on=datetime(2021, 11, 30, tzinfo=pytz.utc),
            nb_pages=3,
            video__id="d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(shared_live_media.video.id)
        jwt_token.payload["roles"] = ["student"]

        # fix the time so that the url signature is deterministic and can be checked
        now = datetime(2021, 11, 30, tzinfo=pytz.utc)
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
                        "sharedlivemedias/7520c16b-5846-41ca-822b-52b446a96809/1638230400/"
                        "1638230400/1638230400.pdf?response-content-disposition=attachment"
                        "%3B+filename%3Dpython-structures.pdf&Expires=1638237600&Signature="
                        "Df4g20VO9S3wIt4qAcLW4puFVN-UemtBn18cdQAZBqIuNP8XJlJXvf-jsa985FTQB5"
                        "FBjD0t6XT9EoOLwmFoob9Cb0MqWzIeFJNnFCKKaB4YA~TS97R~5Y6PUQ9-um0aS2UG"
                        "l--oXk2dta0mMEsXW1oyJwrJLr5ywt1Jo4-I~Bumg1stdZB~ZcZTqpdp0bFggwr5J8"
                        "KBobLWjjDsbYjn7ncWM-WbHyLVJ0qQY5VOL71ByWWvm-7VgMg8bd-2ifcS6SSk5NPD"
                        "V-uA9zgU0oAbHf46Y0BzNsw1PqZzfO~UKPSS~eYxj~De4d9wYvih1lUdzgrPs-ihCl"
                        "~KvXm13eVjsw__&Key-Pair-Id=cloudfront-access-key-id"
                    ),
                    "pages": {
                        "1": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                            "sharedlivemedias/7520c16b-5846-41ca-822b-52b446a96809/1638230400/"
                            "1.png?Expires=1638237600&Signature=NMUCJsyMGlg1ZQ4ocHjiqqHveeBcWE"
                            "t9Hpd-QhSDsPco7iwTwfTS~tgQkjg0OfkZ16hPq118d8AZqXLkcYvYR32Z5oDdV08"
                            "P1LTh8ViUgBtz3XV8yxc~VmyQ3-OmFINSBqPXjZLf29bkXZaPg9LU~EditKJTaWrf"
                            "hkpD2GljyXdj7X6uePqFWWVaIlkY4Xl1Dhjk04hjS2f3m5hictwCCSgN-i8r~EKEe"
                            "UkVCcdf3TGOFOCcrBlxd9525rzUtvgKMDqlyIKGEwGAbK10iRI~pnB3EgXWxZ7U~8"
                            "x-xZT7bmoIrt6NuVKvqf2mNLWWjizGAjOMD1WpO1EGhhZBTdinNg__"
                            "&Key-Pair-Id=cloudfront-access-key-id"
                        ),
                        "2": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                            "sharedlivemedias/7520c16b-5846-41ca-822b-52b446a96809/1638230400/"
                            "2.png?Expires=1638237600&Signature=Qp3z9GZV5guZxb2jHuBrbIsYMyKNJ7"
                            "gMAKyycQusresKjhtwgOJD3hp~vW8b6B1oRRtp~Osb~T5j13MbS-XNCjICs3C~7b6"
                            "p7e77CTg9V6TZF2rQZBz2oOoXiKGAWgkX8adxjFRAImE24NVsudJtaKpef-4MPgFc"
                            "SZfI3O9KQadCv4LW6Q~IZDCCl6JHHrDf6SSBggcyr8sRcXM8dUTM2NWf56siMLk6U"
                            "mY8BNra4qM9zlO7DDNPT1iGsuUcX2OIgHOVI0ykH3PIvQ7yWqTCzKMJrP7xfNczWj"
                            "HBNxrf~rtjbDV5fYO1gdUDlacfPpz4bnu01xPn9lUNr3uooIe~UA__"
                            "&Key-Pair-Id=cloudfront-access-key-id"
                        ),
                        "3": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                            "sharedlivemedias/7520c16b-5846-41ca-822b-52b446a96809/1638230400/"
                            "3.png?Expires=1638237600&Signature=G31rnBICbaateEwB8~aFakNoZQMRE-"
                            "Urzo-CRAvp~AYsdYNEFlbFgYfe-H6if34sT0TX1h2UpZe2HL8pbWG0rIuBArYcpLc"
                            "O9UPncXEBAKnX4WQr8Svl1s-ECBOE3WWC~-Em1o-93ss6qYHgk3ABlxswysK5GmIG"
                            "iraF1rjBNzktkZ87cbNAXpllRAl5swt~LAZyGH8bKnS8reNawGJZo~ppAZEt1cHbp"
                            "KkfzuoLTKHpuIgkxevzdZCVJ2pPnimAyKQGsYH55aoLlD-BGcN~oFojDyDD00UUuq"
                            "9HwRN1xZTYdS0881FSKNkL6Q7AfPkZ6bKPPOmevpdzePDS0Cj-PQ__"
                            "&Key-Pair-Id=cloudfront-access-key-id"
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
            uploaded_on=datetime(2021, 11, 30, tzinfo=pytz.utc),
            nb_pages=3,
            video__id="d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(shared_live_media.video.id)
        jwt_token.payload["roles"] = ["student"]

        # fix the time so that the url signature is deterministic and can be checked
        now = datetime(2021, 11, 30, tzinfo=pytz.utc)
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
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                            "sharedlivemedias/7520c16b-5846-41ca-822b-52b446a96809/1638230400/"
                            "1.png?Expires=1638237600&Signature=NMUCJsyMGlg1ZQ4ocHjiqqHveeBcWE"
                            "t9Hpd-QhSDsPco7iwTwfTS~tgQkjg0OfkZ16hPq118d8AZqXLkcYvYR32Z5oDdV08"
                            "P1LTh8ViUgBtz3XV8yxc~VmyQ3-OmFINSBqPXjZLf29bkXZaPg9LU~EditKJTaWrf"
                            "hkpD2GljyXdj7X6uePqFWWVaIlkY4Xl1Dhjk04hjS2f3m5hictwCCSgN-i8r~EKEe"
                            "UkVCcdf3TGOFOCcrBlxd9525rzUtvgKMDqlyIKGEwGAbK10iRI~pnB3EgXWxZ7U~8"
                            "x-xZT7bmoIrt6NuVKvqf2mNLWWjizGAjOMD1WpO1EGhhZBTdinNg__"
                            "&Key-Pair-Id=cloudfront-access-key-id"
                        ),
                        "2": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                            "sharedlivemedias/7520c16b-5846-41ca-822b-52b446a96809/1638230400/"
                            "2.png?Expires=1638237600&Signature=Qp3z9GZV5guZxb2jHuBrbIsYMyKNJ7"
                            "gMAKyycQusresKjhtwgOJD3hp~vW8b6B1oRRtp~Osb~T5j13MbS-XNCjICs3C~7b6"
                            "p7e77CTg9V6TZF2rQZBz2oOoXiKGAWgkX8adxjFRAImE24NVsudJtaKpef-4MPgFc"
                            "SZfI3O9KQadCv4LW6Q~IZDCCl6JHHrDf6SSBggcyr8sRcXM8dUTM2NWf56siMLk6U"
                            "mY8BNra4qM9zlO7DDNPT1iGsuUcX2OIgHOVI0ykH3PIvQ7yWqTCzKMJrP7xfNczWj"
                            "HBNxrf~rtjbDV5fYO1gdUDlacfPpz4bnu01xPn9lUNr3uooIe~UA__"
                            "&Key-Pair-Id=cloudfront-access-key-id"
                        ),
                        "3": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                            "sharedlivemedias/7520c16b-5846-41ca-822b-52b446a96809/1638230400/"
                            "3.png?Expires=1638237600&Signature=G31rnBICbaateEwB8~aFakNoZQMRE-"
                            "Urzo-CRAvp~AYsdYNEFlbFgYfe-H6if34sT0TX1h2UpZe2HL8pbWG0rIuBArYcpLc"
                            "O9UPncXEBAKnX4WQr8Svl1s-ECBOE3WWC~-Em1o-93ss6qYHgk3ABlxswysK5GmIG"
                            "iraF1rjBNzktkZ87cbNAXpllRAl5swt~LAZyGH8bKnS8reNawGJZo~ppAZEt1cHbp"
                            "KkfzuoLTKHpuIgkxevzdZCVJ2pPnimAyKQGsYH55aoLlD-BGcN~oFojDyDD00UUuq"
                            "9HwRN1xZTYdS0881FSKNkL6Q7AfPkZ6bKPPOmevpdzePDS0Cj-PQ__"
                            "&Key-Pair-Id=cloudfront-access-key-id"
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
            uploaded_on=datetime(2021, 11, 30, tzinfo=pytz.utc),
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
                            "sharedlivemedias/7520c16b-5846-41ca-822b-52b446a96809/1638230400/"
                            "1.png"
                        ),
                        "2": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                            "sharedlivemedias/7520c16b-5846-41ca-822b-52b446a96809/1638230400/"
                            "2.png"
                        ),
                        "3": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                            "sharedlivemedias/7520c16b-5846-41ca-822b-52b446a96809/1638230400/"
                            "3.png"
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
            uploaded_on=datetime(2021, 11, 30, tzinfo=pytz.utc),
            nb_pages=3,
            video__id="d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(shared_live_media.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]

        # fix the time so that the url signature is deterministic and can be checked
        now = datetime(2021, 11, 30, tzinfo=pytz.utc)
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
                        "sharedlivemedias/7520c16b-5846-41ca-822b-52b446a96809/1638230400/"
                        "1638230400/1638230400.pdf?response-content-disposition=attachment"
                        "%3B+filename%3Dpython-compound-statements.pdf&Expires=1638237600&"
                        "Signature=ADUEw1s-d6ql3mnDt3vzbt2x9Klgj7YWg-gcxcsShxC9suWOCjm1KJn"
                        "4emyebhlrOvC7ttpMOOGo5Ofwe0lv3iQgp737ScgafSzK9IKh3sEboBtiqTK5EbWD"
                        "1ou6WyFlrzXV~uLXra5PFzRF5JzAktNxbN39D6BFrDyX68zEwe7PzQql-MCQGdugx"
                        "SQ3LR2bT9g69S8zTrIvKscp158gEBETUbdP3KjSwyYohBiDs0jfVWL31kud0YCQj7"
                        "ruyrK7wDLdMsJNIUvBScWlo2smER-MkJYLbVt3WwC3Ns1EykRLkxaE0fdhP-D6XJk"
                        "PZBI6L3LZ2FXPgB1LpuT7YApw2A__&Key-Pair-Id=cloudfront-access-key-id"
                    ),
                    "pages": {
                        "1": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                            "sharedlivemedias/7520c16b-5846-41ca-822b-52b446a96809/1638230400/"
                            "1.png?Expires=1638237600&Signature=NMUCJsyMGlg1ZQ4ocHjiqqHveeBcWE"
                            "t9Hpd-QhSDsPco7iwTwfTS~tgQkjg0OfkZ16hPq118d8AZqXLkcYvYR32Z5oDdV08"
                            "P1LTh8ViUgBtz3XV8yxc~VmyQ3-OmFINSBqPXjZLf29bkXZaPg9LU~EditKJTaWrf"
                            "hkpD2GljyXdj7X6uePqFWWVaIlkY4Xl1Dhjk04hjS2f3m5hictwCCSgN-i8r~EKEe"
                            "UkVCcdf3TGOFOCcrBlxd9525rzUtvgKMDqlyIKGEwGAbK10iRI~pnB3EgXWxZ7U~8"
                            "x-xZT7bmoIrt6NuVKvqf2mNLWWjizGAjOMD1WpO1EGhhZBTdinNg__"
                            "&Key-Pair-Id=cloudfront-access-key-id"
                        ),
                        "2": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                            "sharedlivemedias/7520c16b-5846-41ca-822b-52b446a96809/1638230400/"
                            "2.png?Expires=1638237600&Signature=Qp3z9GZV5guZxb2jHuBrbIsYMyKNJ7"
                            "gMAKyycQusresKjhtwgOJD3hp~vW8b6B1oRRtp~Osb~T5j13MbS-XNCjICs3C~7b6"
                            "p7e77CTg9V6TZF2rQZBz2oOoXiKGAWgkX8adxjFRAImE24NVsudJtaKpef-4MPgFc"
                            "SZfI3O9KQadCv4LW6Q~IZDCCl6JHHrDf6SSBggcyr8sRcXM8dUTM2NWf56siMLk6U"
                            "mY8BNra4qM9zlO7DDNPT1iGsuUcX2OIgHOVI0ykH3PIvQ7yWqTCzKMJrP7xfNczWj"
                            "HBNxrf~rtjbDV5fYO1gdUDlacfPpz4bnu01xPn9lUNr3uooIe~UA__"
                            "&Key-Pair-Id=cloudfront-access-key-id"
                        ),
                        "3": (
                            "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9fb/"
                            "sharedlivemedias/7520c16b-5846-41ca-822b-52b446a96809/1638230400/"
                            "3.png?Expires=1638237600&Signature=G31rnBICbaateEwB8~aFakNoZQMRE-"
                            "Urzo-CRAvp~AYsdYNEFlbFgYfe-H6if34sT0TX1h2UpZe2HL8pbWG0rIuBArYcpLc"
                            "O9UPncXEBAKnX4WQr8Svl1s-ECBOE3WWC~-Em1o-93ss6qYHgk3ABlxswysK5GmIG"
                            "iraF1rjBNzktkZ87cbNAXpllRAl5swt~LAZyGH8bKnS8reNawGJZo~ppAZEt1cHbp"
                            "KkfzuoLTKHpuIgkxevzdZCVJ2pPnimAyKQGsYH55aoLlD-BGcN~oFojDyDD00UUuq"
                            "9HwRN1xZTYdS0881FSKNkL6Q7AfPkZ6bKPPOmevpdzePDS0Cj-PQ__"
                            "&Key-Pair-Id=cloudfront-access-key-id"
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
            uploaded_on=datetime(2021, 11, 30, tzinfo=pytz.utc),
            nb_pages=5,
            video=video,
        )
        # This shared_live_media belongs to an other video
        SharedLiveMediaFactory(
            upload_state=defaults.READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=pytz.utc),
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
            uploaded_on=datetime(2021, 11, 30, tzinfo=pytz.utc),
            nb_pages=3,
            video=video,
        )

        # This shared_live_media belongs to an other video and should not be in the
        # payload response
        SharedLiveMediaFactory(
            upload_state=defaults.READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=pytz.utc),
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
                                    f"sharedlivemedias/{shared_live_media2.id}/1638230400/1.png"
                                ),
                                "2": (
                                    f"https://abc.cloudfront.net/{video.id}/"
                                    f"sharedlivemedias/{shared_live_media2.id}/1638230400/2.png"
                                ),
                                "3": (
                                    f"https://abc.cloudfront.net/{video.id}/"
                                    f"sharedlivemedias/{shared_live_media2.id}/1638230400/3.png"
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
            uploaded_on=datetime(2021, 11, 30, tzinfo=pytz.utc),
            nb_pages=3,
            video=video,
        )

        # This shared_live_media belongs to an other video, requesting this video
        # in the query parameters should not return result at all
        other_video = VideoFactory()
        SharedLiveMediaFactory(
            upload_state=defaults.READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=pytz.utc),
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
            uploaded_on=datetime(2021, 11, 30, tzinfo=pytz.utc),
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
            uploaded_on=datetime(2021, 11, 30, tzinfo=pytz.utc),
            nb_pages=3,
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
                                "sharedlivemedias/7520c16b-5846-41ca-822b-52b446a96809/1638230400"
                                "/1638230400/1638230400.pdf?response-content-disposition="
                                "attachment%3B+filename%3Dpython-expressions.pdf&Expires="
                                "1638237600&Signature=A69S6ycsdBnPUNViT6moHzDz-Z~x-OczY6hU9pWqQ1wb"
                                "CFeZC06EmwA44aZ62EPeYJr~rBdraLSXJevyk99zPNGPuFinF0XK6ggWannUjrvfk"
                                "3Cqyt2ZGSI5QHwpKqo5crHj018SG28DNuA7cXsQ-BjlaSizwtmzJUV2Hcx5fvFDvx"
                                "FlSrp3lAHHSdOA~L7N2pn1sTfjgqXRjge7KnJGot-dZnlKAC3wCvuazbuLZmzdA7i"
                                "3rVdlNBIMCWhKE5WUUoXlW1tduPTqyqrzfOaoGv2TTsJJqPuEEWVwRRqv0DgRP27S"
                                "oL7qzIvG~OeNYrabMuRQoyFDbYpFRt~ZVQRSwA__"
                                "&Key-Pair-Id=cloudfront-access-key-id"
                            ),
                            "pages": {
                                "1": (
                                    "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                                    "fb/sharedlivemedias/7520c16b-5846-41ca-822b-52b446a96809/1638"
                                    "230400/1.png?Expires=1638237600&Signature=NMUCJsyMGlg1ZQ4ocHj"
                                    "iqqHveeBcWEt9Hpd-QhSDsPco7iwTwfTS~tgQkjg0OfkZ16hPq118d8AZqXLk"
                                    "cYvYR32Z5oDdV08P1LTh8ViUgBtz3XV8yxc~VmyQ3-OmFINSBqPXjZLf29bkX"
                                    "ZaPg9LU~EditKJTaWrfhkpD2GljyXdj7X6uePqFWWVaIlkY4Xl1Dhjk04hjS2"
                                    "f3m5hictwCCSgN-i8r~EKEeUkVCcdf3TGOFOCcrBlxd9525rzUtvgKMDqlyIK"
                                    "GEwGAbK10iRI~pnB3EgXWxZ7U~8x-xZT7bmoIrt6NuVKvqf2mNLWWjizGAjOM"
                                    "D1WpO1EGhhZBTdinNg__&Key-Pair-Id=cloudfront-access-key-id"
                                ),
                                "2": (
                                    "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                                    "fb/sharedlivemedias/7520c16b-5846-41ca-822b-52b446a96809/1638"
                                    "230400/2.png?Expires=1638237600&Signature=Qp3z9GZV5guZxb2jHuB"
                                    "rbIsYMyKNJ7gMAKyycQusresKjhtwgOJD3hp~vW8b6B1oRRtp~Osb~T5j13Mb"
                                    "S-XNCjICs3C~7b6p7e77CTg9V6TZF2rQZBz2oOoXiKGAWgkX8adxjFRAImE24"
                                    "NVsudJtaKpef-4MPgFcSZfI3O9KQadCv4LW6Q~IZDCCl6JHHrDf6SSBggcyr8"
                                    "sRcXM8dUTM2NWf56siMLk6UmY8BNra4qM9zlO7DDNPT1iGsuUcX2OIgHOVI0y"
                                    "kH3PIvQ7yWqTCzKMJrP7xfNczWjHBNxrf~rtjbDV5fYO1gdUDlacfPpz4bnu0"
                                    "1xPn9lUNr3uooIe~UA__&Key-Pair-Id=cloudfront-access-key-id"
                                ),
                                "3": (
                                    "https://abc.cloudfront.net/d9d7049c-5a3f-4070-a494-e6bf0bd8b9"
                                    "fb/sharedlivemedias/7520c16b-5846-41ca-822b-52b446a96809/1638"
                                    "230400/3.png?Expires=1638237600&Signature=G31rnBICbaateEwB8~a"
                                    "FakNoZQMRE-Urzo-CRAvp~AYsdYNEFlbFgYfe-H6if34sT0TX1h2UpZe2HL8p"
                                    "bWG0rIuBArYcpLcO9UPncXEBAKnX4WQr8Svl1s-ECBOE3WWC~-Em1o-93ss6q"
                                    "YHgk3ABlxswysK5GmIGiraF1rjBNzktkZ87cbNAXpllRAl5swt~LAZyGH8bKn"
                                    "S8reNawGJZo~ppAZEt1cHbpKkfzuoLTKHpuIgkxevzdZCVJ2pPnimAyKQGsYH"
                                    "55aoLlD-BGcN~oFojDyDD00UUuq9HwRN1xZTYdS0881FSKNkL6Q7AfPkZ6bKP"
                                    "POmevpdzePDS0Cj-PQ__&Key-Pair-Id=cloudfront-access-key-id"
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
            uploaded_on=datetime(2021, 11, 30, tzinfo=pytz.utc),
            nb_pages=3,
            video=video,
        )

        # This shared_live_media belongs to an other video and should not be in the
        # payload response
        SharedLiveMediaFactory(
            upload_state=defaults.READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=pytz.utc),
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
                                    f"sharedlivemedias/{shared_live_media2.id}/1638230400/1.png"
                                ),
                                "2": (
                                    f"https://abc.cloudfront.net/{video.id}/"
                                    f"sharedlivemedias/{shared_live_media2.id}/1638230400/2.png"
                                ),
                                "3": (
                                    f"https://abc.cloudfront.net/{video.id}/"
                                    f"sharedlivemedias/{shared_live_media2.id}/1638230400/3.png"
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
            uploaded_on=datetime(2021, 11, 30, tzinfo=pytz.utc),
            nb_pages=3,
            video=video,
        )

        # This shared_live_media belongs to an other video and should not be in the
        # payload response
        other_video = VideoFactory()
        SharedLiveMediaFactory(
            upload_state=defaults.READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=pytz.utc),
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
            uploaded_on=datetime(2021, 11, 30, tzinfo=pytz.utc),
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
            uploaded_on=datetime(2021, 11, 30, tzinfo=pytz.utc),
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
                                    f"sharedlivemedias/{shared_live_media2.id}/1638230400/1.png"
                                ),
                                "2": (
                                    f"https://abc.cloudfront.net/{video.id}/"
                                    f"sharedlivemedias/{shared_live_media2.id}/1638230400/2.png"
                                ),
                                "3": (
                                    f"https://abc.cloudfront.net/{video.id}/"
                                    f"sharedlivemedias/{shared_live_media2.id}/1638230400/3.png"
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
            uploaded_on=datetime(2021, 11, 30, tzinfo=pytz.utc),
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
            uploaded_on=datetime(2021, 11, 30, tzinfo=pytz.utc),
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

        now = datetime(2021, 12, 2, tzinfo=pytz.utc)
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
                        "eyJleHBpcmF0aW9uIjogIjIwMjEtMTItMDNUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBbe"
                        "yJhY2wiOiAicHJpdmF0ZSJ9LCBbImNvbnRlbnQtbGVuZ3RoLXJhbmdlIiwgMCwgMzE0NTcyOD"
                        "AwXSwgeyJidWNrZXQiOiAidGVzdC1tYXJzaGEtc291cmNlIn0sIHsia2V5IjogImVkMDhkYTM"
                        "0LTc0NDctNDE0MS05NmZmLTU3NDAzMTVkN2I5OS9zaGFyZWRsaXZlbWVkaWEvYzVjYWQwNTMt"
                        "MTExYS00ZTBlLThmNzgtZmU0M2RlYzExNTEyLzE2Mzg0MDMyMDAucGRmIn0sIHsieC1hbXotY"
                        "Wxnb3JpdGhtIjogIkFXUzQtSE1BQy1TSEEyNTYifSwgeyJ4LWFtei1jcmVkZW50aWFsIjogIm"
                        "F3cy1hY2Nlc3Mta2V5LWlkLzIwMjExMjAyL2V1LXdlc3QtMS9zMy9hd3M0X3JlcXVlc3QifSw"
                        "geyJ4LWFtei1kYXRlIjogIjIwMjExMjAyVDAwMDAwMFoifV19"
                    ),
                    "x-amz-signature": (
                        "bef8754f24944ffc960b1b4d2b32cecbf9211e73fd3130a7862dc80f5cb5a071"
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

        now = datetime(2021, 12, 2, tzinfo=pytz.utc)
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
                        "eyJleHBpcmF0aW9uIjogIjIwMjEtMTItMDNUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBbe"
                        "yJhY2wiOiAicHJpdmF0ZSJ9LCBbImNvbnRlbnQtbGVuZ3RoLXJhbmdlIiwgMCwgMzE0NTcyOD"
                        "AwXSwgeyJidWNrZXQiOiAidGVzdC1tYXJzaGEtc291cmNlIn0sIHsia2V5IjogImVkMDhkYTM"
                        "0LTc0NDctNDE0MS05NmZmLTU3NDAzMTVkN2I5OS9zaGFyZWRsaXZlbWVkaWEvYzVjYWQwNTMt"
                        "MTExYS00ZTBlLThmNzgtZmU0M2RlYzExNTEyLzE2Mzg0MDMyMDAucGRmIn0sIHsieC1hbXotY"
                        "Wxnb3JpdGhtIjogIkFXUzQtSE1BQy1TSEEyNTYifSwgeyJ4LWFtei1jcmVkZW50aWFsIjogIm"
                        "F3cy1hY2Nlc3Mta2V5LWlkLzIwMjExMjAyL2V1LXdlc3QtMS9zMy9hd3M0X3JlcXVlc3QifSw"
                        "geyJ4LWFtei1kYXRlIjogIjIwMjExMjAyVDAwMDAwMFoifV19"
                    ),
                    "x-amz-signature": (
                        "bef8754f24944ffc960b1b4d2b32cecbf9211e73fd3130a7862dc80f5cb5a071"
                    ),
                },
            },
        )

        shared_live_media.refresh_from_db()
        self.assertEqual(shared_live_media.upload_state, "pending")

    def test_api_shared_live_media_initiate_upload_file_without_mimetype(self):
        """With no mimetype the extension should be ignored."""
        shared_live_media = SharedLiveMediaFactory(
            id="c5cad053-111a-4e0e-8f78-fe43dec11512",
            upload_state=random.choice(["ready", "error"]),
            video__id="ed08da34-7447-4141-96ff-5740315d7b99",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(shared_live_media.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        now = datetime(2021, 12, 2, tzinfo=pytz.utc)
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
                        "c5cad053-111a-4e0e-8f78-fe43dec11512/1638403200"
                    ),
                    "x-amz-algorithm": "AWS4-HMAC-SHA256",
                    "x-amz-credential": "aws-access-key-id/20211202/eu-west-1/s3/aws4_request",
                    "x-amz-date": "20211202T000000Z",
                    "policy": (
                        "eyJleHBpcmF0aW9uIjogIjIwMjEtMTItMDNUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBbe"
                        "yJhY2wiOiAicHJpdmF0ZSJ9LCBbImNvbnRlbnQtbGVuZ3RoLXJhbmdlIiwgMCwgMzE0NTcyOD"
                        "AwXSwgeyJidWNrZXQiOiAidGVzdC1tYXJzaGEtc291cmNlIn0sIHsia2V5IjogImVkMDhkYTM"
                        "0LTc0NDctNDE0MS05NmZmLTU3NDAzMTVkN2I5OS9zaGFyZWRsaXZlbWVkaWEvYzVjYWQwNTMt"
                        "MTExYS00ZTBlLThmNzgtZmU0M2RlYzExNTEyLzE2Mzg0MDMyMDAifSwgeyJ4LWFtei1hbGdvc"
                        "ml0aG0iOiAiQVdTNC1ITUFDLVNIQTI1NiJ9LCB7IngtYW16LWNyZWRlbnRpYWwiOiAiYXdzLW"
                        "FjY2Vzcy1rZXktaWQvMjAyMTEyMDIvZXUtd2VzdC0xL3MzL2F3czRfcmVxdWVzdCJ9LCB7Ing"
                        "tYW16LWRhdGUiOiAiMjAyMTEyMDJUMDAwMDAwWiJ9XX0="
                    ),
                    "x-amz-signature": (
                        "3d6d72f4d8ff2d1c874f6bb0e7298900bc2cc231cab36b53af36e14506cc161c"
                    ),
                },
            },
        )

        shared_live_media.refresh_from_db()
        self.assertEqual(shared_live_media.upload_state, "pending")

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

        now = datetime(2021, 12, 2, tzinfo=pytz.utc)
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
                        "eyJleHBpcmF0aW9uIjogIjIwMjEtMTItMDNUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBbe"
                        "yJhY2wiOiAicHJpdmF0ZSJ9LCBbImNvbnRlbnQtbGVuZ3RoLXJhbmdlIiwgMCwgMzE0NTcyOD"
                        "AwXSwgeyJidWNrZXQiOiAidGVzdC1tYXJzaGEtc291cmNlIn0sIHsia2V5IjogImVkMDhkYTM"
                        "0LTc0NDctNDE0MS05NmZmLTU3NDAzMTVkN2I5OS9zaGFyZWRsaXZlbWVkaWEvYzVjYWQwNTMt"
                        "MTExYS00ZTBlLThmNzgtZmU0M2RlYzExNTEyLzE2Mzg0MDMyMDAucGRmIn0sIHsieC1hbXotY"
                        "Wxnb3JpdGhtIjogIkFXUzQtSE1BQy1TSEEyNTYifSwgeyJ4LWFtei1jcmVkZW50aWFsIjogIm"
                        "F3cy1hY2Nlc3Mta2V5LWlkLzIwMjExMjAyL2V1LXdlc3QtMS9zMy9hd3M0X3JlcXVlc3QifSw"
                        "geyJ4LWFtei1kYXRlIjogIjIwMjExMjAyVDAwMDAwMFoifV19"
                    ),
                    "x-amz-signature": (
                        "bef8754f24944ffc960b1b4d2b32cecbf9211e73fd3130a7862dc80f5cb5a071"
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

        now = datetime(2021, 12, 2, tzinfo=pytz.utc)
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
                        "eyJleHBpcmF0aW9uIjogIjIwMjEtMTItMDNUMDA6MDA6MDBaIiwgImNvbmRpdGlvbnMiOiBbe"
                        "yJhY2wiOiAicHJpdmF0ZSJ9LCBbImNvbnRlbnQtbGVuZ3RoLXJhbmdlIiwgMCwgMzE0NTcyOD"
                        "AwXSwgeyJidWNrZXQiOiAidGVzdC1tYXJzaGEtc291cmNlIn0sIHsia2V5IjogImVkMDhkYTM"
                        "0LTc0NDctNDE0MS05NmZmLTU3NDAzMTVkN2I5OS9zaGFyZWRsaXZlbWVkaWEvYzVjYWQwNTMt"
                        "MTExYS00ZTBlLThmNzgtZmU0M2RlYzExNTEyLzE2Mzg0MDMyMDAucGRmIn0sIHsieC1hbXotY"
                        "Wxnb3JpdGhtIjogIkFXUzQtSE1BQy1TSEEyNTYifSwgeyJ4LWFtei1jcmVkZW50aWFsIjogIm"
                        "F3cy1hY2Nlc3Mta2V5LWlkLzIwMjExMjAyL2V1LXdlc3QtMS9zMy9hd3M0X3JlcXVlc3QifSw"
                        "geyJ4LWFtei1kYXRlIjogIjIwMjExMjAyVDAwMDAwMFoifV19"
                    ),
                    "x-amz-signature": (
                        "bef8754f24944ffc960b1b4d2b32cecbf9211e73fd3130a7862dc80f5cb5a071"
                    ),
                },
            },
        )

        shared_live_media.refresh_from_db()
        self.assertEqual(shared_live_media.upload_state, defaults.PENDING)
