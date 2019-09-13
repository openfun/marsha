"""Custom permission classes for the Marsha project."""
from rest_framework import permissions
from rest_framework_simplejwt.models import TokenUser

from .models.account import ADMINISTRATOR, INSTRUCTOR, LTI_ROLES


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
