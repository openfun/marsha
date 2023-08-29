"""Test marsha router."""
from django.core.cache import cache
from django.test import TestCase, override_settings

from rest_framework.routers import DynamicRoute, Route

from marsha.core.routers import MarshaDefaultRouter
from marsha.core.tests.testing_utils import reload_urlconf


@override_settings(DEBUG=False)
class MarshBaseRouteTestCase(TestCase):
    """
    Test case for marsha rooter routes.
    """

    def setUp(self):
        """Pre-flight resets"""
        super().setUp()

        # Reset the cache to always reach the site route.
        cache.clear()

        # Force URLs reload to take DEBUG into account
        reload_urlconf()

    def test_list_route_mapping(self):
        """The "list" route must handle the "DELETE" REST verb."""
        router = MarshaDefaultRouter()
        # first route is the "list" route
        list_route = router.routes[0]
        # second route is for dynamically generated list routes with  @action(detail=False).
        dynamic_list_route = router.routes[1]

        # list_route must handle delete verb
        self.assertTrue(isinstance(list_route, Route))
        self.assertEqual(list_route.url, r"^{prefix}{trailing_slash}$")
        self.assertEqual(
            list_route.mapping,
            {"get": "list", "post": "create", "delete": "bulk_destroy"},
        )
        self.assertEqual(list_route.name, "{basename}-list")
        self.assertFalse(list_route.detail)
        self.assertEqual(list_route.initkwargs, {"suffix": "List"})

        # dynamic_list_route should not be impacted
        self.assertTrue(isinstance(dynamic_list_route, DynamicRoute))
        self.assertEqual(
            dynamic_list_route.url, r"^{prefix}/{url_path}{trailing_slash}$"
        )
        self.assertEqual(dynamic_list_route.name, "{basename}-{url_name}")
        self.assertFalse(dynamic_list_route.detail)
        self.assertEqual(dynamic_list_route.initkwargs, {})
