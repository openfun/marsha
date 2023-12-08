"""Test the LTI video view."""
from html import unescape
import json
from logging import Logger
import random
import re
from unittest import mock
import uuid

from django.test import TestCase, override_settings

from waffle.testutils import override_switch

from marsha.core.defaults import (
    DELETED,
    HARVESTED,
    IDLE,
    JITSI,
    PENDING,
    RAW,
    READY,
    RUNNING,
    SENTRY,
    STATE_CHOICES,
)
from marsha.core.factories import (
    ConsumerSiteAccessFactory,
    ConsumerSiteLTIPassportFactory,
    OrganizationAccessFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
    SharedLiveMediaFactory,
    TimedTextTrackFactory,
    UploadedVideoFactory,
    UserFactory,
    VideoFactory,
)
from marsha.core.lti import LTI, LTIException
from marsha.core.models import ADMINISTRATOR, Video
from marsha.core.simple_jwt.tokens import PlaylistAccessToken, PlaylistRefreshToken
from marsha.core.tests.views.test_lti_base import BaseLTIViewForPortabilityTestCase


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument,too-many-lines


class VideoLTIViewTestCase(TestCase):  # pylint: disable=too-many-public-methods
    """Test the video view in the ``core`` app of the Marsha project."""

    maxDiff = None

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    @override_settings(SENTRY_DSN="https://sentry.dsn")
    @override_settings(RELEASE="1.2.3")
    @override_settings(VIDEO_PLAYER="videojs")
    @override_settings(ATTENDANCE_PUSH_DELAY=10)
    @override_settings(FRONTEND_HOME_URL="https://marsha.education")
    @override_switch(SENTRY, active=True)
    def test_views_lti_video_post_instructor_no_video(
        self, mock_get_consumer_site, mock_verify
    ):
        """Validate the format of the response returned by the view for an instructor request."""
        passport = ConsumerSiteLTIPassportFactory()
        video_id = uuid.uuid4()
        video_lti_id = "video-lti-id"
        playlist_lti_id = "context-id"
        data = {
            "resource_link_id": video_lti_id,
            "context_id": playlist_lti_id,
            "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "launch_presentation_locale": "fr",
            "lis_person_sourcedid": "jane_doe",
            "lis_person_contact_email_primary": "jane@test-mooc.fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        response = self.client.post(f"/lti/videos/{video_id}", data)

        video = Video.objects.get(id=video_id)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        PlaylistRefreshToken(context.get("refresh_token"))  # Must not raise
        self.assertEqual(context.get("frontend_home_url"), "https://marsha.education")
        self.assertEqual(jwt_token.payload["playlist_id"], str(video.playlist.id))
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(
            jwt_token.payload["consumer_site"], str(passport.consumer_site.id)
        )
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "fr_FR")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": True, "can_update": True},
        )
        self.assertDictEqual(
            jwt_token.payload["user"],
            {
                "email": "jane@test-mooc.fr",
                "id": "56255f3807599c377bf0e5bf072359fd",
                "username": "jane_doe",
                "user_fullname": None,
            },
        )

        self.assertEqual(context.get("state"), "success")
        self.assertEqual(
            context.get("static"),
            {
                "img": {
                    "errorMain": "/static/img/errorTelescope.png",
                    "liveBackground": "/static/img/liveBackground.jpg",
                    "liveErrorBackground": "/static/img/liveErrorBackground.jpg",
                    "marshaWhiteLogo": "/static/img/marshaWhiteLogo.png",
                    "videoWizardBackground": "/static/img/videoWizardBackground.png",
                },
            },
        )
        self.assertEqual(
            context.get("resource"),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": None,
                "allow_recording": True,
                "can_edit": True,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "is_public": False,
                "is_ready_to_show": False,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "starting_at": None,
                "description": video.description,
                "id": str(video.id),
                "upload_state": "pending",
                "is_live": False,
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
                    "title": playlist_lti_id,
                    "lti_id": playlist_lti_id,
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
        self.assertEqual(context.get("modelName"), "videos")
        self.assertEqual(context.get("sentry_dsn"), "https://sentry.dsn")
        self.assertEqual(context.get("environment"), "test")
        self.assertEqual(context.get("release"), "1.2.3")
        self.assertEqual(context.get("player"), "videojs")
        self.assertEqual(context.get("attendanceDelay"), 10 * 1000)
        self.assertFalse(context.get("flags").get("live_raw"))
        self.assertTrue(context.get("flags").get("sentry"))
        self.assertFalse(context.get("dashboardCollapsed"))
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    @override_settings(SENTRY_DSN="https://sentry.dsn")
    @override_settings(RELEASE="1.2.3")
    @override_settings(VIDEO_PLAYER="videojs")
    @override_settings(ATTENDANCE_PUSH_DELAY=10)
    @override_settings(FRONTEND_HOME_URL="https://marsha.education")
    @override_switch(SENTRY, active=True)
    def test_views_lti_video_post_instructor_no_video_generic(
        self, mock_get_consumer_site, mock_verify
    ):
        """Validate the format of the response returned by the view for an instructor request."""
        passport = ConsumerSiteLTIPassportFactory()
        video_lti_id = "video-lti-id"
        playlist_lti_id = "context-id"
        data = {
            "resource_link_id": video_lti_id,
            "context_id": playlist_lti_id,
            "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "launch_presentation_locale": "fr",
            "lis_person_sourcedid": "jane_doe",
            "lis_person_contact_email_primary": "jane@test-mooc.fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        response = self.client.post(
            "/lti/videos/",
            data,
            HTTP_REFERER=f"https://{passport.consumer_site.domain}/",
        )

        self.assertEqual(response.status_code, 200)

        video = Video.objects.get(
            lti_id=video_lti_id,
            playlist__lti_id=playlist_lti_id,
            playlist__consumer_site__domain=passport.consumer_site.domain,
        )

        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        PlaylistRefreshToken(context.get("refresh_token"))  # Must not raise
        self.assertEqual(context.get("frontend_home_url"), "https://marsha.education")
        self.assertEqual(jwt_token.payload["playlist_id"], str(video.playlist.id))
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(
            jwt_token.payload["consumer_site"], str(passport.consumer_site.id)
        )
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "fr_FR")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": True, "can_update": True},
        )
        self.assertDictEqual(
            jwt_token.payload["user"],
            {
                "email": "jane@test-mooc.fr",
                "id": "56255f3807599c377bf0e5bf072359fd",
                "username": "jane_doe",
                "user_fullname": None,
            },
        )

        self.assertEqual(context.get("state"), "success")
        self.assertListEqual(
            context.get("warnings"),
            [
                "To allow course copy or export, the resource url must be updated "
                "in the LMS with the following one:",
                f"http://testserver/lti/videos/{video.id}",
            ],
        )
        self.assertEqual(
            context.get("static"),
            {
                "img": {
                    "errorMain": "/static/img/errorTelescope.png",
                    "liveBackground": "/static/img/liveBackground.jpg",
                    "liveErrorBackground": "/static/img/liveErrorBackground.jpg",
                    "marshaWhiteLogo": "/static/img/marshaWhiteLogo.png",
                    "videoWizardBackground": "/static/img/videoWizardBackground.png",
                },
            },
        )
        self.assertEqual(
            context.get("resource"),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": None,
                "allow_recording": True,
                "can_edit": True,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "is_public": False,
                "is_ready_to_show": False,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "starting_at": None,
                "description": video.description,
                "id": str(video.id),
                "upload_state": "pending",
                "is_live": False,
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
                    "title": playlist_lti_id,
                    "lti_id": playlist_lti_id,
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
        self.assertEqual(context.get("modelName"), "videos")
        self.assertEqual(context.get("sentry_dsn"), "https://sentry.dsn")
        self.assertEqual(context.get("environment"), "test")
        self.assertEqual(context.get("release"), "1.2.3")
        self.assertEqual(context.get("player"), "videojs")
        self.assertEqual(context.get("attendanceDelay"), 10 * 1000)
        self.assertFalse(context.get("flags").get("live_raw"))
        self.assertTrue(context.get("flags").get("sentry"))
        self.assertFalse(context.get("dashboardCollapsed"))
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

        # With a second call, we should get the same video
        response = self.client.post(
            "/lti/videos/",
            data,
            HTTP_REFERER=f"https://{passport.consumer_site.domain}/",
        )
        self.assertEqual(response.status_code, 200)
        context = json.loads(unescape(match.group(1)))
        video2 = Video.objects.get(pk=context.get("resource").get("id"))
        self.assertEqual(video, video2)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    @override_settings(SENTRY_DSN="https://sentry.dsn")
    @override_settings(RELEASE="1.2.3")
    @override_settings(VIDEO_PLAYER="videojs")
    @override_settings(ATTENDANCE_PUSH_DELAY=10)
    @override_settings(FRONTEND_HOME_URL="https://marsha.education")
    @override_switch(SENTRY, active=True)
    def test_views_lti_video_post_instructor(self, mock_get_consumer_site, mock_verify):
        """Validate the format of the response returned by the view for an instructor request."""
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__title="foo bar",
            playlist__consumer_site=passport.consumer_site,
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "launch_presentation_locale": "fr",
            "lis_person_sourcedid": "jane_doe",
            "lis_person_contact_email_primary": "jane@test-mooc.fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        response = self.client.post(
            f"/lti/videos/{video.pk}", data, HTTP_REFERER="http://testserver.net"
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        PlaylistRefreshToken(context.get("refresh_token"))  # Must not raise
        self.assertEqual(context.get("frontend_home_url"), "https://marsha.education")
        self.assertEqual(jwt_token.payload["playlist_id"], str(video.playlist.id))
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(
            jwt_token.payload["consumer_site"], str(passport.consumer_site.id)
        )
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "fr_FR")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": True, "can_update": True},
        )
        self.assertDictEqual(
            jwt_token.payload["user"],
            {
                "email": "jane@test-mooc.fr",
                "id": "56255f3807599c377bf0e5bf072359fd",
                "username": "jane_doe",
                "user_fullname": None,
            },
        )

        self.assertEqual(context.get("state"), "success")
        self.assertEqual(
            context.get("static"),
            {
                "img": {
                    "errorMain": "/static/img/errorTelescope.png",
                    "liveBackground": "/static/img/liveBackground.jpg",
                    "liveErrorBackground": "/static/img/liveErrorBackground.jpg",
                    "marshaWhiteLogo": "/static/img/marshaWhiteLogo.png",
                    "videoWizardBackground": "/static/img/videoWizardBackground.png",
                },
            },
        )
        self.assertEqual(
            context.get("resource"),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": None,
                "allow_recording": True,
                "can_edit": True,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "is_public": False,
                "is_ready_to_show": False,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "starting_at": None,
                "description": video.description,
                "id": str(video.id),
                "upload_state": "pending",
                "is_live": False,
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
                    "title": "foo bar",
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
        self.assertEqual(context.get("modelName"), "videos")
        self.assertEqual(context.get("sentry_dsn"), "https://sentry.dsn")
        self.assertEqual(context.get("environment"), "test")
        self.assertEqual(context.get("release"), "1.2.3")
        self.assertEqual(context.get("player"), "videojs")
        self.assertEqual(context.get("attendanceDelay"), 10 * 1000)
        self.assertFalse(context.get("flags").get("live_raw"))
        self.assertTrue(context.get("flags").get("sentry"))
        self.assertFalse(context.get("dashboardCollapsed"))
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)
        video.refresh_from_db()
        self.assertEqual(
            video.last_lti_url,
            "http://testserver.net/course/course-v1:ufr+mathematics+00001",
        )

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    @override_settings(SENTRY_DSN="https://sentry.dsn")
    @override_settings(RELEASE="1.2.3")
    @override_settings(VIDEO_PLAYER="videojs")
    @override_settings(ATTENDANCE_PUSH_DELAY=20)
    def test_views_lti_video_instructor_live_mode_on(
        self, mock_get_consumer_site, mock_verify
    ):
        """Validate the format of the response for a live video requested by an instructor."""
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__title="foo bar",
            playlist__consumer_site=passport.consumer_site,
            live_state=IDLE,
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
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        response = self.client.post(f"/lti/videos/{video.pk}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        PlaylistRefreshToken(context.get("refresh_token"))  # Must not raise
        self.assertEqual(jwt_token.payload["playlist_id"], str(video.playlist.id))
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "email": None,
                "id": "56255f3807599c377bf0e5bf072359fd",
                "username": "jane_doe",
                "user_fullname": None,
            },
        )
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(
            jwt_token.payload["consumer_site"], str(passport.consumer_site.id)
        )
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "fr_FR")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": True, "can_update": True},
        )

        self.assertEqual(context.get("state"), "success")
        self.assertEqual(
            context.get("static"),
            {
                "img": {
                    "errorMain": "/static/img/errorTelescope.png",
                    "liveBackground": "/static/img/liveBackground.jpg",
                    "liveErrorBackground": "/static/img/liveErrorBackground.jpg",
                    "marshaWhiteLogo": "/static/img/marshaWhiteLogo.png",
                    "videoWizardBackground": "/static/img/videoWizardBackground.png",
                },
            },
        )
        self.assertEqual(
            context.get("resource"),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": None,
                "allow_recording": True,
                "can_edit": True,
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
                "is_live": True,
                "upload_state": PENDING,
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
                "has_transcript": False,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "recording_time": 0,
                "retention_date": None,
                "shared_live_medias": [],
                "live_state": IDLE,
                "live_info": {
                    "medialive": {
                        "input": {
                            "endpoints": [
                                "https://live_endpoint1",
                                "https://live_endpoint2",
                            ],
                        }
                    },
                },
                "live_type": RAW,
                "xmpp": None,
                "tags": [],
                "license": None,
            },
        )
        self.assertEqual(context.get("modelName"), "videos")
        self.assertEqual(context.get("sentry_dsn"), "https://sentry.dsn")
        self.assertEqual(context.get("environment"), "test")
        self.assertEqual(context.get("release"), "1.2.3")
        self.assertEqual(context.get("player"), "videojs")
        self.assertEqual(context.get("attendanceDelay"), 20 * 1000)
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    @override_settings(SENTRY_DSN="https://sentry.dsn")
    @override_settings(RELEASE="1.2.3")
    @override_settings(VIDEO_PLAYER="videojs")
    @override_settings(LIVE_CHAT_ENABLED=True)
    @override_settings(XMPP_BOSH_URL="https://xmpp-server.com/http-bind")
    @override_settings(XMPP_CONFERENCE_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_DOMAIN="conference.xmpp-server.com")
    @override_settings(XMPP_JWT_SHARED_SECRET="xmpp_shared_secret")
    @override_settings(ATTENDANCE_PUSH_DELAY=30)
    def test_views_lti_video_instructor_live_mode_and_chat_on(
        self, mock_get_consumer_site, mock_verify
    ):
        """Validate the format of the response for a live video.

        The video is requested by an instructor and chat is enabled.
        """
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__title="foo bar",
            playlist__consumer_site=passport.consumer_site,
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
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        with mock.patch(
            "marsha.core.serializers.xmpp_utils.generate_jwt"
        ) as mock_jwt_encode:
            mock_jwt_encode.return_value = "xmpp_jwt"
            response = self.client.post(f"/lti/videos/{video.pk}", data)

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        PlaylistRefreshToken(context.get("refresh_token"))  # Must not raise
        self.assertEqual(jwt_token.payload["playlist_id"], str(video.playlist.id))
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "email": None,
                "id": "56255f3807599c377bf0e5bf072359fd",
                "username": "jane_doe",
                "user_fullname": None,
            },
        )
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(
            jwt_token.payload["consumer_site"], str(passport.consumer_site.id)
        )
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "fr_FR")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": True, "can_update": True},
        )

        self.assertEqual(context.get("state"), "success")
        self.assertEqual(
            context.get("static"),
            {
                "img": {
                    "errorMain": "/static/img/errorTelescope.png",
                    "liveBackground": "/static/img/liveBackground.jpg",
                    "liveErrorBackground": "/static/img/liveErrorBackground.jpg",
                    "marshaWhiteLogo": "/static/img/marshaWhiteLogo.png",
                    "videoWizardBackground": "/static/img/videoWizardBackground.png",
                },
            },
        )
        self.assertEqual(
            context.get("resource"),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": None,
                "allow_recording": True,
                "can_edit": True,
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
                "is_live": True,
                "upload_state": PENDING,
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
                "has_transcript": False,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "recording_time": 0,
                "retention_date": None,
                "shared_live_medias": [],
                "live_state": RUNNING,
                "live_info": {
                    "medialive": {
                        "input": {
                            "endpoints": [
                                "https://live_endpoint1",
                                "https://live_endpoint2",
                            ],
                        }
                    },
                },
                "live_type": RAW,
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
        self.assertEqual(context.get("modelName"), "videos")
        self.assertEqual(context.get("sentry_dsn"), "https://sentry.dsn")
        self.assertEqual(context.get("environment"), "test")
        self.assertEqual(context.get("release"), "1.2.3")
        self.assertEqual(context.get("player"), "videojs")
        self.assertEqual(context.get("attendanceDelay"), 30 * 1000)
        self.assertFalse(context.get("dashboardCollapsed"))
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    @override_settings(SENTRY_DSN="https://sentry.dsn")
    @override_settings(RELEASE="1.2.3")
    @override_settings(VIDEO_PLAYER="videojs")
    @override_settings(ATTENDANCE_PUSH_DELAY=10)
    @override_switch(SENTRY, active=True)
    def test_views_lti_video_post_instructor_dashboard_collapsed(
        self, mock_get_consumer_site, mock_verify
    ):
        """
        When we get an LTI request with custom_embedded_resource set,
        dashboard_collapsed value in context should be true.
        """
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__title="foo bar",
            playlist__consumer_site=passport.consumer_site,
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "launch_presentation_locale": "fr",
            "lis_person_sourcedid": "jane_doe",
            "lis_person_contact_email_primary": "jane@test-mooc.fr",
            "custom_embedded_resource": "1",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        params = {
            "collapsed": True,
        }
        response = self.client.post(f"/lti/videos/{video.pk}", data, params=params)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        self.assertTrue(context.get("dashboardCollapsed"))

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    @override_settings(SENTRY_DSN="https://sentry.dsn")
    @override_settings(RELEASE="1.2.3")
    def test_views_lti_video_student_live_mode_on(
        self, mock_get_consumer_site, mock_verify
    ):
        """Validate the format of the response for a live video requested by a student."""
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__title="foo bar",
            playlist__consumer_site=passport.consumer_site,
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
                    "chanel": {"id": "medialive_channel_1"},
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
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "student",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        response = self.client.post(f"/lti/videos/{video.pk}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        PlaylistRefreshToken(context.get("refresh_token"))  # Must not raise
        self.assertEqual(jwt_token.payload["playlist_id"], str(video.playlist.id))
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "email": None,
                "id": "56255f3807599c377bf0e5bf072359fd",
                "username": "jane_doe",
                "user_fullname": None,
            },
        )
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(
            jwt_token.payload["consumer_site"], str(passport.consumer_site.id)
        )
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "fr_FR")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": False, "can_update": False},
        )

        self.assertEqual(context.get("state"), "success")
        self.assertEqual(
            context.get("static"),
            {
                "img": {
                    "errorMain": "/static/img/errorTelescope.png",
                    "liveBackground": "/static/img/liveBackground.jpg",
                    "liveErrorBackground": "/static/img/liveErrorBackground.jpg",
                    "marshaWhiteLogo": "/static/img/marshaWhiteLogo.png",
                    "videoWizardBackground": "/static/img/videoWizardBackground.png",
                },
            },
        )
        self.assertEqual(
            context.get("resource"),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": None,
                "allow_recording": True,
                "can_edit": False,
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
                "is_live": True,
                "upload_state": PENDING,
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
                "has_transcript": False,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "recording_time": 0,
                "retention_date": None,
                "shared_live_medias": [],
                "live_info": {},
                "live_state": RUNNING,
                "live_type": RAW,
                "xmpp": None,
                "tags": [],
                "license": None,
            },
        )
        self.assertEqual(context.get("modelName"), "videos")
        self.assertEqual(context.get("sentry_dsn"), "https://sentry.dsn")
        self.assertEqual(context.get("environment"), "test")
        self.assertEqual(context.get("release"), "1.2.3")
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    @override_settings(EXTERNAL_JAVASCRIPT_SCRIPTS=["https://example.com/test.js"])
    def test_views_lti_video_with_external_js_sources(
        self, mock_get_consumer_site, mock_verify
    ):
        """Validate external js sources are added in the lti template."""
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "administrator",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        response = self.client.post(f"/lti/videos/{video.pk}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        self.assertContains(response, '<script src="https://example.com/test.js" >')

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_video_post_administrator(
        self, mock_get_consumer_site, mock_verify
    ):
        """Validate the format of the response returned by the view for an admin request."""
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__title="foo bar",
            playlist__consumer_site=passport.consumer_site,
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "administrator",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        response = self.client.post(f"/lti/videos/{video.pk}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        PlaylistRefreshToken(context.get("refresh_token"))  # Must not raise
        self.assertEqual(jwt_token.payload["playlist_id"], str(video.playlist.id))
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "email": None,
                "id": "56255f3807599c377bf0e5bf072359fd",
                "username": "jane_doe",
                "user_fullname": None,
            },
        )
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(
            jwt_token.payload["consumer_site"], str(passport.consumer_site.id)
        )
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "fr_FR")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": True, "can_update": True},
        )

        self.assertEqual(context.get("state"), "success")
        self.assertEqual(
            context.get("resource"),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": None,
                "allow_recording": True,
                "can_edit": True,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "is_public": False,
                "is_ready_to_show": False,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "starting_at": None,
                "description": video.description,
                "id": str(video.id),
                "is_live": False,
                "upload_state": "pending",
                "shared_live_medias": [],
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
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "recording_time": 0,
                "retention_date": None,
                "live_state": None,
                "live_info": {},
                "live_type": None,
                "xmpp": None,
                "tags": [],
                "license": None,
            },
        )
        self.assertEqual(context.get("modelName"), "videos")
        self.assertEqual(context.get("sentry_dsn"), None)
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_video_read_other_playlist(
        self, mock_get_consumer_site, mock_verify
    ):
        """A video from another portable playlist should have "can_update" set to False."""
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        video = VideoFactory(
            id="301b5f4f-b9f1-4a5f-897d-f8f1bf22c396",
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=True,
            playlist__title="playlist-003",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] not in [DELETED, HARVESTED]]
            ),
            transcode_pipeline="AWS",
            uploaded_on="2019-09-24 07:24:40+00",
            resolutions=[144, 240, 480, 720, 1080],
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": "another-playlist",
            "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        response = self.client.post(f"/lti/videos/{video.pk}", data)
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
            {"can_access_dashboard": True, "can_update": False},
        )
        self.assertEqual(context.get("state"), "success")
        self.assertEqual(
            context.get("resource"),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": "1569309880",
                "allow_recording": True,
                "can_edit": True,
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
                "is_live": False,
                "upload_state": video.upload_state,
                "timed_text_tracks": [],
                "thumbnail": None,
                "title": video.title,
                "urls": {
                    "mp4": {
                        "144": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c396/"
                        "mp4/1569309880_144.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-003_1569309880.mp4",
                        "240": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c396/"
                        "mp4/1569309880_240.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-003_1569309880.mp4",
                        "480": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c396/"
                        "mp4/1569309880_480.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-003_1569309880.mp4",
                        "720": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c396/"
                        "mp4/1569309880_720.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-003_1569309880.mp4",
                        "1080": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c396/"
                        "mp4/1569309880_1080.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-003_1569309880.mp4",
                    },
                    "thumbnails": {
                        "144": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c396/"
                        "thumbnails/1569309880_144.0000000.jpg",
                        "240": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c396/"
                        "thumbnails/1569309880_240.0000000.jpg",
                        "480": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c396/"
                        "thumbnails/1569309880_480.0000000.jpg",
                        "720": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c396/"
                        "thumbnails/1569309880_720.0000000.jpg",
                        "1080": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c396/"
                        "thumbnails/1569309880_1080.0000000.jpg",
                    },
                    "manifests": {
                        "hls": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c396/"
                        "cmaf/1569309880.m3u8",
                    },
                    "previews": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c396/"
                    "previews/1569309880_100.jpg",
                },
                "should_use_subtitle_as_transcript": False,
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
        self.assertEqual(context.get("modelName"), "videos")
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_video_restricted_resolutions_list(
        self, mock_get_consumer_site, mock_verify
    ):
        """Urls list should contains resolutions from resolutions field."""
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(
            id="59c0fc7a-0f64-46c0-993f-bdf47ecd837f",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
            playlist__title="playlist-002",
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] not in [DELETED, HARVESTED]]
            ),
            transcode_pipeline="AWS",
            uploaded_on="2019-09-24 07:24:40+00",
            resolutions=[144, 240, 480],
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "student",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
        }
        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post(f"/lti/videos/{video.pk}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        PlaylistRefreshToken(context.get("refresh_token"))  # Must not raise
        self.assertEqual(jwt_token.payload["playlist_id"], str(video.playlist.id))
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "email": None,
                "id": "56255f3807599c377bf0e5bf072359fd",
                "username": "jane_doe",
                "user_fullname": None,
            },
        )
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(
            jwt_token.payload["consumer_site"], str(passport.consumer_site.id)
        )
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "en_US")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": False, "can_update": False},
        )

        self.assertEqual(context.get("state"), "success")

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
                "is_public": False,
                "is_ready_to_show": True,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "starting_at": None,
                "description": video.description,
                "id": str(video.id),
                "is_live": False,
                "upload_state": video.upload_state,
                "timed_text_tracks": [],
                "thumbnail": None,
                "title": video.title,
                "urls": {
                    "mp4": {
                        "144": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "mp4/1569309880_144.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-002_1569309880.mp4",
                        "240": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "mp4/1569309880_240.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-002_1569309880.mp4",
                        "480": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "mp4/1569309880_480.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-002_1569309880.mp4",
                    },
                    "thumbnails": {
                        "144": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "thumbnails/1569309880_144.0000000.jpg",
                        "240": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "thumbnails/1569309880_240.0000000.jpg",
                        "480": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "thumbnails/1569309880_480.0000000.jpg",
                    },
                    "manifests": {
                        "hls": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "cmaf/1569309880.m3u8",
                    },
                    "previews": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
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
        self.assertEqual(context.get("modelName"), "videos")
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_video_harvested_live_state_student(
        self, mock_get_consumer_site, mock_verify
    ):
        """A student requesting a harvested live should not get urls."""
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(
            id="59c0fc7a-0f64-46c0-993f-bdf47ecd837f",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
            playlist__title="playlist-002",
            live_state=HARVESTED,
            live_type=JITSI,
            upload_state=PENDING,
            uploaded_on="2019-09-24 07:24:40+00",
            resolutions=[240, 480, 720],
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "student",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
        }
        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post(f"/lti/videos/{video.pk}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        PlaylistRefreshToken(context.get("refresh_token"))  # Must not raise
        self.assertEqual(jwt_token.payload["playlist_id"], str(video.playlist.id))
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "email": None,
                "id": "56255f3807599c377bf0e5bf072359fd",
                "username": "jane_doe",
                "user_fullname": None,
            },
        )
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(
            jwt_token.payload["consumer_site"], str(passport.consumer_site.id)
        )
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "en_US")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": False, "can_update": False},
        )

        self.assertEqual(context.get("state"), "success")

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
                "is_public": False,
                "is_ready_to_show": True,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "starting_at": None,
                "description": video.description,
                "id": str(video.id),
                "is_live": True,
                "upload_state": video.upload_state,
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
                    "title": "playlist-002",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "recording_time": 0,
                "retention_date": None,
                "shared_live_medias": [],
                "live_state": HARVESTED,
                "live_info": {},
                "live_type": JITSI,
                "xmpp": None,
                "tags": [],
                "license": None,
            },
        )
        self.assertEqual(context.get("modelName"), "videos")
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_video_harvested_live_state_instructor(
        self, mock_get_consumer_site, mock_verify
    ):
        """An instructor requesting a harvested live should get urls."""
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(
            id="59c0fc7a-0f64-46c0-993f-bdf47ecd837f",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
            playlist__title="playlist-002",
            live_state=HARVESTED,
            live_type=JITSI,
            upload_state=PENDING,
            uploaded_on="2019-09-24 07:24:40+00",
            transcode_pipeline="AWS",
            resolutions=[240, 480, 720],
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
        }
        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post(f"/lti/videos/{video.pk}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        PlaylistRefreshToken(context.get("refresh_token"))  # Must not raise
        self.assertEqual(jwt_token.payload["playlist_id"], str(video.playlist.id))
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "email": None,
                "id": "56255f3807599c377bf0e5bf072359fd",
                "username": "jane_doe",
                "user_fullname": None,
            },
        )
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(
            jwt_token.payload["consumer_site"], str(passport.consumer_site.id)
        )
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "en_US")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": True, "can_update": True},
        )

        self.assertEqual(context.get("state"), "success")

        self.assertEqual(
            context.get("resource"),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": "1569309880",
                "allow_recording": True,
                "can_edit": True,
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
                "is_live": True,
                "upload_state": video.upload_state,
                "timed_text_tracks": [],
                "thumbnail": None,
                "title": video.title,
                "urls": {
                    "manifests": {},
                    "mp4": {
                        "240": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "mp4/1569309880_240.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-002_1569309880.mp4",
                        "480": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "mp4/1569309880_480.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-002_1569309880.mp4",
                        "720": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "mp4/1569309880_720.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-002_1569309880.mp4",
                    },
                    "thumbnails": {
                        "240": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "thumbnails/1569309880_240.0000000.jpg",
                        "480": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "thumbnails/1569309880_480.0000000.jpg",
                        "720": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
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
                "retention_date": None,
                "shared_live_medias": [],
                "live_state": HARVESTED,
                "live_info": {
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
        self.assertEqual(context.get("modelName"), "videos")
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_video_post_student_with_video(
        self, mock_get_consumer_site, mock_verify
    ):
        """Validate the format of the response returned by the view for a student request."""
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(
            id="59c0fc7a-0f64-46c0-993f-bdf47ecd837f",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
            playlist__title="playlist-002",
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] not in [DELETED, HARVESTED]]
            ),
            uploaded_on="2019-09-24 07:24:40+00",
            transcode_pipeline="AWS",
            resolutions=[144, 240, 480, 720, 1080],
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "student",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
        }
        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post(f"/lti/videos/{video.pk}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        PlaylistRefreshToken(context.get("refresh_token"))  # Must not raise
        self.assertEqual(jwt_token.payload["playlist_id"], str(video.playlist.id))
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "email": None,
                "id": "56255f3807599c377bf0e5bf072359fd",
                "username": "jane_doe",
                "user_fullname": None,
            },
        )
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(
            jwt_token.payload["consumer_site"], str(passport.consumer_site.id)
        )
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "en_US")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": False, "can_update": False},
        )

        self.assertEqual(context.get("state"), "success")

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
                "is_public": False,
                "is_ready_to_show": True,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "starting_at": None,
                "description": video.description,
                "id": str(video.id),
                "is_live": False,
                "upload_state": video.upload_state,
                "timed_text_tracks": [],
                "thumbnail": None,
                "title": video.title,
                "urls": {
                    "mp4": {
                        "144": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "mp4/1569309880_144.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-002_1569309880.mp4",
                        "240": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "mp4/1569309880_240.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-002_1569309880.mp4",
                        "480": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "mp4/1569309880_480.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-002_1569309880.mp4",
                        "720": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "mp4/1569309880_720.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-002_1569309880.mp4",
                        "1080": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "mp4/1569309880_1080.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-002_1569309880.mp4",
                    },
                    "thumbnails": {
                        "144": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "thumbnails/1569309880_144.0000000.jpg",
                        "240": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "thumbnails/1569309880_240.0000000.jpg",
                        "480": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "thumbnails/1569309880_480.0000000.jpg",
                        "720": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "thumbnails/1569309880_720.0000000.jpg",
                        "1080": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "thumbnails/1569309880_1080.0000000.jpg",
                    },
                    "manifests": {
                        "hls": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "cmaf/1569309880.m3u8",
                    },
                    "previews": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
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
        self.assertEqual(context.get("modelName"), "videos")
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_video_post_student_with_video_generic(
        self, mock_get_consumer_site, mock_verify
    ):
        """Validate the format of the response returned by the view for a student request."""
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(
            id="59c0fc7a-0f64-46c0-993f-bdf47ecd837f",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
            playlist__title="playlist-002",
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] not in [DELETED, HARVESTED]]
            ),
            uploaded_on="2019-09-24 07:24:40+00",
            transcode_pipeline="AWS",
            resolutions=[144, 240, 480, 720, 1080],
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "student",
            # "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
        }
        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post(
            "/lti/videos/",
            data,
            HTTP_REFERER=f"https://{passport.consumer_site.domain}/",
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        PlaylistRefreshToken(context.get("refresh_token"))  # Must not raise
        self.assertEqual(jwt_token.payload["playlist_id"], str(video.playlist.id))
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "email": None,
                "id": "56255f3807599c377bf0e5bf072359fd",
                "username": "jane_doe",
                "user_fullname": None,
            },
        )
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(
            jwt_token.payload["consumer_site"], str(passport.consumer_site.id)
        )
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "en_US")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": False, "can_update": False},
        )

        self.assertEqual(context.get("state"), "success")

        self.assertIsNone(context.get("warnings"))
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
                "is_public": False,
                "is_ready_to_show": True,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "starting_at": None,
                "description": video.description,
                "id": str(video.id),
                "is_live": False,
                "upload_state": video.upload_state,
                "timed_text_tracks": [],
                "thumbnail": None,
                "title": video.title,
                "urls": {
                    "mp4": {
                        "144": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "mp4/1569309880_144.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-002_1569309880.mp4",
                        "240": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "mp4/1569309880_240.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-002_1569309880.mp4",
                        "480": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "mp4/1569309880_480.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-002_1569309880.mp4",
                        "720": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "mp4/1569309880_720.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-002_1569309880.mp4",
                        "1080": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "mp4/1569309880_1080.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-002_1569309880.mp4",
                    },
                    "thumbnails": {
                        "144": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "thumbnails/1569309880_144.0000000.jpg",
                        "240": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "thumbnails/1569309880_240.0000000.jpg",
                        "480": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "thumbnails/1569309880_480.0000000.jpg",
                        "720": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "thumbnails/1569309880_720.0000000.jpg",
                        "1080": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "thumbnails/1569309880_1080.0000000.jpg",
                    },
                    "manifests": {
                        "hls": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "cmaf/1569309880.m3u8",
                    },
                    "previews": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
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
        self.assertEqual(context.get("modelName"), "videos")
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_video_without_user_id_parameter(
        self, mock_get_consumer_site, mock_verify
    ):
        """Ensure JWT is created if user_id is missing in the LTI request."""
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(
            playlist__consumer_site=passport.consumer_site,
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
            uploaded_on="2019-09-24 07:24:40+00",
            resolutions=[144, 240, 480, 720, 1080],
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "context_title": "mathematics",
            "tool_consumer_instance_name": "ufr",
            "roles": "student",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post(f"/lti/videos/{video.pk}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")
        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        PlaylistRefreshToken(context.get("refresh_token"))  # Must not raise
        self.assertEqual(jwt_token.payload["playlist_id"], str(video.playlist.id))
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(
            jwt_token.payload["consumer_site"], str(passport.consumer_site.id)
        )
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "en_US")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": False, "can_update": False},
        )
        self.assertEqual(context.get("modelName"), "videos")

        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_video_post_student_no_video(
        self, mock_get_consumer_site, mock_verify
    ):
        """Validate the response returned for a student request when there is no video."""
        passport = ConsumerSiteLTIPassportFactory()
        data = {
            "resource_link_id": "example.com-123",
            "context_id": "course-v1:ufr+mathematics+00001",
            "roles": "student",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
        }
        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post(f"/lti/videos/{uuid.uuid4()}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        self.assertEqual(context.get("state"), "success")
        self.assertIsNone(context.get("resource"))
        self.assertEqual(context.get("modelName"), "videos")

        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @override_settings(SENTRY_DSN="https://sentry.dsn")
    @override_settings(RELEASE="1.2.3")
    @override_switch(SENTRY, active=True)
    @mock.patch.object(Logger, "warning")
    @mock.patch.object(LTI, "verify", side_effect=LTIException("lti error"))
    def test_views_lti_video_post_error(self, mock_verify, mock_logger):
        """Validate the response returned in case of an LTI exception."""
        role = random.choice(["instructor", "student"])
        data = {"resource_link_id": "123", "roles": role, "context_id": "abc"}
        response = self.client.post(f"/lti/videos/{uuid.uuid4()}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        mock_logger.assert_called_once_with("lti error")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        self.assertEqual(context.get("state"), "error")
        self.assertDictEqual(
            context.get("error"),
            {
                "message": "lti error",
                "status_code": None,
            },
        )
        self.assertIsNone(context.get("resource"))
        self.assertEqual(context.get("modelName"), "videos")

        self.assertEqual(context.get("environment"), "test")
        self.assertFalse(context.get("flags").get("live_raw"))
        self.assertTrue(context.get("flags").get("sentry"))
        self.assertEqual(context.get("frontend"), "LTI")
        self.assertEqual(context.get("release"), "1.2.3")
        self.assertEqual(context.get("sentry_dsn"), "https://sentry.dsn")
        self.assertEqual(
            context.get("static"),
            {
                "img": {
                    "errorMain": "/static/img/errorTelescope.png",
                    "liveBackground": "/static/img/liveBackground.jpg",
                    "liveErrorBackground": "/static/img/liveErrorBackground.jpg",
                    "marshaWhiteLogo": "/static/img/marshaWhiteLogo.png",
                    "videoWizardBackground": "/static/img/videoWizardBackground.png",
                },
            },
        )
        self.assertEqual(context.get("player"), "videojs")
        self.assertEqual(context.get("uploadPollInterval"), "60")
        self.assertEqual(context.get("attendanceDelay"), 60000)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_video_with_timed_text(self, mock_get_consumer_site, mock_verify):
        """Make sure the LTI Video view functions when the Video has associated TimedTextTracks.

        NB: This is a bug-reproducing test case.
        The comprehensive test suite in test_api_video does not cover this case as it uses a JWT
        and therefore falls in another case when it comes to handling of video ids.
        """
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(playlist__consumer_site=passport.consumer_site)
        # Create a TimedTextTrack associated with the video to trigger the error
        TimedTextTrackFactory(video=video)

        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
        }
        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post(f"/lti/videos/{video.pk}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")
        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        PlaylistRefreshToken(context.get("refresh_token"))  # Must not raise
        self.assertEqual(jwt_token.payload["playlist_id"], str(video.playlist.id))
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(
            jwt_token.payload["consumer_site"], str(passport.consumer_site.id)
        )
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "en_US")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": True, "can_update": True},
        )
        self.assertEqual(context.get("modelName"), "videos")

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_video_static_base_url(self, mock_get_consumer_site, mock_verify):
        """Meta tag public-path should be the STATIC_URL settings with js/ at the end."""
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(playlist__consumer_site=passport.consumer_site)
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
            "launch_presentation_locale": "fr",
        }
        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post(f"/lti/videos/{video.pk}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        self.assertContains(
            response, '<meta name="public-path" value="/static/js/build/lti_site/" />'
        )

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_video_has_transcript(self, mock_get_consumer_site, mock_verify):
        """Compute has_transcript when a transcript is uploaded."""
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(
            playlist__consumer_site=passport.consumer_site,
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
        )
        # Create a TimedTextTrack associated with the video to trigger the error
        transcript = TimedTextTrackFactory(
            video=video,
            mode="ts",
            upload_state=READY,
            uploaded_on="2019-09-24 07:24:40+00",
            extension="srt",
        )

        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        response = self.client.post(f"/lti/videos/{video.pk}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))

        self.assertEqual(
            context.get("resource"),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": None,
                "allow_recording": True,
                "can_edit": True,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "is_public": False,
                "is_ready_to_show": False,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "starting_at": None,
                "description": video.description,
                "id": str(video.id),
                "is_live": False,
                "upload_state": "pending",
                "timed_text_tracks": [
                    {
                        "active_stamp": "1569309880",
                        "id": str(transcript.id),
                        "is_ready_to_show": True,
                        "mode": "ts",
                        "language": transcript.language,
                        "upload_state": "ready",
                        "source_url": (
                            f"https://abc.cloudfront.net/{video.id}/"
                            f"timedtext/source/1569309880_{transcript.language}_ts?"
                            "response-content-disposition=attachment%3B+filename%3Dfoo-bar"
                            "_1569309880.srt"
                        ),
                        "url": (
                            f"https://abc.cloudfront.net/{video.id}/timedtext/"
                            f"1569309880_{transcript.language}_ts.vtt"
                        ),
                        "video": str(video.id),
                    }
                ],
                "thumbnail": None,
                "title": video.title,
                "urls": None,
                "should_use_subtitle_as_transcript": False,
                "has_transcript": True,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": "foo bar",
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

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_video_has_transcript_false(
        self, mock_get_consumer_site, mock_verify
    ):
        """Compute has_transcript when a transcript is uploaded and not ready to be shown."""
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(
            playlist__consumer_site=passport.consumer_site,
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
        )
        # Create a TimedTextTrack associated with the video to trigger the error
        transcript = TimedTextTrackFactory(
            video=video,
            mode="ts",
            upload_state=PENDING,
        )

        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        response = self.client.post(f"/lti/videos/{video.pk}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))

        self.assertEqual(
            context.get("resource"),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": None,
                "allow_recording": True,
                "can_edit": True,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "is_public": False,
                "is_ready_to_show": False,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "starting_at": None,
                "description": video.description,
                "id": str(video.id),
                "is_live": False,
                "upload_state": "pending",
                "timed_text_tracks": [
                    {
                        "active_stamp": None,
                        "id": str(transcript.id),
                        "is_ready_to_show": False,
                        "mode": "ts",
                        "language": transcript.language,
                        "upload_state": "pending",
                        "source_url": None,
                        "url": None,
                        "video": str(video.id),
                    }
                ],
                "thumbnail": None,
                "title": video.title,
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

    def test_views_lti_video_get_request(
        self,
    ):
        """LTI GET request should not be allowed."""
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(
            playlist__consumer_site=passport.consumer_site,
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
        )

        response = self.client.get(f"/lti/videos/{video.id}")

        self.assertEqual(response.status_code, 405)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_video_with_shared_live_media(
        self, mock_get_consumer_site, mock_verify
    ):
        """Make sure the LTI Video view functions when the Video has associated SharedLiveMedia.

        NB: This is a bug-reproducing test case.
        The comprehensive test suite in test_api_video does not cover this case as it uses a JWT
        and therefore falls in another case when it comes to handling of video ids.
        """
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(playlist__consumer_site=passport.consumer_site)
        # Create a SharedLiveMedia associated with the video to trigger the error
        SharedLiveMediaFactory(video=video)

        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
        }
        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post(f"/lti/videos/{video.pk}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")
        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        self.assertEqual(
            context.get("resource").get("shared_live_medias")[0].get("video"),
            str(video.id),
        )

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    @override_settings(FRONTEND_HOME_URL="https://marsha.education/")
    def test_views_lti_video_normalize_frontend_home_url(
        self, mock_get_consumer_site, mock_verify
    ):
        """Make sure the LTI Video view normalizes the FRONTEND_HOME_URL."""
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(playlist__consumer_site=passport.consumer_site)

        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post(f"/lti/videos/{video.pk}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")
        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        self.assertEqual(context.get("frontend_home_url"), "https://marsha.education")

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_video_deleted(self, mock_get_consumer_site, mock_verify):
        """Validate the format of the response returned by the view for an instructor request."""
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__title="foo bar",
            playlist__consumer_site=passport.consumer_site,
        )
        video.delete()
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "launch_presentation_locale": "fr",
            "lis_person_sourcedid": "jane_doe",
            "lis_person_contact_email_primary": "jane@test-mooc.fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        response = self.client.post(f"/lti/videos/{video.id}", data)

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
            {"message": "Resource has been deleted.", "status_code": 410},
        )

        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)


