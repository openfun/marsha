"""Test for the document XAPI statement module generated from a website context."""

from django.test import TestCase, override_settings

from marsha.core.factories import DocumentFactory, SiteFactory, UserFactory
from marsha.core.xapi import XAPIDocumentStatement


class XAPIStatementFromWebsite(TestCase):
    """Generate a document xapi statement from a website context."""

    @override_settings(LANGUAGE_CODE="en-us")
    def test_xapi_statement_enrich_statement(self):
        """XAPI statement sent by the front application should be enriched."""
        document = DocumentFactory(
            id="68333c45-4b8c-4018-a195-5d5e1706b838",
            title="test document xapi",
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
            "verb": {
                "display": {"en-US": "downloaded"},
                "id": "http://id.tincanapi.com/verb/downloaded",
            },
            "id": "17dfcd44-b3e0-403d-ab96-e3ef7da616d4",
        }

        xapi_statement = XAPIDocumentStatement()
        statement = xapi_statement.from_website(document, base_statement, site, user)

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
            },
        )
        self.assertEqual(statement["verb"], base_statement["verb"])
        self.assertEqual(statement["id"], base_statement["id"])
