"""Test the LTI select view."""
import random

from django.test import TestCase

from .utils import generate_passport_and_signed_lti_parameters


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument,too-many-lines


class RespondLTIViewTestCase(TestCase):
    """Test the respond LTI view in the ``core`` app of the Marsha project."""

    maxDiff = None

    def test_views_lti_respond(self):
        """Validate the format of the response returned by the view for an instructor request."""
        lti_parameters, _ = generate_passport_and_signed_lti_parameters(
            url="http://testserver/lti/respond/",
            lti_parameters={
                "roles": random.choice(["instructor", "administrator"]),
                "content_item_return_url": "http://return.url/",
                "content_items": "some content items",
                "context_id": "unknown",
            },
        )
        response = self.client.post(
            "/lti/respond/",
            lti_parameters,
            HTTP_REFERER="https://testserver",
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")

        context = response.context_data

        self.assertEqual(
            context.get("form_action"),
            lti_parameters.get("content_item_return_url"),
        )
        form_data = context.get("form_data")
        for key, value in lti_parameters.items():
            if key in (
                "content_item_return_url",
                "oauth_signature",
                "oauth_timestamp",
                "oauth_nonce",
            ):
                continue
            self.assertEqual(value, form_data.get(key))

        self.assertContains(response, "oauth_consumer_key")
        self.assertContains(response, "oauth_signature")
        self.assertContains(response, "oauth_nonce")

        self.assertEqual(
            lti_parameters.get("oauth_consumer_key"),
            form_data.get("oauth_consumer_key"),
        )
        self.assertNotEqual(
            lti_parameters.get("oauth_signature"), form_data.get("oauth_signature")
        )

    def test_views_lti_respond_verification_wrong_signature(self):
        """Wrong signature should raise a 403 error."""
        lti_parameters, _ = generate_passport_and_signed_lti_parameters(
            url="http://testserver/lti/respond/",
            lti_parameters={
                "roles": random.choice(["instructor", "administrator"]),
                "content_item_return_url": "http://return.url/",
                "content_items": "some content items",
                "context_id": "unknown",
            },
        )
        lti_parameters["oauth_signature"] = "{:s}a".format(
            lti_parameters["oauth_signature"]
        )

        response = self.client.post(
            "/lti/respond/",
            lti_parameters,
            HTTP_REFERER="https://testserver",
        )
        self.assertEqual(response.status_code, 403)

    def test_views_lti_respond_verification_wrong_referer(self):
        """Wrong referer should raise a 403 error."""
        lti_parameters, _ = generate_passport_and_signed_lti_parameters(
            url="http://testserver/lti/respond/",
            lti_parameters={
                "roles": random.choice(["instructor", "administrator"]),
                "content_item_return_url": "http://return.url/",
                "content_items": "some content items",
                "context_id": "unknown",
            },
        )

        response = self.client.post(
            "/lti/respond/",
            lti_parameters,
            HTTP_REFERER="https://wrongserver",
        )
        self.assertEqual(response.status_code, 403)
