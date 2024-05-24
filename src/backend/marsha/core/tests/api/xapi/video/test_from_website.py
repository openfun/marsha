"""Tests for the video xAPI statement sent from the website."""

import io
import json
import logging
from unittest import mock
import uuid

from django.core.cache import cache
from django.test import TestCase, override_settings

from logging_ldp.formatters import LDPGELFFormatter

from marsha.core.defaults import XAPI_STATEMENT_ID_CACHE
from marsha.core.factories import VideoFactory, UserFactory
from marsha.core.simple_jwt.factories import UserAccessTokenFactory


@override_settings(
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        },
        "memory_cache": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"},
    }
)
class XAPIVideoFromWebsiteTest(TestCase):
    """Video XAPI test suite sent from a website."""

    maxDiff = None

    def setUp(self):
        self.logger = logging.getLogger("xapi.example.com")
        self.logger.setLevel(logging.INFO)
        self.log_stream = io.StringIO()

        handler = logging.StreamHandler(self.log_stream)
        handler.setFormatter(LDPGELFFormatter(token="foo", null_character=False))
        self.logger.addHandler(handler)

        # Clear cache
        cache.clear()

        super().setUp()

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
        video = VideoFactory(
            id="7b18195e-e183-4bbf-b8ef-5145ef64ae19", title="Video 000"
        )
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
        log = json.loads(self.log_stream.getvalue())
        self.assertIn("short_message", log)
        message = json.loads(log["short_message"])
        self.assertEqual(
            message.get("verb"),
            {
                "id": "http://adlnet.gov/expapi/verbs/initialized",
                "display": {"en-US": "initialized"},
            },
        )
        self.assertEqual(
            message.get("context"),
            {
                "extensions": {"https://w3id.org/xapi/video/extensions/volume": 1},
                "contextActivities": {
                    "category": [{"id": "https://w3id.org/xapi/video"}]
                },
            },
        )
        self.assertEqual(
            message.get("object"),
            {
                "definition": {
                    "type": "https://w3id.org/xapi/video/activity-type/video",
                    "name": {"en-US": "Video 000"},
                },
                "id": "uuid://7b18195e-e183-4bbf-b8ef-5145ef64ae19",
                "objectType": "Activity",
            },
        )

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

    @override_settings(
        LRS_URL="http://lrs.com/data/xAPI",
        LRS_AUTH_TOKEN="Basic ThisIsABasicAuth",
        LRS_XAPI_VERSION="1.0.3",
    )
    def test_xapi_statement_with_two_same_event(self):
        """
        The first request should be successful and return a 204 status code,
        it must have set the cache with the given id in the data.
        The second request should also succeed but return a 200 status code,
        the cache should have been used to see that the xapi statement has already been sent.
        """
        video = VideoFactory()
        jwt_token = UserAccessTokenFactory()
        user=UserFactory(username="johndoe")
        print(user)
        data = {
            "id": "7b18195e-e183-4bbf-b8ef-5145ef64ae19",
            "verb": {
                "id": "http://adlnet.gov/expapi/verbs/initialized",
                "display": {"en-US": "initialized"},
            },
            "context": {
                "extensions": {"https://w3id.org/xapi/video/extensions/volume": 1}
            },
        }

        with mock.patch("marsha.core.api.XAPI.send", return_value=None):
            response1 = self.client.post(
                f"/xapi/video/{video.id}/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data=json.dumps(data),
                content_type="application/json",
            )

            response2 = self.client.post(
                f"/xapi/video/{video.id}/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data=json.dumps(data),
                content_type="application/json",
            )

        self.assertEqual(response1.status_code, 204)
        self.assertEqual(
            cache.get(f"{XAPI_STATEMENT_ID_CACHE}7b18195e-e183-4bbf-b8ef-5145ef64ae19"),
            "7b18195e-e183-4bbf-b8ef-5145ef64ae19",
        )
        self.assertEqual(response2.status_code, 200)
