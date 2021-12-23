"""Declare API endpoints for shared live media with Django RestFramework viewsets."""
from django.conf import settings
from django.db.models.query import EmptyQuerySet
from django.utils import timezone

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.models import TokenUser

from .. import defaults, permissions, serializers
from ..models import SharedLiveMedia
from ..utils.s3_utils import create_presigned_post
from ..utils.time_utils import to_timestamp
from .base import ObjectPkMixin


class SharedLiveMediaViewSet(ObjectPkMixin, viewsets.ModelViewSet):
    """Viewset for the API of the SharedLiveMedia object."""

    permission_classes = [permissions.NotAllowed]
    queryset = SharedLiveMedia.objects.all()
    serializer_class = serializers.SharedLiveMediaSerializer

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
        else:
            permission_classes = [
                permissions.IsTokenResourceRouteObjectRelatedVideo
                & (permissions.IsTokenInstructor | permissions.IsTokenAdmin)
                | permissions.IsRelatedVideoPlaylistAdmin
                | permissions.IsRelatedVideoOrganizationAdmin
            ]
        return [permission() for permission in permission_classes]

    def list(self, request, *args, **kwargs):
        """List shared live media through the API."""
        queryset = self.get_queryset().none()
        # If the "user" is just representing a resource and not an actual user profile,
        # restrict the queryset to tracks linked to said resource
        user = self.request.user
        if isinstance(user, TokenUser) and (
            not user.token.get("user")
            or user.token.get("user", {}).get("id") != user.token.get("resource_id")
        ):
            queryset = (
                self.get_queryset().filter(video__id=user.id).order_by("created_on")
            )

        # find the video filter
        video = request.query_params.get("video")
        if video is not None:
            if isinstance(queryset, EmptyQuerySet):
                queryset = self.get_queryset()
            queryset = queryset.filter(video__id=video).order_by("created_on")

        paginated_queryset = self.paginate_queryset(queryset)
        if paginated_queryset is not None:
            paginated_serializer = self.get_serializer(paginated_queryset, many=True)
            return self.get_paginated_response(paginated_serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

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
