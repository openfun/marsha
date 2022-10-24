"""Declare API endpoints for user and organisation with Django RestFramework viewsets."""
from django.contrib.auth import get_user_model

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from .. import permissions, serializers
from ..models import ADMINISTRATOR, Organization
from ..serializers import ChallengeTokenSerializer
from .base import APIViewMixin, ObjectPkMixin


class ChallengeAuthenticationView(GenericAPIView):
    """
    Provide an endpoint to get user credential providing a challenge token.

    Note: Authentication is done at the Django level.
    We may also remove authentication and leave the token verification to the serializer.
    This would allow to prevent challenge token use as an access token by removing `ChallengeToken`
    from `AUTH_TOKEN_CLASSES` setting.
    """

    serializer_class = ChallengeTokenSerializer

    def post(self, request, *args, **kwargs):
        """Validate the POSTed challenge and return a user access token."""
        serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as exc:
            raise InvalidToken(exc.args[0]) from exc

        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class UserViewSet(APIViewMixin, viewsets.GenericViewSet):
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


class OrganizationViewSet(APIViewMixin, ObjectPkMixin, viewsets.ModelViewSet):
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
        if self.action in ["retrieve", "update", "partial_update"]:
            permission_classes = [permissions.IsOrganizationAdmin]
        elif self.action in ["list"]:
            permission_classes = [permissions.UserIsAuthenticated]
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        override get_queryset based on the request action
        """

        if self.action in ["list"]:
            return (
                super()
                .get_queryset()
                .filter(
                    user_accesses__user_id=self.request.user.id,
                    user_accesses__role=ADMINISTRATOR,
                )
            )

        return super().get_queryset()
