"""Declare API endpoints for user and organisation with Django RestFramework viewsets."""

from django.contrib.auth import get_user_model
from django.db.models import Q

import django_filters
from rest_framework import filters, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from marsha.core import permissions
from marsha.core.api.base import APIViewMixin, ObjectPkMixin
from marsha.core.models import (
    ADMINISTRATOR,
    INSTRUCTOR,
    Organization,
    OrganizationAccess,
)
from marsha.core.serializers import (
    ChallengeTokenSerializer,
    OrganizationSerializer,
    UserLiteSerializer,
    UserSerializer,
)


User = get_user_model()


class ChallengeAuthenticationView(GenericAPIView):
    """
    Provide an endpoint to get user credential providing a challenge token.

    Note: Authentication is done at the Django level.
    We may also remove authentication and leave the token verification to the serializer.
    This would allow preventing challenge token use as an access token by removing `ChallengeToken`
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


class UserFilter(django_filters.FilterSet):
    """Filter for User model."""

    full_name__icontains = django_filters.CharFilter(method="filter_full_name")
    organization_id = django_filters.UUIDFilter(
        field_name="organization_accesses__organization_id"
    )
    fullname_or_email__icontains = django_filters.CharFilter(
        method="filter_fullname_or_email", label="Full name or email"
    )
    id_not_in = django_filters.CharFilter(method="filter_id_not_in")

    class Meta:
        model = User
        fields = {
            "first_name": ["exact", "iexact", "contains", "icontains"],
            "last_name": ["exact", "iexact", "contains", "icontains"],
            "email": ["exact", "iexact", "contains", "icontains"],
        }

    def filter_full_name(self, queryset, _name, value):
        """Filter on full name."""
        return queryset.filter(
            Q(first_name__icontains=value) | Q(last_name__icontains=value)
        )

    def filter_fullname_or_email(self, queryset, _name, value):
        """Filter on full name or email."""
        return queryset.filter(
            Q(first_name__icontains=value)
            | Q(last_name__icontains=value)
            | Q(email__icontains=value)
        )

    def filter_id_not_in(self, queryset, _name, value):
        """Exclude id list."""
        return queryset.exclude(Q(id__in=value.split(",")))


class UserViewSet(
    APIViewMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """ViewSet for all user-related interactions."""

    permission_classes = [permissions.NotAllowed]
    queryset = User.objects.all().prefetch_related(
        "organization_accesses",
        "organization_accesses__organization",
    )
    serializer_class = UserSerializer
    filter_backends = [
        filters.OrderingFilter,
        django_filters.rest_framework.DjangoFilterBackend,
    ]
    ordering_fields = ["created_on", "last_name", "email"]
    ordering = ["created_on"]
    filterset_class = UserFilter

    def get_permissions(self):
        """Manage permissions for all the endpoint actions."""
        if self.action in ["list", "retrieve"]:
            # The queryset is filtered afterwards, see `get_queryset`
            permission_classes = [permissions.UserIsAuthenticated]
        elif self.action in ["partial_update", "update"]:
            # Only allow organization admin to update users
            permission_classes = [
                permissions.UserIsAuthenticated & permissions.IsUserOrganizationAdmin
            ]
        elif self.action in ["whoami"]:
            # The `whoami` action manages its own permissions to return a 401
            # if the user is not authenticated
            permission_classes = []
        else:
            permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Redefine the queryset to use based on the current action.

        For list, retrieve, update, it returns only the user belonging to the organizations
        the user is an administrator or instructor of.
        """
        queryset = super().get_queryset()

        if self.action in ["list", "retrieve", "partial_update", "update"]:
            user_organization_pks = OrganizationAccess.objects.filter(
                user_id=self.request.user.id, role__in=[ADMINISTRATOR, INSTRUCTOR]
            ).values_list("organization_id", flat=True)
            if not user_organization_pks:
                return queryset.none()

            return queryset.filter(
                organization_accesses__organization_id__in=user_organization_pks
            ).distinct()

        if self.action in ["whoami"]:
            # Make explicit the `whoami` action manages its own queryset
            return queryset

        return queryset

    def get_serializer_class(self):
        """
        Return the serializer class to use.

        For list, it returns a lite version of the serializer.
        For all other actions (including `whoami`), it returns the default full serializer.
        """
        if self.action in ["list"]:
            return UserLiteSerializer

        return super().get_serializer_class()

    @action(detail=False, methods=["get"])
    def whoami(self, request):
        """
        Get information on the current user.

        If the user is not logged in, the request has no object:
        return a 401 so the caller knows they need to log in first.
        """
        if (
            not request.user.is_authenticated
            or (request.user.id is None)
            or (request.user.id == "None")
        ):
            return Response(status=401)

        # Get an actual user object from the TokenUser id
        # pylint: disable=invalid-name
        try:
            user = self.get_queryset().get(id=request.user.id)
        except User.DoesNotExist:
            return Response(status=401)

        return Response(data=self.get_serializer(user).data)


class OrganizationViewSet(APIViewMixin, ObjectPkMixin, viewsets.ModelViewSet):
    """ViewSet for all organization-related interactions."""

    permission_classes = [permissions.NotAllowed]
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer

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
                    user_accesses__role__in=[ADMINISTRATOR, INSTRUCTOR],
                )
            )

        return super().get_queryset()
