"""Test the LTI video view."""
from html import unescape
import json
from logging import Logger
import random
import re
from unittest import mock
import uuid

from django.core.exceptions import ImproperlyConfigured
from django.test import TestCase, override_settings

from pylti.common import LTIException
from rest_framework_simplejwt.tokens import AccessToken

from ..factories import (
    ConsumerSiteLTIPassportFactory,
    TimedTextTrackFactory,
    VideoFactory,
)
from ..lti import LTI
from ..models import ConsumerSite, Video


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class VideoViewTestCase(TestCase):
    """Test the video view in the ``core`` app of the Marsha project."""

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_video_lti_post_instructor(self, mock_get_consumer_site, mock_verify):
        """Validate the format of the response returned by the view for an instructor request."""
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
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

        # Extract the JWT Token and state
        match = re.search(
            '<div class="marsha-frontend-data" data-jwt="(.*)" data-state="(.*)">',
            content,
        )
        data_jwt = match.group(1)
        jwt_token = AccessToken(data_jwt)
        self.assertEqual(jwt_token.payload["video_id"], str(video.id))
        self.assertEqual(jwt_token.payload["user_id"], data["user_id"])
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "fr_FR")
        self.assertFalse(jwt_token.payload["read_only"])
        self.assertDictEqual(
            jwt_token.payload["course"],
            {"school_name": "ufr", "course_name": "mathematics", "course_run": "00001"},
        )

        data_state = match.group(2)
        self.assertEqual(data_state, "instructor")

        # Extract the video data
        data_video = re.search(
            '<div class="marsha-frontend-data" id="videos" data-resource="(.*)">',
            content,
        ).group(1)

        self.assertEqual(
            json.loads(unescape(data_video)),
            {
                "active_stamp": None,
                "is_ready_to_play": False,
                "show_download": True,
                "description": video.description,
                "id": str(video.id),
                "upload_state": "pending",
                "timed_text_tracks": [],
                "thumbnail": None,
                "title": video.title,
                "urls": None,
            },
        )
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_video_lti_post_administrator(
        self, mock_get_consumer_site, mock_verify
    ):
        """Validate the format of the response returned by the view for an admin request."""
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
        content = response.content.decode("utf-8")

        # Extract the JWT Token and state
        match = re.search(
            '<div class="marsha-frontend-data" data-jwt="(.*)" data-state="(.*)">',
            content,
        )
        data_jwt = match.group(1)
        jwt_token = AccessToken(data_jwt)
        self.assertEqual(jwt_token.payload["video_id"], str(video.id))
        self.assertEqual(jwt_token.payload["user_id"], data["user_id"])
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "fr_FR")
        self.assertFalse(jwt_token.payload["read_only"])
        self.assertDictEqual(
            jwt_token.payload["course"],
            {"school_name": "ufr", "course_name": "mathematics", "course_run": "00001"},
        )

        data_state = match.group(2)
        # front application will still use instructor role, nothing change here
        self.assertEqual(data_state, "instructor")

        # Extract the video data
        data_video = re.search(
            '<div class="marsha-frontend-data" id="videos" data-resource="(.*)">',
            content,
        ).group(1)

        self.assertEqual(
            json.loads(unescape(data_video)),
            {
                "active_stamp": None,
                "is_ready_to_play": False,
                "show_download": True,
                "description": video.description,
                "id": str(video.id),
                "upload_state": "pending",
                "timed_text_tracks": [],
                "thumbnail": None,
                "title": video.title,
                "urls": None,
            },
        )
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_video_read_only_video(self, mock_get_consumer_site, mock_verify):
        """A video from another portable playlist should have read_only attribute set to True."""
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        video = VideoFactory(
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=True,
            upload_state="ready",
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

        # Extract the JWT Token and state
        match = re.search(
            '<div class="marsha-frontend-data" data-jwt="(.*)" data-state="(.*)">',
            content,
        )
        data_jwt = match.group(1)
        jwt_token = AccessToken(data_jwt)
        self.assertTrue(jwt_token.payload["read_only"])

        data_state = match.group(2)
        self.assertEqual(data_state, "instructor")

        # Extract the video data
        data_video = re.search(
            '<div class="marsha-frontend-data" id="videos" data-resource="(.*)">',
            content,
        ).group(1)

        self.assertEqual(
            json.loads(unescape(data_video)),
            {
                "active_stamp": None,
                "is_ready_to_play": False,
                "show_download": True,
                "description": video.description,
                "id": str(video.id),
                "upload_state": "ready",
                "timed_text_tracks": [],
                "thumbnail": None,
                "title": video.title,
                "urls": None,
            },
        )
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_video_lti_post_student(self, mock_get_consumer_site, mock_verify):
        """Validate the format of the response returned by the view for a student request."""
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
            upload_state="ready",
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
            '<div class="marsha-frontend-data" data-jwt="(.*)" data-state="(.*)">',
            content,
        )

        data_jwt = match.group(1)
        jwt_token = AccessToken(data_jwt)
        self.assertEqual(jwt_token.payload["video_id"], str(video.id))
        self.assertEqual(jwt_token.payload["user_id"], data["user_id"])
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "en_US")
        self.assertTrue(jwt_token.payload["read_only"])
        self.assertDictEqual(
            jwt_token.payload["course"],
            {"school_name": "ufr", "course_name": "mathematics", "course_run": "00001"},
        )

        data_state = match.group(2)
        self.assertEqual(data_state, "student")

        data_video = re.search(
            '<div class="marsha-frontend-data" id="videos" data-resource="(.*)">',
            content,
        ).group(1)
        self.assertEqual(
            json.loads(unescape(data_video)),
            {
                "active_stamp": None,
                "is_ready_to_play": False,
                "show_download": True,
                "description": video.description,
                "id": str(video.id),
                "upload_state": "ready",
                "timed_text_tracks": [],
                "thumbnail": None,
                "title": video.title,
                "urls": None,
            },
        )
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_video_lti_without_user_id_parameter(
        self, mock_get_consumer_site, mock_verify
    ):
        """Ensure JWT is created if user_id is missing in the LTI request."""
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(
            playlist__consumer_site=passport.consumer_site, upload_state="ready"
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
            '<div class="marsha-frontend-data" data-jwt="(.*)" data-state="(.*)">',
            content,
        )

        data_jwt = match.group(1)
        jwt_token = AccessToken(data_jwt)
        self.assertEqual(jwt_token.payload["video_id"], str(video.id))
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "en_US")
        self.assertDictEqual(
            jwt_token.payload["course"],
            {"school_name": "ufr", "course_name": "mathematics", "course_run": None},
        )

        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_video_lti_post_student_no_video(
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

        data_state = re.search(
            '<div class="marsha-frontend-data" data-state="(.*)">', content
        ).group(1)
        self.assertEqual(data_state, "student")

        data_video = re.search(
            '<div class="marsha-frontend-data" id="videos" data-resource="(.*)">',
            content,
        ).group(1)
        self.assertEqual(data_video, "null")

        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(Logger, "warning")
    @mock.patch.object(LTI, "verify", side_effect=LTIException("lti error"))
    def test_views_video_lti_post_error(self, mock_verify, mock_logger):
        """Validate the response returned in case of an LTI exception."""
        role = random.choice(["instructor", "student"])
        data = {"resource_link_id": "123", "roles": role, "context_id": "abc"}
        response = self.client.post("/lti/videos/{!s}".format(uuid.uuid4()), data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        mock_logger.assert_called_once_with("LTI Exception: %s", "lti error")

        data_state = re.search(
            '<div class="marsha-frontend-data" data-state="(.*)">', content
        ).group(1)
        self.assertEqual(data_state, "error")

        data_video = re.search(
            '<div class="marsha-frontend-data" id="videos" data-resource="(.*)">',
            content,
        ).group(1)
        self.assertEqual(data_video, "null")

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_video_lti_with_timed_text(self, mock_get_consumer_site, mock_verify):
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
            '<div class="marsha-frontend-data" data-jwt="(.*)" data-state="(.*)">',
            content,
        )

        data_jwt = match.group(1)
        jwt_token = AccessToken(data_jwt)
        self.assertEqual(jwt_token.payload["video_id"], str(video.id))
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "en_US")

    @override_settings(STATICFILES_AWS_ENABLED=False)
    @override_settings(CLOUDFRONT_DOMAIN="abcd.cloudfront.net")
    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_video_staticfiles_aws_disabled(
        self, mock_get_consumer_site, mock_verify
    ):
        """Meta tag public-path should'nt be in the response when staticfiles on AWS is diabled."""
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
        self.assertNotContains(
            response, '<meta name="public-path" value="abcd.cloudfront.net" />'
        )

    @override_settings(STATICFILES_AWS_ENABLED=True)
    @override_settings(CLOUDFRONT_DOMAIN="abcd.cloudfront.net")
    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_video_staticfiles_aws_enabled(
        self, mock_get_consumer_site, mock_verify
    ):
        """Meta tag public-path should be in the response when staticfiles on AWS is enabled."""
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
        self.assertContains(
            response, '<meta name="public-path" value="abcd.cloudfront.net" />'
        )


