"""Custom permission classes for the "markdown" app in Marsha project."""
from django.core.exceptions import ObjectDoesNotExist

from rest_framework import permissions

from marsha.core import models


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
                        view.get_related_object(),
                        self.linked_resource_attribute,
                    ).id
                )
                == request.resource.id
            )
        except ObjectDoesNotExist:
            return False


class IsTokenResourceRouteObjectRelatedMarkdownDocument(
    IsTokenResourceRouteObjectRelatedResource
):
    """
    Base permission class for JWT Tokens related to a resource object
    linked to a Markdown document.
    """

    linked_resource_attribute = "markdown_document"


class IsMarkdownDocumentOrganizationAdmin(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Permission to allow a request to proceed only if the user is an admin for the organization
    linked to the playlist the markdown document is a part of.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Allow the request only if there is a markdown document id in the path of the request,
        which exists, and if the current user is an admin for the organization linked
        to the playlist this markdown document is a part of.
        """
        return models.OrganizationAccess.objects.filter(
            role=models.ADMINISTRATOR,
            organization__playlists__markdowndocuments__id=view.get_object_pk(),
            user__id=request.user.id,
        ).exists()


class IsMarkdownDocumentPlaylistAdmin(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Permission to allow a request to proceed only if the user is an admin for the playlist
    the markdown document is a part of.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Allow the request only if there is a markdown document id in the path of the request,
        which exists, and if the current user is an admin for the playlist this
        markdown document is a part of.
        """
        return models.PlaylistAccess.objects.filter(
            role=models.ADMINISTRATOR,
            playlist__markdowndocuments__id=view.get_object_pk(),
            user__id=request.user.id,
        ).exists()


class IsMarkdownDocumentPlaylistOrOrganizationAdmin(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Permission to allow a request to proceed only if the user is an admin for the playlist
    the markdown document is a part of or admin of the linked organization.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Allow the request only if there is a markdown document id in the path of the request,
        which exists, and if the current user is an admin for the playlist this markdown document
        is a part of or admin of the linked organization.
        """
        return IsMarkdownDocumentPlaylistAdmin().has_permission(
            request, view
        ) or IsMarkdownDocumentOrganizationAdmin().has_permission(request, view)


class IsRelatedMarkdownDocumentOrganizationAdmin(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Permission to allow a request to proceed only if the user is an admin for the organization
    linked to the playlist the markdown document is a part of.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Allow the request only if there is a markdown document id in the path of the request,
        which exists, and if the current user is an admin for the organization linked to
        the playlist this markdown document is a part of.
        """
        try:
            if request.data.get("markdown_document"):
                markdown_document_id = request.data.get("markdown_document")
            else:
                try:
                    markdown_document_id = (
                        view.get_related_object().markdown_document.id
                    )
                except AttributeError:
                    return False
            return models.OrganizationAccess.objects.filter(
                role=models.ADMINISTRATOR,
                organization__playlists__markdowndocuments__id=markdown_document_id,
                user__id=request.user.id,
            ).exists()
        except ObjectDoesNotExist:
            return False


class IsRelatedMarkdownDocumentPlaylistAdmin(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Permission to allow a request to proceed only if the user is an admin for the playlist
    the markdown document is a part of.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Allow the request only if there is a markdown document id in the path of the request,
        which exists, and if the current user is an admin for the playlist this markdown document
        is a part of.
        """
        try:
            if request.data.get("markdown_document"):
                markdown_document_id = request.data.get("markdown_document")
            else:
                try:
                    markdown_document_id = (
                        view.get_related_object().markdown_document.id
                    )
                except AttributeError:
                    return False
            return models.PlaylistAccess.objects.filter(
                role=models.ADMINISTRATOR,
                playlist__markdowndocuments__id=markdown_document_id,
                user__id=request.user.id,
            ).exists()
        except ObjectDoesNotExist:
            return False


class IsRelatedMarkdownDocumentPlaylistOrOrganizationAdmin(permissions.BasePermission):
    """
    Allow a request to proceed. Permission class.

    Permission to allow a request to proceed only if the user is an admin for the playlist
    the markdown document is a part of or admin of the linked organization.
    """

    def has_permission(self, request, view):
        """
        Allow the request.

        Allow the request only if there is a markdown document id in the path of the request,
        which exists, and if the current user is an admin for the playlist this markdown document
        is a part of or admin of the linked organization.
        """
        return IsRelatedMarkdownDocumentPlaylistAdmin().has_permission(
            request, view
        ) or IsRelatedMarkdownDocumentOrganizationAdmin().has_permission(request, view)
