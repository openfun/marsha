"""Declare API endpoints with Django RestFramework viewsets."""
from django.conf import settings
from django.db.models import Q
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django.utils import timezone

import django_filters
import jwt
from rest_framework import filters, mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from marsha.bbb.utils.bbb_utils import (
    ApiMeetingException,
    create,
    delete_recording,
    end,
    get_recordings,
    join,
    process_recordings,
)
from marsha.core import defaults, permissions as core_permissions
from marsha.core.api import APIViewMixin, BulkDestroyModelMixin, ObjectPkMixin

from . import permissions, serializers
from ..core.defaults import VOD_CONVERT
from ..core.models import ADMINISTRATOR, INSTRUCTOR, Video
from ..core.utils.convert_lambda_utils import invoke_lambda_convert
from ..core.utils.s3_utils import create_presigned_post
from ..core.utils.time_utils import to_timestamp
from .defaults import LTI_ROUTE
from .forms import ClassroomForm
from .metadata import ClassroomDocumentMetadata
from .models import Classroom, ClassroomDocument, ClassroomRecording
from .utils.tokens import create_classroom_stable_invite_jwt


class ObjectClassroomRelatedMixin:
    """
    Get the related classroom id contained in resource.

    It exposes a function used to get the related classroom.
    It is also useful to avoid URL crafting (when the url classroom_id doesn't
    match token resource classroom id).
    """

    def get_related_classroom_id(self):
        """Get the related classroom ID from the request."""

        # The video ID in the URL is mandatory.
        return self.kwargs.get("classroom_id")


class InviteTokenThrottle(AnonRateThrottle):
    """Throttling class dedicated to classroom invite token endpoint"""

    scope = "classroom_invite_token"

    def get_ident(self, request):
        """The identity is based on the classroom_id and from the AnonRateThrottle ident method"""
        classroom_id = request.parser_context["kwargs"]["pk"]

        return f"{classroom_id}_{super().get_ident(request)}"


class ClassroomFilter(django_filters.FilterSet):
    """Filter for Classroom."""

    organization = django_filters.UUIDFilter(field_name="playlist__organization__id")

    class Meta:
        model = Classroom
        fields = ["playlist"]


