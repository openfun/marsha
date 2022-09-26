"""Custom permission classes for the Deposit app."""
from django.core.exceptions import ObjectDoesNotExist

from rest_framework import permissions


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
        try:
            return (
                str(view.get_related_object().file_depository.id) == request.resource.id
            )
        except ObjectDoesNotExist:
            return False
