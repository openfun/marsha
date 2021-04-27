"""Test the LTI select view."""
import random
from urllib.parse import unquote

from django.test import TestCase

from oauthlib import oauth1

from ..factories import ConsumerSiteLTIPassportFactory


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument,too-many-lines


class RespondLTIViewTestCase(TestCase):
    """Test the respond LTI view in the ``core`` app of the Marsha project."""

    maxDiff = None

    @staticmethod
    def _get_signed_lti_parameters():
        """Generate signed LTI parameters."""
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="testserver")
        lti_parameters = {
            "roles": random.choice(["instructor", "administrator"]),
            "content_item_return_url": "http://return.url/",
            "content_items": "some content items",
            "context_id": "unknown",
        }
        url = "http://testserver/lti/respond/"
        client = oauth1.Client(
            client_key=passport.oauth_consumer_key, client_secret=passport.shared_secret
        )
        # Compute Authorization header which looks like:
        # Authorization: OAuth oauth_nonce="80966668944732164491378916897",
        # oauth_timestamp="1378916897", oauth_version="1.0", oauth_signature_method="HMAC-SHA1",
        # oauth_consumer_key="", oauth_signature="frVp4JuvT1mVXlxktiAUjQ7%2F1cw%3D"
        _uri, headers, _body = client.sign(
            url,
            http_method="POST",
            body=lti_parameters,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        # Parse headers to pass to template as part of context:
        oauth_dict = dict(
            param.strip().replace('"', "").split("=")
            for param in headers["Authorization"].split(",")
        )

        signature = oauth_dict["oauth_signature"]
        oauth_dict["oauth_signature"] = unquote(signature)
        oauth_dict["oauth_nonce"] = oauth_dict.pop("OAuth oauth_nonce")

        lti_parameters.update(oauth_dict)
        return lti_parameters

    def test_views_lti_respond(self):
        """Validate the format of the response returned by the view for an instructor request."""
        lti_parameters = self._get_signed_lti_parameters()
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
        lti_parameters = self._get_signed_lti_parameters()
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
        lti_parameters = self._get_signed_lti_parameters()
        response = self.client.post(
            "/lti/respond/",
            lti_parameters,
            HTTP_REFERER="https://wrongserver",
        )
        self.assertEqual(response.status_code, 403)
