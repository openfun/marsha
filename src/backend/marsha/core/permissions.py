"""Custom permission classes for the Marsha project."""
import uuid

from django.db.models import Q
from django.http.response import Http404

from rest_framework import permissions
from rest_framework.permissions import IsAuthenticated

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


class UserOrResourceIsAuthenticated(IsAuthenticated):
    """This allows access for in user or resource context."""


class UserIsAuthenticated(IsAuthenticated):
    """This allows access only in user context."""

    def has_permission(self, request, view):
        """Simply checks we are NOT in a resource context."""
        has_permission = super().has_permission(request, view)
        return has_permission and request.resource is None


class ResourceIsAuthenticated(IsAuthenticated):
    """This allows access only in resource context."""

    def has_permission(self, request, view):
        """Simply checks we are in a resource context."""
        has_permission = super().has_permission(request, view)
        return has_permission and request.resource is not None


class BaseTokenRolePermission(permissions.BasePermission):
    """Base permission class for JWT Tokens based on token roles.

    These permissions grants access to users authenticated with a JWT token built from a
    resource ie related to a TokenResource.
    """

    role = None

    def check_role(self, token):
        """Check if the required role is in the token and if can_update is granted."""
        return LTI_ROLES[self.__class__.role] & set(
            token.payload.get("roles", [])
        ) and token.payload.get("permissions", {}).get("can_update", False)

    def has_permission(self, request, view):
        """
        Add a check to allow users identified via a JWT token with a given token-granted role.

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
        return request.resource and self.check_role(request.resource.token)


class IsTokenInstructor(BaseTokenRolePermission):
    """Class dedicated to instructor users."""

    role = INSTRUCTOR


class IsTokenAdmin(BaseTokenRolePermission):
    """Class dedicated to administrator users."""

    role = ADMINISTRATOR


class IsTokenResourceRouteObject(permissions.BasePermission):
    """
    Base permission class for JWT Tokens related to a resource object.

    These permissions grants access to users authenticated with a JWT token built from a
    resource ie related to a TokenResource.
    """

    def has_permission(self, request, view):
        """
        Add a check to allow the request if the JWT resource matches the object in the url path.

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
        return request.resource and view.get_object_pk() == request.resource.id


class IsTokenResourceRouteObjectRelatedPlaylist(permissions.BasePermission):
    """
    Base permission class for JWT Tokens related to a playlist linked to a video.

    These permissions grants access to users authenticated with a JWT token built from a
    resource ie related to a TokenResource.
    """

    def has_permission(self, request, view):
        """
        Add a check to allow the request if the JWT resource matches the playlist in the url path.

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
        return (
            request.resource
            and models.Playlist.objects.filter(
                Q(pk=view.get_object_pk())
                & (
                    Q(videos__id=request.resource.id)
                    | Q(documents__id=request.resource.id)
                ),
            ).exists()
        )


class IsTokenResourceRouteObjectRelatedVideo(permissions.BasePermission):
    """
    Base permission class for JWT Tokens related to a resource object linked to a video.

    These permissions grants access to users authenticated with a JWT token built from a
    resource ie related to a TokenResource.
    """

    def has_permission(self, request, view):
        """
        Allow the request if the JWT resource matches the video related to the object in the url.

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
            return (
                request.resource
                and str(view.get_object().video.id) == request.resource.id
            )
        except (AssertionError, Http404):
            return False


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
        try:
            uuid.UUID(request.user.id)
        except (ValueError, TypeError):
            return False

        playlist_id = request.data.get("playlist") or request.query_params.get(
            "playlist"
        )
        return models.PlaylistAccess.objects.filter(
            role=ADMINISTRATOR,
            playlist__id=playlist_id,
            user__id=request.user.id,
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
        video_id = request.data.get("video") or request.query_params.get("video")
        return models.OrganizationAccess.objects.filter(
            role=ADMINISTRATOR,
            organization__playlists__videos__id=video_id,
            user__id=request.user.id,
        ).exists()


class IsParamsVideoAdminThroughPlaylist(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Permission to allow a request to proceed only if the user provides the ID for an existing
    video, and has an access to this video's parent playlist with an administrator role.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Allow the request only if the video from the params or body of the request exists and
        the current logged in user is one of the administrators of the playlist to which
        this video belongs.
        """
        video_id = request.data.get("video") or request.query_params.get("video")
        return models.PlaylistAccess.objects.filter(
            role=ADMINISTRATOR,
            playlist__videos__id=video_id,
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


class IsRelatedVideoPlaylistAdmin(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Permission to allow a request to proceed only if the user is an admin for the playlist
    the video related to the current object is a part of.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Allow the request only if there is a video related object id in the path of
        the request, which exists, and if the current user is an admin for the playlist
        this video is a part of.
        """
        try:
            video_related_object = view.get_object()
        except (Http404, AssertionError):
            return False

        return models.PlaylistAccess.objects.filter(
            role=ADMINISTRATOR,
            playlist__videos=video_related_object.video,
            user__id=request.user.id,
        ).exists()


class IsRelatedVideoOrganizationAdmin(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Permission to allow a request to proceed only if the user is an admin for the organization
    the video related to the current object is a part of.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Allow the request only if there is a video related object id in the path of
        the request, which exists, and if the current user is an admin for the organization
        this video is a part of.
        """
        try:
            video_related_object = view.get_object()
        except (Http404, AssertionError):
            return False

        return models.OrganizationAccess.objects.filter(
            role=ADMINISTRATOR,
            organization__playlists__videos=video_related_object.video,
            user__id=request.user.id,
        ).exists()


class HasPlaylistToken(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Only if the user has a playlist token payload.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Only if the playlist exists.
        """
        if request.resource:
            playlist_id = request.resource.playlist_id
            return models.Playlist.objects.filter(id=playlist_id).exists()
        return False
