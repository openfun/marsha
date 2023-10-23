"""Declare API endpoints for LTI User Association with Django RestFramework viewsets."""
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from rest_framework.response import Response
from rest_framework.status import (
    HTTP_201_CREATED,
    HTTP_400_BAD_REQUEST,
    HTTP_409_CONFLICT,
)
from rest_framework.viewsets import GenericViewSet

from marsha.core import permissions
from marsha.core.api.base import APIViewMixin
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
        if "association_jwt" in request.data:
            serializer = LTIUserAssociationCreationSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            lti_user_id = serializer.validated_data["lti_user_id"]
            lti_consumer_site_id = serializer.validated_data["lti_consumer_site_id"]
            user_id = request.user.id
            # ValueError should never happen thanks to the serializer validation
            # and the fact that the user is authenticated
        elif "lti_user_id" in request.data and "lti_consumer_site_id" in request.data:
            lti_user_id = request.data["lti_user_id"]
            lti_consumer_site_id = request.data["lti_consumer_site_id"]
            user_id = request.user.id
        else:
            return Response({}, status=HTTP_400_BAD_REQUEST)

        try:
            create_user_association(lti_consumer_site_id, lti_user_id, user_id)
        except IntegrityError:
            # The association already exists
            return Response({}, status=HTTP_409_CONFLICT)
        except ValidationError:
            # The association JWT is invalid
            return Response({}, status=HTTP_400_BAD_REQUEST)

        return Response({}, status=HTTP_201_CREATED)
