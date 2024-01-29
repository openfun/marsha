"""Tests for the Organization create API of the Marsha project."""

from django.test import TestCase

from marsha.core import models
from marsha.core.simple_jwt.factories import UserAccessTokenFactory


class OrganizationCreateAPITest(TestCase):
    """Test the create API for organization objects."""

    def test_create_organization_by_anonymous_user(self):
        """Anonymous users cannot create organizations."""
        response = self.client.post(
            "/api/organizations/", {"name": "organization name"}
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(models.Organization.objects.count(), 0)

    def test_create_organization_by_random_logged_in_user(self):
        """Random logged-in users cannot create organizations."""
        jwt_token = UserAccessTokenFactory()

        response = self.client.post(
            "/api/organizations/",
            {"name": "organization name"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.Organization.objects.count(), 0)
