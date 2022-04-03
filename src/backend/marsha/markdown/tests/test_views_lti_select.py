"""Test the LTI select view."""
from html import unescape
import json
import random
import re

from django.test import TestCase, override_settings

from marsha.core.tests.utils import generate_passport_and_signed_lti_parameters


class SelectLTIViewTestCase(TestCase):
    """Test the select LTI view in the ``core`` app of the Marsha project."""

    maxDiff = None

    @override_settings(MARKDOWN_ENABLED=True)
    def test_views_lti_select_markdown_enabled(self):
        """Frontend context flag should be enabled when flag is enabled."""
        lti_consumer_parameters = {
            "roles": random.choice(["instructor", "administrator"]),
            "content_item_return_url": "https://lti-consumer.site/lti",
            "context_id": "sent_lti_context_id",
        }
        lti_parameters, _ = generate_passport_and_signed_lti_parameters(
            url="http://testserver/lti/select/",
            lti_parameters=lti_consumer_parameters,
        )

        response = self.client.post(
            "/lti/select/",
            lti_parameters,
            HTTP_REFERER="http://testserver",
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">',
            response.content.decode("utf-8"),
        )
        context = json.loads(unescape(match.group(1)))

        self.assertEqual(
            context.get("flags"),
            {"BBB": False, "live_raw": False, "markdown": True, "sentry": False},
        )

    @override_settings(MARKDOWN_ENABLED=False)
    def test_views_lti_select_markdown_disabled(self):
        """Frontend context flag should be disabled when flag is disabled."""
        lti_consumer_parameters = {
            "roles": random.choice(["instructor", "administrator"]),
            "content_item_return_url": "https://lti-consumer.site/lti",
            "context_id": "sent_lti_context_id",
        }
        lti_parameters, _ = generate_passport_and_signed_lti_parameters(
            url="http://testserver/lti/select/",
            lti_parameters=lti_consumer_parameters,
        )

        response = self.client.post(
            "/lti/select/",
            lti_parameters,
            HTTP_REFERER="http://testserver",
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">',
            response.content.decode("utf-8"),
        )
        context = json.loads(unescape(match.group(1)))

        self.assertEqual(
            context.get("flags"),
            {"BBB": False, "live_raw": False, "markdown": False, "sentry": False},
        )
