"""Declare API endpoints with Django RestFramework viewsets."""
from django.conf import settings
from django.utils import timezone

import django_filters
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from marsha.bbb.utils.bbb_utils import ApiMeetingException, create, end, join
from marsha.core import defaults, permissions as core_permissions
from marsha.core.api import APIViewMixin, ObjectPkMixin, ObjectRelatedMixin
from marsha.core.utils.url_utils import build_absolute_uri_behind_proxy

from . import permissions, serializers
from ..core.models import ADMINISTRATOR
from ..core.permissions import ResourceIsAuthenticated
from ..core.utils.s3_utils import create_presigned_post
from ..core.utils.time_utils import to_timestamp
from .defaults import LTI_ROUTE
from .forms import ClassroomForm
from .models import Classroom, ClassroomDocument
from .permissions import (
    IsClassroomPlaylistOrOrganizationAdmin,
    IsRelatedClassroomPlaylistOrOrganizationAdmin,
)


class ClassroomFilter(django_filters.FilterSet):
    """Filter for Classroom."""

    organization = django_filters.UUIDFilter(field_name="playlist__organization__id")

    class Meta:
        model = Classroom
        fields = ["playlist"]


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
        (
            core_permissions.IsTokenResourceRouteObject
            & (core_permissions.IsTokenInstructor | core_permissions.IsTokenAdmin)
        )
        | IsClassroomPlaylistOrOrganizationAdmin
    ]

    def get_permissions(self):
        """
        Manage permissions for built-in DRF methods.

        Default to the actions' self defined permissions if applicable or
        to the ViewSet's default permissions.
        """
        if self.action in ["create"]:
            permission_classes = [
                (
                    core_permissions.HasPlaylistToken
                    & (
                        core_permissions.IsTokenInstructor
                        | core_permissions.IsTokenAdmin
                    )
                )
                | IsClassroomPlaylistOrOrganizationAdmin
            ]
        elif self.action in ["retrieve"]:
            permission_classes = [
                ResourceIsAuthenticated | IsClassroomPlaylistOrOrganizationAdmin
            ]
        elif self.action in ["list"]:
            permission_classes = [core_permissions.UserIsAuthenticated]
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

    def list(self, request, *args, **kwargs):
        """List classrooms belonging to user organizations."""
        queryset = self.get_queryset().filter(
            playlist__organization__users__id=request.user.id,
            playlist__organization__user_accesses__role=ADMINISTRATOR,
        )
        filter_set = ClassroomFilter(request.query_params, queryset=queryset)
        page = self.paginate_queryset(
            self.filter_queryset(
                filter_set.qs.order_by(
                    "-created_on",
                    "-playlist__created_on",
                    "-playlist__organization__created_on",
                )
            )
        )
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

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
        new_url = build_absolute_uri_behind_proxy(self.request, LTI_ROUTE)

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
        methods=["get"],
        detail=True,
        url_path="classroomdocuments",
        permission_classes=[
            core_permissions.IsTokenInstructor
            | core_permissions.IsTokenAdmin
            | IsClassroomPlaylistOrOrganizationAdmin
        ],
    )
    # pylint: disable=unused-argument
    def classroomdocuments(self, request, pk=None):
        """Get documents from a classroom.

        Calling the endpoint returns a list of classroom documents.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk : int
            The primary key of the classroom

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse carrying deposited files as a JSON object.

        """
        classroom = self.get_object()
        queryset = classroom.classroom_documents.all()
        page = self.paginate_queryset(self.filter_queryset(queryset))
        serializer = serializers.ClassroomDocumentSerializer(
            page,
            many=True,
            context={"request": self.request},
        )
        return self.get_paginated_response(serializer.data)

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
        permission_classes=[
            ResourceIsAuthenticated | IsClassroomPlaylistOrOrganizationAdmin
        ],
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
            if request.resource:
                roles = request.resource.roles
                moderator = "administrator" in roles or "instructor" in roles
                consumer_site_user_id = (
                    f"{request.resource.consumer_site}_"
                    f"{request.resource.user.get('id')}"
                )
            else:
                # Assume that the user is a moderator
                # as he is an admin of the organization or the playlist
                moderator = True

                # Use the user id as consumer_site_user_id
                consumer_site_user_id = request.user.id
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
            if request.resource:
                roles = request.resource.roles
                moderator = "administrator" in roles or "instructor" in roles
            else:
                # Assume that the user is a moderator
                # as he is an admin of the organization or the playlist
                moderator = True
            response = end(classroom=self.get_object(), moderator=moderator)
            status = 200
        except ApiMeetingException as exception:
            response = {"message": str(exception)}
            status = 400
        return Response(response, status=status)


class ClassroomDocumentViewSet(
    APIViewMixin,
    ObjectPkMixin,
    ObjectRelatedMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """
    Viewset for the API of the ClassroomDocument object.
    """

    queryset = ClassroomDocument.objects.all()
    serializer_class = serializers.ClassroomDocumentSerializer

    permission_classes = [
        permissions.IsTokenResourceRouteObjectRelatedClassroom
        | IsRelatedClassroomPlaylistOrOrganizationAdmin
    ]

    def get_permissions(self):
        """Instantiate and return the list of permissions that this view requires."""
        if self.action in ["create", "list", "update", "partial_update"]:
            permission_classes = [
                core_permissions.IsTokenInstructor
                | core_permissions.IsTokenAdmin
                | IsRelatedClassroomPlaylistOrOrganizationAdmin
            ]
        else:
            permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        """Create a ClassroomDocument.

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
        data = request.data.copy()
        if data.get("classroom"):
            data["classroom_id"] = data.get("classroom")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=201)

    @action(methods=["post"], detail=True, url_path="initiate-upload")
    # pylint: disable=unused-argument
    def initiate_upload(self, request, pk=None):
        """Get an upload policy for a classroom document.

        Calling the endpoint resets the upload state to `pending` and returns an upload policy to
        our AWS S3 source bucket.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk: string
            The primary key of the shared live media

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse carrying the AWS S3 upload policy as a JSON object.

        """
        serializer = serializers.ClassroomDocumentInitiateUploadSerializer(
            data=request.data
        )

        if serializer.is_valid() is not True:
            return Response(serializer.errors, status=400)

        now = timezone.now()
        stamp = to_timestamp(now)

        classroom = self.get_object()
        key = classroom.get_source_s3_key(
            stamp=stamp, extension=serializer.validated_data["extension"]
        )

        presigned_post = create_presigned_post(
            [
                ["eq", "$Content-Type", serializer.validated_data["mimetype"]],
                [
                    "content-length-range",
                    0,
                    settings.CLASSROOM_DOCUMENT_SOURCE_MAX_SIZE,
                ],
            ],
            {},
            key,
        )

        # Reset the upload state of the classroom document
        ClassroomDocument.objects.filter(pk=pk).update(
            filename=serializer.validated_data["filename"],
            upload_state=defaults.PENDING,
        )

        return Response(presigned_post)
