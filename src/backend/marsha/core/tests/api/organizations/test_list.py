"""Tests for the Organization list API of the Marsha project."""
from django.test import TestCase

from marsha.core import factories, models
from marsha.core.simple_jwt.factories import UserAccessTokenFactory


class OrganizationListAPITest(TestCase):
    """Test the list API for organization objects."""

    def test_list_organizations_by_anonymous_user(self):
        """Anonymous users cannot list organizations."""
        factories.OrganizationFactory()
        response = self.client.get("/api/organizations/")
        self.assertEqual(response.status_code, 401)

    def test_list_organizations_by_random_logged_in_user(self):
        """Random logged-in users cannot list organizations."""
        factories.OrganizationFactory()

        jwt_token = UserAccessTokenFactory()

        response = self.client.get(
            "/api/organizations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_list_organizations_by_admin(self):
        """Organization admins cannot list organizations."""
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.ADMINISTRATOR
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            "/api/organizations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
