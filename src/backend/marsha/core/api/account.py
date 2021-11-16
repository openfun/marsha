"""Declare API endpoints for user and organisation with Django RestFramework viewsets."""
from django.contrib.auth import get_user_model

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .. import permissions, serializers
from ..models import Organization
from .base import ObjectPkMixin


class UserViewSet(viewsets.GenericViewSet):
    """ViewSet for all user-related interactions."""

    serializer_class = serializers.UserSerializer

    @action(detail=False, permission_classes=[])
    def whoami(self, request):
        """
        Get information on the current user.

        This is the only implemented user-related endpoint.
        """
        # If the user is not logged in, the request has no object. Return a 401 so the caller
        # knows they need to log in first.
        if (
            not request.user.is_authenticated
            or (request.user.id is None)
            or (request.user.id == "None")
        ):
            return Response(status=401)

        # Get an actual user object from the TokenUser id
        # pylint: disable=invalid-name
        User = get_user_model()
        try:
            user = User.objects.prefetch_related(
                "organization_accesses", "organization_accesses__organization"
            ).get(id=request.user.id)
        except User.DoesNotExist:
            return Response(status=401)

        return Response(data=self.get_serializer(user).data)


class OrganizationViewSet(ObjectPkMixin, viewsets.ModelViewSet):
    """ViewSet for all organization-related interactions."""

    permission_classes = [permissions.NotAllowed]
    queryset = Organization.objects.all()
    serializer_class = serializers.OrganizationSerializer

    def get_permissions(self):
        """
        Manage permissions for built-in DRF methods.

        Default to the actions' self defined permissions if applicable or
        to the ViewSet's default permissions.
        """
        if self.action in ["retrieve"]:
            permission_classes = [permissions.IsOrganizationAdmin]
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]
