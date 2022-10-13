"""Declare API endpoints for LTI User Association with Django RestFramework viewsets."""
from django.db import IntegrityError

from rest_framework.response import Response
from rest_framework.status import HTTP_201_CREATED, HTTP_409_CONFLICT
from rest_framework.viewsets import GenericViewSet

from marsha.core import permissions
from marsha.core.api import APIViewMixin
from marsha.core.lti.user_association import create_user_association
from marsha.core.models import LtiUserAssociation
from marsha.core.serializers import LTIUserAssociationCreationSerializer


class LtiUserAssociationViewSet(APIViewMixin, GenericViewSet):
    """Viewset for the API of the LtiUserAssociation object."""

    queryset = LtiUserAssociation.objects.none()
    permission_classes = [permissions.NotAllowed]

    def get_permissions(self):
        """
        Manage permissions for built-in DRF methods.
        Default to the ViewSet's default permissions.
        """
        if self.action in ["create"]:
            permission_classes = [permissions.UserIsAuthenticated]
        else:
            permission_classes = self.permission_classes

        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        """Create a new LtiUserAssociation."""
        serializer = LTIUserAssociationCreationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # ValueError should never happen thanks to the serializer validation
        # and the fact that the user is authenticated
        try:
            create_user_association(
                serializer.validated_data["lti_consumer_site_id"],
                serializer.validated_data["lti_user_id"],
                request.user.id,
            )
        except IntegrityError:
            return Response({}, status=HTTP_409_CONFLICT)

        return Response({}, status=HTTP_201_CREATED)
