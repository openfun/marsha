"""Declare API endpoints with Django RestFramework viewsets."""

from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from marsha.core import permissions as core_permissions
from marsha.core.api import APIViewMixin, ObjectPkMixin

from . import serializers
from .defaults import LTI_ROUTE
from .forms import {{cookiecutter.model}}Form
from .models import {{cookiecutter.model}}


class {{cookiecutter.model}}ViewSet(
    APIViewMixin,
    ObjectPkMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """Viewset for the API of the {{cookiecutter.model}} object."""

    queryset = {{cookiecutter.model}}.objects.all()
    serializer_class = serializers.{{cookiecutter.model}}Serializer
    permission_classes = [
        core_permissions.IsTokenPlaylistRouteObject
        & (core_permissions.IsTokenInstructor | core_permissions.IsTokenAdmin)
    ]

    def get_permissions(self):
        """
        Manage permissions for built-in DRF methods.

        Default to the actions' self defined permissions if applicable or
        to the ViewSet's default permissions.
        """
        if self.action in ["create"]:
            permission_classes = [
                core_permissions.HasPlaylistToken
                & (core_permissions.IsTokenInstructor | core_permissions.IsTokenAdmin)
            ]
        elif self.action in ["retrieve"]:
            permission_classes = [core_permissions.IsTokenPlaylistRouteObject]
        else:
            permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        """Create one {{cookiecutter.model_lower}} based on the request payload."""
        try:
            form = {{cookiecutter.model}}Form(request.data)
            {{cookiecutter.model_lower}} = form.save()
        except ValueError:
            return Response({"errors": [dict(form.errors)]}, status=400)

        serializer = self.get_serializer({{cookiecutter.model_lower}})

        return Response(serializer.data, status=201)

    @action(
        methods=["get"],
        detail=False,
        url_path="lti-select",
        permission_classes=[core_permissions.HasPlaylistToken],
    )
    def lti_select(self, request):
        """Get selectable content for LTI.

        Calling the endpoint returns a base URL for building a new {{cookiecutter.model_lower}}
        LTI URL and a list of available {{cookiecutter.model_plural_lower}}.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse carrying selectable content as a JSON object.

        """
        new_url = self.request.build_absolute_uri(LTI_ROUTE)

        {{cookiecutter.model_plural_lower}} = serializers.{{cookiecutter.model}}SelectLTISerializer(
            {{cookiecutter.model}}.objects.filter(
                playlist__id=request.resource.playlist_id,
            ),
            many=True,
            context={"request": self.request},
        ).data

        return Response(
            {
                "new_url": new_url,
                "{{cookiecutter.model_plural_lower}}": {{cookiecutter.model_plural_lower}},
            }
        )
