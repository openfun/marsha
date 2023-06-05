"""Tests for the User update API of the Marsha project."""

from django.test import TestCase

from marsha.core import factories, models
from marsha.core.simple_jwt.factories import UserAccessTokenFactory


class UserUpdateAPITest(TestCase):
    """Test the update API for user objects."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        """Create dataset for all tests."""
        super().setUpClass()
        cls.organization = factories.OrganizationFactory()

        cls.user_to_update = factories.OrganizationAccessFactory(
            organization=cls.organization,
            user__first_name="Arnold",
            user__last_name="Richardson",
            user__email="a.richardson@example.com",
            role=models.INSTRUCTOR,
        ).user

    def assert_user_cant_update_user(self, user):
        """Assert a user cannot update a user with a PUT request."""
        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.put(
            f"/api/users/{str(self.user_to_update.pk)}/",
            {"email": "a.richardson+test@example.com"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 404)

    def assert_user_can_update_user(self, user):
        """Assert a user can update a user with a PUT request."""
        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.put(
            f"/api/users/{str(self.user_to_update.pk)}/",
            {"email": "a.richardson+test@example.com"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)

        self.user_to_update.refresh_from_db()
        self.assertEqual(
            response.json(),
            {
                "id": str(self.user_to_update.pk),
                "date_joined": self.user_to_update.date_joined.strftime(
                    "%Y-%m-%dT%H:%M:%S.%fZ"
                ),
                "email": "a.richardson+test@example.com",
                "full_name": self.user_to_update.get_full_name(),
                "is_staff": False,
                "is_superuser": False,
                "organization_accesses": [
                    {
                        "organization": str(self.organization.pk),
                        "organization_name": self.organization.name,
                        "role": "instructor",
                        "user": str(self.user_to_update.pk),
                        "inactive_features": [],
                        "inactive_resources": [],
                    }
                ],
            },
        )

    def test_update_user_by_anonymous_user(self):
        """Anonymous users cannot update user."""
        response = self.client.put(
            f"/api/users/{str(self.user_to_update.pk)}/",
            {"email": "a.richardson+test@example.com"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)

    def test_update_user_by_random_logged_in_user(self):
        """
        Random logged-in users.

        Cannot update access for playlist they have no role in.
        """
        user = factories.UserFactory()

        self.assert_user_cant_update_user(user)

    def test_update_user_by_organization_student(self):
        """Organization students cannot update user."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.organization,
            role=models.STUDENT,
        )

        self.assert_user_cant_update_user(organization_access.user)

    def test_update_user_by_organization_instructor(self):
        """Organization instructors cannot update user."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.organization,
            role=models.INSTRUCTOR,
        )

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.put(
            f"/api/users/{str(self.user_to_update.pk)}/",
            {"email": "a.richardson+test@example.com"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_update_user_by_organization_administrator(self):
        """Organization administrators can update user."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.organization,
            role=models.ADMINISTRATOR,
        )

        self.assert_user_can_update_user(organization_access.user)

    def test_update_user_by_consumer_site_any_role(self):
        """Consumer site roles cannot update user."""
        consumer_site_access = factories.ConsumerSiteAccessFactory()

        self.assert_user_cant_update_user(consumer_site_access.user)

    def test_update_user_by_playlist_any_role(self):
        """Playlist access roles cannot update users."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist__organization=self.organization,
        )

        self.assert_user_cant_update_user(playlist_access.user)
