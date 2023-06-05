"""Tests for the Organization list API of the Marsha project."""
from django.test import TestCase
from django.utils import timezone

from marsha.core import factories, models
from marsha.core.simple_jwt.factories import UserAccessTokenFactory


class OrganizationListAPITest(TestCase):
    """Test the list API for organization objects."""

    maxDiff = None

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

    def test_list_organizations_by_admin_or_instructor(self):
        """Organization admins and instructors can list organizations they belong to."""
        for role in [models.ADMINISTRATOR, models.INSTRUCTOR]:
            with self.subTest(role=role):
                user = factories.UserFactory()
                created_on = timezone.now()
                organization = factories.OrganizationFactory(created_on=created_on)

                factories.OrganizationAccessFactory(
                    user=user,
                    organization=organization,
                    role=role,
                )

                # Other organization not linked to the current user
                factories.OrganizationFactory()

                # Other organization linked to the current user but not as admin
                factories.OrganizationAccessFactory(
                    user=user,
                    role=models.STUDENT,
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
                            "inactive_features": [],
                            "inactive_resources": [],
                        }
                    ],
                )

    def test_list_organizations_not_duplicated(self):
        """
        Test the list of organizations to not be duplicated.
        This cannot be possible for now, as the base queryset uses
        only one OUTER JOIN, but we expect to prevent this in the future.
        """
        user = factories.UserFactory()
        created_on = timezone.now()
        organization = factories.OrganizationFactory(created_on=created_on)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.ADMINISTRATOR
        )

        # Other organization access not linked to the current user
        other_accesses = factories.OrganizationAccessFactory.create_batch(
            10, organization=organization
        )

        # Other organization not linked to the current user
        factories.OrganizationAccessFactory.create_batch(3)

        # Other organization linked to the current user but not as admin
        factories.OrganizationAccessFactory(
            user=user,
            role=models.STUDENT,
        )

        # In case we also add a consumer site admin to access organization
        consumer_site_organization = factories.ConsumerSiteOrganizationFactory(
            organization=organization,
        )
        factories.ConsumerSiteAccessFactory(
            user=user,
            consumer_site=consumer_site_organization.consumer_site,
            role=models.ADMINISTRATOR,
        )

        # other consumer site administrator
        factories.ConsumerSiteAccessFactory(
            consumer_site=consumer_site_organization.consumer_site,
            role=models.ADMINISTRATOR,
        )

        factories.ConsumerSiteAccessFactory.create_batch(
            10, consumer_site=consumer_site_organization.consumer_site
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            "/api/organizations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)

        self.assertEqual(response.json()["results"][0]["id"], str(organization.pk))
        self.assertEqual(response.json()["results"][0]["name"], organization.name)
        self.assertListEqual(
            response.json()["results"][0]["consumer_sites"],
            [str(consumer_site_organization.consumer_site.pk)],
        )
        self.assertListEqual(
            sorted(response.json()["results"][0]["users"]),
            sorted([str(user.pk)] + [str(access.user_id) for access in other_accesses]),
        )
