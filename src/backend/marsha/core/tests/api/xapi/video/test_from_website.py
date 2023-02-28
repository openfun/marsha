"""Tests for the video xAPI statement sent from the website."""
import json
from unittest import mock
import uuid

from django.test import TestCase, override_settings

from marsha.core.factories import VideoFactory
from marsha.core.simple_jwt.factories import UserAccessTokenFactory


class XAPIVideoFromWebsiteTest(TestCase):
    """Video XAPI test suite sent from a website."""

    def test_xapi_statement_api_with_anonymous_user(self):
        """Anonymous users should not be allowed to send xAPI statement."""
        response = self.client.post(f"/xapi/video/{uuid.uuid4()}/")
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_xapi_statement_with_no_lrs_configured(self):
        """If no LRS configured a 200 status code should be returned."""
        video = VideoFactory()
        jwt_token = UserAccessTokenFactory()

        data = {
            "verb": {
                "id": "http://adlnet.gov/expapi/verbs/initialized",
                "display": {"en-US": "initialized"},
            },
            "context": {
                "extensions": {"https://w3id.org/xapi/video/extensions/volume": 1}
            },
        }

        response = self.client.post(
            f"/xapi/video/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            data=json.dumps(data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)

    def test_xapi_statement_api_with_invalid_payload(self):
        """Payload should follow a given pattern."""
        video = VideoFactory()
        jwt_token = UserAccessTokenFactory()

        data = {"foo": "bar"}

        response = self.client.post(
            f"/xapi/video/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            data=json.dumps(data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "verb": ["This field is required."],
                "context": ["This field is required."],
            },
        )

    def test_xapi_statement_with_invalid_video(self):
        """The video in the JWT Token does not exist in our database."""
        jwt_token = UserAccessTokenFactory()

        data = {
            "verb": {
                "id": "http://adlnet.gov/expapi/verbs/initialized",
                "display": {"en-US": "initialized"},
            },
            "context": {
                "extensions": {"https://w3id.org/xapi/video/extensions/volume": 1}
            },
        }

        response = self.client.post(
            f"/xapi/video/{uuid.uuid4()}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            data=json.dumps(data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 404)

    @override_settings(
        LRS_URL="http://lrs.com/data/xAPI",
        LRS_AUTH_TOKEN="Basic ThisIsABasicAuth",
        LRS_XAPI_VERSION="1.0.3",
    )
    def test_xapi_statement_with_request_to_lrs_successful(self):
        """Successful request should return a 204 status code."""
        video = VideoFactory()
        jwt_token = UserAccessTokenFactory()

        data = {
            "verb": {
                "id": "http://adlnet.gov/expapi/verbs/initialized",
                "display": {"en-US": "initialized"},
            },
            "context": {
                "extensions": {"https://w3id.org/xapi/video/extensions/volume": 1}
            },
        }

        with mock.patch("marsha.core.api.XAPI.send", return_value=None):
            response = self.client.post(
                f"/xapi/video/{video.id}/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data=json.dumps(data),
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 204)