class DevelopmentViewsTestCase(TestCase):
    """Test the views in the ``core`` app of the Marsha project for development use cases.

    When developing on marsha, we are using the LTIDevelopmentView to simulate a launch request
    from an iframe in an LMS. However:
    - This simple view does not compute the LTI signature,
    - We don't want to have to create an LTI passport to make it work.

    Setting the "BYPASS_LTI_VERIFICATION" setting to True, allows Marsha to work "normally" without
    a passport and without the LTI verification. This is only allowed when DEBUG is True.
    """

    @override_settings(DEBUG=True)
    @override_settings(BYPASS_LTI_VERIFICATION=True)
    def test_views_video_lti_post_bypass_lti_student(self):
        """In development, passport creation and LTI verification can be bypassed for a student."""
        video = VideoFactory(
            playlist__consumer_site__domain="example.com", upload_state="ready"
        )
        # There is no need to provide an "oauth_consumer_key"
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "student",
            "context_title": "mathematics",
            "tool_consumer_instance_name": "ufr",
            "tool_consumer_instance_guid": "example.com",
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "launch_presentation_locale": "fr",
        }
        response = self.client.post("/lti/videos/{!s}".format(video.pk), data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div class="marsha-frontend-data" data-jwt="(.*)" data-state="(.*)">',
            content,
        )

        data_jwt = match.group(1)
        jwt_token = AccessToken(data_jwt)
        self.assertEqual(jwt_token.payload["video_id"], str(video.id))
        self.assertEqual(jwt_token.payload["user_id"], data["user_id"])
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "fr_FR")
        self.assertDictEqual(
            jwt_token.payload["course"],
            {"school_name": "ufr", "course_name": "mathematics", "course_run": None},
        )

        data_state = match.group(2)
        self.assertEqual(data_state, "student")

        data_video = re.search(
            '<div class="marsha-frontend-data" id="videos" data-resource="(.*)">',
            content,
        ).group(1)

        self.assertEqual(
            json.loads(unescape(data_video)),
            {
                "active_stamp": None,
                "is_ready_to_play": False,
                "show_download": True,
                "description": video.description,
                "id": str(video.id),
                "upload_state": "ready",
                "timed_text_tracks": [],
                "thumbnail": None,
                "title": video.title,
                "urls": None,
            },
        )

    @override_settings(DEBUG=True)
    @override_settings(BYPASS_LTI_VERIFICATION=True)
    def test_views_video_lti_post_bypass_lti_instructor(self):
        """In development, passport creation and LTI verif can be bypassed for a instructor."""
        video = VideoFactory(playlist__consumer_site__domain="example.com")
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "instructor",
            "tool_consumer_instance_guid": "example.com",
            "context_title": "mathematics",
            "tool_consumer_instance_name": "ufr",
            "user_id": "56255f3807599c377bf0e5bf072359fd",
        }
        response = self.client.post("/lti/videos/{!s}".format(video.pk), data)
        self.assertEqual(response.status_code, 200)
        print(response)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        # Extract the JWT Token and state
        match = re.search(
            '<div class="marsha-frontend-data" data-jwt="(.*)" data-state="(.*)">',
            content,
        )
        data_jwt = match.group(1)
        jwt_token = AccessToken(data_jwt)
        self.assertEqual(jwt_token.payload["video_id"], str(video.id))
        self.assertEqual(jwt_token.payload["user_id"], data["user_id"])
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "en_US")
        self.assertDictEqual(
            jwt_token.payload["course"],
            {"school_name": "ufr", "course_name": "mathematics", "course_run": None},
        )

        data_state = match.group(2)
        self.assertEqual(data_state, "instructor")

        # Extract the video data
        data_video = re.search(
            '<div class="marsha-frontend-data" id="videos" data-resource="(.*)">',
            content,
        ).group(1)

        self.assertEqual(
            json.loads(unescape(data_video)),
            {
                "active_stamp": None,
                "is_ready_to_play": False,
                "show_download": True,
                "description": video.description,
                "id": str(video.id),
                "upload_state": "pending",
                "timed_text_tracks": [],
                "thumbnail": None,
                "title": video.title,
                "urls": None,
            },
        )

    @override_settings(DEBUG=True)
    @override_settings(BYPASS_LTI_VERIFICATION=True)
    def test_views_video_lti_post_bypass_lti_instructor_no_video(self):
        """When bypassing LTI, the "example.com" consumer site is automatically created."""
        data = {
            "resource_link_id": "example.com-123",
            "context_id": "course-v1:ufr+mathematics+00001",
            "roles": "instructor",
            "tool_consumer_instance_guid": "example.com",
            "user_id": "56255f3807599c377bf0e5bf072359fd",
        }
        response = self.client.post("/lti/videos/{!s}".format(uuid.uuid4()), data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")
        # Extract the JWT Token and state
        match = re.search(
            '<div class="marsha-frontend-data" data-jwt="(.*)" data-state="(.*)">',
            content,
        )
        data_jwt = match.group(1)
        jwt_token = AccessToken(data_jwt)
        video = Video.objects.get()
        self.assertEqual(jwt_token.payload["video_id"], str(video.id))
        self.assertEqual(jwt_token.payload["user_id"], data["user_id"])
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "en_US")
        self.assertDictEqual(
            jwt_token.payload["course"],
            {"school_name": "ufr", "course_name": "mathematics", "course_run": "00001"},
        )

        data_state = match.group(2)
        self.assertEqual(data_state, "instructor")

        # Extract the video data
        data_video = re.search(
            '<div class="marsha-frontend-data" id="videos" data-resource="(.*)">',
            content,
        ).group(1)

        self.assertEqual(
            json.loads(unescape(data_video)),
            {
                "active_stamp": None,
                "is_ready_to_play": False,
                "show_download": True,
                "description": video.description,
                "id": str(video.id),
                "upload_state": "pending",
                "timed_text_tracks": [],
                "thumbnail": None,
                "title": video.title,
                "urls": None,
            },
        )
        # The consumer site was created with a name and a domain name
        ConsumerSite.objects.get(name="example.com", domain="example.com")

    @override_settings(BYPASS_LTI_VERIFICATION=True)
    def test_views_video_lti_post_bypass_lti_no_debug_mode(self):
        """Bypassing LTI verification is only allowed in debug mode."""
        video = VideoFactory(playlist__consumer_site__domain="example.com")
        role = random.choice(["instructor", "student"])
        data = {
            "resource_link_id": video.lti_id,
            "roles": role,
            "context_id": video.playlist.lti_id,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
        }

        with self.assertRaises(ImproperlyConfigured):
            self.client.post("/lti/videos/{!s}".format(video.pk), data)
