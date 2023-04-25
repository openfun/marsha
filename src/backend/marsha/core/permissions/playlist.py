"""Custom permission classes for the Marsha project."""
import uuid

from django.core.exceptions import ImproperlyConfigured, ObjectDoesNotExist
from django.db.models import Q

from rest_framework import permissions
from rest_framework.permissions import IsAuthenticated

from . import models
from .models import Playlist, PlaylistAccess, PortabilityRequest
from .models.account import (
    ADMINISTRATOR,
    INSTRUCTOR,
    LTI_ROLES,
    STUDENT,
    ConsumerSiteAccess,
    OrganizationAccess,
)


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


class BaseIsParamsPlaylistRole(permissions.BasePermission):
    """
    Permission to allow a request to proceed only if the user provides the ID for an existing
    playlist, and has access to this playlist with a specific role.
    """

    role_filter = {}

    def has_permission(self, request, view):
        """
        Allow the request only if the playlist from the params of body of the request exists
        and the current logged-in user has a specific role.
        """
        try:
            uuid.UUID(request.user.id)
        except (ValueError, TypeError):
            return False

        playlist_id = request.data.get("playlist") or request.query_params.get(
            "playlist"
        )
        return models.PlaylistAccess.objects.filter(
            **self.role_filter,
            playlist__id=playlist_id,
            user__id=request.user.id,
        ).exists()


class IsParamsPlaylistAdmin(HasAdminRoleMixIn, BaseIsParamsPlaylistRole):
    """
    Allow access to user with admin role on the playlist provided in parameters.
    """


class IsParamsPlaylistAdminOrInstructor(
    HasAdminOrInstructorRoleMixIn,
    BaseIsParamsPlaylistRole,
):
    """
    Allow access to user with admin or instructor role on the playlist provided in parameters.
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


class BaseIsParamsVideoRoleThroughPlaylist(permissions.BasePermission):
    """
    Permission to allow a request to proceed only if the user provides the ID for an existing
    video, and has an access to this video's parent playlist with a specific role.
    """

    role_filter = {}

    def has_permission(self, request, view):
        """
        Allow the request only if the video from the params or body of the request exists and
        the current logged in user has a specific role of the playlist to which
        this video belongs.
        """
        video_id = view.get_related_video_id()
        return models.PlaylistAccess.objects.filter(
            **self.role_filter,
            playlist__videos__id=video_id,
            user__id=request.user.id,
        ).exists()


class IsParamsVideoAdminThroughPlaylist(
    HasAdminRoleMixIn, BaseIsParamsVideoRoleThroughPlaylist
):
    """
    Allow access to user with admin role on the video's playlist provided in parameters.
    """


class IsParamsVideoAdminOrInstructorThroughPlaylist(
    HasAdminOrInstructorRoleMixIn, BaseIsParamsVideoRoleThroughPlaylist
):
    """
    Allow access to user with admin or instructor role on the video's playlist
    provided in parameters.
    """


def playlist_role_exists(playlist_id, user_id, roles=None):
    """
    Database query used by the BaseIsPlaylistRole permission.
    Extracting it allow us to reuse it outside permissions
    """
    return models.PlaylistAccess.objects.filter(
        **roles,
        playlist_id=playlist_id,
        user__id=user_id,
    ).exists()


class BaseIsPlaylistRole(permissions.BasePermission):
    """Base permission class for playlist roles."""

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

        return playlist_role_exists(
            playlist_id=self.get_playlist_id(request, view, obj),
            user_id=request.user.id,
            roles=self.role_filter,
        )


class IsPlaylistAdmin(HasAdminRoleMixIn, BaseIsPlaylistRole):
    """
    Allow a request to proceed. Permission class.

    Only if the user has an access to the playlist in the path, with
    an administrator role.
    """


class IsPlaylistInstructor(HasInstructorRoleMixIn, BaseIsPlaylistRole):
    """
    Allow a request to proceed. Permission class.

    Only if the user has an access to the playlist in the path, with
    an instructor role.
    """


class IsPlaylistAdminOrInstructor(HasAdminOrInstructorRoleMixIn, BaseIsPlaylistRole):
    """
    Allow a request to proceed. Permission class.

    Only if the user has an access to the playlist in the path, with
    an admin or instructor role.
    """


class BaseIsObjectPlaylistRole(BaseIsPlaylistRole):
    """
    Base permission class for resource's playlist roles.

    Example: test whether a user has admin role one to a video's playlist.
    """

    def get_playlist_id(self, request, view, obj):
        """Get the playlist id."""
        return obj.playlist_id


class IsObjectPlaylistAdmin(HasAdminRoleMixIn, BaseIsObjectPlaylistRole):
    """Allow request when the user has admin role on the object's playlist."""


