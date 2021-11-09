"""Declare API endpoints with Django RestFramework viewsets."""

import uuid

from django.urls import reverse

from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from marsha.bbb.utils.bbb_utils import ApiMeetingException, create, end, join
from marsha.core import permissions as core_permissions
from marsha.core.api import ObjectPkMixin
from marsha.core.utils.url_utils import build_absolute_uri_behind_proxy

from . import permissions, serializers
from .models import Meeting


class MeetingViewSet(
    ObjectPkMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """Viewset for the API of the Meeting object."""

    queryset = Meeting.objects.all()
    serializer_class = serializers.MeetingSerializer

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
        if self.action in ["retrieve"]:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]

    @action(
        methods=["get"],
        detail=False,
        url_path="lti-select",
        permission_classes=[permissions.HasPlaylistToken],
    )
    def lti_select(self, request):
        """Get selectable content for LTI.

        Calling the endpoint returns a new uuid for a metting
        and a list of available meetings.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse carrying selectable content as a JSON object.

        """
        new_uuid = str(uuid.uuid4())
        new_url = build_absolute_uri_behind_proxy(
            self.request,
            reverse("bbb:meeting_lti_view", args=[new_uuid]),
        )

        meetings = serializers.MeetingSelectLTISerializer(
            Meeting.objects.filter(
                playlist__id=request.user.token.payload.get("playlist_id")
            ),
            many=True,
            context={"request": self.request},
        ).data

        return Response(
            {
                "new_url": new_url,
                "meetings": meetings,
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
            The primary key of the meeting

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse with the serialized meeting.
        """
        # Updating meeting with sent title and welcome text
        self.update(request, *args, **kwargs)

        try:
            response = create(meeting=self.get_object())
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
        """Join a Big Blue Button meeting.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk: string
            The primary key of the meeting

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse with the serialized meeting.
        """
        if not request.data.get("fullname"):
            return Response({"message": "missing fullname parameter"}, status=400)
        try:
            roles = request.user.token.payload.get("roles")
            moderator = "administrator" in roles or "instructor" in roles
            response = join(
                meeting=self.get_object(),
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
        """End a Big Blue Button meeting.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk: string
            The primary key of the meeting

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse with the serialized meeting.
        """
        try:
            roles = request.user.token.payload.get("roles")
            moderator = "administrator" in roles or "instructor" in roles
            response = end(meeting=self.get_object(), moderator=moderator)
            status = 200
        except ApiMeetingException as exception:
            response = {"message": str(exception)}
            status = 400
        return Response(response, status=status)
