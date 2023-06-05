"""Tests for the User API of the Marsha project."""
from django.test import TestCase

from marsha.core import factories
from marsha.core.simple_jwt.factories import UserAccessTokenFactory


class UserWhoAmIAPITest(TestCase):
    """Test the API endpoint to get the current user."""

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

        jwt_token = UserAccessTokenFactory(user=user)

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
        self.assertEqual(response.json()["full_name"], "Jane Doe")
        self.assertEqual(response.json()["id"], str(user.id))
        self.assertEqual(response.json()["is_staff"], False)
        self.assertEqual(response.json()["is_superuser"], False)

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
                "inactive_features": [],
                "inactive_resources": [],
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
                "inactive_features": [],
                "inactive_resources": [],
            },
        )

    def test_whoami_by_logged_in_user_with_inactive_resources_and_features(self):
        """
        Logged-in users can make `whoami` requests.

        They receive their own user object.
        """
        user = factories.UserFactory(
            first_name="Jane", last_name="Doe", email="jane.doe@example.com"
        )
        org_1 = factories.OrganizationFactory(
            inactive_features=["vod_convert"], inactive_resources=["classroom"]
        )
        org_access_1 = factories.OrganizationAccessFactory(
            user=user, organization=org_1
        )
        org_2 = factories.OrganizationFactory(
            inactive_features=[], inactive_resources=["deposit", "webinar"]
        )
        org_access_2 = factories.OrganizationAccessFactory(
            user=user, organization=org_2
        )

        jwt_token = UserAccessTokenFactory(user=user)

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
        self.assertEqual(response.json()["full_name"], "Jane Doe")
        self.assertEqual(response.json()["id"], str(user.id))
        self.assertEqual(response.json()["is_staff"], False)
        self.assertEqual(response.json()["is_superuser"], False)

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
                "inactive_features": ["vod_convert"],
                "inactive_resources": ["classroom"],
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
                "inactive_features": [],
                "inactive_resources": ["deposit", "webinar"],
            },
        )