class IsObjectPlaylistAdminOrInstructor(
    HasAdminOrInstructorRoleMixIn,
    BaseIsObjectPlaylistRole,
):
    """Allow request when the user has admin or instructor role on the object's playlist."""


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


class BaseIsRelatedVideoPlaylistRole(BaseIsObjectPlaylistRole):
    """Allow request when the user has specific role on the object's video's playlist."""

    def get_playlist_id(self, request, view, obj):
        """Get the playlist id."""
        # Note, use select_related to avoid making extra requests to get the video
        return obj.video.playlist_id


class IsRelatedVideoPlaylistAdmin(HasAdminRoleMixIn, BaseIsRelatedVideoPlaylistRole):
    """Allow request when the user has admin role on the object's video's playlist."""


class IsRelatedVideoPlaylistAdminOrInstructor(
    HasAdminOrInstructorRoleMixIn,
    BaseIsRelatedVideoPlaylistRole,
):
    """
    Allow request when the user has admin or instructor role on the object's video's playlist.
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


class BasePortabilityRequestAdministratorAccessPermission(BaseObjectPermission):
    """Base permission to check for user Role against portability request's aimed playlist."""

    access_model = None
    playlist_lookup = None

    def has_object_permission(self, request, view, obj):
        """
        Allow access when the user has `access_model` permission on the `playlist_lookup`
        playlist with administrator role.
        """
        portability_request = obj
        return self.access_model.objects.filter(
            role=ADMINISTRATOR,
            user_id=request.user.id,
            **{self.playlist_lookup: portability_request.for_playlist_id},
        ).exists()


class HasPlaylistAdministratorAccess(
    BasePortabilityRequestAdministratorAccessPermission,
):
    """Allow access when the user has administrative role on playlist."""

    access_model = PlaylistAccess
    playlist_lookup = "playlist_id"


class HasPlaylistConsumerSiteAdministratorAccess(
    BasePortabilityRequestAdministratorAccessPermission,
):
    """
    Allow access when the user has administrative role on consumer site
    related to the playlist.
    """

    access_model = ConsumerSiteAccess
    playlist_lookup = "consumer_site__playlists__id"


class HasPlaylistOrganizationAdministratorAccess(
    BasePortabilityRequestAdministratorAccessPermission,
):
    """
    Allow access when the user has administrative role on the organization owning the playlist.
    """

    access_model = OrganizationAccess
    playlist_lookup = "organization__playlists__id"


class IsPlaylistOwner(BaseObjectPermission):
    """Allow access when the user is the owner/creator of the playlist."""

    def has_object_permission(self, request, view, obj):
        """Determine permission for a specific playlist"""
        portability_request = obj
        return Playlist.objects.filter(
            created_by_id=request.user.id,
            pk=portability_request.for_playlist_id,
        ).exists()


class IsPortabilityRequestOwner(BaseObjectPermission):
    """Allow access when the user is the owner/creator of the portability request."""

    def has_object_permission(self, request, view, obj):
        """Determine permission for a specific portability request"""
        return PortabilityRequest.objects.filter(
            from_user_id=request.user.id,
            pk=view.get_object_pk(),
        ).exists()
 
