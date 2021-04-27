"""Structure of account related models API responses with Django Rest Framework serializers."""
from django.contrib.auth import get_user_model

from rest_framework import serializers

from ..models import Organization, OrganizationAccess


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
