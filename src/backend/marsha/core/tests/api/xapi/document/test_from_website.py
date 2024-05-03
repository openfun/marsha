"""Tests for the document xAPI statement sent from the website."""

import json
from unittest import mock
import uuid

from django.test import TestCase, override_settings

from marsha.core.factories import DocumentFactory
from marsha.core.simple_jwt.factories import UserAccessTokenFactory


class XAPIDocumentFromWebsiteTest(TestCase):
    """Document XAPI test suite sent from a website."""

    @override_settings(
        LRS_URL="http://lrs.com/data/xAPI",
        LRS_AUTH_TOKEN="Basic ThisIsABasicAuth",
        LRS_XAPI_VERSION="1.0.3",
    )
    def test_xapi_statement_document_resource(self):
        """Successful request for a document should return a 204."""
        document = DocumentFactory()

        session_id = str(uuid.uuid4())
        jwt_token = UserAccessTokenFactory()
        print(jwt_token.__dict__)

        data = {
            "verb": {
                "id": "http://id.tincanapi.com/verb/downloaded",
                "display": {"en-US": "downloaded"},
            },
            "context": {
                "extensions": {
                    "https://w3id.org/xapi/document/extensions/session-id": session_id
                }
            },
        }

        with mock.patch("marsha.core.api.XAPI.send", return_value=None):
            response = self.client.post(
                f"/xapi/document/{document.id}/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data=json.dumps(data),
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 204)