class ClassroomViewSet(
    APIViewMixin, ObjectPkMixin, viewsets.ModelViewSet, BulkDestroyModelMixin
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
            core_permissions.IsPlaylistTokenMatchingRouteObject
            & (core_permissions.IsTokenInstructor | core_permissions.IsTokenAdmin)
        )
        | (
            core_permissions.UserIsAuthenticated  # asserts request.resource is None
            & (
                core_permissions.IsObjectPlaylistAdminOrInstructor
                | core_permissions.IsObjectPlaylistOrganizationAdmin
            )
        )
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
                    core_permissions.IsPlaylistToken
                    & (
                        core_permissions.IsTokenInstructor
                        | core_permissions.IsTokenAdmin
                    )
                )
                | (
                    core_permissions.UserIsAuthenticated  # asserts request.resource is None
                    & (
                        core_permissions.IsParamsPlaylistAdminOrInstructor
                        | core_permissions.IsParamsPlaylistAdminThroughOrganization
                    )
                )
            ]
        elif self.action in ["destroy", "bulk_destroy"]:
            # Not available in LTI
            # For standalone site, only playlist admin or organization admin can access
            permission_classes = [
                core_permissions.UserIsAuthenticated
                & (
                    core_permissions.IsObjectPlaylistAdminOrInstructor
                    | core_permissions.IsObjectPlaylistOrganizationAdmin
                )
            ]
        elif self.action in ["retrieve", "service_join"]:
            permission_classes = [
                core_permissions.IsPlaylistTokenMatchingRouteObject
                | core_permissions.IsTokenResourceRouteObject  # needed for invite links
                | (
                    core_permissions.UserIsAuthenticated  # asserts request.resource is None
                    & (
                        core_permissions.IsObjectPlaylistAdminOrInstructor
                        | core_permissions.IsObjectPlaylistOrganizationAdmin
                    )
                )
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
        if self.action in ["retrieve", "update", "partial_update", "create"]:
            serializer_context["is_admin"] = (
                # For standalone site
                (
                    core_permissions.UserIsAuthenticated
                    & (
                        core_permissions.IsObjectPlaylistAdminOrInstructor
                        | core_permissions.IsObjectPlaylistOrganizationAdmin
                    )
                )
                # For LTI
                | (
                    core_permissions.ResourceIsAuthenticated
                    & core_permissions.IsPlaylistTokenMatchingRouteObject
                    & (
                        core_permissions.IsTokenInstructor
                        | core_permissions.IsTokenAdmin
                    )
                )
            )().has_permission(self.request, self)
        return serializer_context

    def _get_filtered_queryset(self):
        """Build the filtered queryset used on the list and bulk_destroy action."""
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
                    playlist__user_accesses__role__in=[ADMINISTRATOR, INSTRUCTOR],
                )
            )
            .distinct()
        )

        return queryset

    def get_queryset(self):
        """Redefine the queryset to use based on the current action."""
        if self.action in ["list", "bulk_destroy"]:
            return self._get_filtered_queryset()

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
        permission_classes=[core_permissions.IsPlaylistToken],
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
            Classroom.objects.filter(playlist__id=request.resource.id),
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

    @action(
        methods=["get"],
        detail=True,
        url_path="token",
        permission_classes=[AllowAny],
        throttle_classes=[InviteTokenThrottle],
    )
    def validate_invite_token(self, request, *args, **kwargs):
        """Check if the token set in query string is valid or not and returns a resource
        token allowing to use it with the current classroom."""
        invite_token = request.query_params.get("invite_token")
        if invite_token is None:
            return Response(
                status=400,
                data={"message": "missing required invite_token in query string"},
            )

        classroom = self.get_object()

        if classroom.public_token == invite_token:
            return Response(
                data={
                    "access_token": str(create_classroom_stable_invite_jwt(classroom))
                }
            )

        if classroom.instructor_token == invite_token:
            return Response(
                data={
                    "access_token": str(
                        create_classroom_stable_invite_jwt(
                            classroom,
                            role=INSTRUCTOR,
                            permissions={
                                "can_update": True,
                                "can_access_dashboard": True,
                            },
                        )
                    )
                }
            )

        raise Http404


