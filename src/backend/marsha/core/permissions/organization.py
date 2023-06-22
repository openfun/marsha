"""Custom permission classes for the Marsha project."""
import uuid

from django.core.exceptions import ImproperlyConfigured

from rest_framework import permissions

from .. import models
from ..models.account import ADMINISTRATOR, INSTRUCTOR
from .base import (
    HasAdminOrInstructorRoleMixIn,
    HasAdminRoleMixIn,
    HasInstructorRoleMixIn,
)


class BaseIsOrganizationRole(permissions.BasePermission):
    """Base permission class for organization roles."""

    role_filter = {}

    def get_organization_id(self, request, view):
        """Get the organization id."""
        # Avoid making extra requests to get the organization id through get_object
        return view.get_object_pk()

    def has_permission(self, request, view):
        """
        Allow the request.

        Only if the organization exists and the current logged in user
        has the proper role.
        """
        if not self.role_filter:
            raise ImproperlyConfigured(
                f"{self.__class__.__name__} must define a `role_filter`."
            )

        return models.OrganizationAccess.objects.filter(
            **self.role_filter,
            organization_id=self.get_organization_id(request, view),
            user_id=request.user.id,
        ).exists()


class IsOrganizationAdmin(HasAdminRoleMixIn, BaseIsOrganizationRole):
    """Permission class to check if the user is one of the organization admin."""


class BaseIsUserOrganizationRole(permissions.BasePermission):
    """
    Base permission class to check for organization roles against
    a specific user's organization (a user may belong to several organizations)."""

    role_filter = {}

    def has_object_permission(self, request, view, obj):
        """
        Allow the request if the requesting user as a specific
        role in one of the `obj` user organization.
        """
        if not self.role_filter:
            raise ImproperlyConfigured(
                f"{self.__class__.__name__} must define a `role_filter`."
            )

        return models.OrganizationAccess.objects.filter(
            **self.role_filter,
            organization_id__in=obj.organization_accesses.values_list(
                "organization_id",
                flat=True,
            ),
            user_id=request.user.id,
        ).exists()


class IsUserOrganizationAdmin(HasAdminRoleMixIn, BaseIsUserOrganizationRole):
    """
    Permission class to check if the user is one of the organization admin
    of the aimed user (for the user management API).
    """


class BaseIsParamsOrganizationRole(BaseIsOrganizationRole):
    """Base permission class to check for organization roles."""

    def get_organization_id(self, request, view):
        """Get the organization id."""
        # Avoid making extra requests to get the organization id through get_object
        return request.data.get("organization") or request.query_params.get(
            "organization"
        )


class IsParamsOrganizationInstructorOrAdmin(
    HasAdminOrInstructorRoleMixIn,
    BaseIsParamsOrganizationRole,
):
    """
    Allow access to user with admin or instructor role on the organization provided in parameters.
    """


class IsParamsPlaylistAdminThroughOrganization(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Permission to allow a request to proceed only if the user provides the ID for an existing
    playlist, and has an access to this playlist's parent organization with an administrator role.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Allow the request only if the playlist from the params of body of the request exists
        and the current logged in user is one of the administrators of its parent organization.
        """
        try:
            uuid.UUID(request.user.id)
        except (ValueError, TypeError):
            return False

        playlist_id = request.data.get("playlist") or request.query_params.get(
            "playlist"
        )
        return models.OrganizationAccess.objects.filter(
            role=ADMINISTRATOR,
            organization__playlists__id=playlist_id,
            user__id=request.user.id,
        ).exists()


class IsOrganizationInstructor(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Permission to allow a request to proceed only if the user is organization instructor.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Allow the request only if the playlist from the params of body of the request exists
        and the current logged-in user is one of the instructors of its parent organization.
        """
        try:
            uuid.UUID(request.user.id)
        except (ValueError, TypeError):
            return False

        return models.OrganizationAccess.objects.filter(
            role=INSTRUCTOR,
            user__id=request.user.id,
        ).exists()


class IsParamsVideoAdminThroughOrganization(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Permission to allow a request to proceed only if the user provides the ID for an existing
    video, and has an access to this video's parent organization with an administrator role.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Allow the request only if the video from the params or body of the request exists and
        the current logged in user is one of the administrators of the organization to which
        this video's playlist belongs.
        """
        video_id = view.get_related_video_id()
        return models.OrganizationAccess.objects.filter(
            role=ADMINISTRATOR,
            organization__playlists__videos__id=video_id,
            user__id=request.user.id,
        ).exists()


def playlist_organization_role_exists(playlist_id, user_id, roles=None):
    """
    Database query used by the BaseIsPlaylistOrganizationRole permission.
    Extracting it allow us to reuse it outside permissions
    """
    return models.OrganizationAccess.objects.filter(
        **roles,
        organization__playlists__id=playlist_id,
        user__id=user_id,
    ).exists()


class BaseIsPlaylistOrganizationRole(permissions.BasePermission):
    """Base permission class for playlist's organization roles."""

    role_filter = {}

    def get_playlist_id(self, request, view, obj):  # pylint: disable=unused-argument
        """Get the playlist id."""
        return obj.pk

    def has_object_permission(self, request, view, obj):
        """
        Allow the request.

        Only if the organization exists and the current logged in user
        has the proper role.
        """
        if not self.role_filter:
            raise ImproperlyConfigured(
                f"{self.__class__.__name__} must define a `role_filter`."
            )

        return playlist_organization_role_exists(
            playlist_id=self.get_playlist_id(request, view, obj),
            user_id=request.user.id,
            roles=self.role_filter,
        )


class IsPlaylistOrganizationAdmin(HasAdminRoleMixIn, BaseIsPlaylistOrganizationRole):
    """Permission class to check if the user is one of the playlist's organization admin."""


class IsPlaylistOrganizationInstructor(
    HasInstructorRoleMixIn,
    BaseIsPlaylistOrganizationRole,
):
    """Permission class to check if the user is one of the playlist's organization instructor."""


class BaseIsObjectPlaylistOrganizationRole(BaseIsPlaylistOrganizationRole):
    """Base permission class for object's playlist's organization roles."""

    def get_playlist_id(self, request, view, obj):
        """Get the playlist id."""
        # Note, use select_related to avoid making extra requests to get the playlist id
        return obj.playlist_id


class IsObjectPlaylistOrganizationAdmin(
    HasAdminRoleMixIn,
    BaseIsObjectPlaylistOrganizationRole,
):
    """
    Permission class to check if the user is one of
    the object's playlist's organization admin.
    """


class BaseIsRelatedVideoPlaylistOrganizationRole(BaseIsPlaylistOrganizationRole):
    """Base permission class for object's video's playlist's organization roles."""

    def get_playlist_id(self, request, view, obj):
        """Get the playlist id."""
        # Note, use select_related to avoid making extra requests to get the video
        return obj.video.playlist_id


class IsRelatedVideoOrganizationAdmin(
    HasAdminRoleMixIn,
    BaseIsRelatedVideoPlaylistOrganizationRole,
):
    """
    Permission class to check if the user is one of
    the object's video's playlist's organization admin.
    """