class VideoLTIViewForPortabilityTestCase(BaseLTIViewForPortabilityTestCase):
    """Test the video LTI view for portability."""

    expected_context_model_name = "videos"  # resource.RESOURCE_NAME

    def _get_lti_view_url(self, resource):
        """Return the LTI view URL for the provided video."""
        return f"/lti/videos/{resource.pk}"

    def test_views_lti_video_portability_for_playlist_without_owner(
        self,
    ):
        """
        Assert the application data does not provide portability information
        when playlist has no known owner
        and the authenticated user is an administrator or a teacher or a student.
        """
        video = UploadedVideoFactory()

        self.assertLTIViewReturnsNoResourceForStudent(video)
        self.assertLTIViewReturnsErrorForAdminOrInstructor(video)

    def test_views_lti_video_portability_for_playlist_with_owner(self):
        """
        Assert the application data provides portability information
        when playlist has a creator
        and the authenticated user is an administrator or a teacher but not a student.
        """
        playlist_with_owner = PlaylistFactory(
            created_by=UserFactory(),
        )
        video = UploadedVideoFactory(playlist=playlist_with_owner)

        self.assertLTIViewReturnsNoResourceForStudent(video)
        self.assertLTIViewReturnsPortabilityContextForAdminOrInstructor(video)

    def test_views_lti_video_portability_for_playlist_with_admin(self):
        """
        Assert the application data provides portability information
        when playlist has an administrator
        and the authenticated user is an administrator or a teacher but not a student.
        """
        playlist_access_admin = PlaylistAccessFactory(
            role=ADMINISTRATOR,
        )
        playlist_with_admin = playlist_access_admin.playlist
        video = UploadedVideoFactory(playlist=playlist_with_admin)

        self.assertLTIViewReturnsNoResourceForStudent(video)
        self.assertLTIViewReturnsPortabilityContextForAdminOrInstructor(video)

    def test_views_lti_video_portability_for_playlist_with_organization_admin(
        self,
    ):
        """
        Assert the application data provides portability information
        when playlist's organization has an administrator
        and the authenticated user is an administrator or a teacher but not a student.
        """
        organization_access_admin = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist_with_organization_admin = PlaylistFactory(
            organization=organization_access_admin.organization,
        )
        video = UploadedVideoFactory(playlist=playlist_with_organization_admin)

        self.assertLTIViewReturnsNoResourceForStudent(video)
        self.assertLTIViewReturnsPortabilityContextForAdminOrInstructor(video)

    def test_views_lti_video_portability_for_playlist_with_consumer_site_admin(
        self,
    ):
        """
        Assert the application data provides portability information
        when playlist's consumer site has an administrator
        and the authenticated user is an administrator or a teacher but not a student.
        """
        consumer_site_access_admin = ConsumerSiteAccessFactory(
            role=ADMINISTRATOR,
        )
        playlist_with_consumer_site_admin = PlaylistFactory(
            consumer_site=consumer_site_access_admin.consumer_site,
        )
        video = UploadedVideoFactory(playlist=playlist_with_consumer_site_admin)

        self.assertLTIViewReturnsNoResourceForStudent(video)
        self.assertLTIViewReturnsPortabilityContextForAdminOrInstructor(video)

    @override_settings(FRONTEND_HOME_URL="https://marsha.education/")
    def test_views_lti_video_portability_normalize_frontend_home_url(self):
        """Make sure the LTI Video view normalizes the FRONTEND_HOME_URL."""
        playlist_with_owner = PlaylistFactory(
            created_by=UserFactory(),
        )
        video = UploadedVideoFactory(playlist=playlist_with_owner)

        self.assertLTIViewReturnsNoResourceForStudent(video)
        self.assertLTIViewReturnsPortabilityContextForAdminOrInstructor(
            video, frontend_home_url="https://marsha.education"
        )
