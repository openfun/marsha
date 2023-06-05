"""Tests for the Organization retrieve API of the Marsha project."""
from django.test import TestCase

from marsha.core import factories, models
from marsha.core.simple_jwt.factories import UserAccessTokenFactory


class OrganizationRetrieveAPITest(TestCase):
    """Test the retrieve API for organization objects."""

    def test_retrieve_organization_by_anonymous_user(self):
        """Anonymous users cannot retrieve organizations."""
        organization = factories.OrganizationFactory()
        response = self.client.get(f"/api/organizations/{organization.id}/")
        self.assertEqual(response.status_code, 401)

    def test_retrieve_organization_by_random_logged_in_user(self):
        """Random logged-in users cannot retrieve organizations unrelated to them."""
        organization = factories.OrganizationFactory()

        jwt_token = UserAccessTokenFactory()

        response = self.client.get(
            f"/api/organizations/{organization.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_retrieve_organization_by_instructor(self):
        """Organization instructors cannot retrieve organizations."""
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.INSTRUCTOR
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/organizations/{organization.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_retrieve_organization_by_admin(self):
        """Organization administrators can retrieve organizations."""
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.ADMINISTRATOR
        )

        jwt_token = UserAccessTokenFactory(user=user)
        response = self.client.get(
            f"/api/organizations/{organization.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "consumer_sites": [],
                "created_on": organization.created_on.isoformat()[:-6]
                + "Z",  # NB: DRF literally does this
                "id": str(organization.id),
                "name": organization.name,
                "users": [str(user.id)],
                "inactive_features": [],
                "inactive_resources": [],
            },
        )
