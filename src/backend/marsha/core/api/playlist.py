"""Declare API endpoints for playlist with Django RestFramework viewsets."""
from django.db.models import Q
from django.db.models.deletion import ProtectedError

import django_filters
from rest_framework import filters, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .. import permissions, serializers
from ..models import ADMINISTRATOR, INSTRUCTOR, Playlist
from .base import APIViewMixin, ObjectPkMixin


class PlaylistFilter(django_filters.FilterSet):
    """Filter for Playlist."""

    organization = django_filters.UUIDFilter(field_name="organization__id")
    can_edit = django_filters.BooleanFilter(method="filter_can_edit")

    class Meta:
        model = Playlist
        fields = []

    def filter_can_edit(self, queryset, name, value):
        """Filter playlists where the user has edit access."""
        if not value:
            return queryset

        if not isinstance(value, bool):
            raise ValidationError(
                f"Invalid value for {name} filter, must be a boolean."
            )

        return queryset.filter(can_edit=value)


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
                # users who are playlist administrators or instructor
                permissions.IsPlaylistAdminOrInstructor
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
            permission_classes = [permissions.IsParamsOrganizationInstructorOrAdmin]
        elif self.action in ["partial_update", "update"]:
            permission_classes = [
                # users who are playlist administrators or instructor
                permissions.IsPlaylistAdminOrInstructor
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
        elif self.action in ["destroy"]:
            permission_classes = [
                permissions.IsPlaylistAdmin | permissions.IsPlaylistOrganizationAdmin
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
                    user_accesses__role__in=[ADMINISTRATOR, INSTRUCTOR],
                )
            )
            .annotate_can_edit(self.request.user.id)
            .distinct()
        )

        return queryset

    def get_queryset(self):
        """Redefine the queryset to use based on the current action."""
        if self.action in ["list"]:
            return self._get_list_queryset()

        return super().get_queryset()

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response("Resources are still attached to playlist", status=400)
