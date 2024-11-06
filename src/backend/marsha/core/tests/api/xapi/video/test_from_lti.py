"""Tests for the video xAPI statement sent from LTI."""

import io
import json
import logging

from django.core.cache import cache
from django.test import TestCase

from logging_ldp.formatters import LDPGELFFormatter

from marsha.core.factories import (
    ConsumerSiteFactory,
    OrganizationFactory,
    PlaylistFactory,
    VideoFactory,
)
from marsha.core.simple_jwt.factories import (
    PlaylistAccessTokenFactory,
    StudentLtiTokenFactory,
)


class XAPIVideoFromLTITest(TestCase):
    """Tests for the video xAPI statement sent from LTI."""

    maxDiff = None

    def setUp(self):
        self.logger = logging.getLogger("xapi.lti.example.com")
        self.logger.setLevel(logging.INFO)
        self.log_stream = io.StringIO()

        handler = logging.StreamHandler(self.log_stream)
        handler.setFormatter(LDPGELFFormatter(token="foo", null_character=False))
        self.logger.addHandler(handler)

        # Clear cache
        cache.clear()

        super().setUp()

    def test_send_xapi_statement_from_lti_request(self):
        """
        A video xAPI statement should be sent when the video has been created in a LTI context.
        """
        video = VideoFactory(
            id="7b18195e-e183-4bbf-b8ef-5145ef64ae19",
            title="Video 000",
            playlist__consumer_site__domain="lti.example.com",
        )
        jwt_token = StudentLtiTokenFactory(
            playlist=video.playlist,
            context_id="cf253c93-3738-496b-8c8f-1e8a1b09a6b1",
        )

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
                    "category": [{"id": "https://w3id.org/xapi/video"}],
                    "parent": [
                        {
                            "id": "cf253c93-3738-496b-8c8f-1e8a1b09a6b1",
                            "objectType": "Activity",
                            "definition": {
                                "type": "http://adlnet.gov/expapi/activities/course"
                            },
                        }
                    ],
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

    def test_send_xapi_statement_from_lti_request_video_no_consumer_site(self):
        """
        A video xAPI statement should be sent when the video has not been created in a LTI context.
        """
        organization = OrganizationFactory()
        playlist = PlaylistFactory(
            organization=organization, consumer_site=None, lti_id=None
        )
        consumer_site = ConsumerSiteFactory(domain="lti.example.com")
        video = VideoFactory(
            id="7b18195e-e183-4bbf-b8ef-5145ef64ae19",
            title="Video 000",
            playlist=playlist,
        )
        jwt_token = StudentLtiTokenFactory(
            playlist=video.playlist,
            context_id="cf253c93-3738-496b-8c8f-1e8a1b09a6b1",
            consumer_site=str(consumer_site.id),
        )
        self.assertIsNotNone(video.playlist.organization)
        self.assertIsNone(video.playlist.consumer_site)

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
                    "category": [{"id": "https://w3id.org/xapi/video"}],
                    "parent": [
                        {
                            "id": "cf253c93-3738-496b-8c8f-1e8a1b09a6b1",
                            "objectType": "Activity",
                            "definition": {
                                "type": "http://adlnet.gov/expapi/activities/course"
                            },
                        }
                    ],
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

    def test_send_xapi_statement_from_public_video_view_created_from_website(self):
        """
        The XAPI statement should be ignored when the video has been created from the website
        and used in a public view.
        """
        organization = OrganizationFactory()
        playlist = PlaylistFactory(
            organization=organization, consumer_site=None, lti_id=None
        )
        video = VideoFactory(
            id="7b18195e-e183-4bbf-b8ef-5145ef64ae19",
            title="Video 000",
            playlist=playlist,
        )
        # JWT Token used in a public view
        jwt_token = PlaylistAccessTokenFactory(
            playlist=video.playlist,
        )
        self.assertIsNotNone(video.playlist.organization)
        self.assertIsNone(video.playlist.consumer_site)

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

        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.log_stream.getvalue(), "")
