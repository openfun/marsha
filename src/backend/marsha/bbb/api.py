"""Declare API endpoints with Django RestFramework viewsets."""
from django.conf import settings
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django.utils import timezone

import django_filters
import jwt
from rest_framework import filters, mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from marsha.bbb.utils.bbb_utils import (
    ApiMeetingException,
    create,
    end,
    get_recordings,
    join,
    process_recordings,
)
from marsha.core import defaults, permissions as core_permissions
from marsha.core.api import APIViewMixin, ObjectPkMixin, ObjectRelatedMixin

from . import permissions, serializers
from ..core.models import ADMINISTRATOR
from ..core.utils.s3_utils import create_presigned_post
from ..core.utils.time_utils import to_timestamp
from .defaults import LTI_ROUTE
from .forms import ClassroomForm
from .metadata import ClassroomDocumentMetadata
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

    queryset = Classroom.objects.all().select_related("playlist")
    serializer_class = serializers.ClassroomSerializer
    filter_backends = [
        filters.OrderingFilter,
        django_filters.rest_framework.DjangoFilterBackend,
    ]
    ordering_fields = ["created_on", "title"]
    ordering = ["-created_on"]
    filterset_class = ClassroomFilter

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
                | (
                    core_permissions.UserIsAuthenticated  # asserts request.resource is None
                    & (
                        core_permissions.IsParamsPlaylistAdmin
                        | core_permissions.IsParamsPlaylistAdminThroughOrganization
                    )
                )
            ]
        elif self.action in ["retrieve", "service_join"]:
            permission_classes = [
                core_permissions.IsTokenResourceRouteObject
                | IsClassroomPlaylistOrOrganizationAdmin
            ]
        elif self.action in ["list"]:
            permission_classes = [core_permissions.UserIsAuthenticated]
        else:
            permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        """
        Manage the serializer class to use based on the action
        """
        if self.action in ["list"]:
            return serializers.ClassroomLiteSerializer

        return super().get_serializer_class()

    def get_serializer_context(self):
        """
        Extra context provided to the serializer class.

        We add an `is_admin` flag to the context to let the serializer
        know if the user has right to share the classroom, this will
        generate a `classroom_stable_invite_jwt`.
        """
        serializer_context = super().get_serializer_context()
        if self.action in ["retrieve", "update", "partial_update"]:
            serializer_context["is_admin"] = (
                # For standalone site
                (
                    core_permissions.UserIsAuthenticated
                    & IsClassroomPlaylistOrOrganizationAdmin
                )
                # For LTI
                | (
                    core_permissions.ResourceIsAuthenticated
                    & core_permissions.IsTokenResourceRouteObject
                    & (
                        core_permissions.IsTokenInstructor
                        | core_permissions.IsTokenAdmin
                    )
                )
            )().has_permission(self.request, self)
        return serializer_context

    def _get_list_queryset(self):
        """Build the queryset used on the list action."""
        queryset = (
            super()
            .get_queryset()
            .filter(
                Q(
                    playlist__organization__user_accesses__user_id=self.request.user.id,
                    playlist__organization__user_accesses__role=ADMINISTRATOR,
                )
                | Q(
                    playlist__user_accesses__user_id=self.request.user.id,
                    playlist__user_accesses__role=ADMINISTRATOR,
                )
            )
            .distinct()
        )

        return queryset

    def get_queryset(self):
        """Redefine the queryset to use based on the current action."""
        if self.action in ["list"]:
            return self._get_list_queryset()

        return super().get_queryset()

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
        new_url = self.request.build_absolute_uri(LTI_ROUTE)

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
        page = self.paginate_queryset(queryset)
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
            response = create(
                classroom=self.get_object(),
                recording_ready_callback_url=request.build_absolute_uri(
                    reverse("classroom:classrooms-recording-ready")
                ),
            )
            status = 200
        except ApiMeetingException as exception:
            response = {"message": str(exception)}
            status = 400
        return Response(response, status=status)

    @action(
        methods=["patch"],
        detail=True,
        url_path="join",
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
            response = end(classroom=self.get_object())
            status = 200
        except ApiMeetingException as exception:
            response = {"message": str(exception)}
            status = 400
        return Response(response, status=status)

    @action(
        methods=["post"],
        detail=False,
        url_path="recording-ready",
        permission_classes=[AllowAny],
    )
    def recording_ready(self, request, *args, **kwargs):
        """Method called by BBB when a recording is ready.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint, it should contain a payload with the following field:
            - signed_parameters: a jwt containing the signed parameters sent by BBB:
                - meeting_id: the id of the meeting
                - record_id: the id of the recording

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse acknowledging the success or failure of the operation.
        """
        signed_parameters = request.data.get("signed_parameters")
        if not signed_parameters:
            return Response(status=400)
        try:
            decoded_parameters = jwt.decode(
                jwt=signed_parameters,
                key=settings.BBB_API_CALLBACK_SECRET,
                algorithms=["HS256"],
            )
        except jwt.exceptions.InvalidSignatureError:
            return Response(status=401)

        meeting_id = decoded_parameters.get("meeting_id")
        record_id = decoded_parameters.get("record_id")
        if not meeting_id or not record_id:
            return Response(status=400)

        classroom = get_object_or_404(Classroom, meeting_id=meeting_id)

        try:
            api_response = get_recordings(
                meeting_id=classroom.meeting_id, record_id=record_id
            )
            process_recordings(classroom, api_response, record_id)
        except ApiMeetingException:
            return Response(status=400)
        return Response({"message": "success"}, status=200)


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
    metadata_class = ClassroomDocumentMetadata

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
        elif self.action in ["metadata"]:
            permission_classes = [core_permissions.UserOrResourceIsAuthenticated]
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
