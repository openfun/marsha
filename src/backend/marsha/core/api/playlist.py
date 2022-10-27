"""Declare API endpoints for playlist with Django RestFramework viewsets."""
from django.db.models import Q

import django_filters
from rest_framework import filters, viewsets

from .. import permissions, serializers
from ..models import ADMINISTRATOR, Playlist
from .base import APIViewMixin, ObjectPkMixin


class PlaylistFilter(django_filters.FilterSet):
    """Filter for Playlist."""

    organization = django_filters.UUIDFilter(field_name="organization__id")

    class Meta:
        model = Playlist
        fields = []


class PlaylistViewSet(APIViewMixin, ObjectPkMixin, viewsets.ModelViewSet):
    """ViewSet for all playlist-related interactions."""

    permission_classes = [permissions.NotAllowed]
    queryset = Playlist.objects.all().select_related("organization", "consumer_site")
    serializer_class = serializers.PlaylistSerializer
    filter_backends = [
        filters.OrderingFilter,
        django_filters.rest_framework.DjangoFilterBackend,
    ]
    ordering_fields = ["created_on", "title"]
    ordering = ["-created_on"]
    filterset_class = PlaylistFilter

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

    def _get_list_queryset(self):
        """Build the queryset used on the list action."""
        queryset = (
            super()
            .get_queryset()
            .filter(
                Q(
                    organization__user_accesses__user_id=self.request.user.id,
                    organization__user_accesses__role=ADMINISTRATOR,
                )
                | Q(
                    user_accesses__user_id=self.request.user.id,
                    user_accesses__role=ADMINISTRATOR,
                )
            )
        )

        return queryset

    def get_queryset(self):
        """Redefine the queryset to use based on the current action."""
        if self.action in ["list"]:
            return self._get_list_queryset()

        return super().get_queryset()
