"""Test the LTI video view."""
from html import unescape
import json
from logging import Logger
import random
import re
from unittest import mock
import uuid

from django.test import TestCase, override_settings

from pylti.common import LTIException
from rest_framework_simplejwt.tokens import AccessToken
from waffle.testutils import override_switch

from ..defaults import IDLE, PENDING, READY, RUNNING, STATE_CHOICES, VIDEO_LIVE
from ..factories import (
    ConsumerSiteLTIPassportFactory,
    TimedTextTrackFactory,
    VideoFactory,
)
from ..lti import LTI


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument,too-many-lines


class VideoLTIViewTestCase(TestCase):
    """Test the video view in the ``core`` app of the Marsha project."""

    maxDiff = None

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    @override_settings(SENTRY_DSN="https://sentry.dsn")
    @override_settings(RELEASE="1.2.3")
    @override_settings(VIDEO_PLAYER="videojs")
    @override_switch(VIDEO_LIVE, active=True)
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
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        response = self.client.post("/lti/videos/{!s}".format(video.pk), data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = AccessToken(context.get("jwt"))
        self.assertEqual(jwt_token.payload["resource_id"], str(video.id))
        self.assertEqual(jwt_token.payload["user_id"], data["user_id"])
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "fr_FR")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": True, "can_update": True},
        )
        self.assertDictEqual(
            jwt_token.payload["course"],
            {"school_name": "ufr", "course_name": "mathematics", "course_run": "00001"},
        )

        self.assertEqual(context.get("state"), "success")
        self.assertEqual(
            context.get("static"), {"svg": {"plyr": "/static/svg/plyr.svg"}}
        )
        self.assertEqual(
            context.get("resource"),
            {
                "active_stamp": None,
                "is_ready_to_show": False,
                "show_download": True,
                "description": video.description,
                "id": str(video.id),
                "upload_state": "pending",
                "timed_text_tracks": [],
                "thumbnail": None,
                "title": video.title,
                "urls": None,
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "playlist": {
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "live_state": None,
                "live_info": {},
            },
        )
        self.assertEqual(context.get("modelName"), "videos")
        self.assertEqual(context.get("sentry_dsn"), "https://sentry.dsn")
        self.assertEqual(context.get("environment"), "test")
        self.assertEqual(context.get("release"), "1.2.3")
        self.assertEqual(context.get("player"), "videojs")
        self.assertEqual(context.get("flags"), {"video_live": True})
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    @override_settings(SENTRY_DSN="https://sentry.dsn")
    @override_settings(RELEASE="1.2.3")
    @override_settings(VIDEO_PLAYER="videojs")
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
            upload_state=PENDING,
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        response = self.client.post("/lti/videos/{!s}".format(video.pk), data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = AccessToken(context.get("jwt"))
        self.assertEqual(jwt_token.payload["resource_id"], str(video.id))
        self.assertEqual(jwt_token.payload["user_id"], data["user_id"])
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "fr_FR")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": True, "can_update": True},
        )
        self.assertDictEqual(
            jwt_token.payload["course"],
            {"school_name": "ufr", "course_name": "mathematics", "course_run": "00001"},
        )

        self.assertEqual(context.get("state"), "success")
        self.assertEqual(
            context.get("static"), {"svg": {"plyr": "/static/svg/plyr.svg"}}
        )
        self.assertEqual(
            context.get("resource"),
            {
                "active_stamp": None,
                "is_ready_to_show": False,
                "show_download": True,
                "description": video.description,
                "id": str(video.id),
                "upload_state": PENDING,
                "timed_text_tracks": [],
                "thumbnail": None,
                "title": video.title,
                "urls": {
                    "manifests": {
                        "hls": "https://channel_endpoint1/live.m3u8",
                        "dash": None,
                    },
                    "mp4": {},
                    "thumbnails": {},
                },
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "playlist": {
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "live_state": IDLE,
                "live_info": {
                    "medialive": {
                        "input": {
                            "endpoints": [
                                "https://live_endpoint1",
                                "https://live_endpoint2",
                            ],
                        }
                    }
                },
            },
        )
        self.assertEqual(context.get("modelName"), "videos")
        self.assertEqual(context.get("sentry_dsn"), "https://sentry.dsn")
        self.assertEqual(context.get("environment"), "test")
        self.assertEqual(context.get("release"), "1.2.3")
        self.assertEqual(context.get("player"), "videojs")
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

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
            upload_state=PENDING,
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "student",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        response = self.client.post("/lti/videos/{!s}".format(video.pk), data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = AccessToken(context.get("jwt"))
        self.assertEqual(jwt_token.payload["resource_id"], str(video.id))
        self.assertEqual(jwt_token.payload["user_id"], data["user_id"])
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "fr_FR")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": False, "can_update": False},
        )
        self.assertDictEqual(
            jwt_token.payload["course"],
            {"school_name": "ufr", "course_name": "mathematics", "course_run": "00001"},
        )

        self.assertEqual(context.get("state"), "success")
        self.assertEqual(
            context.get("static"), {"svg": {"plyr": "/static/svg/plyr.svg"}}
        )
        self.assertEqual(
            context.get("resource"),
            {
                "active_stamp": None,
                "is_ready_to_show": True,
                "show_download": True,
                "description": video.description,
                "id": str(video.id),
                "upload_state": PENDING,
                "timed_text_tracks": [],
                "thumbnail": None,
                "title": video.title,
                "urls": {
                    "manifests": {
                        "hls": "https://channel_endpoint1/live.m3u8",
                        "dash": None,
                    },
                    "mp4": {},
                    "thumbnails": {},
                },
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "playlist": {
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "live_state": RUNNING,
                "live_info": {},
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
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        response = self.client.post("/lti/videos/{!s}".format(video.pk), data)
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
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        response = self.client.post("/lti/videos/{!s}".format(video.pk), data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = AccessToken(context.get("jwt"))
        self.assertEqual(jwt_token.payload["resource_id"], str(video.id))
        self.assertEqual(jwt_token.payload["user_id"], data["user_id"])
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "fr_FR")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": True, "can_update": True},
        )
        self.assertDictEqual(
            jwt_token.payload["course"],
            {"school_name": "ufr", "course_name": "mathematics", "course_run": "00001"},
        )

        self.assertEqual(context.get("state"), "success")
        self.assertEqual(
            context.get("resource"),
            {
                "active_stamp": None,
                "is_ready_to_show": False,
                "show_download": True,
                "description": video.description,
                "id": str(video.id),
                "upload_state": "pending",
                "timed_text_tracks": [],
                "thumbnail": None,
                "title": video.title,
                "urls": None,
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "playlist": {
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "live_state": None,
                "live_info": {},
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
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
            uploaded_on="2019-09-24 07:24:40+00",
            resolutions=[144, 240, 480, 720, 1080],
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": "another-playlist",
            "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        response = self.client.post("/lti/videos/{!s}".format(video.pk), data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = AccessToken(context.get("jwt"))
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": True, "can_update": False},
        )
        self.assertEqual(context.get("state"), "success")
        self.assertEqual(
            context.get("resource"),
            {
                "active_stamp": "1569309880",
                "is_ready_to_show": True,
                "show_download": True,
                "description": video.description,
                "id": str(video.id),
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
                        "dash": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c396/"
                        "cmaf/1569309880.mpd",
                        "hls": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c396/"
                        "cmaf/1569309880.m3u8",
                    },
                    "previews": "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c396/"
                    "previews/1569309880_100.jpg",
                },
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "playlist": {
                    "title": "playlist-003",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "live_state": None,
                "live_info": {},
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
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
            uploaded_on="2019-09-24 07:24:40+00",
            resolutions=[144, 240, 480],
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "student",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
        }
        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post("/lti/videos/{!s}".format(video.pk), data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = AccessToken(context.get("jwt"))
        self.assertEqual(jwt_token.payload["resource_id"], str(video.id))
        self.assertEqual(jwt_token.payload["user_id"], data["user_id"])
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "en_US")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": False, "can_update": False},
        )
        self.assertDictEqual(
            jwt_token.payload["course"],
            {"school_name": "ufr", "course_name": "mathematics", "course_run": "00001"},
        )

        self.assertEqual(context.get("state"), "success")

        self.assertEqual(
            context.get("resource"),
            {
                "active_stamp": "1569309880",
                "is_ready_to_show": True,
                "show_download": True,
                "description": video.description,
                "id": str(video.id),
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
                        "dash": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "cmaf/1569309880.mpd",
                        "hls": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "cmaf/1569309880.m3u8",
                    },
                    "previews": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                    "previews/1569309880_100.jpg",
                },
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "playlist": {
                    "title": "playlist-002",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "live_state": None,
                "live_info": {},
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
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
            uploaded_on="2019-09-24 07:24:40+00",
            resolutions=[144, 240, 480, 720, 1080],
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "student",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
        }
        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post("/lti/videos/{!s}".format(video.pk), data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = AccessToken(context.get("jwt"))
        self.assertEqual(jwt_token.payload["resource_id"], str(video.id))
        self.assertEqual(jwt_token.payload["user_id"], data["user_id"])
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "en_US")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": False, "can_update": False},
        )
        self.assertDictEqual(
            jwt_token.payload["course"],
            {"school_name": "ufr", "course_name": "mathematics", "course_run": "00001"},
        )

        self.assertEqual(context.get("state"), "success")

        self.assertEqual(
            context.get("resource"),
            {
                "active_stamp": "1569309880",
                "is_ready_to_show": True,
                "show_download": True,
                "description": video.description,
                "id": str(video.id),
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
                        "dash": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "cmaf/1569309880.mpd",
                        "hls": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                        "cmaf/1569309880.m3u8",
                    },
                    "previews": "https://abc.cloudfront.net/59c0fc7a-0f64-46c0-993f-bdf47ecd837f/"
                    "previews/1569309880_100.jpg",
                },
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "playlist": {
                    "title": "playlist-002",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "live_state": None,
                "live_info": {},
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

        response = self.client.post("/lti/videos/{!s}".format(video.pk), data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")
        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = AccessToken(context.get("jwt"))
        self.assertEqual(jwt_token.payload["resource_id"], str(video.id))
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "en_US")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": False, "can_update": False},
        )
        self.assertDictEqual(
            jwt_token.payload["course"],
            {"school_name": "ufr", "course_name": "mathematics", "course_run": None},
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
        }
        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post("/lti/videos/{!s}".format(uuid.uuid4()), data)
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

    @mock.patch.object(Logger, "warning")
    @mock.patch.object(LTI, "verify", side_effect=LTIException("lti error"))
    def test_views_lti_video_post_error(self, mock_verify, mock_logger):
        """Validate the response returned in case of an LTI exception."""
        role = random.choice(["instructor", "student"])
        data = {"resource_link_id": "123", "roles": role, "context_id": "abc"}
        response = self.client.post("/lti/videos/{!s}".format(uuid.uuid4()), data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        mock_logger.assert_called_once_with("lti error")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        self.assertEqual(context.get("state"), "error")
        self.assertIsNone(context.get("resource"))
        self.assertEqual(context.get("modelName"), "videos")

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
        }
        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post("/lti/videos/{!s}".format(video.pk), data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")
        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = AccessToken(context.get("jwt"))
        self.assertEqual(jwt_token.payload["resource_id"], str(video.id))
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "en_US")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": True, "can_update": True},
        )
        self.assertEqual(context.get("modelName"), "videos")

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    @override_settings(ABSOLUTE_STATIC_URL="/static/")
    def test_views_lti_video_static_base_url(self, mock_get_consumer_site, mock_verify):
        """Meta tag public-path should be the ABSOLUTE_STATIC_URL settings with js/ at the end."""
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(playlist__consumer_site=passport.consumer_site)
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "launch_presentation_locale": "fr",
        }
        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post("/lti/videos/{!s}".format(video.pk), data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        self.assertContains(response, '<meta name="public-path" value="/static/js/" />')

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
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        response = self.client.post("/lti/videos/{!s}".format(video.pk), data)
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
                "active_stamp": None,
                "is_ready_to_show": False,
                "show_download": True,
                "description": video.description,
                "id": str(video.id),
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
                            "https://abc.cloudfront.net/{!s}/"
                            "timedtext/source/1569309880_{!s}_ts?response-content-disposition="
                            "attachment%3B+filename%3Dfoo-bar_1569309880.srt"
                        ).format(video.id, transcript.language),
                        "url": (
                            "https://abc.cloudfront.net/{!s}/timedtext/"
                            "1569309880_{!s}_ts.vtt"
                        ).format(video.id, transcript.language),
                        "video": str(video.id),
                    }
                ],
                "thumbnail": None,
                "title": video.title,
                "urls": None,
                "should_use_subtitle_as_transcript": False,
                "has_transcript": True,
                "playlist": {
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "live_state": None,
                "live_info": {},
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
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        response = self.client.post("/lti/videos/{!s}".format(video.pk), data)
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
                "active_stamp": None,
                "is_ready_to_show": False,
                "show_download": True,
                "description": video.description,
                "id": str(video.id),
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
                "playlist": {
                    "title": "foo bar",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "live_state": None,
                "live_info": {},
            },
        )
