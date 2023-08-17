"""Custom permission classes for the Marsha project."""

from rest_framework import permissions
from rest_framework.permissions import IsAuthenticated

from ..models.account import ADMINISTRATOR, INSTRUCTOR


class NotAllowed(permissions.BasePermission):
    """
    Utility permission class denies all requests.

    This is used as a default to close requests to unsupported actions.
    """

    def has_permission(self, request, view):
        """Deny permission always."""
        return False


class UserOrPlaylistIsAuthenticated(IsAuthenticated):
    """This allows access for in user or playlist context."""


class UserIsAuthenticated(IsAuthenticated):
    """This allows access only in user context."""

    def has_permission(self, request, view):
        """Simply checks we are NOT in a playlist context."""
        has_permission = super().has_permission(request, view)
        return has_permission and request.resource is None


class PlaylistIsAuthenticated(IsAuthenticated):
    """This allows access only in playlist context."""

    def has_permission(self, request, view):
        """Simply checks we are in a playlist context."""
        has_permission = super().has_permission(request, view)
        return has_permission and request.resource is not None


class HasAdminRoleMixIn:
    """
    Mixin to check if the user has an admin role.

    To be combined with one of the Base...Role classes below.
    """

    role_filter = {"role": ADMINISTRATOR}


class HasInstructorRoleMixIn:
    """
    Mixin to check if the user has an instructor role.

    To be combined with one of the Base...Role classes below.
    """

    role_filter = {"role": INSTRUCTOR}


class HasAdminOrInstructorRoleMixIn:
    """
    Mixin to check if the user has an admin or instructor role.

    To be combined with one of the Base...Role classes below.
    """

    role_filter = {"role__in": [ADMINISTRATOR, INSTRUCTOR]}


class BaseObjectPermission(permissions.BasePermission):
    """Base permission to be used for detail views"""

    def has_permission(self, request, view):
        """
        Allow access only for detailed views, `has_object_permission`
        will be called when it returns `True`
        """
        lookup_url_kwarg = view.lookup_url_kwarg or view.lookup_field
        if lookup_url_kwarg and lookup_url_kwarg in view.kwargs:
            # The inheriting has_object_permission will use the request.user.id
            # as filter, so even if it looks like `UserIsAuthenticated` we
            # test it here to never allow `.filter(user_id=None)` queries.
            return request.user.id is not None
        return False

    def has_object_permission(self, request, view, obj):
        """To be implemented in inheriting classes."""
        raise NotImplementedError()
