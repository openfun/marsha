"""Custom permission classes for the "markdown" app in Marsha project."""

from django.core.exceptions import ObjectDoesNotExist

from rest_framework import permissions

from marsha.core import models
from marsha.markdown.models import MarkdownDocument


def _is_organization_admin(user_id, markdown_document_id):
    """Check if user is an admin of the organization containing a markdown document."""

    if not user_id or not markdown_document_id:
        return False

    return models.OrganizationAccess.objects.filter(
        role=models.ADMINISTRATOR,
        organization__playlists__markdowndocuments__id=markdown_document_id,
        user__id=user_id,
    ).exists()


def _is_playlist_admin(user_id, markdown_document_id):
    """Check if user is an admin of the playlist containing a markdown document."""

    if not user_id or not markdown_document_id:
        return False

    return models.PlaylistAccess.objects.filter(
        role=models.ADMINISTRATOR,
        playlist__markdowndocuments__id=markdown_document_id,
        user__id=user_id,
    ).exists()


class IsTokenResourceRouteObjectRelatedMarkdownDocument(permissions.BasePermission):
    """
    Base permission class for JWT Tokens related to a resource object linked to a
    Markdown document.

    These permissions grants access to users authenticated with a JWT token built from a
    resource ie related to a TokenUser as defined in `rest_framework_simplejwt`.
    """

    def has_permission(self, request, view):
        """
        Allow the request if the JWT resource matches the Markdown document related to the object
        in the url.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
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

        return MarkdownDocument.objects.filter(
            pk=view.get_related_markdown_document_id(), playlist_id=request.resource.id
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
        return _is_playlist_admin(
            user_id=request.user.id,
            markdown_document_id=view.get_object_pk(),
        ) or _is_organization_admin(
            user_id=request.user.id,
            markdown_document_id=view.get_object_pk(),
        )


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
        try:
            markdown_document_id = view.get_related_object().markdown_document.id
        except (AttributeError, ObjectDoesNotExist):
            markdown_document_id = request.data.get("markdown_document")

        if not markdown_document_id:
            return False

        return _is_playlist_admin(
            user_id=request.user.id,
            markdown_document_id=markdown_document_id,
        ) or _is_organization_admin(
            user_id=request.user.id,
            markdown_document_id=markdown_document_id,
        )
