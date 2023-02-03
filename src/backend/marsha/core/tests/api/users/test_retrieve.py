"""Tests for the User retrieve API of the Marsha project."""

from django.test import TestCase

from marsha.core import factories, models
from marsha.core.simple_jwt.factories import UserAccessTokenFactory


class UserRetrieveAPITest(TestCase):
    """Test the retrieve API for user objects."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        """Create dataset for all tests."""
        super().setUpClass()
        cls.organization = factories.OrganizationFactory()

        cls.user_to_retrieve = factories.OrganizationAccessFactory(
            organization=cls.organization,
            user__first_name="Arnold",
            user__last_name="Richardson",
            user__email="a.richardson@example.com",
            role=models.INSTRUCTOR,
        ).user

    def assert_user_cant_retrieve_user(self, user):
        """Assert a user cannot retrieve a user with a GET request."""
        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/users/{str(self.user_to_retrieve.pk)}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def assert_user_can_retrieve_user(self, user):
        """Assert a user can retrieve a user with a GET request."""
        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/users/{str(self.user_to_retrieve.pk)}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            response.json(),
            {
                "id": str(self.user_to_retrieve.pk),
                "date_joined": self.user_to_retrieve.date_joined.strftime(
                    "%Y-%m-%dT%H:%M:%S.%fZ"
                ),
                "email": self.user_to_retrieve.email,
                "full_name": self.user_to_retrieve.get_full_name(),
                "is_staff": False,
                "is_superuser": False,
                "organization_accesses": [
                    {
                        "organization": str(self.organization.pk),
                        "organization_name": self.organization.name,
                        "role": "instructor",
                        "user": str(self.user_to_retrieve.pk),
                    }
                ],
            },
        )

    def test_retrieve_user_by_anonymous_user(self):
        """Anonymous users cannot retrieve user."""
        response = self.client.get(
            f"/api/users/{str(self.user_to_retrieve.pk)}/",
        )
        self.assertEqual(response.status_code, 401)

    def test_retrieve_user_by_random_logged_in_user(self):
        """
        Random logged-in users.

        Cannot retrieve access for playlist they have no role in.
        """
        user = factories.UserFactory()

        self.assert_user_cant_retrieve_user(user)

    def test_retrieve_user_by_organization_student(self):
        """Organization students cannot retrieve user."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.organization,
            role=models.STUDENT,
        )

        self.assert_user_cant_retrieve_user(organization_access.user)

    def test_retrieve_user_by_organization_instructor(self):
        """Organization instructors can retrieve user."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.organization,
            role=models.INSTRUCTOR,
        )

        self.assert_user_can_retrieve_user(organization_access.user)

    def test_retrieve_user_by_organization_administrator(self):
        """Organization administrators can retrieve user."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.organization,
            role=models.ADMINISTRATOR,
        )

        self.assert_user_can_retrieve_user(organization_access.user)

    def test_retrieve_user_by_consumer_site_any_role(self):
        """Consumer site roles cannot retrieve user."""
        consumer_site_access = factories.ConsumerSiteAccessFactory()

        self.assert_user_cant_retrieve_user(consumer_site_access.user)

    def test_retrieve_user_by_playlist_any_role(self):
        """Playlist access roles cannot retrieve users."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist__organization=self.organization,
        )

        self.assert_user_cant_retrieve_user(playlist_access.user)