class ClassroomDocumentViewSet(
    APIViewMixin,
    ObjectPkMixin,
    ObjectClassroomRelatedMixin,
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    Viewset for the API of the ClassroomDocument object.
    """

    queryset = ClassroomDocument.objects.all().select_related("classroom")
    serializer_class = serializers.ClassroomDocumentSerializer
    metadata_class = ClassroomDocumentMetadata
    filter_backends = [
        filters.OrderingFilter,
    ]
    ordering_fields = ["created_on"]
    ordering = ["-created_on"]

    permission_classes = [
        permissions.IsTokenResourceRouteObjectRelatedClassroom
        | (
            core_permissions.UserIsAuthenticated  # asserts request.resource is None
            & (
                permissions.IsRelatedClassroomPlaylistAdminOrInstructor
                | permissions.IsRelatedClassroomOrganizationAdmin
            )
        )
    ]

    def get_permissions(self):
        """Instantiate and return the list of permissions that this view requires."""
        if self.action in ["create", "list"]:
            permission_classes = [
                core_permissions.IsTokenInstructor
                | core_permissions.IsTokenAdmin
                | permissions.IsParamsClassroomAdminOrInstructorThroughPlaylist
                | permissions.IsParamsClassroomAdminThroughOrganization
            ]
        elif self.action in ["update", "partial_update", "destroy"]:
            permission_classes = [
                core_permissions.IsTokenInstructor
                | core_permissions.IsTokenAdmin
                | (
                    core_permissions.UserIsAuthenticated  # asserts request.resource is None
                    & (
                        permissions.IsRelatedClassroomPlaylistAdminOrInstructor
                        | permissions.IsRelatedClassroomOrganizationAdmin
                    )
                )
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
    def initiate_upload(self, request, pk=None, classroom_id=None):
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
        classroom = self.get_object()  # check permissions first

        serializer = serializers.ClassroomDocumentInitiateUploadSerializer(
            data=request.data
        )
        if serializer.is_valid() is not True:
            return Response(serializer.errors, status=400)

        now = timezone.now()
        stamp = to_timestamp(now)

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

    def perform_destroy(self, instance):
        """Change the default document if the instance is the default one"""

        super().perform_destroy(instance)
        if (
            instance.is_default and instance.classroom.classroom_documents.count() > 0
        ):  # If deleted document was the default, the oldest in the new default
            document = (
                instance.classroom.classroom_documents.exclude(id=instance.id)
                .order_by("created_on")
                .first()
            )
            document.is_default = True
            document.save()


class ClassroomRecordingViewSet(
    APIViewMixin,
    ObjectPkMixin,
    ObjectClassroomRelatedMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    Viewset for the API of the ClassroomRecording object.
    """

    queryset = ClassroomRecording.objects.all().select_related("classroom")
    serializer_class = serializers.ClassroomRecordingSerializer
    filter_backends = [
        filters.OrderingFilter,
    ]
    ordering_fields = ["created_on"]
    ordering = ["-created_on"]

    permission_classes = [core_permissions.NotAllowed]

    def get_permissions(self):
        """Instantiate and return the list of permissions that this view requires."""
        if self.action in ["create_vod", "destroy"]:
            permission_classes = [
                core_permissions.IsTokenInstructor
                | core_permissions.IsTokenAdmin
                | (
                    core_permissions.UserIsAuthenticated  # asserts request.resource is None
                    & (
                        permissions.IsRelatedClassroomPlaylistAdminOrInstructor
                        | permissions.IsRelatedClassroomOrganizationAdmin
                    )
                )
            ]
        else:
            permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = super().get_queryset()

        queryset = queryset.filter(classroom=self.kwargs.get("classroom_id"))

        if self.action == "create_vod":
            queryset = queryset.select_related(
                "classroom__playlist__consumer_site",
                "classroom__playlist__organization",
            )

        return queryset

    @action(methods=["post"], detail=True, url_path="create-vod")
    # pylint: disable=unused-argument
    def create_vod(self, request, pk=None, classroom_id=None):
        """Turn a classroom recording into a VOD.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk: string
            The primary key of the recording
        classroom_id: string
            The primary key of the classroom

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse with the serialized classroom recording vod.

        """
        classroom_recording = self.get_object()  # check permissions first

        try:
            consumer_site_inactive_features = (
                classroom_recording.classroom.playlist.consumer_site.inactive_features
            )
        except AttributeError:
            consumer_site_inactive_features = []

        try:
            organization_inactive_features = (
                classroom_recording.classroom.playlist.organization.inactive_features
            )
        except AttributeError:
            organization_inactive_features = []

        inactive_features = (
            consumer_site_inactive_features + organization_inactive_features
        )

        if VOD_CONVERT in inactive_features:
            return Response({"error": "VOD conversion is disabled."}, status=405)

        classroom_recording.vod = Video.objects.create(
            title=request.data.get("title"),
            playlist=classroom_recording.classroom.playlist,
        )
        classroom_recording.save()

        serializer = serializers.ClassroomRecordingSerializer(
            classroom_recording, context={"request": request, "is_admin": True}
        )

        now = timezone.now()
        stamp = to_timestamp(now)

        invoke_lambda_convert(
            classroom_recording.video_file_url,
            classroom_recording.vod.get_source_s3_key(stamp=stamp),
        )

        return Response(serializer.data, status=201)

    def destroy(self, request, *args, **kwargs):
        """
        Delete the ClassroomRecording object.
        To avoid untracked recordings on BBB,
        the recording should be deleted on BBB first.
        If it succeeds, we proceed to delete.
        """
        classroom_recording = self.get_object()
        try:
            delete_recording([classroom_recording])
        except ApiMeetingException:
            return Response("BBB API failed to delete the recording", status=500)
        return super().destroy(request, *args, **kwargs)
