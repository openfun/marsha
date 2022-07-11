"""Tests for the xAPI statement API of the marsha project."""
import json
from unittest import mock
import uuid

from django.test import TestCase

import requests
from rest_framework_simplejwt.tokens import AccessToken

from ..factories import DocumentFactory, VideoFactory


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class XAPIStatementApiTest(TestCase):
    """Test the API for the xAPI resource."""

    def test_xapi_statement_api_with_anonymous_user(self):
        """Anonymous users should not be allowed to send xAPI statement."""
        response = self.client.post("/xapi/video/")
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_xapi_statement_with_no_lrs_configured(self):
        """If no LRS configured a 501 status code should be returned."""
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["user"] = {
            "id": "John Doe",
            "username": "john_doe",
        }

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
            "/xapi/video/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            data=json.dumps(data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 501)

    def test_xapi_statement_api_with_invalid_payload(self):
        """Payload should follow a given pattern."""
        video = VideoFactory(
            playlist__consumer_site__lrs_url="http://lrs.com/data/xAPI",
            playlist__consumer_site__lrs_auth_token="Basic ThisIsABasicAuth",
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]

        data = {"foo": "bar"}

        response = self.client.post(
            "/xapi/video/",
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
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(uuid.uuid4())
        jwt_token.payload["roles"] = ["student"]

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
            "/xapi/video/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            data=json.dumps(data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 404)

    @mock.patch("marsha.core.api.XAPI.send")
    def test_xapi_statement_with_request_error_to_lrs(self, xapi_send_mock):
        """Sending a request to the LRS fails. The response should reflect this failure."""
        video = VideoFactory(
            playlist__consumer_site__lrs_url="http://lrs.com/data/xAPI",
            playlist__consumer_site__lrs_auth_token="Basic ThisIsABasicAuth",
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["user"] = {
            "id": "John Doe",
            "username": "john_doe",
        }

        data = {
            "verb": {
                "id": "http://adlnet.gov/expapi/verbs/initialized",
                "display": {"en-US": "initialized"},
            },
            "context": {
                "extensions": {"https://w3id.org/xapi/video/extensions/volume": 1}
            },
        }

        mock_response = mock.Mock()
        mock_response.text.return_value = "foo"
        mock_response.status_code.return_value = 400

        exception = requests.exceptions.HTTPError(response=mock_response)
        xapi_send_mock.side_effect = exception

        response = self.client.post(
            "/xapi/video/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            data=json.dumps(data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 501)
        self.assertEqual(
            response.json().get("status"), "Impossible to send xAPI request to LRS."
        )

    def test_xapi_statement_with_request_to_lrs_successful(self):
        """Successful request should return a 204 status code."""
        video = VideoFactory(
            playlist__consumer_site__lrs_url="http://lrs.com/data/xAPI",
            playlist__consumer_site__lrs_auth_token="Basic ThisIsABasicAuth",
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["user"] = {
            "id": "John Doe",
            "username": "john_doe",
        }

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
                "/xapi/video/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data=json.dumps(data),
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 204)

    def test_xapi_statement_with_missing_user(self):
        """Missing user parameter in JWT will fail request to LRS."""
        video = VideoFactory(
            playlist__consumer_site__lrs_url="http://lrs.com/data/xAPI",
            playlist__consumer_site__lrs_auth_token="Basic ThisIsABasicAuth",
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["session_id"] = str(uuid.uuid4())
        jwt_token.payload["roles"] = ["student"]

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
                "/xapi/video/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data=json.dumps(data),
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 204)

    def test_xapi_statement_document_resource(self):
        """Successful request for a document should return a 204."""
        document = DocumentFactory(
            playlist__consumer_site__lrs_url="http://lrs.com/data/xAPI",
            playlist__consumer_site__lrs_auth_token="Basic ThisIsABasicAuth",
        )
        jwt_token = AccessToken()
        session_id = str(uuid.uuid4())
        jwt_token.payload["resource_id"] = str(document.id)
        jwt_token.payload["session_id"] = session_id
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["user"] = {
            "id": "John Doe",
            "username": "john_doe",
        }

        data = {
            "verb": {
                "id": "http://id.tincanapi.com/verb/downloaded",
                "display": {"en-US": "downloaded"},
            },
            "context": {
                "extensions": {
                    "https://w3id.org/xapi/video/extensions/session-id": session_id
                }
            },
        }

        with mock.patch("marsha.core.api.XAPI.send", return_value=None):
            response = self.client.post(
                "/xapi/document/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data=json.dumps(data),
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 204)
