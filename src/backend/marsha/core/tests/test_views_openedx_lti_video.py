"""Test the LTI interconnection with Open edX."""
from html import unescape
import json
from logging import Logger
import random
import re
from unittest import mock

from django.test import TestCase

from pylti.common import LTIException
from rest_framework_simplejwt.tokens import AccessToken

from ..factories import (
    ConsumerSiteLTIPassportFactory,
    TimedTextTrackFactory,
    VideoFactory,
)
from ..lti import LTI


# We don't enforce arguments documentation in tests
# pylint: disable=missing-param-doc,missing-type-doc,unused-argument


class ViewsTestCase(TestCase):
    """Test the views in the ``core`` app of the Marsha project."""

    def test_views_video_lti_post_instructor(self):
        """The deprecated Open edX view should continue to work as expected for instructors.

        For a video that is ready, matching the lti_id and in the same playlist on the same
        consumer site. Portability is not supported anymore as we expected instructors to now
        use the new LTI launch request urls.
        """
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(
            lti_id="123",
            playlist__consumer_site=passport.consumer_site,
            upload_state="ready",
        )
        data = {
            "resource_link_id": "example.com-123",
            "context_id": video.playlist.lti_id,
            "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
        }
        with mock.patch.object(
            LTI, "verify", return_value=passport.consumer_site
        ) as mock_verify:
            response = self.client.post("/lti-video/", data)
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
                "upload_state": "ready",
                "timed_text_tracks": [],
                "title": video.title,
                "urls": None,
            },
        )
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    def test_views_video_lti_post_student(self):
        """The deprecated Open edX view should continue to work as expected for students.

        For a video that is ready, matching the lti_id and in the same playlist on the same
        consumer site. Portability is not supported anymore as we expected instructors to now
        use the new LTI launch request urls.
        """
        passport = ConsumerSiteLTIPassportFactory()
        video = VideoFactory(
            lti_id="123",
            playlist__consumer_site=passport.consumer_site,
            upload_state="ready",
        )
        data = {
            "resource_link_id": "example.com-123",
            "context_id": video.playlist.lti_id,
            "roles": "student",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
        }

        with mock.patch.object(
            LTI, "verify", return_value=passport.consumer_site
        ) as mock_verify:
            response = self.client.post("/lti-video/", data)
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
            playlist__consumer_site=passport.consumer_site,
            upload_state="ready",
        )
        data = {
            "resource_link_id": "example.com-123",
            "context_id": video.playlist.lti_id,
            "roles": "student",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        with mock.patch.object(
            LTI, "verify", return_value=passport.consumer_site
        ) as mock_verify:
            response = self.client.post("/lti-video/", data)
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

        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    def test_views_video_lti_post_student_no_video(self):
        """Validate the response returned for a student request when there is no video."""
        passport = ConsumerSiteLTIPassportFactory()
        data = {
            "resource_link_id": "example.com-123",
            "context_id": "abc",
            "roles": "student",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
        }
        with mock.patch.object(
            LTI, "verify", return_value=passport.consumer_site
        ) as mock_verify:
            response = self.client.post("/lti-video/", data)
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

    @mock.patch.object(Logger, "warning")
    @mock.patch.object(LTI, "verify", side_effect=LTIException("lti error"))
    def test_views_video_lti_post_error(self, mock_verify, mock_logger):
        """Validate the response returned in case of an LTI exception."""
        role = random.choice(["instructor", "student"])
        data = {
            "resource_link_id": "example.com-123",
            "roles": role,
            "context_id": "abc",
        }
        response = self.client.post("/lti-video/", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        mock_logger.assert_called_once_with("LTI Exception: %s", "lti error")

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
            playlist__consumer_site=passport.consumer_site,
            upload_state="ready",
        )
        # Create a TimedTextTrack associated with the video to trigger the error
        TimedTextTrackFactory(video=video)

        data = {
            "resource_link_id": "example.com-123",
            "context_id": video.playlist.lti_id,
            "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
        }
        with mock.patch.object(LTI, "verify", return_value=passport.consumer_site):
            response = self.client.post("/lti-video/", data)
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
