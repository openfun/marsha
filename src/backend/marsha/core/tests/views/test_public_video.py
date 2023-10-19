"""Test the public video view."""
from html import unescape
import json
import random
import re
from unittest import mock
import uuid

from django.core.cache import cache
from django.test import TestCase, override_settings

from marsha.core.defaults import (
    DELETED,
    HARVESTED,
    PENDING,
    RAW,
    RUNNING,
    STATE_CHOICES,
)
from marsha.core.factories import (
    LiveSessionFactory,
    OrganizationFactory,
    PlaylistFactory,
    VideoFactory,
)
from marsha.core.simple_jwt.tokens import PlaylistAccessToken, PlaylistRefreshToken


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument,too-many-lines


class VideoPublicViewTestCase(TestCase):
    """Test the public video view in the ``core`` app of the Marsha project."""

    maxDiff = None

    def tearDown(self):
        super().tearDown()
        cache.clear()

    def test_video_publicly_accessible(self):
        """Validate to access to a public video."""
        video = VideoFactory(
            id="301b5f4f-b9f1-4a5f-897d-f8f1bf22c397",
            playlist__title="playlist-003",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site__domain="trusted_domain.com",
            is_public=True,
            resolutions=[144, 240, 480, 720, 1080],
            transcode_pipeline="AWS",
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] not in [DELETED, HARVESTED]]
            ),
            uploaded_on="2019-09-24 07:24:40+00",
        )

        # First response has no cache
        with self.assertNumQueries(9):
            response = self.client.get(f"/videos/{video.pk}")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        self.assertIn("Content-Security-Policy", response.headers)
        self.assertNotIn("X-Frame-Options", response.headers)
        self.assertEqual(
            response.headers["Content-Security-Policy"],
            "frame-ancestors trusted_domain.com *.trusted_domain.com;",
        )
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        PlaylistRefreshToken(context.get("refresh_token"))  # Must not raise

        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": False, "can_update": False},
        )
        self.assertNotIn("user", jwt_token.payload)

        self.assertEqual(
            context.get("resource"),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": "1569309880",
                "allow_recording": True,
                "can_edit": False,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "is_public": True,
                "is_ready_to_show": True,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "description": video.description,
                "id": str(video.id),
                "is_live": False,
                "upload_state": video.upload_state,
                "timed_text_tracks": [],
                "thumbnail": None,
                "title": video.title,
                "urls": {
                    "mp4": {
                        "144": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c397/"
                        "mp4/1569309880_144.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-003_1569309880.mp4",
                        "240": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c397/"
                        "mp4/1569309880_240.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-003_1569309880.mp4",
                        "480": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c397/"
                        "mp4/1569309880_480.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-003_1569309880.mp4",
                        "720": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c397/"
                        "mp4/1569309880_720.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-003_1569309880.mp4",
                        "1080": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c397/"
                        "mp4/1569309880_1080.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-003_1569309880.mp4",
                    },
                    "thumbnails": {
                        "144": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c397/"
                        "thumbnails/1569309880_144.0000000.jpg",
                        "240": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c397/"
                        "thumbnails/1569309880_240.0000000.jpg",
                        "480": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c397/"
                        "thumbnails/1569309880_480.0000000.jpg",
                        "720": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c397/"
                        "thumbnails/1569309880_720.0000000.jpg",
                        "1080": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c397/"
                        "thumbnails/1569309880_1080.0000000.jpg",
                    },
                    "manifests": {
                        "hls": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c397/"
                        "cmaf/1569309880.m3u8",
                    },
                    "previews": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c397/"
                    "previews/1569309880_100.jpg",
                },
                "should_use_subtitle_as_transcript": False,
                "starting_at": None,
                "has_transcript": False,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": "playlist-003",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "recording_time": 0,
                "retention_date": None,
                "shared_live_medias": [],
                "live_state": None,
                "live_info": {},
                "live_type": None,
                "xmpp": None,
                "tags": [],
                "license": None,
            },
        )
        self.assertEqual(context.get("state"), "success")
        self.assertEqual(context.get("modelName"), "videos")
        self.assertIsNone(context.get("context_id"))
        self.assertIsNone(context.get("consumer_site"))

        # The second response is cached, the header should not have need changed
        # and should still contain the CSP frame-ancestors
        with self.assertNumQueries(0):
            cached_response = self.client.get(f"/videos/{video.pk}")

        self.assertEqual(cached_response.status_code, 200)
        self.assertContains(cached_response, "<html>")
        self.assertIn("Content-Security-Policy", cached_response.headers)
        self.assertNotIn("X-Frame-Options", cached_response.headers)
        self.assertEqual(
            cached_response.headers["Content-Security-Policy"],
            "frame-ancestors trusted_domain.com *.trusted_domain.com;",
        )

    def test_video_not_publicly_accessible(self):
        """Validate it is impossible to access to a non-public video."""
        video = VideoFactory(
            id="301b5f4f-b9f1-4a5f-897d-f8f1bf22c396",
            playlist__title="playlist-003",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            is_public=False,
            resolutions=[144, 240, 480, 720, 1080],
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
            uploaded_on="2019-09-24 07:24:40+00",
        )

        response = self.client.get(f"/videos/{video.pk}")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))

        self.assertIsNone(context.get("resource"))
        self.assertEqual(context.get("state"), "error")
        self.assertDictEqual(
            context.get("error"),
            {
                "message": "Video matching query does not exist.",
                "status_code": None,
            },
        )
        self.assertEqual(context.get("modelName"), "videos")

    def test_video_not_existing(self):
        """Accessing a non-existing video should return an error state."""
        response = self.client.get(f"/videos/{uuid.uuid4()}")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))

        self.assertIsNone(context.get("resource"))
        self.assertEqual(context.get("state"), "error")
        self.assertDictEqual(
            context.get("error"),
            {
                "message": "Video matching query does not exist.",
                "status_code": None,
            },
        )
        self.assertEqual(context.get("modelName"), "videos")

    @override_settings(LIVE_CHAT_ENABLED=True)
    @override_settings(XMPP_WEBSOCKET_URL="ws://xmpp-server.com/xmpp-websocket")
    @override_settings(XMPP_CONFERENCE_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_JWT_SHARED_SECRET="xmpp_shared_secret")
    def test_video_live_publicly_available(self):
        """Validate to access to a live public video."""
        video = VideoFactory(
            id="5caa7753-3e05-406e-a91f-ec1b758fead0",
            playlist__title="playlist-003",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            is_public=True,
            uploaded_on="2019-09-24 07:24:40+00",
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
            upload_state=PENDING,
        )

        with mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode:
            mock_jwt_encode.return_value = "xmpp_jwt"
            response = self.client.get(f"/videos/{video.pk}")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        PlaylistRefreshToken(context.get("refresh_token"))  # Must not raise

        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": False, "can_update": False},
        )

        self.assertEqual(
            context.get("resource"),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": "1569309880",
                "allow_recording": True,
                "can_edit": False,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "is_public": True,
                "is_ready_to_show": True,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "description": video.description,
                "id": str(video.id),
                "is_live": True,
                "upload_state": video.upload_state,
                "timed_text_tracks": [],
                "thumbnail": None,
                "title": video.title,
                "urls": {
                    "manifests": {
                        "hls": "https://channel_endpoint1/live.m3u8",
                    },
                    "mp4": {},
                    "thumbnails": {},
                },
                "should_use_subtitle_as_transcript": False,
                "starting_at": None,
                "has_transcript": False,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": "playlist-003",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "recording_time": 0,
                "retention_date": None,
                "shared_live_medias": [],
                "live_state": RUNNING,
                "live_info": {},
                "live_type": RAW,
                "xmpp": {
                    "bosh_url": None,
                    "converse_persistent_store": "localStorage",
                    "websocket_url": "ws://xmpp-server.com/xmpp-websocket?token=xmpp_jwt",
                    "conference_url": f"{video.id}@conference.xmpp-server.com",
                    "jid": "conference.xmpp-server.com",
                },
                "tags": [],
                "license": None,
            },
        )
        self.assertEqual(context.get("state"), "success")
        self.assertEqual(context.get("modelName"), "videos")

    def test_video_accessible_from_mail(self):
        """Validate the access to a lti ressource with email access."""
        video = VideoFactory(is_public=False)
        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="sarah@openfun.fr",
            is_registered=True,
            language="fr",
            lti_id=str(video.playlist.lti_id),
            lti_user_id="5555",
            video=video,
        )

        # Direct video access doesn't work without any params
        response = self.client.get(f"/videos/{video.pk}")
        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">',
            response.content.decode("utf-8"),
        )
        context = json.loads(unescape(match.group(1)))
        self.assertIsNone(context.get("resource"))
        self.assertEqual(context.get("state"), "error")
        self.assertDictEqual(
            context.get("error"),
            {
                "message": "Video matching query does not exist.",
                "status_code": None,
            },
        )
        self.assertEqual(context.get("modelName"), "videos")

        # now livesession params are added, direct access is possible
        response = self.client.get(
            f"/videos/{video.pk}?lrpk={livesession.pk}&key="
            f"{livesession.get_generate_salted_hmac()}"
        )
        self.assertEqual(response.status_code, 200)
        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">',
            response.content.decode("utf-8"),
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        PlaylistRefreshToken(context.get("refresh_token"))  # Must not raise

        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": False, "can_update": False},
        )
        self.assertEqual(context.get("state"), "success")
        self.assertEqual(context.get("modelName"), "videos")
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "email": "sarah@openfun.fr",
                "id": livesession.lti_user_id,
                "username": livesession.username,
            },
        )
        self.assertEqual(jwt_token.payload["playlist_id"], str(video.playlist.id))
        self.assertEqual(jwt_token.payload["locale"], "fr_FR")
        self.assertEqual(jwt_token.payload["context_id"], video.playlist.lti_id)
        self.assertEqual(
            jwt_token.payload["consumer_site"], str(livesession.consumer_site.id)
        )
        self.assertEqual(context.get("state"), "success")
        self.assertEqual(context.get("frontend"), "LTI")
        self.assertEqual(context.get("modelName"), "videos")

    def test_video_ressource_public_accessible_from_mail(self):
        """Validate the access to a public ressource with email access."""
        # video can be no longer public, access is still accepted
        video = VideoFactory(is_public=random.choice([True, False]))
        public_registration = LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            email="sarah@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )

        response = self.client.get(
            f"/videos/{video.pk}?lrpk={public_registration.pk}&key="
            f"{public_registration.get_generate_salted_hmac()}"
        )
        self.assertEqual(response.status_code, 200)
        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">',
            response.content.decode("utf-8"),
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        PlaylistRefreshToken(context.get("refresh_token"))  # Must not raise

        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": False, "can_update": False},
        )
        self.assertEqual(context.get("state"), "success")
        self.assertEqual(context.get("modelName"), "videos")
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "email": "sarah@test-fun-mooc.fr",
                "anonymous_id": str(public_registration.anonymous_id),
            },
        )
        self.assertEqual(jwt_token.payload["roles"], ["none"])
        self.assertEqual(jwt_token.payload["playlist_id"], str(video.playlist.id))
        self.assertEqual(jwt_token.payload["locale"], "en_US")
        self.assertIsNone(jwt_token.payload.get("context_id"))
        self.assertIsNone(jwt_token.payload.get("consumer_site"))
        self.assertEqual(context.get("state"), "success")
        self.assertEqual(context.get("frontend"), "LTI")
        self.assertEqual(context.get("modelName"), "videos")

    def test_video_accessible_from_mail_wrong_key(self):
        """Validate can't access to a lti ressource if the key is not correct."""
        video = VideoFactory(is_public=False)
        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="sarah@openfun.fr",
            is_registered=True,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="5555",
            video=video,
        )

        response = self.client.get(
            f"/videos/{video.pk}?lrpk={livesession.pk}&key=wrongkey"
        )
        self.assertEqual(response.status_code, 404)

    def test_video_accessible_public_from_mail_wrong_key(self):
        """Validate can't access to a public ressource if the key is not correct."""
        video = VideoFactory(is_public=True)
        public_registration = LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            email="sarah@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )

        response = self.client.get(
            f"/videos/{video.pk}?lrpk={public_registration.pk}&key=wrongkey"
        )
        self.assertEqual(response.status_code, 404)

    def test_video_accessible_lti_from_mail_wrong_video(self):
        """Validate can't access to a lti ressource if the video is not
        the one of the livesession."""
        video = VideoFactory(is_public=True)
        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="sarah@openfun.fr",
            is_registered=True,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="5555",
            video=VideoFactory(),
        )

        response = self.client.get(
            f"/videos/{video.pk}?lrpk={livesession.pk}&key="
            f"{livesession.get_generate_salted_hmac()}"
        )
        self.assertEqual(response.status_code, 404)

    def test_video_accessible_public_from_mail_wrong_video(self):
        """Validate can't access to a public ressource if the video is not
        the one of the livesession."""
        video = VideoFactory(is_public=True)
        public_registration = LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            email="sarah@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=VideoFactory(is_public=True),
        )

        response = self.client.get(
            f"/videos/{video.pk}?lrpk={public_registration.pk}&key="
            f"{public_registration.get_generate_salted_hmac()}"
        )
        self.assertEqual(response.status_code, 404)

    def test_video_public_without_consumer_site(self):
        """Public video without consumer site should have x-frame-options header."""
        organization = OrganizationFactory()
        playlist = PlaylistFactory(
            title="playlist-003",
            lti_id=None,
            organization=organization,
            consumer_site=None,
        )
        video = VideoFactory(
            playlist=playlist,
            is_public=True,
            resolutions=[144, 240, 480, 720, 1080],
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] not in [DELETED, HARVESTED]]
            ),
            transcode_pipeline="AWS",
            uploaded_on="2019-09-24 07:24:40+00",
        )

        response = self.client.get(f"/videos/{video.pk}")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        self.assertNotIn("Content-Security-Policy", response.headers)
        self.assertIn("X-Frame-Options", response.headers)
        self.assertEqual(response.headers["X-Frame-Options"], "DENY")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        PlaylistRefreshToken(context.get("refresh_token"))  # Must not raise

        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": False, "can_update": False},
        )
        self.assertNotIn("user", jwt_token.payload)

        self.assertEqual(
            context.get("resource"),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": "1569309880",
                "allow_recording": True,
                "can_edit": False,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "is_public": True,
                "is_ready_to_show": True,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "description": video.description,
                "id": str(video.id),
                "is_live": False,
                "upload_state": video.upload_state,
                "timed_text_tracks": [],
                "thumbnail": None,
                "title": video.title,
                "urls": {
                    "mp4": {
                        "144": f"https://abc.cloudfront.net/{video.pk}/"
                        "mp4/1569309880_144.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-003_1569309880.mp4",
                        "240": f"https://abc.cloudfront.net/{video.pk}/"
                        "mp4/1569309880_240.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-003_1569309880.mp4",
                        "480": f"https://abc.cloudfront.net/{video.pk}/"
                        "mp4/1569309880_480.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-003_1569309880.mp4",
                        "720": f"https://abc.cloudfront.net/{video.pk}/"
                        "mp4/1569309880_720.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-003_1569309880.mp4",
                        "1080": f"https://abc.cloudfront.net/{video.pk}/"
                        "mp4/1569309880_1080.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-003_1569309880.mp4",
                    },
                    "thumbnails": {
                        "144": f"https://abc.cloudfront.net/{video.pk}/"
                        "thumbnails/1569309880_144.0000000.jpg",
                        "240": f"https://abc.cloudfront.net/{video.pk}/"
                        "thumbnails/1569309880_240.0000000.jpg",
                        "480": f"https://abc.cloudfront.net/{video.pk}/"
                        "thumbnails/1569309880_480.0000000.jpg",
                        "720": f"https://abc.cloudfront.net/{video.pk}/"
                        "thumbnails/1569309880_720.0000000.jpg",
                        "1080": f"https://abc.cloudfront.net/{video.pk}/"
                        "thumbnails/1569309880_1080.0000000.jpg",
                    },
                    "manifests": {
                        "hls": f"https://abc.cloudfront.net/{video.pk}/"
                        "cmaf/1569309880.m3u8",
                    },
                    "previews": f"https://abc.cloudfront.net/{video.pk}/"
                    "previews/1569309880_100.jpg",
                },
                "should_use_subtitle_as_transcript": False,
                "starting_at": None,
                "has_transcript": False,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": "playlist-003",
                    "lti_id": None,
                },
                "recording_time": 0,
                "retention_date": None,
                "shared_live_medias": [],
                "live_state": None,
                "live_info": {},
                "live_type": None,
                "xmpp": None,
                "tags": [],
                "license": None,
            },
        )
        self.assertEqual(context.get("state"), "success")
        self.assertEqual(context.get("modelName"), "videos")
        self.assertIsNone(context.get("context_id"))
        self.assertIsNone(context.get("consumer_site"))
