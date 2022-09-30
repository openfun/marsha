"""Custom permission classes for the BBB app."""
from django.core.exceptions import ObjectDoesNotExist

from rest_framework import permissions

from marsha.core import models


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
        try:
            return str(view.get_related_object().classroom.id) == request.resource.id
        except ObjectDoesNotExist:
            return False


class IsClassroomOrganizationAdmin(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Permission to allow a request to proceed only if the user is an admin for the organization
    linked to the playlist the classroom is a part of.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Allow the request only if there is a classroom id in the path of the request, which exists,
        and if the current user is an admin for the organization linked to the playlist this video
        is a part of.
        """
        return models.OrganizationAccess.objects.filter(
            role=models.ADMINISTRATOR,
            organization__playlists__classrooms__id=view.get_object_pk(),
            user__id=request.user.id,
        ).exists()
