"""Custom permission classes for the BBB app."""
from django.core.exceptions import ObjectDoesNotExist

from rest_framework import permissions

from marsha.core import models


def _is_organization_admin(user_id, classroom_id):
    """Check if user is an admin of the organization containing a classroom."""
    return models.OrganizationAccess.objects.filter(
        role=models.ADMINISTRATOR,
        organization__playlists__classrooms__id=classroom_id,
        user__id=user_id,
    ).exists()


def _is_playlist_admin(user_id, classroom_id):
    """Check if user is an admin of the playlist containing a classroom."""
    return models.PlaylistAccess.objects.filter(
        role=models.ADMINISTRATOR,
        playlist__classrooms__id=classroom_id,
        user__id=user_id,
    ).exists()


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
        try:
            return str(view.get_related_object().classroom.id) == request.resource.id
        except ObjectDoesNotExist:
            return False


class IsClassroomPlaylistOrOrganizationAdmin(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Permission to allow a request to proceed only if the user is an admin for the playlist
    the classroom is a part of or admin of the linked organization.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Allow the request only if there is a classroom id in the path of the request, which exists,
        and if the current user is an admin for the playlist this video is a part of or
        admin of the linked organization.
        """
        return _is_playlist_admin(
            user_id=request.user.id,
            classroom_id=view.get_object_pk(),
        ) or _is_organization_admin(
            user_id=request.user.id,
            classroom_id=view.get_object_pk(),
        )


class IsRelatedClassroomPlaylistOrOrganizationAdmin(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Permission to allow a request to proceed only if the user is an admin for the playlist
    the classroom is a part of or admin of the linked organization.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Allow the request only if there is a classroom id in the path of the request, which exists,
        and if the current user is an admin for the playlist this video is a part of or
        admin of the linked organization.
        """
        try:
            classroom_id = view.get_related_object().classroom.id
        except (AttributeError, ObjectDoesNotExist):
            classroom_id = request.data.get("classroom")

        if not classroom_id:
            return False

        return _is_playlist_admin(
            user_id=request.user.id,
            classroom_id=classroom_id,
        ) or _is_organization_admin(
            user_id=request.user.id,
            classroom_id=classroom_id,
        )
