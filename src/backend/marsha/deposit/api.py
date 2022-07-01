"""Declare API endpoints with Django RestFramework viewsets."""
from django.conf import settings
from django.utils import timezone

from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from marsha.core import defaults, permissions as core_permissions
from marsha.core.api import APIViewMixin, ObjectPkMixin
from marsha.core.utils.s3_utils import create_presigned_post
from marsha.core.utils.time_utils import to_timestamp
from marsha.core.utils.url_utils import build_absolute_uri_behind_proxy

from . import permissions, serializers
from .forms import FileDepositoryForm
from .models import DepositedFile, FileDepository


class FileDepositoryViewSet(
    APIViewMixin,
    ObjectPkMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """Viewset for the API of the FileDepository object."""

    queryset = FileDepository.objects.all()
    serializer_class = serializers.FileDepositorySerializer

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
        """Create one file_depository based on the request payload."""
        try:
            form = FileDepositoryForm(request.data)
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
        new_url = build_absolute_uri_behind_proxy(
            self.request, "/lti/filedepositories/"
        )

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


class DepositedFileViewSet(
    APIViewMixin,
    ObjectPkMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """
    Viewset for the API of the DepositedFile object.
    """

    queryset = DepositedFile.objects.all()
    serializer_class = serializers.DepositedFileSerializer

    permission_classes = [permissions.IsTokenResourceRouteObjectRelatedFileDepository]

    def get_permissions(self):
        """Instantiate and return the list of permissions that this view requires."""
        if self.action in ["create", "list"]:
            permission_classes = [
                core_permissions.IsTokenInstructor
                | core_permissions.IsTokenAdmin
                | core_permissions.IsTokenStudent
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
        serializer = serializers.DepositedFileInitiateUploadSerializer(
            data=request.data
        )

        if serializer.is_valid() is not True:
            return Response(serializer.errors, status=400)

        now = timezone.now()
        stamp = to_timestamp(now)

        deposited_file = self.get_object()
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
