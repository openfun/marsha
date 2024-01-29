"""Tests for the xapi module of the Marsha project."""

from unittest import mock

from django.test import TestCase, override_settings

from marsha.core.defaults import ENDED, RAW, READY, RUNNING
from marsha.core.factories import DocumentFactory, VideoFactory
from marsha.core.simple_jwt.factories import LTIPlaylistAccessTokenFactory
from marsha.core.xapi import (
    XAPI,
    XAPIDocumentStatement,
    XAPIVideoStatement,
    get_xapi_statement,
    requests,
)


class XAPIVideoStatementTest(TestCase):
    """Test the XAPIVideoStatement class."""

    def test_xapi_statement_missing_user(self):
        """Missing lti user should fallback on session_id."""
        video = VideoFactory(
            id="68333c45-4b8c-4018-a195-5d5e1706b838",
            playlist__consumer_site__domain="example.com",
            title="test video xapi",
        )

        jwt_token = LTIPlaylistAccessTokenFactory(
            session_id="326c0689-48c1-493e-8d2d-9fb0c289de7f",
            context_id="course-v1:ufr+mathematics+0001",
        )
        del jwt_token.payload["user"]

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

        xapi_statement = XAPIVideoStatement()
        statement = xapi_statement.from_lti(video, base_statement, jwt_token)

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

        jwt_token = LTIPlaylistAccessTokenFactory(
            session_id="326c0689-48c1-493e-8d2d-9fb0c289de7f",
            context_id="course-v1:ufr+mathematics+0001",
            user__id="b2584aa405540758db2a6278521b6478",
        )

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

        xapi_statement = XAPIVideoStatement()
        statement = xapi_statement.from_lti(video, base_statement, jwt_token)

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

        jwt_token = LTIPlaylistAccessTokenFactory(
            session_id="326c0689-48c1-493e-8d2d-9fb0c289de7f",
            context_id="course-v1:ufr+mathematics+0001",
            user__id="b2584aa405540758db2a6278521b6478",
        )

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

        xapi_statement = XAPIVideoStatement()
        statement = xapi_statement.from_lti(video, base_statement, jwt_token)

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

    def test_xapi_statement_live_video_ended(self):
        """An ended live video should send a video activity type."""
        video = VideoFactory(
            id="68333c45-4b8c-4018-a195-5d5e1706b838",
            playlist__consumer_site__domain="example.com",
            title="test video xapi",
            live_state=ENDED,
            live_type=RAW,
            upload_state=READY,
        )

        jwt_token = LTIPlaylistAccessTokenFactory(
            session_id="326c0689-48c1-493e-8d2d-9fb0c289de7f",
            context_id="course-v1:ufr+mathematics+0001",
            user__id="b2584aa405540758db2a6278521b6478",
        )

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

        xapi_statement = XAPIVideoStatement()
        statement = xapi_statement.from_lti(video, base_statement, jwt_token)

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

    def test_xapi_statement_missing_context_id(self):
        """Parent contextActivities should be missing without context_id."""
        video = VideoFactory(
            id="68333c45-4b8c-4018-a195-5d5e1706b838",
            playlist__consumer_site__domain="example.com",
            title="test video xapi",
        )

        jwt_token = LTIPlaylistAccessTokenFactory(
            session_id="326c0689-48c1-493e-8d2d-9fb0c289de7f",
        )
        del jwt_token.payload["user"]
        del jwt_token.payload["context_id"]

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

        xapi_statement = XAPIVideoStatement()
        statement = xapi_statement.from_lti(video, base_statement, jwt_token)

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


