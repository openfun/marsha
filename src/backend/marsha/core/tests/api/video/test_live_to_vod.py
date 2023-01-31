"""Tests for the Video live to VOD API of the Marsha project."""
import json
import random
from unittest import mock

from django.test import TestCase, override_settings

from marsha.core import api, factories, models
from marsha.core.defaults import ENDED, HARVESTED, JITSI, LIVE_CHOICES, PENDING, READY
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    UserAccessTokenFactory,
)


class VideoLivetoVodAPITest(TestCase):
    """Test the "live to VOD" API of the video object."""

    maxDiff = None

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.some_organization = factories.OrganizationFactory()
        cls.some_video = factories.WebinarVideoFactory(
            playlist__organization=cls.some_organization,
            upload_state=PENDING,
            live_state=HARVESTED,
        )

    def assert_user_cannot_call_live_to_vod(self, user, video):
        """Assert the user cannot convert the live."""

        jwt_token = UserAccessTokenFactory(user=user)
        response = self.client.post(
            f"/api/videos/{video.pk}/live-to-vod/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    @override_settings(LIVE_CHAT_ENABLED=True)
    def assert_user_can_call_live_to_vod(self, user, video):
        """Assert the user can convert the live."""
        self.assertNotEqual(video.upload_state, READY)

        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups, mock.patch.object(
            api.video, "reopen_room_for_vod"
        ) as mock_reopen_room, mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode:
            mock_jwt_encode.return_value = "xmpp_jwt"
            jwt_token = UserAccessTokenFactory(user=user)
            response = self.client.post(
                f"/api/videos/{video.id}/live-to-vod/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            mock_dispatch_video_to_groups.assert_called_once_with(video)
            mock_reopen_room.assert_called_once_with(video.id)

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(content["upload_state"], READY)

    def test_live_to_vod_by_anonymous_user(self):
        """Anonymous users cannot convert live to VOD."""
        response = self.client.post(f"/api/videos/{self.some_video.pk}/live-to-vod/")

        self.assertEqual(response.status_code, 401)

    def test_live_to_vod_by_random_user(self):
        """Authenticated user without access cannot convert live to VOD."""
        user = factories.UserFactory()

        self.assert_user_cannot_call_live_to_vod(user, self.some_video)

    def test_live_to_vod_by_organization_student(self):
        """Organization students cannot convert live to VOD."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.some_organization,
            role=models.STUDENT,
        )

        self.assert_user_cannot_call_live_to_vod(
            organization_access.user,
            self.some_video,
        )

    def test_live_to_vod_by_organization_instructor(self):
        """Organization instructors cannot convert live to VOD."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.some_organization,
            role=models.INSTRUCTOR,
        )

        self.assert_user_cannot_call_live_to_vod(
            organization_access.user,
            self.some_video,
        )

    def test_live_to_vod_by_organization_administrator(self):
        """Organization administrators can convert live to VOD."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.some_organization,
            role=models.ADMINISTRATOR,
        )

        self.assert_user_can_call_live_to_vod(organization_access.user, self.some_video)

    def test_live_to_vod_by_consumer_site_any_role(self):
        """Consumer site roles cannot convert live to VOD."""
        consumer_site_access = factories.ConsumerSiteAccessFactory(
            consumer_site=self.some_video.playlist.consumer_site,
        )

        self.assert_user_cannot_call_live_to_vod(
            consumer_site_access.user,
            self.some_video,
        )

    def test_live_to_vod_by_playlist_student(self):
        """Playlist student cannot convert live to VOD."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=models.STUDENT,
        )

        self.assert_user_cannot_call_live_to_vod(playlist_access.user, self.some_video)

    def test_live_to_vod_by_playlist_instructor(self):
        """Playlist instructor cannot convert live to VOD."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=models.INSTRUCTOR,
        )

        self.assert_user_can_call_live_to_vod(playlist_access.user, self.some_video)

    def test_live_to_vod_by_playlist_admin(self):
        """Playlist administrator can convert live to VOD."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=models.ADMINISTRATOR,
        )

        self.assert_user_can_call_live_to_vod(playlist_access.user, self.some_video)

    @override_settings(LIVE_CHAT_ENABLED=True)
    @override_settings(XMPP_BOSH_URL="https://xmpp-server.com/http-bind")
    @override_settings(XMPP_CONFERENCE_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_CONVERSE_PERSISTENT_STORE="localStorage")
    @override_settings(XMPP_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_JWT_SHARED_SECRET="xmpp_shared_secret")
    def test_api_video_instructor_harvested_live_to_vod(self):
        """An instructor can transform an harvested live to a vod."""
        video = factories.VideoFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__title="playlist-002",
            live_state=HARVESTED,
            live_type=JITSI,
            upload_state=PENDING,
            uploaded_on="2019-09-24 07:24:40+00",
            resolutions=[240, 480, 720],
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups, mock.patch.object(
            api.video, "reopen_room_for_vod"
        ) as mock_reopen_room, mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode:
            mock_jwt_encode.return_value = "xmpp_jwt"
            response = self.client.post(
                f"/api/videos/{video.id}/live-to-vod/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            mock_dispatch_video_to_groups.assert_called_once_with(video)
            mock_reopen_room.assert_called_once_with(video.id)

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
                "upload_state": READY,
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
                    "manifests": {
                        "hls": f"https://abc.cloudfront.net/{video.id}/"
                        "cmaf/1569309880.m3u8"
                    },
                    "previews": f"https://abc.cloudfront.net/{video.id}/"
                    "previews/1569309880_100.jpg",
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
                "live_state": ENDED,
                "live_info": {},
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
        video.refresh_from_db()
        self.assertEqual(video.upload_state, "ready")

    def test_api_video_instructor_non_harvested_live_to_vod(self):
        """An instructor can transform an harvested live to a vod."""
        video = factories.VideoFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__title="playlist-002",
            live_state=random.choice(
                [s[0] for s in LIVE_CHOICES if s[0] is not HARVESTED]
            ),
            live_type=JITSI,
            upload_state=PENDING,
            uploaded_on="2019-09-24 07:24:40+00",
            resolutions=[240, 480, 720],
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video)

        with mock.patch(
            "marsha.websocket.utils.channel_layers_utils.dispatch_video_to_groups"
        ) as mock_dispatch_video_to_groups:
            response = self.client.post(
                f"/api/videos/{video.id}/live-to-vod/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            mock_dispatch_video_to_groups.assert_not_called()

        self.assertEqual(response.status_code, 400)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "error": (
                    "Live video must be harvested before transforming it to VOD."
                    f" Current status is {video.live_state}"
                )
            },
        )
