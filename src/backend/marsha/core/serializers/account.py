"""Structure of account related models API responses with Django Rest Framework serializers."""
from django.contrib.auth import get_user_model

from rest_framework import serializers
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenVerifySerializer
from rest_framework_simplejwt.settings import api_settings

from ..models import ConsumerSite, Organization, OrganizationAccess
from ..simple_jwt.tokens import ChallengeToken, UserAccessToken
from .base import ReadOnlyModelSerializer


class ChallengeTokenSerializer(TokenVerifySerializer):
    """Validate the challenge token and return a user access token."""

    def validate(self, attrs):
        """Assert the token is a valid challenge token and generate the access token."""
        data = super().validate(attrs)

        token = ChallengeToken(attrs["token"])

        try:
            user_access_token = UserAccessToken.for_user_id(
                token.payload[api_settings.USER_ID_CLAIM],
            )
        except KeyError as exc:
            raise TokenError(exc.args[0]) from exc

        data["access"] = str(user_access_token)

        return data


class OrganizationAccessSerializer(serializers.ModelSerializer):
    """
    Organization access serializer.

    Represents the link between a user and an organization, with a role that grants a specific
    level of access.
    """

    organization_name = serializers.SerializerMethodField()

    class Meta:
        """Meta for OrganizationAccessSerializer."""

        model = OrganizationAccess
        fields = [
            "organization",
            "organization_name",
            "role",
            "user",
        ]

    def get_organization_name(self, organization_access):
        """
        Get field for Serializer Method.

        Add the organization name on organization accesses directly, to avoid nesting an
        additional object just for one string.
        """
        return organization_access.organization.name


class OrganizationSerializer(serializers.ModelSerializer):
    """Serializer to display a complete Organization resource."""

    class Meta:
        """Meta for OrganizationSerializer."""

        model = Organization
        fields = [
            "consumer_sites",
            "created_on",
            "id",
            "name",
            "users",
        ]
        read_only_fields = ("id",)


class OrganizationLiteSerializer(ReadOnlyModelSerializer):
    """Serializer for a lite representation of Organization resource."""

    class Meta:
        """Meta for OrganizationSerializer."""

        model = Organization
        fields = [
            "id",
            "name",
        ]


class ConsumerSiteSerializer(ReadOnlyModelSerializer):
    """Serializer to display a ConsumerSite resource."""

    class Meta:
        """Meta for ConsumerSiteSerializer"""

        model = ConsumerSite
        fields = [
            "id",
            "name",
            "domain",
        ]


class UserSerializer(serializers.ModelSerializer):
    """
    Regular user serializer.

    Allowlist fields as user objects contain a lot more information
    than we'd like to expose on the API.
    """

    organization_accesses = OrganizationAccessSerializer(many=True)

    class Meta:
        """Meta for UserSerializer."""

        model = get_user_model()
        fields = [
            "date_joined",
            "email",
            "first_name",
            "id",
            "is_staff",
            "is_superuser",
            "last_name",
            "organization_accesses",
        ]
