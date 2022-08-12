"""Declare API endpoints for playlist with Django RestFramework viewsets."""
from rest_framework import viewsets
from rest_framework.response import Response

from .. import permissions, serializers
from ..models import Playlist
from .base import APIViewMixin, ObjectPkMixin


class PlaylistViewSet(APIViewMixin, ObjectPkMixin, viewsets.ModelViewSet):
    """ViewSet for all playlist-related interactions."""

    permission_classes = [permissions.NotAllowed]
    queryset = Playlist.objects.all()
    serializer_class = serializers.PlaylistSerializer

    def get_permissions(self):
        """
        Manage permissions for built-in DRF methods.

        Default to the actions' self defined permissions if applicable or
        to the ViewSet's default permissions.
        """
        if self.action in ["list"]:
            permission_classes = [permissions.UserIsAuthenticated]
        elif self.action in ["retrieve"]:
            permission_classes = [
                # users who are playlist administrators
                permissions.IsPlaylistAdmin
                # or users who are administrators of the playlist organization
                | permissions.IsPlaylistOrganizationAdmin
                # or
                | (
                    # requests made with a JWT token granting instructor or administrator
                    (permissions.IsTokenInstructor | permissions.IsTokenAdmin)
                    # and to an object related to the playlist
                    & permissions.IsTokenResourceRouteObjectRelatedPlaylist
                )
            ]
        elif self.action in ["create"]:
            permission_classes = [permissions.IsParamsOrganizationAdmin]
        elif self.action in ["partial_update", "update"]:
            permission_classes = [
                # requests made with a JWT token granting instructor or administrator
                (permissions.IsTokenInstructor | permissions.IsTokenAdmin)
                # and to an object related to the playlist
                & permissions.IsTokenResourceRouteObjectRelatedPlaylist
            ]
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]

    def list(self, request, *args, **kwargs):
        """
        Return a list of playlists.

        By default, filtered to only return to the user what
        playlists they have access to.
        """
        queryset = self.get_queryset().filter(
            organization__users__id=self.request.user.id
        )

        organization_id = self.request.query_params.get("organization")
        if organization_id:
            queryset = queryset.filter(organization__id=organization_id)

        page = self.paginate_queryset(queryset.order_by("title"))
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset.order_by("title"), many=True)
        return Response(serializer.data)
