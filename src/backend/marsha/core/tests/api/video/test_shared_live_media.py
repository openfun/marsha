"""Tests for the Video API for SharedLiveMedia navigation of the Marsha project."""
from datetime import datetime, timezone
import json
from unittest import mock

from django.test import TestCase, override_settings

from marsha.core import api
from marsha.core.api.video import channel_layers_utils
from marsha.core.defaults import (
    DELETED,
    ERROR,
    JITSI,
    PENDING,
    PROCESSING,
    READY,
    RUNNING,
)
from marsha.core.factories import (
    ConsumerSiteAccessFactory,
    OrganizationAccessFactory,
    OrganizationFactory,
    PlaylistAccessFactory,
    SharedLiveMediaFactory,
    UserFactory,
    VideoFactory,
    WebinarVideoFactory,
)
from marsha.core.models import ADMINISTRATOR, INSTRUCTOR, STUDENT
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)


# This file may be split between start-sharing, navigate-sharing and end-sharing
# pylint: disable=too-many-lines,too-many-public-methods


class VideoSharedLiveMediaStartTestCase(TestCase):
    """Tests for the Video SharedLiveMedia start sharing API"""

    maxDiff = None

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.some_organization = OrganizationFactory()
        cls.some_video = WebinarVideoFactory(
            playlist__organization=cls.some_organization,
            live_state=RUNNING,
        )
        cls.some_shared_live_media = SharedLiveMediaFactory(
            extension="pdf",
            title="slides",
            upload_state=READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=3,
            video=cls.some_video,
        )

    def assert_user_cannot_shared_live_media_start(
        self, user, video, shared_live_media
    ):
        """Assert the user cannot start sharing the live."""

        jwt_token = UserAccessTokenFactory(user=user)
        response = self.client.patch(
            f"/api/videos/{video.pk}/start-sharing/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            data={"sharedlivemedia": str(shared_live_media.pk)},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)

    @override_settings(LIVE_CHAT_ENABLED=True)
    def assert_user_can_shared_live_media_start(self, user, video, shared_live_media):
        """Assert the user can start sharing the live."""
        self.assertIsNone(video.active_shared_live_media_id)

        with mock.patch.object(
            channel_layers_utils, "dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups, mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode:
            mock_jwt_encode.return_value = "xmpp_jwt"

            jwt_token = UserAccessTokenFactory(user=user)
            response = self.client.patch(
                f"/api/videos/{video.pk}/start-sharing/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data={"sharedlivemedia": str(shared_live_media.pk)},
                content_type="application/json",
            )
            video.refresh_from_db()
            mock_dispatch_video_to_groups.assert_called_once_with(video)

            self.assertEqual(response.status_code, 200)

            content = response.json()

        self.assertEqual(
            content["active_shared_live_media"]["id"], str(shared_live_media.pk)
        )
        self.assertEqual(video.active_shared_live_media_id, shared_live_media.pk)

    def test_shared_live_media_start_by_random_user(self):
        """Authenticated user without access cannot start sharing a live."""
        user = UserFactory()

        self.assert_user_cannot_shared_live_media_start(
            user, self.some_video, self.some_shared_live_media
        )

    def test_shared_live_media_start_by_organization_student(self):
        """Organization students cannot start sharing a live."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=STUDENT,
        )

        self.assert_user_cannot_shared_live_media_start(
            organization_access.user, self.some_video, self.some_shared_live_media
        )

    def test_shared_live_media_start_by_organization_instructor(self):
        """Organization instructors cannot start sharing a live."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=INSTRUCTOR,
        )

        self.assert_user_cannot_shared_live_media_start(
            organization_access.user, self.some_video, self.some_shared_live_media
        )

    def test_shared_live_media_start_by_organization_administrator(self):
        """Organization administrators can start sharing a live."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=ADMINISTRATOR,
        )

        self.assert_user_can_shared_live_media_start(
            organization_access.user, self.some_video, self.some_shared_live_media
        )

    def test_shared_live_media_start_by_consumer_site_any_role(self):
        """Consumer site roles cannot start sharing a live."""
        consumer_site_access = ConsumerSiteAccessFactory(
            consumer_site=self.some_video.playlist.consumer_site,
        )

        self.assert_user_cannot_shared_live_media_start(
            consumer_site_access.user, self.some_video, self.some_shared_live_media
        )

    def test_shared_live_media_start_by_playlist_student(self):
        """Playlist student cannot start sharing a live."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=STUDENT,
        )

        self.assert_user_cannot_shared_live_media_start(
            playlist_access.user, self.some_video, self.some_shared_live_media
        )

    def test_shared_live_media_start_by_playlist_instructor(self):
        """Playlist instructor cannot start sharing a live."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=INSTRUCTOR,
        )

        self.assert_user_can_shared_live_media_start(
            playlist_access.user, self.some_video, self.some_shared_live_media
        )

    def test_shared_live_media_start_by_playlist_admin(self):
        """Playlist administrator can start sharing a live."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=ADMINISTRATOR,
        )

        self.assert_user_can_shared_live_media_start(
            playlist_access.user, self.some_video, self.some_shared_live_media
        )


