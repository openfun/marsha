"""Custom permission classes for the BBB app."""

from rest_framework import permissions

from marsha.bbb.models import Classroom
from marsha.core import models, permissions as core_permissions


class IsTokenResourceRouteObjectRelatedClassroom(permissions.BasePermission):
    """
    Base permission class for JWT Tokens related to a resource object linked to a Classroom.

    These permissions grants access to users authenticated with a JWT token built from a
    resource ie related to a TokenUser as defined in `rest_framework_simplejwt`.
    """

    def has_permission(self, request, view):
        """
        Allow the request if the JWT resource matches the Classroom related to the object
        in the url.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request that holds the authenticated user
        view : Type[restframework.viewsets or restframework.views]
            The API view for which permissions are being checked

        Returns
        -------
        boolean
            True if the request is authorized, False otherwise
        """
        if not request.resource:
            return False

        return Classroom.objects.filter(
            pk=view.get_related_classroom_id(), playlist_id=request.resource.id
        ).exists()


class BaseIsRelatedClassroomPlaylistRoleMixin:
    """Allow request when the user has specific role on the object's classroom's playlist."""

    # pylint: disable=unused-argument
    def get_playlist_id(self, request, view, obj):
        """Get the playlist id."""
        # Note, use select_related to avoid making extra requests to get the classroom
        return obj.classroom.playlist_id


class BaseIsRelatedClassroomPlaylistRole(
    BaseIsRelatedClassroomPlaylistRoleMixin, core_permissions.BaseIsObjectPlaylistRole
):
    """Allow request when the user has specific role on the object's classroom's playlist."""


class IsRelatedClassroomPlaylistAdminOrInstructor(
    core_permissions.HasAdminOrInstructorRoleMixIn,
    BaseIsRelatedClassroomPlaylistRole,
):
    """
    Allow request when the user has admin or instructor role on the object's classroom's playlist.
    """


class BaseIsRelatedClassroomPlaylistOrganizationRole(
    BaseIsRelatedClassroomPlaylistRoleMixin,
    core_permissions.BaseIsPlaylistOrganizationRole,
):
    """Base permission class for object's classroom's playlist's organization roles."""


class IsRelatedClassroomOrganizationAdmin(
    core_permissions.HasAdminRoleMixIn,
    BaseIsRelatedClassroomPlaylistOrganizationRole,
):
    """
    Permission class to check if the user is one of
    the object's classroom's playlist's organization admin.
    """


class IsParamsClassroomAdminOrInstructorThroughPlaylist(
    core_permissions.HasAdminOrInstructorRoleMixIn, permissions.BasePermission
):
    """
    Allow access to user with admin or instructor role on the classroom's playlist
    provided in parameters.
    """

    def has_permission(self, request, view):
        """
        Allow the request only if the classroom from the params or body of the request exists and
        the current logged in user has a specific role of the playlist to which
        this classroom belongs.
        """
        classroom_id = view.get_related_classroom_id()
        return models.PlaylistAccess.objects.filter(
            **self.role_filter,
            playlist__classrooms__id=classroom_id,
            user__id=request.user.id,
        ).exists()


class IsParamsClassroomAdminThroughOrganization(
    core_permissions.HasAdminRoleMixIn,
    permissions.BasePermission,
):
    """
    Allow a request to proceed. Permission class.

    Permission to allow a request to proceed only if the user provides the ID for an existing
    classroom, and has an access to this classroom's parent organization with an administrator
    role.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Allow the request only if the classroom from the params or body of the request exists and
        the current logged in user is one of the administrators of the organization to which
        this classroom's playlist belongs.
        """
        classroom_id = view.get_related_classroom_id()
        return models.OrganizationAccess.objects.filter(
            **self.role_filter,
            organization__playlists__classrooms__id=classroom_id,
            user__id=request.user.id,
        ).exists()
