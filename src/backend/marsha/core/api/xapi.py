"""Declare API endpoints for xapi with Django RestFramework viewsets."""
import json
import logging

from django.apps import apps
from django.http import HttpResponseNotFound

import requests
from rest_framework.response import Response
from rest_framework.views import APIView

from . import APIViewMixin
from .. import permissions, serializers
from ..xapi import XAPI, get_xapi_statement


logger = logging.getLogger(__name__)


class XAPIStatementView(APIViewMixin, APIView):
    """Viewset managing xAPI requests."""

    permission_classes = [permissions.ResourceIsAuthenticated]
    http_method_names = ["post"]

    def post(self, request, resource_kind):
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
            statement_object = get_xapi_statement(resource_kind)
        except NotImplementedError:
            return HttpResponseNotFound()

        model = apps.get_model(app_label="core", model_name=resource_kind)
        try:
            # Note: permissions.ResourceIsAuthenticated asserts request.resource is not None
            object_instance = model.objects.get(pk=request.resource.id)
        except model.DoesNotExist:
            return Response(
                {
                    "reason": f"{resource_kind} with id {request.resource.id} does not exist"
                },
                status=404,
            )

        consumer_site = object_instance.playlist.consumer_site

        # xapi statements are sent to a consumer-site-specific logger. We assume that the logger
        # name respects the following convention: "xapi.[consumer site domain]",
        # _e.g._ `xapi.foo.education` for the `foo.education` consumer site domain. Note that this
        # logger should be defined in your settings with an appropriate handler and formatter.
        xapi_logger = logging.getLogger(f"xapi.{consumer_site.domain}")

        # xapi statement sent by the client but incomplete
        partial_xapi_statement = serializers.XAPIStatementSerializer(data=request.data)
        if not partial_xapi_statement.is_valid():
            return Response(partial_xapi_statement.errors, status=400)

        # xapi statement enriched with video and jwt_token information
        xapi_statement = statement_object(
            object_instance,
            partial_xapi_statement.validated_data,
            request.resource.token,
        )

        # Log the statement in the xapi logger
        xapi_logger.info(json.dumps(xapi_statement.get_statement()))

        if not consumer_site.lrs_url or not consumer_site.lrs_auth_token:
            logger.info("LRS is not configured.")
            return Response(status=200)

        xapi = XAPI(
            consumer_site.lrs_url,
            consumer_site.lrs_auth_token,
            consumer_site.lrs_xapi_version,
        )

        try:
            xapi.send(xapi_statement)
        # pylint: disable=invalid-name
        except requests.exceptions.HTTPError as e:
            message = "Impossible to send xAPI request to LRS."
            logger.critical(
                message,
                extra={"response": e.response.text, "status": e.response.status_code},
            )
            return Response({"status": message}, status=500)

        return Response(status=204)