class VideoSharedLiveMediaNavigateTestCase(TestCase):
    """Tests for the Video SharedLiveMedia navigate sharing API"""

    maxDiff = None

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.some_organization = OrganizationFactory()
        cls.some_video = WebinarVideoFactory(
            playlist__organization=cls.some_organization,
            live_state=RUNNING,
        )
        cls.some_shared_live_media = SharedLiveMediaFactory(
            extension="pdf",
            title="slides",
            upload_state=READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=3,
            video=cls.some_video,
        )

        cls.some_video.active_shared_live_media = cls.some_shared_live_media
        cls.some_video.active_shared_live_media_page = 1
        cls.some_video.save()

    def assert_user_cannot_navigate_shared_live_media(self, user, video):
        """Assert the user cannot navigate sharing the live."""

        jwt_token = UserAccessTokenFactory(user=user)
        response = self.client.patch(
            f"/api/videos/{video.pk}/navigate-sharing/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            data={"target_page": 2},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)

    @override_settings(LIVE_CHAT_ENABLED=True)
    def assert_user_can_navigate_shared_live_media(
        self, user, video, shared_live_media
    ):
        """Assert the user can navigate sharing the live."""
        self.assertNotEqual(video.active_shared_live_media_page, 2)

        with mock.patch.object(
            channel_layers_utils, "dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups, mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode:
            mock_jwt_encode.return_value = "xmpp_jwt"

            jwt_token = UserAccessTokenFactory(user=user)
            response = self.client.patch(
                f"/api/videos/{video.id}/navigate-sharing/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data={"target_page": 2},
                content_type="application/json",
            )
            video.refresh_from_db()
            mock_dispatch_video_to_groups.assert_called_once_with(video)

            self.assertEqual(response.status_code, 200)

            content = response.json()

        self.assertEqual(content["active_shared_live_media_page"], 2)
        self.assertEqual(video.active_shared_live_media_id, shared_live_media.pk)

    def test_shared_live_media_navigate_by_random_user(self):
        """Authenticated user without access cannot navigate sharing a live."""
        user = UserFactory()

        self.assert_user_cannot_navigate_shared_live_media(user, self.some_video)

    def test_shared_live_media_navigate_by_organization_student(self):
        """Organization students cannot navigate sharing a live."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=STUDENT,
        )

        self.assert_user_cannot_navigate_shared_live_media(
            organization_access.user, self.some_video
        )

    def test_shared_live_media_navigate_by_organization_instructor(self):
        """Organization instructors cannot navigate sharing a live."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=INSTRUCTOR,
        )

        self.assert_user_cannot_navigate_shared_live_media(
            organization_access.user, self.some_video
        )

    def test_shared_live_media_navigate_by_organization_administrator(self):
        """Organization administrators can navigate sharing a live."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=ADMINISTRATOR,
        )

        self.assert_user_can_navigate_shared_live_media(
            organization_access.user, self.some_video, self.some_shared_live_media
        )

    def test_shared_live_media_navigate_by_consumer_site_any_role(self):
        """Consumer site roles cannot navigate sharing a live."""
        consumer_site_access = ConsumerSiteAccessFactory(
            consumer_site=self.some_video.playlist.consumer_site,
        )

        self.assert_user_cannot_navigate_shared_live_media(
            consumer_site_access.user, self.some_video
        )

    def test_shared_live_media_navigate_by_playlist_student(self):
        """Playlist student cannot navigate sharing a live."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=STUDENT,
        )

        self.assert_user_cannot_navigate_shared_live_media(
            playlist_access.user, self.some_video
        )

    def test_shared_live_media_navigate_by_playlist_instructor(self):
        """Playlist instructor cannot navigate sharing a live."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=INSTRUCTOR,
        )

        self.assert_user_can_navigate_shared_live_media(
            playlist_access.user, self.some_video, self.some_shared_live_media
        )

    def test_shared_live_media_navigate_by_playlist_admin(self):
        """Playlist administrator can navigate sharing a live."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=ADMINISTRATOR,
        )

        self.assert_user_can_navigate_shared_live_media(
            playlist_access.user, self.some_video, self.some_shared_live_media
        )


