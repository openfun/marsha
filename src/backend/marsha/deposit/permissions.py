"""Custom permission classes for the Deposit app."""

from rest_framework import permissions

from marsha.core import models
from marsha.deposit.models import FileDepository


def _is_organization_admin(user_id, file_depository_id):
    """Check if user is an admin of the organization containing a file depository."""

    if not user_id or not file_depository_id:
        return False

    return models.OrganizationAccess.objects.filter(
        role=models.ADMINISTRATOR,
        organization__playlists__filedepositories__id=file_depository_id,
        user__id=user_id,
    ).exists()


def _is_playlist_admin(user_id, file_depository_id):
    """Check if user is an admin of the playlist containing a file depository."""

    if not user_id or not file_depository_id:
        return False

    return models.PlaylistAccess.objects.filter(
        role=models.ADMINISTRATOR,
        playlist__filedepositories__id=file_depository_id,
        user__id=user_id,
    ).exists()


class IsTokenResourceRouteObjectRelatedFileDepository(permissions.BasePermission):
    """
    Base permission class for JWT Tokens related to a resource object linked to a FileDepository.

    These permissions grants access to users authenticated with a JWT token built from a
    resource ie related to a TokenUser as defined in `rest_framework_simplejwt`.
    """

    def has_permission(self, request, view):
        """
        Allow the request if the JWT resource matches the FileDepository related to the object
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

        return FileDepository.objects.filter(
            pk=view.get_related_filedepository_id(), playlist_id=request.resource.id
        ).exists()


class IsFileDepositoryPlaylistOrOrganizationAdmin(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Permission to allow a request to proceed only if the user is an admin for the playlist
    the file depository is a part of or admin of the linked organization.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Allow the request only if there is a file depository id in the path of the request,
        which exists, and if the current user is an admin for the playlist this file depository
        is a part of or admin of the linked organization.
        """
        return _is_playlist_admin(
            user_id=request.user.id,
            file_depository_id=view.get_object_pk(),
        ) or _is_organization_admin(
            user_id=request.user.id,
            file_depository_id=view.get_object_pk(),
        )


class IsRelatedFileDepositoryPlaylistOrOrganizationAdmin(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Permission to allow a request to proceed only if the user is an admin for the playlist
    the file depository is a part of or admin of the linked organization.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Allow the request only if there is a file depository id in the path of the request,
        which exists, and if the current user is an admin for the playlist this file depository
        is a part of or admin of the linked organization.
        """
        file_depository_id = view.get_related_filedepository_id()

        if not file_depository_id:
            return False

        return _is_playlist_admin(
            user_id=request.user.id,
            file_depository_id=file_depository_id,
        ) or _is_organization_admin(
            user_id=request.user.id,
            file_depository_id=file_depository_id,
        )
