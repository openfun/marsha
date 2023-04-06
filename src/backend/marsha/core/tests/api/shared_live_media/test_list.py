"""Tests for the SharedLiveMedia list API of the Marsha project."""
from datetime import datetime
import json
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
from marsha.core.models.account import ADMINISTRATOR, INSTRUCTOR
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)
from marsha.core.tests.testing_utils import RSA_KEY_MOCK


class SharedLiveMediaListAPITest(TestCase):
    """Test the list API of the shared live media object."""

    def _get_url(self, video):
        """Return the url to use in tests."""
        return f"/api/videos/{video.id}/sharedlivemedias/"

    maxDiff = None

    def test_api_shared_live_media_list_anonymous(self):
        """An anonymous user can not list shared live medias."""
        SharedLiveMediaFactory.create_batch(2)
        video = VideoFactory()

        response = self.client.get(self._get_url(video))

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
            self._get_url(video),
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
            self._get_url(video),
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
            self._get_url(other_video),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)

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
                self._get_url(video),
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
        video = VideoFactory()

        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            response = self.client.get(self._get_url(video))
            self.assertEqual(response.status_code, 401)

    def test_api_shared_live_media_list_by_user_with_no_access(self):
        """
        Token user without any access list shared live medias for a video.

        A user with a user token, without any specific access, cannot list shared live
        medias for any given video.
        """
        SharedLiveMediaFactory.create_batch(2)
        jwt_token = UserAccessTokenFactory()
        video = VideoFactory()
        response = self.client.get(
            self._get_url(video),
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
            self._get_url(video),
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
            self._get_url(other_video),
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
            self._get_url(video),
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
            self._get_url(video),
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
            self._get_url(other_video),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)


class SharedLiveMediaListAPIOldTest(SharedLiveMediaListAPITest):
    """Test the list API of the shared live media object."""

    def _get_url(self, video):
        """Return the url to use in tests."""
        return f"/api/sharedlivemedias/?video={video.id}"
