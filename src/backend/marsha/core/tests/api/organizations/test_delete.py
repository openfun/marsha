"""Tests for the Organization delete API of the Marsha project."""

from django.test import TestCase

from marsha.core import factories, models
from marsha.core.simple_jwt.factories import UserAccessTokenFactory


class OrganizationDeleteAPITest(TestCase):
    """Test the delete API for organization objects."""

    def test_delete_organization_by_anonymous_user(self):
        """Anonymous users cannot delete organizations."""
        organization = factories.OrganizationFactory()
        self.assertEqual(models.Organization.objects.count(), 1)

        response = self.client.delete(f"/api/organizations/{organization.id}/")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(models.Organization.objects.count(), 1)

    def test_delete_organization_by_random_logged_in_user(self):
        """Random logged-in users cannot delete organizations."""
        organization = factories.OrganizationFactory()
        self.assertEqual(models.Organization.objects.count(), 1)

        jwt_token = UserAccessTokenFactory()

        response = self.client.delete(
            f"/api/organizations/{organization.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.Organization.objects.count(), 1)

    def test_delete_organization_by_admin(self):
        """Organization admins cannot delete organizations."""
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.ADMINISTRATOR
        )
        self.assertEqual(models.Organization.objects.count(), 1)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.delete(
            f"/api/organizations/{organization.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.Organization.objects.count(), 1)
