"""Tests for the xapi module of the Marsha project."""
from unittest import mock

from django.test import TestCase, override_settings

from rest_framework_simplejwt.tokens import AccessToken

from ..defaults import RAW, RUNNING
from ..factories import VideoFactory
from ..xapi import XAPI, XAPIStatement, requests


class XAPIStatmentTest(TestCase):
    """Test the XAPIStatement class."""

    def test_xapi_statement_missing_user(self):
        """Missing lti user should fallback on session_id."""
        video = VideoFactory(
            id="68333c45-4b8c-4018-a195-5d5e1706b838",
            playlist__consumer_site__domain="example.com",
            title="test video xapi",
        )

        jwt_token = AccessToken()
        jwt_token.payload["session_id"] = "326c0689-48c1-493e-8d2d-9fb0c289de7f"
        jwt_token.payload["context_id"] = "course-v1:ufr+mathematics+0001"

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

        xapi_statement = XAPIStatement(video, base_statement, jwt_token)
        statement = xapi_statement.get_statement()

        self.assertIsNotNone(statement["timestamp"])
        self.assertEqual(
            statement["actor"],
            {
                "objectType": "Agent",
                "account": {
                    "name": "326c0689-48c1-493e-8d2d-9fb0c289de7f",
                    "homePage": "http://example.com",
                },
            },
        )
        self.assertEqual(
            statement["object"],
            {
                "definition": {
                    "type": "https://w3id.org/xapi/video/activity-type/video",
                    "name": {"en-US": "test video xapi"},
                },
                "id": "uuid://68333c45-4b8c-4018-a195-5d5e1706b838",
                "objectType": "Activity",
            },
        )
        self.assertEqual(
            statement["context"],
            {
                "extensions": {
                    "https://w3id.org/xapi/video/extensions/session-id": "a6151456-18b7-"
                    "43b4-8452-2037fed588df"
                },
                "contextActivities": {
                    "category": [{"id": "https://w3id.org/xapi/video"}],
                    "parent": [
                        {
                            "id": "course-v1:ufr+mathematics+0001",
                            "objectType": "Activity",
                            "definition": {
                                "type": "http://adlnet.gov/expapi/activities/course"
                            },
                        }
                    ],
                },
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

        jwt_token = AccessToken()
        jwt_token.payload["user"] = {"id": "b2584aa405540758db2a6278521b6478"}
        jwt_token.payload["session_id"] = "326c0689-48c1-493e-8d2d-9fb0c289de7f"
        jwt_token.payload["context_id"] = "course-v1:ufr+mathematics+0001"

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

        xapi_statement = XAPIStatement(video, base_statement, jwt_token)
        statement = xapi_statement.get_statement()

        self.assertIsNotNone(statement["timestamp"])
        self.assertEqual(
            statement["actor"],
            {
                "objectType": "Agent",
                "account": {
                    "name": "b2584aa405540758db2a6278521b6478",
                    "homePage": "http://example.com",
                },
            },
        )
        self.assertEqual(
            statement["object"],
            {
                "definition": {
                    "type": "https://w3id.org/xapi/video/activity-type/video",
                    "name": {"en-US": "test video xapi"},
                },
                "id": "uuid://68333c45-4b8c-4018-a195-5d5e1706b838",
                "objectType": "Activity",
            },
        )
        self.assertEqual(
            statement["context"],
            {
                "extensions": {
                    "https://w3id.org/xapi/video/extensions/session-id": "a6151456-18b7-"
                    "43b4-8452-2037fed588df"
                },
                "contextActivities": {
                    "category": [{"id": "https://w3id.org/xapi/video"}],
                    "parent": [
                        {
                            "id": "course-v1:ufr+mathematics+0001",
                            "objectType": "Activity",
                            "definition": {
                                "type": "http://adlnet.gov/expapi/activities/course"
                            },
                        }
                    ],
                },
            },
        )
        self.assertEqual(statement["verb"], base_statement["verb"])
        self.assertEqual(statement["id"], base_statement["id"])
        self.assertEqual(statement["result"], base_statement["result"])

    def test_xapi_statement_live_video(self):
        """A live video should send a webinar activity type."""
        video = VideoFactory(
            id="68333c45-4b8c-4018-a195-5d5e1706b838",
            playlist__consumer_site__domain="example.com",
            title="test video xapi",
            live_state=RUNNING,
            live_type=RAW,
        )

        jwt_token = AccessToken()
        jwt_token.payload["user"] = {"id": "b2584aa405540758db2a6278521b6478"}
        jwt_token.payload["session_id"] = "326c0689-48c1-493e-8d2d-9fb0c289de7f"
        jwt_token.payload["context_id"] = "course-v1:ufr+mathematics+0001"

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

        xapi_statement = XAPIStatement(video, base_statement, jwt_token)
        statement = xapi_statement.get_statement()

        self.assertIsNotNone(statement["timestamp"])
        self.assertEqual(
            statement["actor"],
            {
                "objectType": "Agent",
                "account": {
                    "name": "b2584aa405540758db2a6278521b6478",
                    "homePage": "http://example.com",
                },
            },
        )
        self.assertEqual(
            statement["object"],
            {
                "definition": {
                    "type": "http://id.tincanapi.com/activitytype/webinar",
                    "name": {"en-US": "test video xapi"},
                },
                "id": "uuid://68333c45-4b8c-4018-a195-5d5e1706b838",
                "objectType": "Activity",
            },
        )
        self.assertEqual(
            statement["context"],
            {
                "extensions": {
                    "https://w3id.org/xapi/video/extensions/session-id": "a6151456-18b7-"
                    "43b4-8452-2037fed588df"
                },
                "contextActivities": {
                    "category": [{"id": "https://w3id.org/xapi/video"}],
                    "parent": [
                        {
                            "id": "course-v1:ufr+mathematics+0001",
                            "objectType": "Activity",
                            "definition": {
                                "type": "http://adlnet.gov/expapi/activities/course"
                            },
                        }
                    ],
                },
            },
        )
        self.assertEqual(statement["verb"], base_statement["verb"])
        self.assertEqual(statement["id"], base_statement["id"])
        self.assertEqual(statement["result"], base_statement["result"])

    def test_xapi_statement_missing_context_id(self):
        """Parent contextActivities should be missing without context_id."""
        video = VideoFactory(
            id="68333c45-4b8c-4018-a195-5d5e1706b838",
            playlist__consumer_site__domain="example.com",
            title="test video xapi",
        )

        jwt_token = AccessToken()
        jwt_token.payload["session_id"] = "326c0689-48c1-493e-8d2d-9fb0c289de7f"

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

        xapi_statement = XAPIStatement(video, base_statement, jwt_token)
        statement = xapi_statement.get_statement()

        self.assertIsNotNone(statement["timestamp"])
        self.assertEqual(
            statement["actor"],
            {
                "objectType": "Agent",
                "account": {
                    "name": "326c0689-48c1-493e-8d2d-9fb0c289de7f",
                    "homePage": "http://example.com",
                },
            },
        )
        self.assertEqual(
            statement["object"],
            {
                "definition": {
                    "type": "https://w3id.org/xapi/video/activity-type/video",
                    "name": {"en-US": "test video xapi"},
                },
                "id": "uuid://68333c45-4b8c-4018-a195-5d5e1706b838",
                "objectType": "Activity",
            },
        )
        self.assertEqual(
            statement["context"],
            {
                "extensions": {
                    "https://w3id.org/xapi/video/extensions/session-id": "a6151456-18b7-"
                    "43b4-8452-2037fed588df"
                },
                "contextActivities": {
                    "category": [{"id": "https://w3id.org/xapi/video"}]
                },
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
