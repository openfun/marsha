"""Tests for the Organization list API of the Marsha project."""
from django.test import TestCase
from django.utils import timezone

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
        """Random logged-in users can list organizations but always empty."""
        factories.OrganizationFactory()

        jwt_token = UserAccessTokenFactory()

        response = self.client.get(
            "/api/organizations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)
        self.assertEqual(response.json()["results"], [])

    def test_list_organizations_by_admin(self):
        """Organization admins cannot list organizations."""
        user = factories.UserFactory()
        created_on = timezone.now()
        organization = factories.OrganizationFactory(created_on=created_on)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.ADMINISTRATOR
        )

        # Other organization not linked to the current user
        factories.OrganizationFactory()

        # Other organization linked to the current user but not as admin
        factories.OrganizationAccessFactory(
            user=user,
            role=models.INSTRUCTOR,
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            "/api/organizations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(
            response.json()["results"],
            [
                {
                    "consumer_sites": [],
                    # remove offset in number and replace with Z like DRF serializer did
                    "created_on": created_on.isoformat()[:-6] + "Z",
                    "id": str(organization.pk),
                    "name": organization.name,
                    "users": [str(user.pk)],
                }
            ],
        )