class XAPIDocumentStatementTest(TestCase):
    """Test the XAPIDocumentStatement class."""

    @override_settings(LANGUAGE_CODE="en-us")
    def test_xapi_statement_enrich_statement(self):
        """XAPI statement sent by the front application should be enriched."""
        document = DocumentFactory(
            id="68333c45-4b8c-4018-a195-5d5e1706b838",
            playlist__consumer_site__domain="example.com",
            title="test document xapi",
        )

        jwt_token = LTIPlaylistAccessTokenFactory(
            session_id="326c0689-48c1-493e-8d2d-9fb0c289de7f",
            context_id="course-v1:ufr+mathematics+0001",
            user__id="b2584aa405540758db2a6278521b6478",
        )

        base_statement = {
            "context": {
                "extensions": {
                    "https://w3id.org/xapi/video/extensions/session-id": "a6151456-18b7-"
                    "43b4-8452-2037fed588df"
                }
            },
            "verb": {
                "display": {"en-US": "downloaded"},
                "id": "http://id.tincanapi.com/verb/downloaded",
            },
            "id": "17dfcd44-b3e0-403d-ab96-e3ef7da616d4",
        }

        xapi_statement = XAPIDocumentStatement()
        statement = xapi_statement.from_lti(document, base_statement, jwt_token)

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
                    "type": "http://id.tincanapi.com/activitytype/document",
                    "name": {"en-US": "test document xapi"},
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
                    "category": [{"id": "https://w3id.org/xapi/lms"}],
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

    @override_settings(LANGUAGE_CODE="en-us")
    def test_xapi_statement_missing_context_id(self):
        """Parent contextActivities should be missing without context_id."""
        document = DocumentFactory(
            id="68333c45-4b8c-4018-a195-5d5e1706b838",
            playlist__consumer_site__domain="example.com",
            title="test document xapi",
        )

        jwt_token = LTIPlaylistAccessTokenFactory(
            session_id="326c0689-48c1-493e-8d2d-9fb0c289de7f",
            user__id="b2584aa405540758db2a6278521b6478",
        )
        del jwt_token.payload["context_id"]

        base_statement = {
            "context": {
                "extensions": {
                    "https://w3id.org/xapi/video/extensions/session-id": "a6151456-18b7-"
                    "43b4-8452-2037fed588df"
                }
            },
            "verb": {
                "display": {"en-US": "downloaded"},
                "id": "http://id.tincanapi.com/verb/downloaded",
            },
            "id": "17dfcd44-b3e0-403d-ab96-e3ef7da616d4",
        }

        xapi_statement = XAPIDocumentStatement()
        statement = xapi_statement.from_lti(document, base_statement, jwt_token)

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
                    "type": "http://id.tincanapi.com/activitytype/document",
                    "name": {"en-US": "test document xapi"},
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
                    "category": [{"id": "https://w3id.org/xapi/lms"}]
                },
            },
        )
        self.assertEqual(statement["verb"], base_statement["verb"])
        self.assertEqual(statement["id"], base_statement["id"])

    @override_settings(LANGUAGE_CODE="en-us")
    def test_xapi_statement_missing_user_id(self):
        """Missing lti user should fallback on session_id."""
        document = DocumentFactory(
            id="68333c45-4b8c-4018-a195-5d5e1706b838",
            playlist__consumer_site__domain="example.com",
            title="test document xapi",
        )

        jwt_token = LTIPlaylistAccessTokenFactory(
            session_id="326c0689-48c1-493e-8d2d-9fb0c289de7f",
            context_id="course-v1:ufr+mathematics+0001",
        )
        del jwt_token.payload["user"]

        base_statement = {
            "context": {
                "extensions": {
                    "https://w3id.org/xapi/video/extensions/session-id": "a6151456-18b7-"
                    "43b4-8452-2037fed588df"
                }
            },
            "verb": {
                "display": {"en-US": "downloaded"},
                "id": "http://id.tincanapi.com/verb/downloaded",
            },
            "id": "17dfcd44-b3e0-403d-ab96-e3ef7da616d4",
        }

        xapi_statement = XAPIDocumentStatement()
        statement = xapi_statement.from_lti(document, base_statement, jwt_token)

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
                    "type": "http://id.tincanapi.com/activitytype/document",
                    "name": {"en-US": "test document xapi"},
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
                    "category": [{"id": "https://w3id.org/xapi/lms"}],
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


class GetXapiStatementTest(TestCase):
    """Test get_xapi_statement function."""

    def test_get_xapi_statement_with_video(self):
        """With video parameter must return XAPIVideoStatement."""
        statement_class = get_xapi_statement("video")
        self.assertIsInstance(statement_class, XAPIVideoStatement)

    def test_get_xapi_statement_with_document(self):
        """With document parameter must return XAPIDocumentStatement."""
        statement_class = get_xapi_statement("document")
        self.assertIsInstance(statement_class, XAPIDocumentStatement)

    def test_get_xapi_statement_with_unknown_resource(self):
        """With unknown resource must throw an exception."""
        with self.assertRaises(NotImplementedError):
            get_xapi_statement("unknown")
