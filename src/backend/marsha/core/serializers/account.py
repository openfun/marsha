"""Structure of account related models API responses with Django Rest Framework serializers."""
from django.contrib.auth import get_user_model

from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenVerifySerializer
from rest_framework_simplejwt.settings import api_settings

from marsha.core.models import ConsumerSite, Organization, OrganizationAccess
from marsha.core.serializers.base import ReadOnlyModelSerializer
from marsha.core.simple_jwt.tokens import ChallengeToken, LTIUserToken, UserRefreshToken


class ChallengeTokenSerializer(TokenVerifySerializer):
    """Validate the challenge token and return a user access token."""

    def validate(self, attrs):
        """Assert the token is a valid challenge token and generate the access token."""
        data = super().validate(attrs)

        token = ChallengeToken(attrs["token"])

        try:
            user_refresh_token = UserRefreshToken.for_user_id(
                token.payload[api_settings.USER_ID_CLAIM],
            )
        except KeyError as exc:
            raise TokenError(exc.args[0]) from exc

        data["refresh"] = str(user_refresh_token)
        data["access"] = str(user_refresh_token.access_token)

        return data


class OrganizationAccessSerializer(serializers.ModelSerializer):
    """
    Organization access serializer.

    Represents the link between a user and an organization, with a role that grants a specific
    level of access.
    """

    class Meta:
        """Meta for OrganizationAccessSerializer."""

        model = OrganizationAccess
        fields = [
            "organization",
            "organization_name",
            "role",
            "user",
            "inactive_resources",
            "inactive_features",
        ]

    organization_name = serializers.SerializerMethodField()
    inactive_resources = serializers.SerializerMethodField()
    inactive_features = serializers.SerializerMethodField()

    def get_organization_name(self, organization_access):
        """
        Get field for Serializer Method.

        Add the organization name on organization accesses directly, to avoid nesting an
        additional object just for one string.
        """
        return organization_access.organization.name

    def get_inactive_resources(self, organization_access):
        """
        Get field for Serializer Method.

        Add the inactive resource on organization accesses directly, to avoid nesting an
        additional object.
        """
        return organization_access.organization.inactive_resources

    def get_inactive_features(self, organization_access):
        """
        Get field for Serializer Method.

        Add the inactive features on organization accesses directly, to avoid nesting an
        additional object.
        """
        return organization_access.organization.inactive_features


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
            "inactive_resources",
            "inactive_features",
        ]
        read_only_fields = [
            "id",
            "inactive_resources",
            "inactive_features",
        ]


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

    Allow list fields as user objects contain a lot more information
    than we'd like to expose on the API.
    """

    organization_accesses = OrganizationAccessSerializer(many=True, read_only=True)
    full_name = serializers.CharField(source="get_full_name", read_only=True)

    class Meta:
        """Meta for UserSerializer."""

        model = get_user_model()
        fields = [
            "date_joined",
            "email",
            "full_name",
            "id",
            "is_staff",
            "is_superuser",
            "organization_accesses",
        ]


class UserLiteSerializer(serializers.ModelSerializer):
    """Same as regular user serializer with fewer data."""

    full_name = serializers.CharField(source="get_full_name", read_only=True)

    class Meta:
        """Meta for UserSerializer."""

        model = get_user_model()
        fields = [
            "email",
            "full_name",
            "id",
        ]


class LTIUserAssociationCreationSerializer(serializers.Serializer):
    """Serializer to validate the creation of an LTI user association."""

    association_jwt = serializers.CharField()

    def validate(self, attrs):
        """Validate the serialized data and return validated data from the payload."""
        data = super().validate(attrs)

        # May raise a TokenError which will be caught by DRF
        try:
            association_token = LTIUserToken(attrs["association_jwt"])
        except TokenError as exc:
            raise ValidationError(exc.args[0]) from exc

        # May raise a KeyError which will be caught by DRF
        data["lti_consumer_site_id"] = association_token.payload["lti_consumer_site_id"]
        data["lti_user_id"] = association_token.payload["lti_user_id"]

        return data
