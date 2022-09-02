"""Custom permission classes for the "markdown" app in Marsha project."""
from django.http.response import Http404

from rest_framework import permissions


class IsTokenResourceRouteObjectRelatedResource(permissions.BasePermission):
    """
    Base permission class for JWT Tokens related to a resource object linked to a resource.

    These permissions grant access to users authenticated with a resource JWT token built from a
    resource.
    """

    linked_resource_attribute = ""

    def has_permission(self, request, view):
        """
        Allow the request if the JWT resource matches the resource
        related to the object in the url.

        Parameters
        ----------
        request : Type[rest_framework.request.Request]
            The request that holds the authenticated user
        view : Type[rest_framework.viewsets or rest_framework.views]
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
                str(
                    getattr(
                        view.get_object(),
                        self.linked_resource_attribute,
                    ).id
                )
                == request.resource.id
            )
        except (AssertionError, Http404):
            return False


class IsTokenResourceRouteObjectRelatedMarkdownDocument(
    IsTokenResourceRouteObjectRelatedResource
):
    """
    Base permission class for JWT Tokens related to a resource object
    linked to a Markdown document.
    """

    linked_resource_attribute = "markdown_document"
