"""Declare API endpoints for thumbnails with Django RestFramework viewsets."""
from django.conf import settings
from django.utils import timezone

import django_filters
from rest_framework import filters, mixins, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.response import Response

from marsha.core.metadata import ThumbnailMetadata

from .. import defaults, permissions, serializers
from ..models import Thumbnail
from ..utils.s3_utils import create_presigned_post
from ..utils.time_utils import to_timestamp
from .base import (
    APIViewMixin,
    ObjectPkMixin,
    ObjectRelatedMixin,
    ObjectVideoRelatedMixin,
)


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
            permission_classes = [permissions.UserOrResourceIsAuthenticated]
        elif self.action in ["create", "list"]:
            permission_classes = [
                permissions.IsTokenInstructor
                | permissions.IsTokenAdmin
                | permissions.IsParamsVideoAdminOrInstructorThroughPlaylist
                | permissions.IsParamsVideoAdminThroughOrganization
            ]
        elif self.action in ["retrieve", "destroy", "initiate_upload"]:
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
        if self.action in ["list"]:
            video_id = self.get_related_video_id()
            return queryset.filter(video__id=video_id)

        return queryset

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

        now = timezone.now()
        stamp = to_timestamp(now)

        key = thumbnail.get_source_s3_key(stamp=stamp)

        presigned_post = create_presigned_post(
            [
                ["starts-with", "$Content-Type", "image/"],
                ["content-length-range", 0, settings.THUMBNAIL_SOURCE_MAX_SIZE],
            ],
            {},
            key,
        )

        # Reset the upload state of the thumbnail
        Thumbnail.objects.filter(pk=pk).update(upload_state=defaults.PENDING)

        return Response(presigned_post)
