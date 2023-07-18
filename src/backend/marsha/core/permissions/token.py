"""Custom permission classes for the Marsha project."""
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Q

from rest_framework import permissions

from .. import models
from ..models.account import ADMINISTRATOR, INSTRUCTOR, LTI_ROLES, STUDENT


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


class IsTokenStudent(BaseTokenRolePermission):
    """Class dedicated to student users."""

    def check_role(self, token):
        """Check if the student role is in the token."""
        return bool(LTI_ROLES[STUDENT] & set(token.payload.get("roles", [])))


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
                and str(view.get_related_object().video.id) == request.resource.id
            )
        except ObjectDoesNotExist:
            return False


class IsPlaylistToken(permissions.BasePermission):
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
            playlist_id = request.resource.id
            return models.Playlist.objects.filter(id=playlist_id).exists() and (
                str(view.get_queryset().get(id=view.get_object_pk()).playlist_id)
                == playlist_id
            )
        return False


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
