"""Custom permission classes for the Marsha project."""
from rest_framework import exceptions, permissions
from rest_framework_simplejwt.models import TokenUser


class IsVideoTokenOrAdminUser(permissions.IsAdminUser):
    """A custom permission class for LTI.

    These permissions build on the `IsAdminUser` class but grants additional specific accesses
    to users authenticated with a JWT token built from an LTI resource link id ie related to a
    TokenUser as defined in `rest_framework_simplejwt`.

    """

    message = "Only admin users or object owners are allowed."

    def has_permission(self, request, view):
        """Allow TokenUser and report further check to the object permission check.

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
        if isinstance(request.user, TokenUser):
            return True

        return super().has_permission(request, view)

    def has_object_permission(self, request, view, obj):
        """Add a check to allow users identified via a JWT token linked to an LTI resource.

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
        if isinstance(request.user, TokenUser) and str(obj.id) != request.user.id:
            raise exceptions.PermissionDenied()

        return super().has_object_permission(request, view, obj)
