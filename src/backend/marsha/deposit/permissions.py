"""Custom permission classes for the Deposit app."""
from django.core.exceptions import ObjectDoesNotExist

from rest_framework import permissions

from marsha.core import models


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
        try:
            return (
                str(view.get_related_object().file_depository.id) == request.resource.id
            )
        except ObjectDoesNotExist:
            return False


class IsFileDepositoryOrganizationAdmin(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Permission to allow a request to proceed only if the user is an admin for the organization
    linked to the playlist the file depository is a part of.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Allow the request only if there is a file depository id in the path of the request,
        which exists, and if the current user is an admin for the organization linked to
        the playlist this file depository is a part of.
        """
        return models.OrganizationAccess.objects.filter(
            role=models.ADMINISTRATOR,
            organization__playlists__filedepositories__id=view.get_object_pk(),
            user__id=request.user.id,
        ).exists()


class IsFileDepositoryPlaylistAdmin(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Permission to allow a request to proceed only if the user is an admin for the playlist
    the file depository is a part of.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Allow the request only if there is a file depository id in the path of the request,
        which exists, and if the current user is an admin for the playlist this file depository
        is a part of.
        """
        return models.PlaylistAccess.objects.filter(
            role=models.ADMINISTRATOR,
            playlist__filedepositories__id=view.get_object_pk(),
            user__id=request.user.id,
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
        return IsFileDepositoryPlaylistAdmin().has_permission(
            request, view
        ) or IsFileDepositoryOrganizationAdmin().has_permission(request, view)


class IsRelatedFileDepositoryOrganizationAdmin(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Permission to allow a request to proceed only if the user is an admin for the organization
    linked to the playlist the file depository is a part of.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Allow the request only if there is a file depository id in the path of the request,
        which exists, and if the current user is an admin for the organization linked to
        the playlist this file depository is a part of.
        """
        try:
            if request.data.get("file_depository"):
                file_depository_id = request.data.get("file_depository")
            else:
                try:
                    file_depository_id = view.get_related_object().file_depository.id
                except AttributeError:
                    return False
            return models.OrganizationAccess.objects.filter(
                role=models.ADMINISTRATOR,
                organization__playlists__filedepositories__id=file_depository_id,
                user__id=request.user.id,
            ).exists()
        except ObjectDoesNotExist:
            return False


class IsRelatedFileDepositoryPlaylistAdmin(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Permission to allow a request to proceed only if the user is an admin for the playlist
    the file depository is a part of.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Allow the request only if there is a file depository id in the path of the request,
        which exists, and if the current user is an admin for the playlist this file depository
        is a part of.
        """
        try:
            if request.data.get("file_depository"):
                file_depository_id = request.data.get("file_depository")
            else:
                try:
                    file_depository_id = view.get_related_object().file_depository.id
                except AttributeError:
                    return False
            return models.PlaylistAccess.objects.filter(
                role=models.ADMINISTRATOR,
                playlist__filedepositories__id=file_depository_id,
                user__id=request.user.id,
            ).exists()
        except ObjectDoesNotExist:
            return False


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
        return IsRelatedFileDepositoryPlaylistAdmin().has_permission(
            request, view
        ) or IsRelatedFileDepositoryOrganizationAdmin().has_permission(request, view)
