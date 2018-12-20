"""Custom permission classes for the Marsha project."""
from rest_framework import exceptions, permissions
from rest_framework_simplejwt.models import TokenUser

from .models.account import INSTRUCTOR, LTI_ROLES


class IsVideoTokenOrAdminUser(permissions.IsAdminUser):
    """A custom permission class for JWT Tokens related to a video object.

    These permissions build on the `IsAdminUser` class but grants additional specific accesses
    to users authenticated with a JWT token built from a video ie related to a TokenUser as
    defined in `rest_framework_simplejwt`.

    """

    message = "Only admin users or object owners are allowed."

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
        if isinstance(user, TokenUser) and LTI_ROLES[INSTRUCTOR] & set(
            user.token.payload.get("roles", [])
        ):
            return True

        return super().has_permission(request, view)

    def get_video_id(self, obj):
        """Get the video id to check that it matches the JWT Token.

        Parameters
        ----------
        obj : Type[models.Model]
            The  object for which object permissions are being checked

        Returns
        -------
        string
            The id of the video passed as obj

        """
        return obj.id

    def has_object_permission(self, request, view, obj):
        """Add a check to allow users identified via a JWT token linked to a video.

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
        user = request.user
        if (
            isinstance(user, TokenUser)
            and LTI_ROLES[INSTRUCTOR] & set(user.token.payload.get("roles", []))
            and str(self.get_video_id(obj)) != user.id
        ):
            raise exceptions.PermissionDenied()

        return super().has_object_permission(request, view, obj)


class IsRelatedVideoTokenOrAdminUser(IsVideoTokenOrAdminUser):
    """A custom permission class for JWT Tokens related to objects linked to a video.

    These permissions build on the `IsAdminUser` class but grants additional specific accesses
    to users authenticated with a JWT token built from the LTI resource link id ie related to a
    TokenUser as defined in `rest_framework_simplejwt`.

    """

    def get_video_id(self, obj):
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
