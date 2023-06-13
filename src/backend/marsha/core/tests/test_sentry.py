"""Test for sentry module"""

from django.test import TestCase, override_settings

from marsha.core.sentry import filter_transactions


class SentryFilteringTestCase(TestCase):
    """Test about sentry filtering"""

    @override_settings(SENTRY_IGNORE_HEALTH_CHECKS=True)
    def test_filtering_without_request_in_event(self):
        """Without request parameter in the event, the event should be return directly"""

        event = {"foo": "bar"}

        filtered_event = filter_transactions(event, None)

        self.assertEqual(event, filtered_event)

    @override_settings(SENTRY_IGNORE_HEALTH_CHECKS=True)
    def test_filtering_without_url_in_the_request(self):
        """Without url in the request, the event should be return directly"""

        event = {
            "foo": "bar",
            "request": {
                "query_string": "query=foobar&page=2",
            },
        }

        filtered_event = filter_transactions(event, None)

        self.assertEqual(event, filtered_event)

    @override_settings(SENTRY_IGNORE_HEALTH_CHECKS=False)
    def test_filtering_setting_disabled_should_return_the_event(self):
        """When the SENTRY_IGNORE_HEALTH_CHECKS is set to False, the event should be return"""

        event = {
            "foo": "bar",
            "request": {
                "query_string": "query=foobar&page=2",
                "url": "https://absolute.uri/__heartbeat__/",
            },
        }

        filtered_event = filter_transactions(event, None)

        self.assertEqual(event, filtered_event)

    @override_settings(SENTRY_IGNORE_HEALTH_CHECKS=True)
    def test_filtering_url_matching_dockerflow_heartbeat_should_return_none(self):
        """When a request url matches a dockerflow heartbeat pattern, should return None"""

        event = {
            "foo": "bar",
            "request": {
                "query_string": "query=foobar&page=2",
                "url": "https://absolute.uri/__heartbeat__/",
            },
        }

        filtered_event = filter_transactions(event, None)

        self.assertIsNone(filtered_event)

    @override_settings(SENTRY_IGNORE_HEALTH_CHECKS=True)
    def test_filtering_url_matching_dockerflow_lbheartbeat_should_return_none(self):
        """When a request url matches a dockerflow lbheartbeat pattern, should return None"""

        event = {
            "foo": "bar",
            "request": {
                "query_string": "query=foobar&page=2",
                "url": "https://absolute.uri/__lbheartbeat__/",
            },
        }

        filtered_event = filter_transactions(event, None)

        self.assertIsNone(filtered_event)
