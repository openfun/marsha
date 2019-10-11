"""Tests for the xapi module of the Marsha project."""
from unittest import mock

from django.test import TestCase

from ..exceptions import MissingUserIdError
from ..factories import VideoFactory
from ..lti import LTIUser
from ..xapi import XAPI, requests


class MockLtiUser:
    """Mock LTIUser class."""

    @property
    def user_id(self):
        """Force to raise a wanted exception."""
        raise AttributeError("user_id")


class XAPITest(TestCase):
    """Test the xapi module."""

    def test_xapi_missing_user_id(self):
        """Missing lti user_id should raise an exception."""
        xapi = XAPI("https://lrs.example.com", "auth_token")
        video = VideoFactory()

        with self.assertRaises(MissingUserIdError):
            xapi.send(video, {}, MockLtiUser())

    @mock.patch.object(requests, "post")
    def test_xapi_enrich_and_send_statement(self, mock_requests_post):
        """XAPI statement sent by the front application should be enriched.

        Before sending a statement, the xapi module is responsible for enriching it.
        """
        xapi = XAPI("https://lrs.example.com", "auth_token")
        video = VideoFactory(
            id="68333c45-4b8c-4018-a195-5d5e1706b838",
            playlist__consumer_site__domain="example.com",
        )

        mock_token_user = mock.MagicMock()
        mock_token = mock.MagicMock()
        type(mock_token).payload = mock.PropertyMock(
            return_value={
                "user_id": "foo",
                "course": {
                    "school_name": "ufr",
                    "course_name": "mathematics",
                    "course_run": "001",
                },
            }
        )
        type(mock_token_user).token = mock.PropertyMock(return_value=mock_token)

        lti_user = LTIUser(mock_token_user)

        mock_response = mock.MagicMock()
        mock_response.raise_for_status.return_value = 200
        mock_requests_post.return_value = mock_response
        base_statement = {
            "context": {
                "extensions": {
                    "https://w3id.org/xapi/video/extensions/session-id": "a6151456-18b7-"
                    "43b4-8452-2037fed588df"
                }
            },
            "result": {
                "extensions": {
                    "https://w3id.org/xapi/video/extensions/time-from": 0,
                    "https://w3id.org/xapi/video/extensions/time-to": 0,
                    "https://w3id.org/xapi/video/extensions/length": 104.304,
                    "https://w3id.org/xapi/video/extensions/progress": 0,
                    "https://w3id.org/xapi/video/extensions/played-segments": "0",
                }
            },
            "verb": {
                "display": {"en-US": "seeked"},
                "id": "https://w3id.org/xapi/video/verbs/seeked",
            },
            "id": "17dfcd44-b3e0-403d-ab96-e3ef7da616d4",
        }

        xapi.send(video, base_statement, lti_user)

        args, kwargs = mock_requests_post.call_args_list[0]
        self.assertEqual(args[0], "https://lrs.example.com")
        self.assertEqual(
            kwargs["headers"],
            {
                "Authorization": "auth_token",
                "Content-Type": "application/json",
                "X-Experience-API-Version": "1.0.3",
            },
        )
        enriched_statement = kwargs["json"]

        self.assertIsNotNone(enriched_statement["timestamp"])
        self.assertEqual(
            enriched_statement["actor"],
            {
                "objectType": "Agent",
                "account": {"name": "foo", "homePage": "http://example.com"},
            },
        )
        self.assertEqual(
            enriched_statement["object"],
            {
                "definition": {
                    "type": "https://w3id.org/xapi/video/activity-type/video",
                    "extensions": {
                        "https://w3id.org/xapi/acrossx/extensions/school": "ufr",
                        "http://adlnet.gov/expapi/activities/course": "mathematics",
                        "http://adlnet.gov/expapi/activities/module": "001",
                    },
                },
                "id": "uuid://68333c45-4b8c-4018-a195-5d5e1706b838",
                "objectType": "Activity",
            },
        )
        self.assertEqual(enriched_statement["verb"], base_statement["verb"])
        self.assertEqual(enriched_statement["id"], base_statement["id"])
        self.assertEqual(enriched_statement["result"], base_statement["result"])