class VideoSharedLiveMediaEndTestCase(TestCase):
    """Tests for the Video SharedLiveMedia end sharing API"""

    maxDiff = None

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.some_organization = OrganizationFactory()
        cls.some_video = WebinarVideoFactory(
            playlist__organization=cls.some_organization,
            live_state=RUNNING,
        )
        cls.some_shared_live_media = SharedLiveMediaFactory(
            extension="pdf",
            title="slides",
            upload_state=READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=3,
            video=cls.some_video,
        )

        cls.some_video.active_shared_live_media = cls.some_shared_live_media
        cls.some_video.active_shared_live_media_page = 1
        cls.some_video.save()

    def assert_user_cannot_end_shared_live_media(self, user, video):
        """Assert the user cannot end sharing the live."""

        jwt_token = UserAccessTokenFactory(user=user)
        response = self.client.patch(
            f"/api/videos/{video.pk}/end-sharing/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    @override_settings(LIVE_CHAT_ENABLED=True)
    def assert_user_can_end_shared_live_media(self, user, video, shared_live_media):
        """Assert the user can end sharing the live."""
        self.assertEqual(video.active_shared_live_media_id, shared_live_media.pk)

        with mock.patch.object(
            channel_layers_utils, "dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups, mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode:
            mock_jwt_encode.return_value = "xmpp_jwt"

            jwt_token = UserAccessTokenFactory(user=user)
            response = self.client.patch(
                f"/api/videos/{video.id}/end-sharing/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            video.refresh_from_db()
            mock_dispatch_video_to_groups.assert_called_once_with(video)

            self.assertEqual(response.status_code, 200)

            content = response.json()

        self.assertIsNone(content["active_shared_live_media"])
        self.assertIsNone(video.active_shared_live_media_id)

    def test_shared_live_media_end_by_random_user(self):
        """Authenticated user without access cannot end sharing a live."""
        user = UserFactory()

        self.assert_user_cannot_end_shared_live_media(user, self.some_video)

    def test_shared_live_media_end_by_organization_student(self):
        """Organization students cannot end sharing a live."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=STUDENT,
        )

        self.assert_user_cannot_end_shared_live_media(
            organization_access.user, self.some_video
        )

    def test_shared_live_media_end_by_organization_instructor(self):
        """Organization instructors cannot end sharing a live."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=INSTRUCTOR,
        )

        self.assert_user_cannot_end_shared_live_media(
            organization_access.user, self.some_video
        )

    def test_shared_live_media_end_by_organization_administrator(self):
        """Organization administrators can end sharing a live."""
        organization_access = OrganizationAccessFactory(
            organization=self.some_organization,
            role=ADMINISTRATOR,
        )

        self.assert_user_can_end_shared_live_media(
            organization_access.user, self.some_video, self.some_shared_live_media
        )

    def test_shared_live_media_end_by_consumer_site_any_role(self):
        """Consumer site roles cannot end sharing a live."""
        consumer_site_access = ConsumerSiteAccessFactory(
            consumer_site=self.some_video.playlist.consumer_site,
        )

        self.assert_user_cannot_end_shared_live_media(
            consumer_site_access.user, self.some_video
        )

    def test_shared_live_media_end_by_playlist_student(self):
        """Playlist student cannot end sharing a live."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=STUDENT,
        )

        self.assert_user_cannot_end_shared_live_media(
            playlist_access.user, self.some_video
        )

    def test_shared_live_media_end_by_playlist_instructor(self):
        """Playlist instructor cannot end sharing a live."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=INSTRUCTOR,
        )

        self.assert_user_can_end_shared_live_media(
            playlist_access.user, self.some_video, self.some_shared_live_media
        )

    def test_shared_live_media_end_by_playlist_admin(self):
        """Playlist administrator can end sharing a live."""
        playlist_access = PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=ADMINISTRATOR,
        )

        self.assert_user_can_end_shared_live_media(
            playlist_access.user, self.some_video, self.some_shared_live_media
        )


