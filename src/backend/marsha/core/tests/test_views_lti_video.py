"""Test the LTI interconnection with Open edX."""
from html import unescape
import json
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
# pylint: disable=missing-param-doc,missing-type-doc,unused-argument


class ViewsTestCase(TestCase):
    """Test the views in the ``core`` app of the Marsha project."""

    def test_views_video_lti_post_instructor(self):
        """Validate the format of the response returned by the view for an instructor request."""
        passport = ConsumerSiteLTIPassportFactory(oauth_consumer_key="ABC123")
        video = VideoFactory(
            lti_id="123",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
        }
        with mock.patch.object(
            LTI, "verify", return_value=passport.consumer_site
        ) as mock_verify:
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
        self.assertDictEqual(
            jwt_token.payload["course"],
            {
                "school_name": "ufr",
                "course_name": "mathematics",
                "course_section": "00001",
            },
        )

        data_state = match.group(2)
        self.assertEqual(data_state, "instructor")

        # Extract the video data
        data_video = re.search(
            '<div class="marsha-frontend-data" id="video" data-video="(.*)">', content
        ).group(1)

        self.assertEqual(
            json.loads(unescape(data_video)),
            {
                "active_stamp": None,
                "is_ready_to_play": False,
                "description": video.description,
                "id": str(video.id),
                "upload_state": "pending",
                "timed_text_tracks": [],
                "title": video.title,
                "urls": None,
            },
        )
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    def test_views_video_lti_post_student(self):
        """Validate the format of the response returned by the view for a student request."""
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(
            lti_id="123",
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
        with mock.patch.object(
            LTI, "verify", return_value=passport.consumer_site
        ) as mock_verify:
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
        self.assertDictEqual(
            jwt_token.payload["course"],
            {
                "school_name": "ufr",
                "course_name": "mathematics",
                "course_section": "00001",
            },
        )

        data_state = match.group(2)
        self.assertEqual(data_state, "student")

        data_video = re.search(
            '<div class="marsha-frontend-data" id="video" data-video="(.*)">', content
        ).group(1)
        self.assertEqual(
            json.loads(unescape(data_video)),
            {
                "active_stamp": None,
                "is_ready_to_play": False,
                "description": video.description,
                "id": str(video.id),
                "upload_state": "ready",
                "timed_text_tracks": [],
                "title": video.title,
                "urls": None,
            },
        )
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    def test_views_video_lti_without_user_id_parameter(self):
        """Ensure JWT is created if user_id is missing in the LTI request."""
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(
            lti_id="123",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
            upload_state="ready",
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "student",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        with mock.patch.object(
            LTI, "verify", return_value=passport.consumer_site
        ) as mock_verify:
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
        self.assertDictEqual(
            jwt_token.payload["course"],
            {
                "school_name": "ufr",
                "course_name": "mathematics",
                "course_section": "00001",
            },
        )

        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    def test_views_video_lti_post_student_no_video(self):
        """Validate the response returned for a student request when there is no video."""
        passport = ConsumerSiteLTIPassportFactory()
        data = {
            "resource_link_id": "example.com-123",
            "context_id": "course-v1:ufr+mathematics+00001",
            "roles": "student",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
        }
        with mock.patch.object(
            LTI, "verify", return_value=passport.consumer_site
        ) as mock_verify:
            response = self.client.post("/lti/videos/{!s}".format(uuid.uuid4()), data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        data_state = re.search(
            '<div class="marsha-frontend-data" data-state="(.*)">', content
        ).group(1)
        self.assertEqual(data_state, "student")

        data_video = re.search(
            '<div class="marsha-frontend-data" id="video" data-video="(.*)">', content
        ).group(1)
        self.assertEqual(data_video, "null")

        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify", side_effect=LTIException)
    def test_views_video_lti_post_error(self, mock_verify):
        """Validate the response returned in case of an LTI exception."""
        role = random.choice(["instructor", "student"])
        data = {"resource_link_id": "123", "roles": role, "context_id": "abc"}
        response = self.client.post("/lti/videos/{!s}".format(uuid.uuid4()), data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        data_state = re.search(
            '<div class="marsha-frontend-data" data-state="(.*)">', content
        ).group(1)
        self.assertEqual(data_state, "error")

        data_video = re.search(
            '<div class="marsha-frontend-data" id="video" data-video="(.*)">', content
        ).group(1)
        self.assertEqual(data_video, "null")

    def test_views_video_lti_with_timed_text(self):
        """Make sure the LTI Video view functions when the Video has associated TimedTextTracks.

        NB: This is a bug-reproducing test case.
        The comprehensive test suite in test_api_video does not cover this case as it uses a JWT
        and therefore falls in another case when it comes to handling of video ids.
        """
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(
            lti_id="123",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
        )
        # Create a TimedTextTrack associated with the video to trigger the error
        TimedTextTrackFactory(video=video)

        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
        }
        with mock.patch.object(LTI, "verify", return_value=passport.consumer_site):
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
            lti_id="123",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site__domain="example.com",
            upload_state="ready",
        )
        # There is no need to provide an "oauth_consumer_key"
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "student",
            "tool_consumer_instance_guid": "example.com",
            "user_id": "56255f3807599c377bf0e5bf072359fd",
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
        self.assertDictEqual(
            jwt_token.payload["course"],
            {
                "school_name": "ufr",
                "course_name": "mathematics",
                "course_section": "00001",
            },
        )

        data_state = match.group(2)
        self.assertEqual(data_state, "student")

        data_video = re.search(
            '<div class="marsha-frontend-data" id="video" data-video="(.*)">', content
        ).group(1)

        self.assertEqual(
            json.loads(unescape(data_video)),
            {
                "active_stamp": None,
                "is_ready_to_play": False,
                "description": video.description,
                "id": str(video.id),
                "upload_state": "ready",
                "timed_text_tracks": [],
                "title": video.title,
                "urls": None,
            },
        )

    @override_settings(DEBUG=True)
    @override_settings(BYPASS_LTI_VERIFICATION=True)
    def test_views_video_lti_post_bypass_lti_instructor(self):
        """In development, passport creation and LTI verif can be bypassed for a instructor."""
        video = VideoFactory(
            lti_id="123",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site__domain="example.com",
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "instructor",
            "tool_consumer_instance_guid": "example.com",
            "user_id": "56255f3807599c377bf0e5bf072359fd",
        }
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
        self.assertDictEqual(
            jwt_token.payload["course"],
            {
                "school_name": "ufr",
                "course_name": "mathematics",
                "course_section": "00001",
            },
        )

        data_state = match.group(2)
        self.assertEqual(data_state, "instructor")

        # Extract the video data
        data_video = re.search(
            '<div class="marsha-frontend-data" id="video" data-video="(.*)">', content
        ).group(1)

        self.assertEqual(
            json.loads(unescape(data_video)),
            {
                "active_stamp": None,
                "is_ready_to_play": False,
                "description": video.description,
                "id": str(video.id),
                "upload_state": "pending",
                "timed_text_tracks": [],
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
        self.assertDictEqual(
            jwt_token.payload["course"],
            {
                "school_name": "ufr",
                "course_name": "mathematics",
                "course_section": "00001",
            },
        )

        data_state = match.group(2)
        self.assertEqual(data_state, "instructor")

        # Extract the video data
        data_video = re.search(
            '<div class="marsha-frontend-data" id="video" data-video="(.*)">', content
        ).group(1)

        self.assertEqual(
            json.loads(unescape(data_video)),
            {
                "active_stamp": None,
                "is_ready_to_play": False,
                "description": video.description,
                "id": str(video.id),
                "upload_state": "pending",
                "timed_text_tracks": [],
                "title": video.title,
                "urls": None,
            },
        )
        # The consumer site was created with a name and a domain name
        ConsumerSite.objects.get(name="example.com", domain="example.com")

    @override_settings(BYPASS_LTI_VERIFICATION=True)
    def test_views_video_lti_post_bypass_lti_no_debug_mode(self):
        """Bypassing LTI verification is only allowed in debug mode."""
        video = VideoFactory(
            lti_id="123",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site__domain="example.com",
        )
        role = random.choice(["instructor", "student"])
        data = {
            "resource_link_id": video.lti_id,
            "roles": role,
            "context_id": video.playlist.lti_id,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
        }

        with self.assertRaises(ImproperlyConfigured):
            self.client.post("/lti/videos/{!s}".format(video.pk), data)
