"""Declare API endpoints for portability requests with Django RestFramework viewsets."""
from django.utils.encoding import force_str

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import APIException
from rest_framework.filters import OrderingFilter
from rest_framework.response import Response

from marsha.core.models import PortabilityRequest
from marsha.core.utils.portability_request_utils import (
    PortabilityTransitionException,
    accept_portability_request,
    destroy_portability_request,
    reject_portability_request,
)

from ..permissions import (
    HasPlaylistAdministratorAccess,
    HasPlaylistConsumerSiteAdministratorAccess,
    HasPlaylistOrganizationAdministratorAccess,
    IsPlaylistOwner,
    IsPortabilityRequestOwner,
    NotAllowed,
    PortToPlaylistExists,
    UserIsAuthenticated,
)
from ..serializers import PortabilityRequestSerializer
from .base import APIViewMixin, ObjectPkMixin


class PortabilityTransitionUnallowedException(APIException):
    """Exception raised when trying to update a portability request in the wrong state."""

    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_detail = 'Method "{triggered_action}" not allowed.'
    default_code = "unprocessable_entity"

    def __init__(self, triggered_action, detail=None, code=None):
        """Pass the action name to the error details"""
        if detail is None:
            detail = force_str(self.default_detail).format(
                triggered_action=triggered_action
            )  # nosec
        super().__init__(detail, code)


class PortabilityResourceViewSet(APIViewMixin, ObjectPkMixin, viewsets.ModelViewSet):
    """Viewset for the API of the portability request object."""

    queryset = PortabilityRequest.objects.none()
    serializer_class = PortabilityRequestSerializer
    permission_classes = [NotAllowed]
    filter_backends = [OrderingFilter, DjangoFilterBackend]  # django-filter
    filterset_fields = ("state", "for_playlist_id")  # django-filter
    ordering_fields = ("created_on",)  # django-filter

    def get_permissions(self):
        """
        Manage permissions for built-in DRF methods.
        Default to the ViewSet's default permissions.

        Only the `create` view is available from LTI.
        """
        if self.action in ["create"]:
            permission_classes = [PortToPlaylistExists]
        elif self.action in ["destroy"]:
            permission_classes = [UserIsAuthenticated & IsPortabilityRequestOwner]
        elif self.action in ["retrieve"]:
            permission_classes = [
                UserIsAuthenticated
                & (
                    IsPortabilityRequestOwner
                    | IsPlaylistOwner
                    | HasPlaylistAdministratorAccess
                    | HasPlaylistOrganizationAdministratorAccess
                    | HasPlaylistConsumerSiteAdministratorAccess
                )
            ]
        elif self.action in ["accept", "reject"]:
            permission_classes = [
                UserIsAuthenticated
                & (
                    IsPlaylistOwner
                    | HasPlaylistAdministratorAccess
                    | HasPlaylistOrganizationAdministratorAccess
                    | HasPlaylistConsumerSiteAdministratorAccess
                )
            ]
        elif self.action in ["list"]:
            permission_classes = [UserIsAuthenticated]
        else:  # "partial_update", "update"
            permission_classes = self.permission_classes

        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """Return the queryset according to the action."""
        if self.action in ["list", "retrieve"]:
            return PortabilityRequest.objects.regarding_user_id(
                self.request.user.id,
                include_owned_requests=True,
            ).annotate_can_accept_or_reject(self.request.user.id)
        if self.action in ["accept", "reject"]:
            # `can_accept_or_reject` is forced to `False` because it is only used for frontend
            # purpose, and we want to return the state after update without having to
            # make a new request.
            return PortabilityRequest.objects.regarding_user_id(
                self.request.user.id,
            ).annotate_can_accept_or_reject(self.request.user.id, force_value=False)
        if self.action in ["destroy", "partial_update", "update"]:
            return PortabilityRequest.objects.filter(
                from_user_id=self.request.user.id
            ).annotate_can_accept_or_reject(self.request.user.id, force_value=True)
        return super().get_queryset().distinct()

    @action(methods=["post"], detail=True)
    def accept(self, *args, **kwargs):
        """Mark the portability requested as accepted"""
        portability_request = self.get_object()
        try:
            accept_portability_request(portability_request)
        except PortabilityTransitionException as exc:
            raise PortabilityTransitionUnallowedException(
                triggered_action=self.action
            ) from exc
        return Response(self.get_serializer(portability_request).data)

    @action(methods=["post"], detail=True)
    def reject(self, *args, **kwargs):
        """Mark the portability requested as rejected"""
        portability_request = self.get_object()
        try:
            reject_portability_request(portability_request)
        except PortabilityTransitionException as exc:
            raise PortabilityTransitionUnallowedException(
                triggered_action=self.action
            ) from exc
        return Response(self.get_serializer(portability_request).data)

    def perform_destroy(self, instance):
        """Delete the portability request if not accepted/rejected"""
        try:
            destroy_portability_request(instance)
        except PortabilityTransitionException as exc:
            raise PortabilityTransitionUnallowedException(
                triggered_action=self.action
            ) from exc
