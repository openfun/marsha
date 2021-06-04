"""Tests for the Organization API of the Marsha project."""
from django.test import TestCase

from rest_framework_simplejwt.tokens import AccessToken

from .. import factories, models


class OrganizationAPITest(TestCase):
    """Test the API for organization objects."""

    def test_create_organization_by_anonymous_user(self):
        """Anonymous users cannot create organizations."""
        response = self.client.post(
            "/api/organizations/", {"name": "organization name"}
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(models.Organization.objects.count(), 0)

    def test_create_organization_by_random_logged_in_user(self):
        """Random logged-in users cannot create organizations."""
        user = factories.UserFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

        response = self.client.post(
            "/api/organizations/",
            {"name": "organization name"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.Organization.objects.count(), 0)

    def test_retrieve_organization_by_anonymous_user(self):
        """Anonymous users cannot retrieve organizations."""
        organization = factories.OrganizationFactory()
        response = self.client.get(f"/api/organizations/{organization.id}/")
        self.assertEqual(response.status_code, 401)

    def test_retrieve_organization_by_random_logged_in_user(self):
        """Random logged-in users cannot retrieve organizations unrelated to them."""
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": str(user.username),
        }

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
            },
        )

    def test_list_organizations_by_anonymous_user(self):
        """Anonymous users cannot list organizations."""
        factories.OrganizationFactory()
        response = self.client.get("/api/organizations/")
        self.assertEqual(response.status_code, 401)

    def test_list_organizations_by_random_logged_in_user(self):
        """Random logged-in users cannot list organizations."""
        user = factories.UserFactory()
        factories.OrganizationFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

        response = self.client.get(
            "/api/organizations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_delete_organization_by_anonymous_user(self):
        """Anonymous users cannot delete organizations."""
        organization = factories.OrganizationFactory()
        self.assertEqual(models.Organization.objects.count(), 1)

        response = self.client.delete(f"/api/organizations/{organization.id}/")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(models.Organization.objects.count(), 1)

    def test_delete_organization_by_random_logged_in_user(self):
        """Random logged-in users cannot delete organizations."""
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        self.assertEqual(models.Organization.objects.count(), 1)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

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

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

        response = self.client.delete(
            f"/api/organizations/{organization.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.Organization.objects.count(), 1)

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
        user = factories.UserFactory()
        organization = factories.OrganizationFactory(name="existing name")

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

        response = self.client.put(
            f"/api/organizations/{organization.id}/",
            {"name": "new name"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        organization.refresh_from_db()
        self.assertEqual(organization.name, "existing name")

    def test_update_organization_by_admin(self):
        """Organization admins cannot update organizations."""
        user = factories.UserFactory()
        organization = factories.OrganizationFactory(name="existing name")
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.ADMINISTRATOR
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
        }

        response = self.client.put(
            f"/api/organizations/{organization.id}/",
            {"name": "new name"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        organization.refresh_from_db()
        self.assertEqual(organization.name, "existing name")
