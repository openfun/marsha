"""Custom permission classes for the Marsha project."""
from rest_framework import permissions
from rest_framework_simplejwt.models import TokenUser

from . import models
from .models.account import ADMINISTRATOR, INSTRUCTOR, LTI_ROLES


class NotAllowed(permissions.BasePermission):
    """
    Utility permission class denies all requests.

    This is used as a default to close requests to unsupported actions.
    """

    def has_permission(self, request, view):
        """Deny permission always."""
        return False


class BaseResourcePermission(permissions.BasePermission):
    """Base permission class for JWT Tokens related to a resource object.

    These permissions grants access to users authenticated with a JWT token built from a
    resource ie related to a TokenUser as defined in `rest_framework_simplejwt`.

    """

    role = None

    def has_permission(self, request, view):
        """Allow TokenUser and postpone further check to the object permission check.

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
        user = request.user
        if (
            isinstance(user, TokenUser)
            and LTI_ROLES[self.__class__.role]
            & set(user.token.payload.get("roles", []))
            and user.token.payload.get("permissions", {}).get("can_update", False)
            is True
        ):
            return True

        return False

    def get_resource_id(self, obj):
        """Get the resource id to check that it matches the JWT Token.

        Parameters
        ----------
        obj : Type[models.Model]
            The  object for which object permissions are being checked

        Returns
        -------
        string
            The id of the resource passed as obj

        """
        return obj.id

    def has_object_permission(self, request, view, obj):
        """Add a check to allow users identified via a JWT token linked to a resource.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request that holds the authenticated user
        view : Type[restframework.viewsets or restframework.views]
            The API view for which permissions are being checked
        obj: Type[models.Model]
            The object for which object permissions are being checked

        Raises
        ------
        PermissionDenied
            Raised if the request is not authorized

        Returns
        -------
        None
            The response of this method is ignored by its caller in restframework (we delegate
            checking if the user is Admin to the parent class `IsAdminUser`)

        """
        # Users authentified via LTI are identified by a TokenUser with the
        # resource_link_id as user ID.
        if str(self.get_resource_id(obj)) == request.user.id:
            return True

        return False


class IsResourceInstructor(BaseResourcePermission):
    """Class dedicated to instructor users."""

    role = INSTRUCTOR


class IsResourceAdmin(BaseResourcePermission):
    """Class dedicated to administrator users."""

    role = ADMINISTRATOR


class BaseVideoRelatedPermission(BaseResourcePermission):
    """A custom permission class for JWT Tokens related to objects linked to a video.

    These permissions build on the `IsAdminUser` class but grants additional specific accesses
    to users authenticated with a JWT token built from the LTI resource link id ie related to a
    TokenUser as defined in `rest_framework_simplejwt`.

    """

    def get_resource_id(self, obj):
        """Get the video id to check that it matches the JWT Token.

        Parameters
        ----------
        obj : Type[models.Model]
            The  object for which object permissions are being checked

        Returns
        -------
        string
            The id of the video linked to the object passed as obj

        """
        return obj.video.id


class IsVideoRelatedInstructor(BaseVideoRelatedPermission):
    """Class dedicated to instructor users."""

    role = INSTRUCTOR


class IsVideoRelatedAdmin(BaseVideoRelatedPermission):
    """Class dedicated to administrator users."""

    role = ADMINISTRATOR


class IsVideoToken(permissions.IsAuthenticated):
    """A custom permission class for JWT Tokens related to a video object.

    These permissions build on the `IsAuthenticated` class but grants additional specific accesses
    to users authenticated with a JWT token built from a video ie related to a TokenUser as
    defined in `rest_framework_simplejwt`.

    """

    message = "Only connected users can access this resource."

    def has_permission(self, request, view):
        """Allow TokenUser and postpone further check to the object permission check.

        Parameters
        ----------
        request : Type[rest_framework.request]
            The request that holds the authenticated user
        view : Type[restframework.viewsets or restframework.views]
            The API view for which permissions are being checked

        Returns
        -------
        boolean
            True if the request is authorized, False otherwise

        """
        if isinstance(request.user, TokenUser):
            return True

        return super().has_permission(request, view)


class IsParamsOrganizationAdmin(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Only if the user provides the ID for an existing organization,
    and is a member of this organization with an administrator role.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Only if the organization from the params of body of the request exists
        and the current logged in user is one of its administrators.
        """
        organization_id = request.data.get("organization") or request.query_params.get(
            "organization"
        )
        return models.OrganizationAccess.objects.filter(
            role=ADMINISTRATOR,
            organization__id=organization_id,
            user__id=request.user.id,
        ).exists()


class IsParamsPlaylistAdmin(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Permission to allow a request to proceed only if the user provides the ID for an existing
    playlist, and has an access to this playlist with an administrator role.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Allow the request only if the playlist from the params of body of the request exists
        and the current logged in user is one of its administrators.
        """
        playlist_id = request.data.get("playlist") or request.query_params.get(
            "playlist"
        )
        return models.PlaylistAccess.objects.filter(
            role=ADMINISTRATOR, playlist__id=playlist_id, user__id=request.user.id,
        ).exists()


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
        playlist_id = request.data.get("playlist") or request.query_params.get(
            "playlist"
        )
        return models.OrganizationAccess.objects.filter(
            role=ADMINISTRATOR,
            organization__playlists__id=playlist_id,
            user__id=request.user.id,
        ).exists()


class IsOrganizationAdmin(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Only if the user is a member of the organization in the path, with
    an administrator role.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Only if the organization exists and the current logged in user is one
        of its administrators.
        """
        return models.OrganizationAccess.objects.filter(
            role=ADMINISTRATOR,
            # Avoid making extra requests to get the organization id through get_object
            organization__id=view.get_object_pk(),
            user__id=request.user.id,
        ).exists()


class IsPlaylistAdmin(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Only if the user has an access to the playlist in the path, with
    an administrator role.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Only if the playlist exists and the current logged in user is one
        of its administrator.
        """
        return models.PlaylistAccess.objects.filter(
            role=ADMINISTRATOR,
            # Avoid making extra requests to get the playlist id through get_object
            playlist__id=view.get_object_pk(),
            user__id=request.user.id,
        ).exists()


class IsPlaylistOrganizationAdmin(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Only if the user is a member of the organization related to the playlist
    in the path, with an administrator role.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Only if the playlist exists and the current logged in user is one
        of the administrators of its related organization.
        """
        return models.OrganizationAccess.objects.filter(
            role=ADMINISTRATOR,
            # Avoid making extra requests to get the playlist id through get_object
            organization__playlists__id=view.get_object_pk(),
            user__id=request.user.id,
        ).exists()


class IsVideoPlaylistAdmin(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Permission to allow a request to proceed only if the user is an admin for the playlist
    the video is a part of.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Allow the request only if there is a video id in the path of the request, which exists,
        and if the current user is an admin for the playlist this video is a part of.
        """
        return models.PlaylistAccess.objects.filter(
            role=ADMINISTRATOR,
            playlist__videos__id=view.get_object_pk(),
            user__id=request.user.id,
        ).exists()


class IsVideoOrganizationAdmin(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Permission to allow a request to proceed only if the user is an admin for the organization
    linked to the playlist the video is a part of.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Allow the request only if there is a video id in the path of the request, which exists,
        and if the current user is an admin for the organization linked to the playlist this video
        is a part of.
        """
        return models.OrganizationAccess.objects.filter(
            role=ADMINISTRATOR,
            organization__playlists__videos__id=view.get_object_pk(),
            user__id=request.user.id,
        ).exists()
