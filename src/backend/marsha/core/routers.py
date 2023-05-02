"""Marsha router implementation."""

from django.core.exceptions import ImproperlyConfigured

from rest_framework.routers import DefaultRouter, Route


class MarshaDefaultRouter(DefaultRouter):
    """
    This router handles the "DELETE" verb on list routes eg: DELETE on /api/videos/
    The route then call the action "bulk_destroy" if it is implemented.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        custom_routes = []
        list_route_found = False
        for route in self.routes:
            if route.name == "{basename}-list":
                custom_routes.append(
                    Route(
                        url=route.url,
                        mapping=route.mapping | {"delete": "bulk_destroy"},
                        name=route.name,
                        detail=route.detail,
                        initkwargs=route.initkwargs,
                    )
                )
                list_route_found = True
            else:
                custom_routes.append(route)

        if not list_route_found:
            raise ImproperlyConfigured("Missing list route in DefaultRouter")

        self.routes = custom_routes
