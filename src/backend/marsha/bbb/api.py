"""Declare API endpoints with Django RestFramework viewsets."""

from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from marsha.bbb.utils.bbb_utils import ApiMeetingException, create, end, join
from marsha.core import permissions as core_permissions
from marsha.core.api import APIViewMixin, ObjectPkMixin
from marsha.core.utils.url_utils import build_absolute_uri_behind_proxy

from . import serializers
from .forms import ClassroomForm
from .models import Classroom


class ClassroomViewSet(
    APIViewMixin,
    ObjectPkMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """Viewset for the API of the Classroom object."""

    queryset = Classroom.objects.all()
    serializer_class = serializers.ClassroomSerializer

    permission_classes = [
        core_permissions.IsTokenResourceRouteObject
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
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        """Create one classroom based on the request payload."""
        try:
            form = ClassroomForm(request.data)
            classroom = form.save()
        except ValueError:
            return Response({"errors": [dict(form.errors)]}, status=400)

        serializer = self.get_serializer(classroom)

        return Response(serializer.data, status=201)

    @action(
        methods=["get"],
        detail=False,
        url_path="lti-select",
        permission_classes=[core_permissions.HasPlaylistToken],
    )
    def lti_select(self, request):
        """Get selectable content for LTI.

        Calling the endpoint returns a base URL for building a new classroom
        LTI URL and a list of available classrooms.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse carrying selectable content as a JSON object.

        """
        new_url = build_absolute_uri_behind_proxy(self.request, "/lti/classrooms/")

        classrooms = serializers.ClassroomSelectLTISerializer(
            Classroom.objects.filter(playlist__id=request.resource.playlist_id),
            many=True,
            context={"request": self.request},
        ).data

        return Response(
            {
                "new_url": new_url,
                "classrooms": classrooms,
            }
        )

    @action(
        methods=["patch"],
        detail=True,
        url_path="create",
    )
    def service_create(self, request, *args, **kwargs):
        """Create a Big Blue Button meeting.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk: string
            The primary key of the classroom

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse with the serialized classroom.
        """
        # Updating classroom with sent title and welcome text
        self.update(request, *args, **kwargs)

        try:
            response = create(classroom=self.get_object())
            status = 200
        except ApiMeetingException as exception:
            response = {"message": str(exception)}
            status = 400
        return Response(response, status=status)

    @action(
        methods=["patch"],
        detail=True,
        url_path="join",
        permission_classes=[IsAuthenticated],
    )
    def service_join(self, request, *args, **kwargs):
        """Join a Big Blue Button classroom.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk: string
            The primary key of the classroom

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse with the serialized classroom.
        """
        if not request.data.get("fullname"):
            return Response({"message": "missing fullname parameter"}, status=400)
        try:
            roles = request.resource.roles
            moderator = "administrator" in roles or "instructor" in roles
            consumer_site_user_id = (
                f"{request.resource.consumer_site}_"
                f"{(request.resource.user or {}).get('id')}"
            )
            response = join(
                classroom=self.get_object(),
                consumer_site_user_id=consumer_site_user_id,
                fullname=request.data.get("fullname"),
                moderator=moderator,
            )
            status = 200
        except ApiMeetingException as exception:
            response = {"message": str(exception)}
            status = 400
        return Response(response, status=status)

    @action(
        methods=["patch"],
        detail=True,
        url_path="end",
    )
    def service_end(self, request, *args, **kwargs):
        """End a Big Blue Button classroom.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk: string
            The primary key of the classroom

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse with the serialized classroom.
        """
        try:
            roles = request.resource.roles
            moderator = "administrator" in roles or "instructor" in roles
            response = end(classroom=self.get_object(), moderator=moderator)
            status = 200
        except ApiMeetingException as exception:
            response = {"message": str(exception)}
            status = 400
        return Response(response, status=status)
