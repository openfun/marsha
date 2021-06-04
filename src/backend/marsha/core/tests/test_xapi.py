"""Tests for the xapi module of the Marsha project."""
from unittest import mock

from django.test import TestCase, override_settings

from ..factories import VideoFactory
from ..lti import LTIUser
from ..xapi import XAPI, XAPIStatement, requests


class MockLtiUser:
    """Mock LTIUser class."""


class XAPIStatmentTest(TestCase):
    """Test the XAPIStatement class."""

    def test_xapi_statement_missing_user(self):
        """Missing lti user should fallback on session_id."""
        video = VideoFactory(
            id="68333c45-4b8c-4018-a195-5d5e1706b838",
            playlist__consumer_site__domain="example.com",
            title="test video xapi",
        )

        mock_token_user = mock.MagicMock()
        mock_token = mock.MagicMock()
        type(mock_token).payload = mock.PropertyMock(
            return_value={
                "session_id": "bar",
                "course": {
                    "school_name": "ufr",
                    "course_name": "mathematics",
                    "course_run": "001",
                },
            }
        )
        type(mock_token_user).token = mock.PropertyMock(return_value=mock_token)

        lti_user = LTIUser(mock_token_user)

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

        xapi_statement = XAPIStatement(video, base_statement, lti_user)
        statement = xapi_statement.get_statement()

        self.assertIsNotNone(statement["timestamp"])
        self.assertEqual(
            statement["actor"],
            {
                "objectType": "Agent",
                "account": {"name": "bar", "homePage": "http://example.com"},
            },
        )
        self.assertEqual(
            statement["object"],
            {
                "definition": {
                    "type": "https://w3id.org/xapi/video/activity-type/video",
                    "name": {"en-US": "test video xapi"},
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
        self.assertEqual(statement["verb"], base_statement["verb"])
        self.assertEqual(statement["id"], base_statement["id"])
        self.assertEqual(statement["result"], base_statement["result"])

    @override_settings(LANGUAGE_CODE="en-us")
    def test_xapi_statement_enrich_statement(self):
        """XAPI statement sent by the front application should be enriched."""
        video = VideoFactory(
            id="68333c45-4b8c-4018-a195-5d5e1706b838",
            playlist__consumer_site__domain="example.com",
            title="test video xapi",
        )

        mock_token_user = mock.MagicMock()
        mock_token = mock.MagicMock()
        type(mock_token).payload = mock.PropertyMock(
            return_value={
                "user": {
                    "id": "foo",
                },
                "course": {
                    "school_name": "ufr",
                    "course_name": "mathematics",
                    "course_run": "001",
                },
            }
        )
        type(mock_token_user).token = mock.PropertyMock(return_value=mock_token)

        lti_user = LTIUser(mock_token_user)

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

        xapi_statement = XAPIStatement(video, base_statement, lti_user)
        statement = xapi_statement.get_statement()

        self.assertIsNotNone(statement["timestamp"])
        self.assertEqual(
            statement["actor"],
            {
                "objectType": "Agent",
                "account": {"name": "foo", "homePage": "http://example.com"},
            },
        )
        self.assertEqual(
            statement["object"],
            {
                "definition": {
                    "type": "https://w3id.org/xapi/video/activity-type/video",
                    "name": {"en-US": "test video xapi"},
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
        self.assertEqual(statement["verb"], base_statement["verb"])
        self.assertEqual(statement["id"], base_statement["id"])
        self.assertEqual(statement["result"], base_statement["result"])


class XAPITest(TestCase):
    """Test the xapi module."""

    @mock.patch.object(requests, "post")
    def test_xapi_enrich_and_send_statement(self, mock_requests_post):
        """XAPI statement sent by the front application should be enriched.

        Before sending a statement, the xapi module is responsible for enriching it.
        """
        xapi = XAPI("https://lrs.example.com", "auth_token")

        mock_response = mock.MagicMock()
        mock_response.raise_for_status.return_value = 200
        mock_requests_post.return_value = mock_response

        statement = {"foo": "bar"}
        mock_xapi_statement = mock.MagicMock()
        mock_xapi_statement.get_statement.return_value = statement

        xapi.send(mock_xapi_statement)

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
        self.assertEqual(kwargs["json"], statement)
