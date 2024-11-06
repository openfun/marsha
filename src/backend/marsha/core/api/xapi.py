"""Declare API endpoints for xapi with Django RestFramework viewsets."""

import json
import logging

from django.apps import apps
from django.conf import settings
from django.contrib.sites.shortcuts import get_current_site
from django.core.cache import cache
from django.http import HttpResponseNotFound
from django.shortcuts import get_object_or_404

import requests
from rest_framework.response import Response
from rest_framework.views import APIView

from marsha.core import permissions, serializers
from marsha.core.api.base import APIViewMixin
from marsha.core.defaults import XAPI_STATEMENT_ID_CACHE
from marsha.core.models import ConsumerSite
from marsha.core.xapi import XAPI, get_xapi_statement


logger = logging.getLogger(__name__)


class NoConsumerSiteError(Exception):
    """Error raised when no consumer site is found."""


class XAPIStatementView(APIViewMixin, APIView):
    """Viewset managing xAPI requests."""

    permission_classes = [permissions.UserOrPlaylistIsAuthenticated]
    http_method_names = ["post"]

    def _statement_from_lti(
        self, request, partial_xapi_statement, statement_class, object_instance
    ):
        consumer_site = object_instance.playlist.consumer_site

        if consumer_site is None:
            # The resource is used in a LTI context but have been created in the website context
            # so the consumer site does not exists on the playlist.
            # We have to find it directly from the LTI information we have in the JWT token.
            if not request.resource.token.payload.get("consumer_site"):
                # If the consumer site is not present in the JWT token, we have no information
                # from what context the statement is sent. So we stop here the process.
                raise NoConsumerSiteError(
                    "Consumer site is mandatory in the LTI token."
                )

            consumer_site = ConsumerSite.objects.get(
                pk=request.resource.token.payload.get("consumer_site")
            )

        # xapi statements are sent to a consumer-site-specific logger. We assume that the logger
        # name respects the following convention: "xapi.[consumer site domain]",
        # _e.g._ `xapi.foo.education` for the `foo.education` consumer site domain. Note that this
        # logger should be defined in your settings with an appropriate handler and formatter.
        xapi_logger = logging.getLogger(f"xapi.{consumer_site.domain}")

        # xapi statement enriched with video and jwt_token information
        xapi_statement = statement_class.from_lti(
            object_instance,
            partial_xapi_statement.validated_data,
            request.resource.token,
            consumer_site.domain,
        )

        # Log the statement in the xapi logger
        xapi_logger.info(json.dumps(xapi_statement))

        return (
            xapi_statement,
            consumer_site.lrs_url,
            consumer_site.lrs_auth_token,
            consumer_site.lrs_xapi_version,
        )

    def _statement_from_website(
        self, request, partial_xapi_statement, statement_class, object_instance
    ):
        current_site = get_current_site(request)

        # xapi statements are sent to a specific logger dedicated to the current site.
        # We assume that the logger name respects the following convention:
        # "xapi.[current site domain]",
        # _e.g._ `xapi.foo.education` for the `foo.education` current site domain. Note that this
        # logger should be defined in your settings with an appropriate handler and formatter.
        xapi_logger = logging.getLogger(f"xapi.{current_site.domain}")

        xapi_statement = statement_class.from_website(
            object_instance,
            partial_xapi_statement.validated_data,
            current_site,
            request.user,
        )

        # Log the statement in the xapi logger
        xapi_logger.info(json.dumps(xapi_statement))

        return xapi_statement

    # pylint: disable=too-many-return-statements
    def post(self, request, resource_kind, resource_id):
        """Send a xAPI statement to a defined LRS.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint.
            It contains a JSON representing part of the xAPI statement

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse to reflect if the XAPI request failed or is successful

        """
        try:
            statement_class = get_xapi_statement(resource_kind)
        except NotImplementedError:
            return HttpResponseNotFound()

        model = apps.get_model(app_label="core", model_name=resource_kind)
        object_instance = get_object_or_404(model, **{"pk": resource_id})

        # xapi statement sent by the client but incomplete
        partial_xapi_statement = serializers.XAPIStatementSerializer(data=request.data)
        if not partial_xapi_statement.is_valid():
            return Response(partial_xapi_statement.errors, status=400)

        if request.resource:
            # consumer site in a LTI token is mandatory.
            if request.resource.playlist_id != str(object_instance.playlist.id):
                return HttpResponseNotFound()
            try:
                (
                    statement,
                    lrs_url,
                    lrs_auth_token,
                    lrs_xapi_version,
                ) = self._statement_from_lti(
                    request, partial_xapi_statement, statement_class, object_instance
                )
            except NoConsumerSiteError:
                return Response(status=400)
        else:
            statement = self._statement_from_website(
                request, partial_xapi_statement, statement_class, object_instance
            )
            lrs_url = settings.LRS_URL
            lrs_auth_token = settings.LRS_AUTH_TOKEN
            lrs_xapi_version = settings.LRS_XAPI_VERSION

        if not lrs_url or not lrs_auth_token:
            logger.info("LRS is not configured.")
            return Response(status=200)

        if cache.get(f"{XAPI_STATEMENT_ID_CACHE}{statement['id']}") is not None:
            logger.info("XAPI statement %s already sent.", statement["id"])
            return Response(status=200)

        xapi = XAPI(
            lrs_url,
            lrs_auth_token,
            lrs_xapi_version,
        )

        try:
            xapi.send(statement)
        # pylint: disable=invalid-name
        except requests.exceptions.HTTPError as e:
            message = "Impossible to send xAPI request to LRS."
            logger.critical(
                message,
                extra={"response": e.response.text, "status": e.response.status_code},
            )
            return Response({"status": message}, status=500)

        cache.set(
            f"{XAPI_STATEMENT_ID_CACHE}{statement['id']}",
            statement["id"],
            settings.XAPI_STATEMENT_ID_CACHE_TIMEOUT,
        )

        return Response(status=204)
