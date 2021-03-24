"""Test the LTI select view."""
from unittest import mock

from django.test import TestCase

from pylti.common import LTIException

from ..factories import ConsumerSiteLTIPassportFactory
from ..lti import LTI


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument,too-many-lines


class RespondLTIViewTestCase(TestCase):
    """Test the respond LTI view in the ``core`` app of the Marsha project."""

    maxDiff = None

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_respond(self, mock_get_consumer_site, _mock_verify):
        """Validate the format of the response returned by the view for an instructor request."""
        passport = ConsumerSiteLTIPassportFactory()

        # https://www.imsglobal.org/specs/lticiv1p0/specification
        data = {
            "content_item_return_url": "http://return.url/",
            "content_items": "some content items",
            "context_id": "unknown",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "roles": "Instructor,Administrator",
        }

        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post("/lti/respond/", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")

        context = response.context_data

        self.assertEqual(
            context.get("form_action"), data.get("content_item_return_url")
        )
        form_data = context.get("form_data")
        for key, value in data.items():
            if key in ("content_item_return_url", "oauth_signature"):
                continue
            self.assertEqual(value, form_data.get(key))

        self.assertContains(response, "oauth_consumer_key")
        self.assertContains(response, "oauth_signature")
        self.assertContains(response, "oauth_nonce")

        self.assertEqual(
            data.get("oauth_consumer_key"), form_data.get("oauth_consumer_key")
        )
        self.assertNotEqual(
            data.get("oauth_signature"), form_data.get("oauth_signature")
        )

    @mock.patch.object(LTI, "verify", side_effect=LTIException)
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_respond_verification_fails(
        self, mock_get_consumer_site, _mock_verify
    ):
        """Validate the format of the response returned by the view for an instructor request."""
        passport = ConsumerSiteLTIPassportFactory()

        # https://www.imsglobal.org/specs/lticiv1p0/specification
        data = {
            "content_item_return_url": "http://return.url/",
            "content_items": "some content items",
            "context_id": "unknown",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "oauth_signature": "any signature",
            "roles": "Instructor,Administrator",
        }

        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post("/lti/respond/", data)
        self.assertEqual(response.status_code, 403)
