"""Declare API endpoints for playlist with Django RestFramework viewsets."""
from django.conf import settings
from django.db.models import Q
from django.db.models.deletion import ProtectedError

import django_filters
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .. import permissions, serializers
from ..lti.user_association import clean_lti_user_id
from ..models import (
    ADMINISTRATOR,
    INSTRUCTOR,
    LtiUserAssociation,
    Playlist,
    PlaylistAccess,
)
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
                    & permissions.IsTokenPlaylistRouteObjectRelatedPlaylist
                )
            ]
        elif self.action in ["claim"]:
            permission_classes = [permissions.CanClaimPlaylist]
        elif self.action in ["is_claimed"]:
            permission_classes = [
                permissions.IsTokenInstructor | permissions.IsTokenAdmin
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
                    & permissions.IsTokenPlaylistRouteObjectRelatedPlaylist
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

    @action(detail=True, methods=["post"])
    # pylint: disable=unused-argument
    def claim(self, request, *args, **kwargs):
        """Claim a playlist by creating a PlaylistAccess."""
        playlist = self.get_object()
        playlist_access_exists = PlaylistAccess.objects.filter(
            playlist=playlist,
        ).exists()
        PlaylistAccess.objects.get_or_create(
            playlist=playlist,
            user_id=request.user.id,
            defaults={
                "role": INSTRUCTOR if playlist_access_exists else ADMINISTRATOR,
            },
        )

        # should we set playlist organization to user organization?
        # should we set playlist consumer_site to user consumer_site through user_association ?
        # should we set playlist created_by to user ?

        serializer = self.get_serializer(playlist)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="is-claimed")
    # pylint: disable=unused-argument
    def is_claimed(self, request, *args, **kwargs):
        """Check if a playlist is claimed by an LTI user.
        Only callable in LTI context."""
        playlist = self.get_object()

        lti_user_id = clean_lti_user_id(self.request.user.token.get("user").get("id"))

        if (
            lti_user_id in settings.PLAYLIST_CLAIM_EXCLUDED_LTI_USER_ID
            or not playlist.is_claimable
        ):
            return Response({"is_claimed": True})

        try:
            consumer_site = self.request.user.token.get("consumer_site")

            user_id = LtiUserAssociation.objects.values_list("user_id", flat=True).get(
                lti_user_id=lti_user_id,
                consumer_site=consumer_site,
            )

            is_claimed = PlaylistAccess.objects.filter(
                playlist=playlist,
                user_id=str(user_id),
            ).exists()
        except (
            AttributeError,
            LtiUserAssociation.DoesNotExist,
            PlaylistAccess.DoesNotExist,
        ):
            is_claimed = False

        return Response({"is_claimed": is_claimed})
