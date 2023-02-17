"""Declare API endpoints for shared live media with Django RestFramework viewsets."""
from django.conf import settings
from django.utils import timezone

import django_filters
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.response import Response

from marsha.websocket.utils import channel_layers_utils

from .. import defaults, permissions, serializers
from ..models import SharedLiveMedia
from ..utils.s3_utils import create_presigned_post
from ..utils.time_utils import to_timestamp
from .base import APIViewMixin, ObjectPkMixin, ObjectRelatedMixin


class SharedLiveMediaFilter(django_filters.FilterSet):
    """Filter for SharedLiveMedia."""

    video = django_filters.UUIDFilter(field_name="video_id")

    class Meta:
        model = SharedLiveMedia
        fields = []


class SharedLiveMediaViewSet(
    APIViewMixin, ObjectPkMixin, ObjectRelatedMixin, viewsets.ModelViewSet
):
    """Viewset for the API of the SharedLiveMedia object."""

    permission_classes = [permissions.NotAllowed]
    queryset = SharedLiveMedia.objects.select_related("video")
    serializer_class = serializers.SharedLiveMediaSerializer
    filter_backends = [
        filters.OrderingFilter,
        django_filters.rest_framework.DjangoFilterBackend,
    ]
    ordering_fields = ["created_on", "video__title"]
    ordering = ["created_on"]
    filterset_class = SharedLiveMediaFilter

    def get_serializer_context(self):
        """Extra context provided to the serializer class."""
        context = super().get_serializer_context()

        admin_role_permission = permissions.IsTokenAdmin()
        instructor_role_permission = permissions.IsTokenInstructor()

        context["is_admin"] = admin_role_permission.has_permission(
            request=self.request, view=None
        ) or instructor_role_permission.has_permission(request=self.request, view=None)

        return context

    def get_permissions(self):
        """Instantiate and return the list of permissions that this view requires."""
        if self.action in ["create", "list"]:
            permission_classes = [
                permissions.IsTokenInstructor
                | permissions.IsTokenAdmin
                | permissions.IsParamsVideoAdminThroughOrganization
                | permissions.IsParamsVideoAdminThroughPlaylist
            ]
        elif self.action in ["retrieve"]:
            permission_classes = [
                permissions.IsTokenResourceRouteObjectRelatedVideo
                | permissions.IsRelatedVideoPlaylistAdmin
                | permissions.IsRelatedVideoOrganizationAdmin
            ]
        elif self.action in ["destroy", "initiate_upload", "update", "partial_update"]:
            permission_classes = [
                permissions.IsTokenResourceRouteObjectRelatedVideo
                & (permissions.IsTokenInstructor | permissions.IsTokenAdmin)
                | permissions.IsRelatedVideoPlaylistAdmin
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

    def _get_list_queryset(self):
        """Build the queryset used on the list action."""
        queryset = super().get_queryset()

        if self.request.resource:  # aka we are authenticated through LTI
            queryset = queryset.filter(video__id=self.request.resource.id)

        # Otherwise, we are authenticated through a user JWT.
        # Filtering is currently not necessary as permissions enforce
        # a "video" parameter to be present in the request.
        # See `IsParamsVideoAdminThrough*` permissions.

        return queryset

    def get_queryset(self):
        """Redefine the queryset to use based on the current action."""
        if self.action in ["list"]:
            return self._get_list_queryset()

        return super().get_queryset()

    def destroy(self, request, *args, **kwargs):
        """
        Delete the SharedLiveMedia object.
        If active on a video,
        sets the video's `active_shared_live_media` and `active_shared_live_media_page`
        attributes to None.
        """
        shared_live_media = self.get_object()
        video = shared_live_media.video
        if video.active_shared_live_media == shared_live_media:
            video.active_shared_live_media = None
            video.active_shared_live_media_page = None
            video.save()
        response = super().destroy(request, *args, **kwargs)
        channel_layers_utils.dispatch_video_to_groups(video)
        return response

    def perform_update(self, serializer):
        super().perform_update(serializer)
        channel_layers_utils.dispatch_shared_live_media(serializer.instance)

    @action(methods=["post"], detail=True, url_path="initiate-upload")
    # pylint: disable=unused-argument
    def initiate_upload(self, request, pk=None):
        """Get an upload policy for a shared live media.

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
        serializer = serializers.SharedLiveMediaInitiateUploadSerializer(
            data=request.data
        )

        if serializer.is_valid() is not True:
            return Response(serializer.errors, status=400)

        now = timezone.now()
        stamp = to_timestamp(now)

        shared_live_media = self.get_object()
        key = shared_live_media.get_source_s3_key(
            stamp=stamp, extension=serializer.validated_data["extension"]
        )

        presigned_post = create_presigned_post(
            [
                ["eq", "$Content-Type", serializer.validated_data["mimetype"]],
                ["content-length-range", 0, settings.SHARED_LIVE_MEDIA_SOURCE_MAX_SIZE],
            ],
            {},
            key,
        )

        # Reset the upload state of the shared live media
        SharedLiveMedia.objects.filter(pk=pk).update(upload_state=defaults.PENDING)

        return Response(presigned_post)
