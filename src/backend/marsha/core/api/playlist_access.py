"""Declare API endpoints for playlist access with Django RestFramework viewsets."""
from django.db.models import Q

import django_filters
from rest_framework import filters, viewsets

from .. import permissions, serializers
from ..models import ADMINISTRATOR, INSTRUCTOR, PlaylistAccess
from ..permissions import IsParamsPlaylistAdminThroughOrganization
from .base import APIViewMixin, ObjectPkMixin


class PlaylistAccessFilter(django_filters.FilterSet):
    """Filter for PlaylistAccess."""

    playlist_id = django_filters.UUIDFilter(field_name="playlist_id")

    class Meta:
        model = PlaylistAccess
        fields = []


class PlaylistAccessViewSet(APIViewMixin, ObjectPkMixin, viewsets.ModelViewSet):
    """ViewSet for all playlist-related interactions."""

    permission_classes = [permissions.NotAllowed]
    queryset = PlaylistAccess.objects.all().select_related("user", "playlist")
    serializer_class = serializers.PlaylistAccessSerializer
    filter_backends = [
        filters.OrderingFilter,
        django_filters.rest_framework.DjangoFilterBackend,
    ]
    ordering_fields = ["created_on", "playlist__title", "role", "user__last_name"]
    ordering = ["created_on"]
    filterset_class = PlaylistAccessFilter

    def get_permissions(self):
        """
        Manage permissions for built-in DRF methods.

        Default to the actions' self defined permissions if applicable or
        to the ViewSet's default permissions.
        """
        if self.action in ["list", "retrieve"]:
            permission_classes = [permissions.UserIsAuthenticated]
        elif self.action in ["create"]:
            permission_classes = [
                permissions.IsParamsPlaylistAdmin
                | IsParamsPlaylistAdminThroughOrganization
            ]
        elif self.action in ["destroy", "partial_update", "update"]:
            permission_classes = [
                # users who are playlist administrators of the playlist
                permissions.IsObjectPlaylistAdmin
                # or users who are administrators of the playlist organization
                | permissions.IsObjectPlaylistOrganizationAdmin
            ]
        else:
            try:
                permission_classes = getattr(self, str(self.action)).kwargs.get(
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
        if self.action in ["list", "retrieve"]:
            return self._get_list_queryset()

        return super().get_queryset()
