"""Test for the video XAPI statement module generated from a website context."""

from django.test import TestCase, override_settings

from marsha.core.defaults import ENDED, RAW, READY, RUNNING
from marsha.core.factories import SiteFactory, UserFactory, VideoFactory
from marsha.core.xapi import XAPIVideoStatement


class XAPIStatementFromWebsite(TestCase):
    """Generate xapi statement from a website context."""

    @override_settings(LANGUAGE_CODE="en-us")
    def test_xapi_statement_enrich_statement(self):
        """XAPI statement sent by the front application should be enriched."""
        video = VideoFactory(
            id="68333c45-4b8c-4018-a195-5d5e1706b838",
            title="test video xapi",
        )

        site = SiteFactory(name="marsha", domain="marsha.education")
        user = UserFactory(username="john")

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
        statement = xapi_statement.from_website(video, base_statement, site, user)

        self.assertIsNotNone(statement["timestamp"])
        self.assertEqual(
            statement["actor"],
            {
                "objectType": "Agent",
                "account": {
                    "name": f"{user.id}",
                    "homePage": "http://marsha.education",
                    "mbox": "mailto:john@example.org",
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
            title="test video xapi",
            live_state=RUNNING,
            live_type=RAW,
        )

        site = SiteFactory(name="marsha", domain="marsha.education")
        user = UserFactory(username="john")

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
        statement = xapi_statement.from_website(video, base_statement, site, user)

        self.assertIsNotNone(statement["timestamp"])
        self.assertEqual(
            statement["actor"],
            {
                "objectType": "Agent",
                "account": {
                    "name": f"{user.id}",
                    "homePage": "http://marsha.education",
                    "mbox": "mailto:john@example.org",
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
            title="test video xapi",
            live_state=ENDED,
            live_type=RAW,
            upload_state=READY,
        )

        site = SiteFactory(name="marsha", domain="marsha.education")
        user = UserFactory(username="john")

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
        statement = xapi_statement.from_website(video, base_statement, site, user)

        self.assertIsNotNone(statement["timestamp"])
        self.assertEqual(
            statement["actor"],
            {
                "objectType": "Agent",
                "account": {
                    "name": f"{user.id}",
                    "homePage": "http://marsha.education",
                    "mbox": "mailto:john@example.org",
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
                },
            },
        )
        self.assertEqual(statement["verb"], base_statement["verb"])
        self.assertEqual(statement["id"], base_statement["id"])
        self.assertEqual(statement["result"], base_statement["result"])
