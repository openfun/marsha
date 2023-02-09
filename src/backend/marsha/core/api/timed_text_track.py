"""Declare API endpoints for videos with Django RestFramework viewsets."""
from django.conf import settings
from django.utils import timezone

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .. import defaults, permissions, serializers
from ..metadata import TimedTextMetadata
from ..models import TimedTextTrack
from ..utils.s3_utils import create_presigned_post
from ..utils.time_utils import to_timestamp
from .base import APIViewMixin, ObjectPkMixin, ObjectRelatedMixin


class TimedTextTrackViewSet(
    APIViewMixin, ObjectPkMixin, ObjectRelatedMixin, viewsets.ModelViewSet
):
    """Viewset for the API of the TimedTextTrack object."""

    permission_classes = [permissions.NotAllowed]
    queryset = TimedTextTrack.objects.all()
    serializer_class = serializers.TimedTextTrackSerializer
    metadata_class = TimedTextMetadata

    def get_permissions(self):
        """Instantiate and return the list of permissions that this view requires."""
        if self.action == "metadata":
            permission_classes = [permissions.ResourceIsAuthenticated]
        elif self.action in ["create", "list"]:
            permission_classes = [
                permissions.IsTokenInstructor
                | permissions.IsTokenAdmin
                | permissions.IsParamsVideoAdminThroughOrganization
                | permissions.IsParamsVideoAdminThroughPlaylist
            ]
        else:
            permission_classes = [
                permissions.IsTokenResourceRouteObjectRelatedVideo
                & permissions.IsTokenInstructor
                | permissions.IsTokenResourceRouteObjectRelatedVideo
                & permissions.IsTokenAdmin
                | permissions.IsRelatedVideoPlaylistAdmin
                | permissions.IsRelatedVideoOrganizationAdmin
            ]
        return [permission() for permission in permission_classes]

    def list(self, request, *args, **kwargs):
        """List timed text tracks through the API."""
        queryset = self.get_queryset()
        # If the "user" is just representing a resource and not an actual user profile, restrict
        # the queryset to tracks linked to said resource
        if self.request.resource:
            queryset = queryset.filter(video__id=self.request.resource.id)

        # Apply the video filter if appropriate
        video = request.query_params.get("video")
        if video is not None:
            queryset = queryset.filter(video__id=video)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(methods=["post"], detail=True, url_path="initiate-upload")
    # pylint: disable=unused-argument
    def initiate_upload(self, request, pk=None):
        """Get an upload policy for a timed text track.

        Calling the endpoint resets the upload state to `pending` and returns an upload policy to
        our AWS S3 source bucket.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk: string
            The primary key of the timed text track

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse carrying the AWS S3 upload policy as a JSON object.

        """
        now = timezone.now()
        stamp = to_timestamp(now)

        timed_text_track = self.get_object()
        key = timed_text_track.get_source_s3_key(stamp=stamp)

        presigned_post = create_presigned_post(
            [["content-length-range", 0, settings.SUBTITLE_SOURCE_MAX_SIZE]],
            {},
            key,
        )

        # Reset the upload state of the timed text track
        TimedTextTrack.objects.filter(pk=pk).update(upload_state=defaults.PENDING)

        return Response(presigned_post)
