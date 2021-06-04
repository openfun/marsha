"""Tests for the User API of the Marsha project."""
from django.test import TestCase

from rest_framework_simplejwt.tokens import AccessToken

from .. import factories


class UserAPITest(TestCase):
    """Test the API for user objects."""

    # WHOAMI TESTS
    def test_whoami_by_anonymous_user(self):
        """
        Anonymous users can make `whoami` requests.

        They receive a 401 response confirming they are not logged in.
        """
        response = self.client.get("/api/users/whoami/")
        self.assertEqual(response.status_code, 401)

    def test_whoami_by_logged_in_user(self):
        """
        Logged-in users can make `whoami` requests.

        They receive their own user object.
        """
        user = factories.UserFactory(
            first_name="Jane", last_name="Doe", email="jane.doe@example.com"
        )
        org_1 = factories.OrganizationFactory()
        org_access_1 = factories.OrganizationAccessFactory(
            user=user, organization=org_1
        )
        org_2 = factories.OrganizationFactory()
        org_access_2 = factories.OrganizationAccessFactory(
            user=user, organization=org_2
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(user.id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": str(user.username),
        }
        print(jwt_token.payload["user"])

        with self.assertNumQueries(3):
            response = self.client.get(
                "/api/users/whoami/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["date_joined"],
            user.date_joined.isoformat()[:-6] + "Z",  # NB: DRF literally does this
        )
        self.assertEqual(response.json()["email"], "jane.doe@example.com")
        self.assertEqual(response.json()["first_name"], "Jane")
        self.assertEqual(response.json()["id"], str(user.id))
        self.assertEqual(response.json()["is_staff"], False)
        self.assertEqual(response.json()["is_superuser"], False)
        self.assertEqual(response.json()["last_name"], "Doe")

        resp_accesses = response.json()["organization_accesses"]
        resp_org_access_1 = (
            resp_accesses.pop(0)
            if resp_accesses[0]["organization"] == str(org_1.id)
            else resp_accesses.pop(1)
        )
        self.assertEqual(
            resp_org_access_1,
            {
                "organization": str(org_1.id),
                "organization_name": org_1.name,
                "role": org_access_1.role,
                "user": str(user.id),
            },
        )
        resp_org_access_2 = resp_accesses.pop(0)
        self.assertEqual(
            resp_org_access_2,
            {
                "organization": str(org_2.id),
                "organization_name": org_2.name,
                "role": org_access_2.role,
                "user": str(user.id),
            },
        )
