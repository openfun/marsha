"""Tests for the xAPI statement API of the marsha project."""
import json
from unittest import mock

from django.test import TestCase, override_settings

import requests
from rest_framework_simplejwt.tokens import AccessToken

from ..factories import VideoFactory
from ..models import Video
from ..xapi import MissingUserIdError


# We don't enforce arguments documentation in tests
# pylint: disable=missing-param-doc,missing-type-doc,unused-argument


class XAPIStatementApiTest(TestCase):
    """Test the API for the xAPI resource."""

    def test_xapi_statement_api_with_anonymous_user(self):
        """Anonymous users should not be allowed to send xAPI statement."""
        response = self.client.post("/xapi/")
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    @override_settings(LRS_URL=None)
    def test_xapi_statement_with_no_lrs_configured(self):
        """If no LRS configured a 501 status code should be returned."""
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]

        data = {"foo": "bar"}

        response = self.client.post(
            "/xapi/",
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            data=json.dumps(data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 501)

    def test_xapi_statement_api_with_invalid_payload(self):
        """Payload should follow a given pattern."""
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]

        data = {"foo": "bar"}

        response = self.client.post(
            "/xapi/",
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
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
                "timestamp": ["This field is required."],
            },
        )

    @mock.patch("marsha.core.api.Video.objects.get", side_effect=Video.DoesNotExist)
    def test_xapi_statement_with_invalid_video(self, video_model_mock):
        """The video in the JWT Token does not exist in our database."""
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]

        data = {
            "verb": {
                "id": "http://adlnet.gov/expapi/verbs/initialized",
                "display": {"en-US": "initialized"},
            },
            "context": {
                "extensions": {"https://w3id.org/xapi/video/extensions/volume": 1}
            },
            "timestamp": "2018-12-31T16:17:35.717Z",
        }

        response = self.client.post(
            "/xapi/",
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            data=json.dumps(data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 404)

    @mock.patch("marsha.core.api.Video.objects.get")
    @mock.patch("marsha.core.api.XAPI")
    def test_xapi_statement_with_request_error_to_lrs(
        self, xapi_mock, video_model_mock
    ):
        """Sending a request to the LRS fails. The response should reflect this failure."""
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]

        data = {
            "verb": {
                "id": "http://adlnet.gov/expapi/verbs/initialized",
                "display": {"en-US": "initialized"},
            },
            "context": {
                "extensions": {"https://w3id.org/xapi/video/extensions/volume": 1}
            },
            "timestamp": "2018-12-31T16:17:35.717Z",
        }

        mock_response = mock.Mock()
        mock_response.text.return_value = "foo"
        mock_response.status_code.return_value = 400

        exception = requests.exceptions.HTTPError(response=mock_response)
        video_model_mock.return_value = video
        xapi_instance = xapi_mock.return_value
        xapi_instance.send.side_effect = exception

        response = self.client.post(
            "/xapi/",
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            data=json.dumps(data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 501)
        self.assertEqual(
            response.json().get("status"), "Impossible to send xAPI request to LRS."
        )

    @mock.patch("marsha.core.api.Video.objects.get")
    @mock.patch("marsha.core.api.XAPI")
    def test_xapi_statement_with_request_to_lrs_successful(
        self, xapi_mock, video_model_mock
    ):
        """Successful request should return a 204 status code."""
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]

        data = {
            "verb": {
                "id": "http://adlnet.gov/expapi/verbs/initialized",
                "display": {"en-US": "initialized"},
            },
            "context": {
                "extensions": {"https://w3id.org/xapi/video/extensions/volume": 1}
            },
            "timestamp": "2018-12-31T16:17:35.717Z",
        }

        video_model_mock.return_value = video
        xapi_instance = xapi_mock.return_value
        xapi_instance.send.return_value = None

        response = self.client.post(
            "/xapi/",
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            data=json.dumps(data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 204)

    @mock.patch("marsha.core.api.Video.objects.get")
    @mock.patch("marsha.core.api.XAPI")
    def test_xapi_statement_with_missing_user_id(self, xapi_mock, video_model_mock):
        """Missing user_id parameter in JWT will fail request to LRS."""
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["video_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]

        data = {
            "verb": {
                "id": "http://adlnet.gov/expapi/verbs/initialized",
                "display": {"en-US": "initialized"},
            },
            "context": {
                "extensions": {"https://w3id.org/xapi/video/extensions/volume": 1}
            },
            "timestamp": "2018-12-31T16:17:35.717Z",
        }

        video_model_mock.return_value = video
        xapi_instance = xapi_mock.return_value
        xapi_instance.send.side_effect = MissingUserIdError()

        response = self.client.post(
            "/xapi/",
            HTTP_AUTHORIZATION="Bearer {!s}".format(jwt_token),
            data=json.dumps(data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json().get("status"), "Impossible to idenitfy the actor."
        )
