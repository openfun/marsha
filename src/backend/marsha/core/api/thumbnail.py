"""Declare API endpoints for thumbnails with Django RestFramework viewsets."""

from django.conf import settings

import django_filters
from rest_framework import filters, mixins, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.response import Response

from marsha.core import defaults, permissions, serializers, storage
from marsha.core.api.base import (
    APIViewMixin,
    ObjectPkMixin,
    ObjectRelatedMixin,
    ObjectVideoRelatedMixin,
)
from marsha.core.metadata import ThumbnailMetadata
from marsha.core.models import Thumbnail
from marsha.core.tasks.thumbnail import resize_thumbnails


class ThumbnailFilter(django_filters.FilterSet):
    """Filter for Thumbnail."""

    video = django_filters.UUIDFilter(field_name="video_id")

    class Meta:
        model = Thumbnail
        fields = []


class ThumbnailViewSet(
    APIViewMixin,
    ObjectPkMixin,
    ObjectRelatedMixin,
    ObjectVideoRelatedMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Viewset for the API of the Thumbnail object."""

    permission_classes = [permissions.NotAllowed]
    queryset = Thumbnail.objects.all()
    serializer_class = serializers.ThumbnailSerializer
    metadata_class = ThumbnailMetadata
    filter_backends = [
        filters.OrderingFilter,
        django_filters.rest_framework.DjangoFilterBackend,
    ]
    ordering_fields = ["created_on", "video__title"]
    ordering = ["created_on"]
    filterset_class = ThumbnailFilter

    def get_permissions(self):
        """Instantiate and return the list of permissions that this view requires."""
        if self.action == "metadata":
            permission_classes = [permissions.UserOrPlaylistIsAuthenticated]
        elif self.action in ["create", "list"]:
            permission_classes = [
                permissions.IsTokenInstructor
                | permissions.IsTokenAdmin
                | permissions.IsParamsVideoAdminOrInstructorThroughPlaylist
                | permissions.IsParamsVideoAdminThroughOrganization
            ]
        elif self.action in ["retrieve", "destroy", "initiate_upload", "upload_ended"]:
            permission_classes = [
                permissions.IsPlaylistTokenMatchingRouteObject
                & (permissions.IsTokenInstructor | permissions.IsTokenAdmin)
                | permissions.IsRelatedVideoPlaylistAdminOrInstructor
                | permissions.IsRelatedVideoOrganizationAdmin
            ]
        elif self.action is None:
            if self.request.method not in self.allowed_methods:
                raise MethodNotAllowed(self.request.method)
            permission_classes = self.permission_classes
        else:
            # When here it means we forgot to define a permission for a new action
            # We enforce the permission definition in this method to have a clearer view
            raise NotImplementedError(f"Action '{self.action}' is not implemented.")
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """Redefine the queryset to use based on the current action."""
        queryset = super().get_queryset()
        return queryset.filter(video__id=self.get_related_video_id())

    @action(methods=["post"], detail=True, url_path="initiate-upload")
    # pylint: disable=unused-argument
    def initiate_upload(self, request, pk=None, video_id=None):
        """Get an upload policy for a thumbnail.

        Calling the endpoint resets the upload state to `pending` and returns an upload policy to
        our AWS S3 source bucket.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk: string
            The primary key of the thumbnail

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse carrying the AWS S3 upload policy as a JSON object.

        """
        thumbnail = self.get_object()  # check permissions first
        serializer = serializers.ThumbnailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        presigned_post = (
            storage.get_initiate_backend().initiate_object_videos_storage_upload(
                request,
                thumbnail,
                [
                    ["starts-with", "$Content-Type", "image/"],
                    ["content-length-range", 0, settings.THUMBNAIL_SOURCE_MAX_SIZE],
                ],
            )
        )

        # Reset the upload state of the thumbnail
        Thumbnail.objects.filter(pk=pk).update(upload_state=defaults.PENDING)

        return Response(presigned_post)

    @action(methods=["post"], detail=True, url_path="upload-ended")
    # pylint: disable=unused-argument
    def upload_ended(self, request, pk=None, video_id=None):
        """Notify the API that the thumbnail upload has ended.

        Calling the endpoint will start the resizing process of the thumbnail.
        The request should have a file_key in the body, which is the key of the
        uploaded file.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk: string
            The primary key of the thumbnail

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse with the serialized thumbnail.
        """
        # Ensure object exists and user has access to it
        thumbnail = self.get_object()

        serializer = serializers.VideosStorageUploadEndedSerializer(
            data=request.data, context={"obj": thumbnail}
        )
        serializer.is_valid(raise_exception=True)

        file_key = serializer.validated_data["file_key"]
        # The file_key have the "tmp/{video_pk}/thumbnail/{stamp}" format
        stamp = file_key.split("/")[-1]
        resize_thumbnails.delay(pk, stamp)

        return Response(serializer.data)
