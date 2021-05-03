"""Test the LTI select view."""
import random
from unittest import mock

from django.test import TestCase

from rest_framework_simplejwt.tokens import AccessToken

from .utils import generate_passport_and_signed_lti_parameters


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument,too-many-lines


class RespondLTIViewTestCase(TestCase):
    """Test the respond LTI view in the ``core`` app of the Marsha project."""

    maxDiff = None

    def test_views_lti_respond(self):
        """Validate the format of the response returned by the view."""
        lti_select_form_data, _ = generate_passport_and_signed_lti_parameters(
            url="http://testserver/lti/respond/",
            lti_parameters={
                "roles": random.choice(["instructor", "administrator"]),
                "content_item_return_url": "http://return.url/",
                "context_id": "unknown",
            },
        )
        jwt_token = AccessToken()
        jwt_token.payload["lti_select_form_data"] = lti_select_form_data
        response = self.client.post(
            "/lti/respond/",
            {
                "jwt": str(jwt_token),
                "content_items": "some content items",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")

        context = response.context_data

        self.assertEqual(
            context.get("form_action"),
            lti_select_form_data.get("content_item_return_url"),
        )
        form_data = context.get("form_data")
        for key, value in lti_select_form_data.items():
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
            lti_select_form_data.get("oauth_consumer_key"),
            form_data.get("oauth_consumer_key"),
        )
        self.assertEqual(
            "some content items",
            form_data.get("content_items"),
        )
        self.assertNotEqual(
            lti_select_form_data.get("oauth_signature"),
            form_data.get("oauth_signature"),
        )

    @mock.patch(
        "oauthlib.oauth1.rfc5849.generate_nonce",
        return_value="59474787080480293391616018589",
    )
    @mock.patch("oauthlib.oauth1.rfc5849.generate_timestamp", return_value="1616018589")
    def test_views_lti_respond_signature(self, mock_ts, mock_nonce):
        """Validate signed data of the response returned by the view for an instructor request."""
        lti_select_form_data, _ = generate_passport_and_signed_lti_parameters(
            url="http://lti-consumer.site/lti/respond/",
            lti_parameters={
                "roles": "instructor",
                "content_item_return_url": "http://lti-consumer.site/",
                "context_id": "unknown",
            },
            passport_attributes={
                "oauth_consumer_key": "W1PWSNDUL7T7YGMCOWZH",
                "shared_secret": "passport_secret",
            },
        )
        jwt_token = AccessToken()
        jwt_token.payload["lti_select_form_data"] = lti_select_form_data
        response = self.client.post(
            "/lti/respond/",
            {
                "jwt": str(jwt_token),
                "content_items": "some content items",
            },
        )
        context = response.context_data

        form_data = context.get("form_data")
        self.assertEqual(
            "xaB0rmss7hEJCNBVPwPPsXzeUWI=", form_data.get("oauth_signature")
        )
        self.assertEqual(mock_ts.return_value, form_data.get("oauth_timestamp"))
        self.assertEqual(mock_nonce.return_value, form_data.get("oauth_nonce"))

    def test_views_lti_respond_wrong_jwt(self):
        """Wrong JWT should raise a 403 error."""
        lti_select_form_data, _ = generate_passport_and_signed_lti_parameters(
            url="http://testserver/lti/respond/",
            lti_parameters={
                "roles": random.choice(["instructor", "administrator"]),
                "content_item_return_url": "http://lti-consumer.site/",
                "context_id": "unknown",
            },
        )
        jwt_token = AccessToken()
        jwt_token.payload["lti_select_form_data"] = lti_select_form_data
        response = self.client.post(
            "/lti/respond/",
            {
                "jwt": str(jwt_token) + "a",
                "content_items": "some content items",
            },
        )
        self.assertEqual(response.status_code, 403)

    def test_views_lti_respond_no_jwt(self):
        """Missing JWT should raise a 403 error."""
        response = self.client.post(
            "/lti/respond/",
        )
        self.assertEqual(response.status_code, 403)

    def test_views_lti_respond_no_lti_select_form_data(self):
        """Missing lti_select_form_data in JWT should raise a 400 error."""
        jwt_token = AccessToken()
        response = self.client.post(
            "/lti/respond/",
            {
                "jwt": str(jwt_token),
                "content_items": "some content items",
            },
        )
        self.assertEqual(response.status_code, 400)

    def test_views_lti_respond_no_content_items(self):
        """Missing content_items post data should raise a 400 error."""
        lti_select_form_data, _ = generate_passport_and_signed_lti_parameters(
            url="http://testserver/lti/respond/",
            lti_parameters={
                "roles": random.choice(["instructor", "administrator"]),
                "content_item_return_url": "http://lti-consumer.site/",
                "context_id": "unknown",
            },
        )
        jwt_token = AccessToken()
        jwt_token.payload["lti_select_form_data"] = lti_select_form_data
        response = self.client.post(
            "/lti/respond/",
            {
                "jwt": str(jwt_token),
            },
        )
        self.assertEqual(response.status_code, 400)

    def test_views_lti_respond_no_content_item_return_url(self):
        """Missing content_item_return_url in JWT should raise a 400 error."""
        lti_select_form_data, _ = generate_passport_and_signed_lti_parameters(
            url="http://testserver/lti/respond/",
            lti_parameters={
                "roles": random.choice(["instructor", "administrator"]),
                "context_id": "unknown",
            },
        )
        jwt_token = AccessToken()
        jwt_token.payload["lti_select_form_data"] = lti_select_form_data
        response = self.client.post(
            "/lti/respond/",
            {
                "jwt": str(jwt_token),
                "content_items": "some content items",
            },
        )
        self.assertEqual(response.status_code, 400)

    def test_views_lti_respond_wrong_content_item_return_url(self):
        """Wrong content_item_return_url in JWT should raise a 400 error."""
        lti_select_form_data, _ = generate_passport_and_signed_lti_parameters(
            url="http://testserver/lti/respond/",
            lti_parameters={
                "roles": random.choice(["instructor", "administrator"]),
                "content_item_return_url": "not an url",
                "context_id": "unknown",
            },
        )
        jwt_token = AccessToken()
        jwt_token.payload["lti_select_form_data"] = lti_select_form_data
        response = self.client.post(
            "/lti/respond/",
            {
                "jwt": str(jwt_token),
                "content_items": "some content items",
            },
        )
        self.assertEqual(response.status_code, 400)

    def test_views_lti_respond_no_oauth_consumer_key(self):
        """Missing oauth_consumer_key in JWT should raise a 403 error."""
        lti_select_form_data, _ = generate_passport_and_signed_lti_parameters(
            url="http://testserver/lti/respond/",
            lti_parameters={
                "roles": random.choice(["instructor", "administrator"]),
                "content_item_return_url": "http://lti-consumer.site/",
                "context_id": "unknown",
            },
        )
        lti_select_form_data.pop("oauth_consumer_key")
        jwt_token = AccessToken()
        jwt_token.payload["lti_select_form_data"] = lti_select_form_data
        response = self.client.post(
            "/lti/respond/",
            {
                "jwt": str(jwt_token),
                "content_items": "some content items",
            },
        )
        self.assertEqual(response.status_code, 403)

    def test_views_lti_respond_wrong_oauth_consumer_key(self):
        """Wrong oauth_consumer_key in JWT should raise a 403 error."""
        lti_select_form_data, _ = generate_passport_and_signed_lti_parameters(
            url="http://testserver/lti/respond/",
            lti_parameters={
                "roles": random.choice(["instructor", "administrator"]),
                "content_item_return_url": "http://lti-consumer.site/",
                "context_id": "unknown",
            },
        )
        lti_select_form_data["oauth_consumer_key"] = "wrong oauth_consumer_key"
        jwt_token = AccessToken()
        jwt_token.payload["lti_select_form_data"] = lti_select_form_data
        response = self.client.post(
            "/lti/respond/",
            {
                "jwt": str(jwt_token),
                "content_items": "some content items",
            },
        )
        self.assertEqual(response.status_code, 403)
