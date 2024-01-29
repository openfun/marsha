"""Tests for the Organization update API of the Marsha project."""

from django.test import TestCase

from marsha.core import factories, models
from marsha.core.simple_jwt.factories import UserAccessTokenFactory


class OrganizationUpdateAPITest(TestCase):
    """Test the update API for organization objects."""

    def test_update_organization_by_anonymous_user(self):
        """Anonymous users cannot update organizations."""
        organization = factories.OrganizationFactory(name="existing name")
        response = self.client.put(
            f"/api/organizations/{organization.id}/", {"name": "new name"}
        )

        self.assertEqual(response.status_code, 401)
        organization.refresh_from_db()
        self.assertEqual(organization.name, "existing name")

    def test_update_organization_by_random_logged_in_user(self):
        """Random logged-in users cannot update organizations."""
        organization = factories.OrganizationFactory(name="existing name")

        jwt_token = UserAccessTokenFactory()

        response = self.client.put(
            f"/api/organizations/{organization.id}/",
            {"name": "new name"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        organization.refresh_from_db()
        self.assertEqual(organization.name, "existing name")

    def test_update_organization_by_instructor(self):
        """Organization instructors cannot update organizations."""
        user = factories.UserFactory()
        organization = factories.OrganizationFactory(name="existing name")
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.INSTRUCTOR
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.put(
            f"/api/organizations/{organization.id}/",
            {"name": "new name"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        organization.refresh_from_db()
        self.assertEqual(organization.name, "existing name")

    def test_update_organization_by_admin(self):
        """Organization admins can update organizations."""
        user = factories.UserFactory()
        organization = factories.OrganizationFactory(name="existing name")
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.ADMINISTRATOR
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.put(
            f"/api/organizations/{organization.id}/",
            {"name": "new name"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        organization.refresh_from_db()
        self.assertEqual(organization.name, "new name")
