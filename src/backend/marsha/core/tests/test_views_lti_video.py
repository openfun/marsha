"""Test the LTI interconnection with Open edX."""
from html import unescape
import json
import random
import re
from unittest import mock

from django.test import TestCase

from pylti.common import LTIException
from rest_framework_simplejwt.tokens import AccessToken

from ..factories import ConsumerSiteLTIPassportFactory, VideoFactory
from ..lti import LTI


# We don't enforce arguments documentation in tests
# pylint: disable=missing-param-doc,missing-type-doc,unused-argument


class ViewsTestCase(TestCase):
    """Test the views in the ``core`` app of the Marsha project."""

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_views_video_lti_post_instructor(self, mock_initialize):
        """Validate the format of the response returned by the view for an instructor request."""
        passport = ConsumerSiteLTIPassportFactory(oauth_consumer_key="ABC123")
        video = VideoFactory(
            lti_id="123",
            playlist__lti_id="abc",
            playlist__consumer_site=passport.consumer_site,
        )
        data = {
            "resource_link_id": "123",
            "roles": "instructor",
            "context_id": "abc",
            "tool_consumer_instance_guid": "example.com",
            "oauth_consumer_key": "ABC123",
        }
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
                "description": video.description,
                "id": str(video.id),
                "state": "pending",
                "subtitle_tracks": [],
                "title": video.title,
                "urls": None,
            },
        )

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_views_video_lti_post_student(self, mock_initialize):
        """Validate the format of the response returned by the view for a student request."""
        passport = ConsumerSiteLTIPassportFactory(oauth_consumer_key="ABC123")
        video = VideoFactory(
            lti_id="123",
            playlist__lti_id="abc",
            playlist__consumer_site=passport.consumer_site,
        )
        data = {
            "resource_link_id": "123",
            "roles": "student",
            "context_id": "abc",
            "tool_consumer_instance_guid": "example.com",
            "oauth_consumer_key": "ABC123",
        }
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

        self.assertEqual(
            json.loads(unescape(data_video)),
            {
                "active_stamp": None,
                "description": video.description,
                "id": str(video.id),
                "state": "pending",
                "subtitle_tracks": [],
                "title": video.title,
                "urls": None,
            },
        )

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_views_video_lti_post_student_no_video(self, mock_initialize):
        """Validate the response returned for a student request when there is no video."""
        ConsumerSiteLTIPassportFactory(oauth_consumer_key="ABC123")
        data = {
            "resource_link_id": "123",
            "roles": "student",
            "context_id": "abc",
            "tool_consumer_instance_guid": "example.com",
            "oauth_consumer_key": "ABC123",
        }
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

    @mock.patch.object(LTI, "verify", side_effect=LTIException)
    def test_views_video_lti_post_error(self, mock_initialize):
        """Validate the response returned in case of an LTI exception."""
        role = random.choice(["instructor", "student"])
        data = {
            "resource_link_id": "123",
            "roles": role,
            "context_id": "abc",
            "tool_consumer_instance_guid": "example.com",
        }
        response = self.client.post("/lti-video/", data)
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