class TestVideoSharedLiveMedia(TestCase):
    """Tests for the Video API for SharedLiveMedia navigation of the Marsha project."""

    maxDiff = None

    def test_api_video_shared_live_media_start_anonymous(self):
        """An anonymous user can not start a shared live media."""

        shared_live_media = SharedLiveMediaFactory()

        response = self.client.patch(
            f"/api/videos/{shared_live_media.video.id}/start-sharing/"
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.json(), {"detail": "Authentication credentials were not provided."}
        )

    def test_api_video_shared_live_media_navigate_anonymous(self):
        """An anonymous user can not navigate in a shared live media."""

        shared_live_media = SharedLiveMediaFactory()

        response = self.client.patch(
            f"/api/videos/{shared_live_media.video.id}/navigate-sharing/"
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.json(), {"detail": "Authentication credentials were not provided."}
        )

    def test_api_video_shared_live_media_end_anonymous(self):
        """An anonymous user can not end a shared live media."""

        shared_live_media = SharedLiveMediaFactory()

        response = self.client.patch(
            f"/api/videos/{shared_live_media.video.id}/end-sharing/"
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.json(), {"detail": "Authentication credentials were not provided."}
        )

    def test_api_video_shared_live_media_start_student(self):
        """A student user can not start a shared live media."""

        shared_live_media = SharedLiveMediaFactory()

        jwt_token = StudentLtiTokenFactory(
            resource=shared_live_media.video,
            context_id=str(shared_live_media.video.playlist.lti_id),
            consumer_site=str(shared_live_media.video.playlist.consumer_site.id),
        )

        response = self.client.patch(
            f"/api/videos/{shared_live_media.video.id}/start-sharing/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.json(),
            {"detail": "You do not have permission to perform this action."},
        )

    def test_api_video_shared_live_media_navigate_student(self):
        """A student user can not navigate in a shared live media."""

        shared_live_media = SharedLiveMediaFactory()

        jwt_token = StudentLtiTokenFactory(
            resource=shared_live_media.video,
        )

        response = self.client.patch(
            f"/api/videos/{shared_live_media.video.id}/navigate-sharing/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.json(),
            {"detail": "You do not have permission to perform this action."},
        )

    def test_api_video_shared_live_media_end_student(self):
        """A student user can not end a shared live media."""

        shared_live_media = SharedLiveMediaFactory()

        jwt_token = StudentLtiTokenFactory(
            resource=shared_live_media.video,
        )

        response = self.client.patch(
            f"/api/videos/{shared_live_media.video.id}/end-sharing/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.json(),
            {"detail": "You do not have permission to perform this action."},
        )

    def test_api_video_shared_live_media_start_staff_or_user(self):
        """Users authenticated via a session can not start a shared live media."""
        shared_live_media = SharedLiveMediaFactory()
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            response = self.client.patch(
                f"/api/videos/{shared_live_media.video.id}/start-sharing/"
            )
            self.assertEqual(response.status_code, 401)
            self.assertEqual(
                response.json(),
                {"detail": "Authentication credentials were not provided."},
            )

    def test_api_video_shared_live_media_navigate_staff_or_user(self):
        """Users authenticated via a session can not navigate in a shared live media."""
        shared_live_media = SharedLiveMediaFactory()
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            response = self.client.patch(
                f"/api/videos/{shared_live_media.video.id}/navigate-sharing/"
            )
            self.assertEqual(response.status_code, 401)
            self.assertEqual(
                response.json(),
                {"detail": "Authentication credentials were not provided."},
            )

    def test_api_video_shared_live_media_end_staff_or_user(self):
        """Users authenticated via a session can not end a shared live media."""
        shared_live_media = SharedLiveMediaFactory()
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            response = self.client.patch(
                f"/api/videos/{shared_live_media.video.id}/end-sharing/"
            )
            self.assertEqual(response.status_code, 401)
            self.assertEqual(
                response.json(),
                {"detail": "Authentication credentials were not provided."},
            )

    @override_settings(LIVE_CHAT_ENABLED=True)
    @override_settings(XMPP_BOSH_URL="https://xmpp-server.com/http-bind")
    @override_settings(XMPP_CONFERENCE_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_JWT_SHARED_SECRET="xmpp_shared_secret")
    def test_api_video_shared_live_media_start_instructor_ready(self):
        """An instructor can start a ready shared live media."""

        video = VideoFactory(
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            upload_state=PENDING,
            live_state=RUNNING,
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

        shared_live_media = SharedLiveMediaFactory(
            extension="pdf",
            title="slides",
            upload_state=READY,
            uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
            nb_pages=3,
            video=video,
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=shared_live_media.video,
        )
        with mock.patch.object(
            channel_layers_utils, "dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups, mock.patch.object(
            api.video, "update_id3_tags"
        ) as mock_update_id3_tags, mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode:
            mock_update_id3_tags.assert_not_called()
            mock_jwt_encode.return_value = "xmpp_jwt"
            response = self.client.patch(
                f"/api/videos/{shared_live_media.video.id}/start-sharing/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data={"sharedlivemedia": str(shared_live_media.id)},
                content_type="application/json",
            )
            video.refresh_from_db()
            mock_dispatch_video_to_groups.assert_called_once_with(video)

            self.assertEqual(response.status_code, 200)

            content = response.json()
            self.assertEqual(
                content,
                {
                    "active_shared_live_media": {
                        "active_stamp": "1638230400",
                        "filename": "slides.pdf",
                        "id": str(shared_live_media.id),
                        "is_ready_to_show": True,
                        "nb_pages": shared_live_media.nb_pages,
                        "show_download": True,
                        "title": "slides",
                        "upload_state": READY,
                        "urls": {
                            "pages": {
                                "1": (
                                    "https://abc.cloudfront.net/"
                                    f"{video.id}/sharedlivemedia/"
                                    f"{shared_live_media.id}/1638230400_1.svg"
                                ),
                                "2": (
                                    "https://abc.cloudfront.net/"
                                    f"{video.id}/sharedlivemedia/"
                                    f"{shared_live_media.id}/1638230400_2.svg"
                                ),
                                "3": (
                                    "https://abc.cloudfront.net/"
                                    f"{video.id}/sharedlivemedia/"
                                    f"{shared_live_media.id}/1638230400_3.svg"
                                ),
                            }
                        },
                        "video": str(video.id),
                    },
                    "active_shared_live_media_page": 1,
                    "allow_recording": True,
                    "can_edit": True,
                    "description": shared_live_media.video.description,
                    "estimated_duration": None,
                    "has_chat": True,
                    "has_live_media": True,
                    "id": str(shared_live_media.video.id),
                    "is_live": True,
                    "title": shared_live_media.video.title,
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
                    "urls": {
                        "manifests": {
                            "hls": "https://channel_endpoint1/live.m3u8",
                        },
                        "mp4": {},
                        "thumbnails": {},
                    },
                    "should_use_subtitle_as_transcript": False,
                    "has_transcript": False,
                    "participants_asking_to_join": [],
                    "participants_in_discussion": [],
                    "playlist": {
                        "id": str(shared_live_media.video.playlist.id),
                        "title": "foo bar",
                        "lti_id": "course-v1:ufr+mathematics+00001",
                    },
                    "recording_time": 0,
                    "shared_live_medias": [
                        {
                            "active_stamp": "1638230400",
                            "filename": "slides.pdf",
                            "id": str(shared_live_media.id),
                            "is_ready_to_show": True,
                            "nb_pages": shared_live_media.nb_pages,
                            "show_download": True,
                            "title": "slides",
                            "upload_state": READY,
                            "urls": {
                                "pages": {
                                    "1": (
                                        "https://abc.cloudfront.net/"
                                        f"{video.id}/sharedlivemedia/"
                                        f"{shared_live_media.id}/1638230400_1.svg"
                                    ),
                                    "2": (
                                        "https://abc.cloudfront.net/"
                                        f"{video.id}/sharedlivemedia/"
                                        f"{shared_live_media.id}/1638230400_2.svg"
                                    ),
                                    "3": (
                                        "https://abc.cloudfront.net/"
                                        f"{video.id}/sharedlivemedia/"
                                        f"{shared_live_media.id}/1638230400_3.svg"
                                    ),
                                }
                            },
                            "video": str(video.id),
                        },
                    ],
                    "live_state": "running",
                    "live_info": {
                        "jitsi": {
                            "config_overwrite": {},
                            "domain": "meet.jit.si",
                            "external_api_url": "https://meet.jit.si/external_api.js",
                            "interface_config_overwrite": {},
                            "room_name": str(video.pk),
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
                        "converse_persistent_store": "localStorage",
                        "websocket_url": None,
                        "conference_url": f"{video.id}@conference.xmpp-server.com",
                        "jid": "conference.xmpp-server.com",
                    },
                    "tags": [],
                    "license": None,
                },
            )
            self.assertEqual(video.active_shared_live_media, shared_live_media)
            self.assertEqual(video.active_shared_live_media_page, 1)

    @override_settings(LIVE_CHAT_ENABLED=True)
    @override_settings(XMPP_BOSH_URL="https://xmpp-server.com/http-bind")
    @override_settings(XMPP_CONFERENCE_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_JWT_SHARED_SECRET="xmpp_shared_secret")
    def test_api_video_shared_live_media_start_not_ready(self):
        """An instructor can not start a not ready shared live media."""

        video = VideoFactory(
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            upload_state=PENDING,
            live_state=RUNNING,
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

        for state in [
            PENDING,
            PROCESSING,
            ERROR,
            DELETED,
        ]:
            shared_live_media = SharedLiveMediaFactory(
                extension="pdf",
                title="slides",
                # upload_state=random.choice([s[0] for s in STATE_CHOICES if s[0] != READY]),
                upload_state=state,
                uploaded_on=datetime(2021, 11, 30, tzinfo=timezone.utc),
                nb_pages=3,
                video=video,
            )

            jwt_token = InstructorOrAdminLtiTokenFactory(
                resource=shared_live_media.video,
            )

            with mock.patch.object(
                channel_layers_utils, "dispatch_video_to_groups"
            ) as mock_dispatch_video_to_groups:
                response = self.client.patch(
                    f"/api/videos/{video.id}/start-sharing/",
                    HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                    data={"sharedlivemedia": str(shared_live_media.id)},
                    content_type="application/json",
                )
                mock_dispatch_video_to_groups.assert_not_called()

            self.assertEqual(response.status_code, 400)
            self.assertEqual(
                response.json(), {"detail": "Shared live media is not ready."}
            )

    def test_api_video_shared_live_media_start_wrong_video_id(self):
        """An instructor can not start a shared live media
        if related video doesn't match the JWT ressource."""
        shared_live_media = SharedLiveMediaFactory()
        other_shared_live_media = SharedLiveMediaFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=other_shared_live_media.video,
        )

        response = self.client.patch(
            f"/api/videos/{shared_live_media.video.id}/start-sharing/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            data={"sharedlivemedia": str(shared_live_media.id)},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.json(),
            {"detail": "You do not have permission to perform this action."},
        )

    @override_settings(LIVE_CHAT_ENABLED=True)
    @override_settings(XMPP_BOSH_URL="https://xmpp-server.com/http-bind")
    @override_settings(XMPP_CONFERENCE_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_JWT_SHARED_SECRET="xmpp_shared_secret")
    def test_api_video_shared_live_media_start_wrong_sharedlivemedia_id(self):
        """An instructor can not start a shared live media if the video is not related."""
        shared_live_media = SharedLiveMediaFactory()
        other_shared_live_media = SharedLiveMediaFactory(upload_state=READY)

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=shared_live_media.video,
        )

        with mock.patch.object(
            channel_layers_utils, "dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.patch(
                f"/api/videos/{shared_live_media.video.id}/start-sharing/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data={"sharedlivemedia": str(other_shared_live_media.id)},
                content_type="application/json",
            )
            mock_dispatch_video_to_groups.assert_not_called()

        self.assertEqual(response.status_code, 404)

    @override_settings(LIVE_CHAT_ENABLED=True)
    @override_settings(XMPP_BOSH_URL="https://xmpp-server.com/http-bind")
    @override_settings(XMPP_CONFERENCE_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_JWT_SHARED_SECRET="xmpp_shared_secret")
    def test_api_video_shared_live_media_start_already_started(self):
        """An instructor can not start a shared live media
        if related video shared live media has started."""

        video = VideoFactory(
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            active_shared_live_media=SharedLiveMediaFactory(),
            upload_state=PENDING,
            live_state=RUNNING,
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
        shared_live_media = SharedLiveMediaFactory(video=video)

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=shared_live_media.video,
        )

        with mock.patch.object(
            channel_layers_utils, "dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.patch(
                f"/api/videos/{shared_live_media.video.id}/start-sharing/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data={"sharedlivemedia": str(shared_live_media.id)},
                content_type="application/json",
            )

            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.json(), {"detail": "Video is already sharing."})
            mock_dispatch_video_to_groups.assert_not_called()

    @override_settings(LIVE_CHAT_ENABLED=True)
    @override_settings(XMPP_BOSH_URL="https://xmpp-server.com/http-bind")
    @override_settings(XMPP_CONFERENCE_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_JWT_SHARED_SECRET="xmpp_shared_secret")
    def test_api_video_shared_live_media_navigate_instructor(self):
        """An instructor can navigate in a shared live media."""

        shared_live_media = SharedLiveMediaFactory(nb_pages=6)
        video = VideoFactory(
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            active_shared_live_media=shared_live_media,
            active_shared_live_media_page=1,
            upload_state=PENDING,
            live_state=RUNNING,
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
        video.shared_live_medias.set([shared_live_media])

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=shared_live_media.video,
        )

        with mock.patch.object(
            channel_layers_utils, "dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups, mock.patch.object(
            api.video, "update_id3_tags"
        ) as mock_update_id3_tags, mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode:
            mock_update_id3_tags.assert_not_called()
            mock_jwt_encode.return_value = "xmpp_jwt"
            response = self.client.patch(
                f"/api/videos/{shared_live_media.video.id}/navigate-sharing/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data={"target_page": 2},
                content_type="application/json",
            )
            video.refresh_from_db()
            mock_dispatch_video_to_groups.assert_called_once_with(video)

            self.assertEqual(response.status_code, 200)

            content = json.loads(response.content)
            self.assertEqual(
                {
                    "active_shared_live_media": {
                        "active_stamp": None,
                        "filename": None,
                        "id": str(shared_live_media.id),
                        "is_ready_to_show": False,
                        "nb_pages": shared_live_media.nb_pages,
                        "show_download": True,
                        "title": None,
                        "upload_state": "pending",
                        "urls": None,
                        "video": str(video.id),
                    },
                    "active_shared_live_media_page": 2,
                    "allow_recording": True,
                    "can_edit": True,
                    "description": shared_live_media.video.description,
                    "estimated_duration": None,
                    "has_chat": True,
                    "has_live_media": True,
                    "id": str(shared_live_media.video.id),
                    "is_live": True,
                    "title": shared_live_media.video.title,
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
                    "urls": {
                        "manifests": {
                            "hls": "https://channel_endpoint1/live.m3u8",
                        },
                        "mp4": {},
                        "thumbnails": {},
                    },
                    "should_use_subtitle_as_transcript": False,
                    "has_transcript": False,
                    "participants_asking_to_join": [],
                    "participants_in_discussion": [],
                    "playlist": {
                        "id": str(shared_live_media.video.playlist.id),
                        "title": "foo bar",
                        "lti_id": "course-v1:ufr+mathematics+00001",
                    },
                    "recording_time": 0,
                    "shared_live_medias": [
                        {
                            "active_stamp": None,
                            "filename": None,
                            "id": str(shared_live_media.id),
                            "is_ready_to_show": False,
                            "nb_pages": shared_live_media.nb_pages,
                            "show_download": True,
                            "title": None,
                            "upload_state": "pending",
                            "urls": None,
                            "video": str(video.id),
                        }
                    ],
                    "live_state": "running",
                    "live_info": {
                        "jitsi": {
                            "config_overwrite": {},
                            "domain": "meet.jit.si",
                            "external_api_url": "https://meet.jit.si/external_api.js",
                            "interface_config_overwrite": {},
                            "room_name": str(video.pk),
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
                        "converse_persistent_store": "localStorage",
                        "websocket_url": None,
                        "conference_url": f"{video.id}@conference.xmpp-server.com",
                        "jid": "conference.xmpp-server.com",
                    },
                    "tags": [],
                    "license": None,
                },
                content,
            )
            self.assertEqual(video.active_shared_live_media, shared_live_media)
            self.assertEqual(video.active_shared_live_media_page, 2)

    def test_api_video_shared_live_media_navigate_no_active(self):
        """An instructor can not navigate if no active shared live media."""

        shared_live_media = SharedLiveMediaFactory(nb_pages=2)
        video = VideoFactory(
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            upload_state=PENDING,
            live_state=RUNNING,
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
        video.shared_live_medias.set([shared_live_media])

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        with mock.patch.object(
            channel_layers_utils, "dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.patch(
                f"/api/videos/{video.id}/navigate-sharing/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data={"target_page": 2},
                content_type="application/json",
            )
            video.refresh_from_db()
            mock_dispatch_video_to_groups.assert_not_called()

            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.json(), {"detail": "No shared live media."})
            self.assertEqual(video.active_shared_live_media, None)
            self.assertEqual(video.active_shared_live_media_page, None)

    @override_settings(LIVE_CHAT_ENABLED=True)
    @override_settings(XMPP_BOSH_URL="https://xmpp-server.com/http-bind")
    @override_settings(XMPP_CONFERENCE_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_JWT_SHARED_SECRET="xmpp_shared_secret")
    def test_api_video_shared_live_media_navigate_unexisting_page(self):
        """An instructor can not navigate to an unexisting page in a shared live media."""

        shared_live_media = SharedLiveMediaFactory(nb_pages=6)
        video = VideoFactory(
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            active_shared_live_media=shared_live_media,
            active_shared_live_media_page=1,
            upload_state=PENDING,
            live_state=RUNNING,
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
        video.shared_live_medias.set([shared_live_media])

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=shared_live_media.video,
        )

        with mock.patch.object(
            channel_layers_utils, "dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.patch(
                f"/api/videos/{shared_live_media.video.id}/navigate-sharing/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data={"target_page": 7},
                content_type="application/json",
            )
            video.refresh_from_db()
            mock_dispatch_video_to_groups.assert_not_called()

            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.json(), {"detail": "Page does not exist."})
            self.assertEqual(video.active_shared_live_media, shared_live_media)
            self.assertEqual(video.active_shared_live_media_page, 1)

    @override_settings(LIVE_CHAT_ENABLED=True)
    @override_settings(XMPP_BOSH_URL="https://xmpp-server.com/http-bind")
    @override_settings(XMPP_CONFERENCE_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_JWT_SHARED_SECRET="xmpp_shared_secret")
    def test_api_video_shared_live_media_navigate_undefined_page(self):
        """An instructor can not navigate to an undefined page in a shared live media."""

        shared_live_media = SharedLiveMediaFactory(nb_pages=6)
        video = VideoFactory(
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            active_shared_live_media=shared_live_media,
            active_shared_live_media_page=1,
            upload_state=PENDING,
            live_state=RUNNING,
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
        video.shared_live_medias.set([shared_live_media])

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=shared_live_media.video,
        )

        with mock.patch.object(
            channel_layers_utils, "dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.patch(
                f"/api/videos/{shared_live_media.video.id}/navigate-sharing/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data={"target_page": None},
                content_type="application/json",
            )
            video.refresh_from_db()
            mock_dispatch_video_to_groups.assert_not_called()

            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.json(), {"detail": "Invalid page number."})
            self.assertEqual(video.active_shared_live_media, shared_live_media)
            self.assertEqual(video.active_shared_live_media_page, 1)

    @override_settings(LIVE_CHAT_ENABLED=True)
    @override_settings(XMPP_BOSH_URL="https://xmpp-server.com/http-bind")
    @override_settings(XMPP_CONFERENCE_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_JWT_SHARED_SECRET="xmpp_shared_secret")
    def test_api_video_shared_live_media_navigate_missing_page(self):
        """An instructor can not navigate to an undefined page in a shared live media."""

        shared_live_media = SharedLiveMediaFactory(nb_pages=6)
        video = VideoFactory(
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            active_shared_live_media=shared_live_media,
            active_shared_live_media_page=1,
            upload_state=PENDING,
            live_state=RUNNING,
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
        video.shared_live_medias.set([shared_live_media])

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=shared_live_media.video,
        )

        with mock.patch.object(
            channel_layers_utils, "dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.patch(
                f"/api/videos/{shared_live_media.video.id}/navigate-sharing/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )
            video.refresh_from_db()
            mock_dispatch_video_to_groups.assert_not_called()

            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.json(), {"detail": "Invalid page number."})
            self.assertEqual(video.active_shared_live_media, shared_live_media)
            self.assertEqual(video.active_shared_live_media_page, 1)

    @override_settings(LIVE_CHAT_ENABLED=True)
    @override_settings(XMPP_BOSH_URL="https://xmpp-server.com/http-bind")
    @override_settings(XMPP_CONFERENCE_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_JWT_SHARED_SECRET="xmpp_shared_secret")
    def test_api_video_shared_live_media_end_instructor(self):
        """An instructor can end a shared live media."""

        shared_live_media = SharedLiveMediaFactory(nb_pages=6)
        video = VideoFactory(
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            active_shared_live_media=shared_live_media,
            active_shared_live_media_page=1,
            upload_state=PENDING,
            live_state=RUNNING,
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
        video.shared_live_medias.set([shared_live_media])

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=shared_live_media.video,
        )

        with mock.patch.object(
            channel_layers_utils, "dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups, mock.patch.object(
            api.video, "update_id3_tags"
        ) as mock_update_id3_tags, mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode:
            mock_update_id3_tags.assert_not_called()
            mock_jwt_encode.return_value = "xmpp_jwt"
            response = self.client.patch(
                f"/api/videos/{shared_live_media.video.id}/end-sharing/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            video.refresh_from_db()
            mock_dispatch_video_to_groups.assert_called_once_with(video)

            self.assertEqual(response.status_code, 200)

            content = json.loads(response.content)
            self.assertEqual(
                {
                    "active_shared_live_media": None,
                    "active_shared_live_media_page": None,
                    "allow_recording": True,
                    "can_edit": True,
                    "description": shared_live_media.video.description,
                    "estimated_duration": None,
                    "has_chat": True,
                    "has_live_media": True,
                    "id": str(shared_live_media.video.id),
                    "is_live": True,
                    "title": shared_live_media.video.title,
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
                    "urls": {
                        "manifests": {
                            "hls": "https://channel_endpoint1/live.m3u8",
                        },
                        "mp4": {},
                        "thumbnails": {},
                    },
                    "should_use_subtitle_as_transcript": False,
                    "has_transcript": False,
                    "participants_asking_to_join": [],
                    "participants_in_discussion": [],
                    "playlist": {
                        "id": str(shared_live_media.video.playlist.id),
                        "title": "foo bar",
                        "lti_id": "course-v1:ufr+mathematics+00001",
                    },
                    "recording_time": 0,
                    "shared_live_medias": [
                        {
                            "active_stamp": None,
                            "filename": None,
                            "id": str(shared_live_media.id),
                            "is_ready_to_show": False,
                            "nb_pages": shared_live_media.nb_pages,
                            "show_download": True,
                            "title": None,
                            "upload_state": "pending",
                            "urls": None,
                            "video": str(video.id),
                        }
                    ],
                    "live_state": "running",
                    "live_info": {
                        "jitsi": {
                            "config_overwrite": {},
                            "domain": "meet.jit.si",
                            "external_api_url": "https://meet.jit.si/external_api.js",
                            "interface_config_overwrite": {},
                            "room_name": str(video.pk),
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
                        "converse_persistent_store": "localStorage",
                        "websocket_url": None,
                        "conference_url": f"{video.id}@conference.xmpp-server.com",
                        "jid": "conference.xmpp-server.com",
                    },
                    "tags": [],
                    "license": None,
                },
                content,
            )
            self.assertEqual(video.active_shared_live_media, None)
            self.assertEqual(video.active_shared_live_media_page, None)

    def test_api_video_shared_live_media_end_no_active(self):
        """An instructor can not end if no active shared live media."""

        shared_live_media = SharedLiveMediaFactory(nb_pages=2)
        video = VideoFactory(
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            upload_state=PENDING,
            live_state=RUNNING,
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
        video.shared_live_medias.set([shared_live_media])

        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        with mock.patch.object(
            channel_layers_utils, "dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.patch(
                f"/api/videos/{video.id}/end-sharing/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data={"target_page": 2},
                content_type="application/json",
            )
            video.refresh_from_db()
            mock_dispatch_video_to_groups.assert_not_called()

            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.json(), {"detail": "No shared live media."})
            self.assertEqual(video.active_shared_live_media, None)
            self.assertEqual(video.active_shared_live_media_page, None)
