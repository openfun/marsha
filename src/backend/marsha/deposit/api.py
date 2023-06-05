"""Declare API endpoints with Django RestFramework viewsets."""
from django.conf import settings
from django.db.models import Q
from django.utils import timezone

import django_filters
from rest_framework import filters, mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from marsha.core import defaults, permissions as core_permissions
from marsha.core.api import APIViewMixin, ObjectPkMixin, ObjectRelatedMixin
from marsha.core.utils.s3_utils import create_presigned_post
from marsha.core.utils.time_utils import to_timestamp

from . import permissions, serializers
from ..core.factories import UserFactory
from ..core.models import ADMINISTRATOR, LTI_ROLES, STUDENT
from .defaults import LTI_ROUTE
from .forms import FileDepositoryForm
from .metadata import DepositedFileMetadata
from .models import DepositedFile, FileDepository
from .permissions import (
    IsFileDepositoryPlaylistOrOrganizationAdmin,
    IsRelatedFileDepositoryPlaylistOrOrganizationAdmin,
)


class FileDepositoryFilter(django_filters.FilterSet):
    """Filter for file depository."""

    organization = django_filters.UUIDFilter(field_name="playlist__organization__id")

    class Meta:
        model = FileDepository
        fields = ["playlist"]


class DepositedFileFilter(django_filters.FilterSet):
    """Filter for DepositedFile."""

    class Meta:
        model = DepositedFile
        fields = {
            "read": ["exact"],
        }


class FileDepositoryViewSet(
    APIViewMixin,
    ObjectPkMixin,
    viewsets.ModelViewSet,
):
    """Viewset for the API of the FileDepository object."""

    queryset = FileDepository.objects.all().select_related("playlist")
    serializer_class = serializers.FileDepositorySerializer
    filter_backends = [
        filters.OrderingFilter,
        django_filters.rest_framework.DjangoFilterBackend,
    ]
    ordering_fields = ["created_on", "title"]
    ordering = ["-created_on"]
    filterset_class = FileDepositoryFilter

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
        elif self.action in ["retrieve"]:
            permission_classes = [
                core_permissions.IsTokenResourceRouteObject
                & (
                    core_permissions.IsTokenInstructor
                    | core_permissions.IsTokenAdmin
                    | core_permissions.IsTokenStudent
                )
                | IsFileDepositoryPlaylistOrOrganizationAdmin
            ]
        elif self.action in ["update", "partial_update", "destroy"]:
            permission_classes = [
                (
                    core_permissions.IsTokenResourceRouteObject
                    & (
                        core_permissions.IsTokenInstructor
                        | core_permissions.IsTokenAdmin
                    )
                )
                | IsFileDepositoryPlaylistOrOrganizationAdmin
            ]
        elif self.action in ["list"]:
            permission_classes = [core_permissions.UserIsAuthenticated]
        else:
            permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]

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
        """Create one file_depository based on the request payload."""
        try:
            # TODO: mikado 1: remove this when we have a proper authentication
            data = request.data.copy()
            data["created_by"] = UserFactory().id
            form = FileDepositoryForm(data)
            file_depository = form.save()
        except ValueError:
            return Response({"errors": [dict(form.errors)]}, status=400)

        serializer = self.get_serializer(file_depository)

        return Response(serializer.data, status=201)

    @action(
        methods=["get"],
        detail=False,
        url_path="lti-select",
        permission_classes=[core_permissions.HasPlaylistToken],
    )
    def lti_select(self, request):
        """Get selectable content for LTI.

        Calling the endpoint returns a base URL for building a new file_depository
        LTI URL and a list of available file_depositories.

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

        file_depositories = serializers.FileDepositorySelectLTISerializer(
            FileDepository.objects.filter(playlist__id=request.resource.playlist_id),
            many=True,
            context={"request": self.request},
        ).data

        return Response(
            {
                "new_url": new_url,
                "file_depositories": file_depositories,
            }
        )

    @action(
        methods=["get"],
        detail=True,
        url_path="depositedfiles",
        permission_classes=[
            core_permissions.IsTokenInstructor
            | core_permissions.IsTokenAdmin
            | core_permissions.IsTokenStudent
            | IsFileDepositoryPlaylistOrOrganizationAdmin
        ],
    )
    # pylint: disable=unused-argument
    def depositedfiles(self, request, pk=None):
        """Get deposited files from a file_depository.

        Calling the endpoint returns a list of deposited files.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk : int
            The primary key of the file_depository

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse carrying deposited files as a JSON object.

        """
        file_depository = self.get_object()
        queryset = file_depository.deposited_files.all()
        if request.resource and any(
            x in LTI_ROLES.get(STUDENT) for x in request.resource.roles
        ):
            queryset = queryset.filter(author_id=request.resource.user.get("id"))
        filter_set = DepositedFileFilter(request.query_params, queryset=queryset)
        page = self.paginate_queryset(filter_set.qs)
        serializer = serializers.DepositedFileSerializer(
            page,
            many=True,
            context={"request": self.request},
        )
        return self.get_paginated_response(serializer.data)


class DepositedFileViewSet(
    APIViewMixin,
    ObjectPkMixin,
    ObjectRelatedMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    Viewset for the API of the DepositedFile object.
    """

    queryset = DepositedFile.objects.all()
    serializer_class = serializers.DepositedFileSerializer
    metadata_class = DepositedFileMetadata

    permission_classes = [
        permissions.IsTokenResourceRouteObjectRelatedFileDepository
        | core_permissions.UserIsAuthenticated
    ]

    def get_permissions(self):
        """Instantiate and return the list of permissions that this view requires."""
        if self.action in ["create"]:
            permission_classes = [
                core_permissions.IsTokenInstructor
                | core_permissions.IsTokenAdmin
                | core_permissions.IsTokenStudent
                | core_permissions.UserIsAuthenticated
            ]
        elif self.action in ["create", "list", "metadata"]:
            permission_classes = [
                core_permissions.IsTokenInstructor
                | core_permissions.IsTokenAdmin
                | core_permissions.IsTokenStudent
                | IsRelatedFileDepositoryPlaylistOrOrganizationAdmin,
            ]
        elif self.action in ["update", "partial_update", "destroy"]:
            permission_classes = [
                core_permissions.IsTokenInstructor
                | core_permissions.IsTokenAdmin
                | IsRelatedFileDepositoryPlaylistOrOrganizationAdmin
            ]
        else:
            permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]

    @action(methods=["post"], detail=True, url_path="initiate-upload")
    # pylint: disable=unused-argument
    def initiate_upload(self, request, pk=None):
        """Get an upload policy for a deposited file.

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
        deposited_file = self.get_object()  # check permissions first

        serializer = serializers.DepositedFileInitiateUploadSerializer(
            data=request.data
        )

        if serializer.is_valid() is not True:
            return Response(serializer.errors, status=400)

        now = timezone.now()
        stamp = to_timestamp(now)

        key = deposited_file.get_source_s3_key(
            stamp=stamp, extension=serializer.validated_data["extension"]
        )

        presigned_post = create_presigned_post(
            [
                ["eq", "$Content-Type", serializer.validated_data["mimetype"]],
                ["content-length-range", 0, settings.DEPOSITED_FILE_SOURCE_MAX_SIZE],
            ],
            {},
            key,
        )

        # Reset the upload state of the deposited file
        DepositedFile.objects.filter(pk=pk).update(
            filename=serializer.validated_data["filename"],
            upload_state=defaults.PENDING,
        )

        return Response(presigned_post)
