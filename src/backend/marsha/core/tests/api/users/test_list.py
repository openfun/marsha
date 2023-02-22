"""Tests for the User list API of the Marsha project."""

from django.test import TestCase

from marsha.core import factories, models
from marsha.core.simple_jwt.factories import UserAccessTokenFactory


class UserListAPITest(TestCase):
    """Test the list API for users objects."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        """Create dataset for all tests."""
        super().setUpClass()
        cls.organization = factories.OrganizationFactory()

        cls.user_1 = factories.OrganizationAccessFactory(
            organization=cls.organization,
            user__first_name="Arnold",
            user__last_name="Richardson",
            user__email="a.richardson@example.com",
        ).user
        cls.user_2 = factories.OrganizationAccessFactory(
            organization=cls.organization,
            user__first_name="Christian",
            user__last_name="Miller",
            user__email="c.miller@example.com",
        ).user
        cls.user_3 = factories.OrganizationAccessFactory(
            organization=cls.organization,
            user__first_name="Benoît",
            user__last_name="Hubert",
            user__email="b.hubert@example.com",
        ).user
        cls.user_4 = factories.OrganizationAccessFactory(
            organization=cls.organization,
            user__first_name="Damien",
            user__last_name="Bouvier",
            user__email="d.bouvier@example.com",
        ).user

        cls.other_organization = factories.OrganizationFactory()
        cls.user_5 = factories.OrganizationAccessFactory(
            organization=cls.other_organization,
            user__first_name="John",
            user__last_name="Parker",
        ).user

        # Never listed users
        factories.UserFactory()
        factories.OrganizationAccessFactory()

    def assert_user_cant_list_user(self, user):
        """Assert that a GET request returns an empty list."""
        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            "/api/users/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            response.json(),
            {"count": 0, "next": None, "previous": None, "results": []},
        )

    def assertGetReturnsOrderedUserList(self, user, expected_users):
        """Assert that a GET request returns a list of `expected_access`."""
        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            "/api/users/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        response_data = response.json()

        self.assertEqual(
            response_data["count"],
            len(expected_users),
        )
        self.assertEqual(
            response_data["results"],
            [
                {
                    "id": str(user.pk),
                    "email": user.email,
                    "full_name": user.get_full_name(),
                }
                for user in expected_users
            ],
        )

    def test_list_user_by_anonymous_user(self):
        """Anonymous users cannot list users."""

        response = self.client.get("/api/users/")
        self.assertEqual(response.status_code, 401)

    def test_list_user_by_random_logged_in_user(self):
        """
        Random logged-in users.

        Cannot list access for playlist they have no role in.
        """
        user = factories.UserFactory()

        self.assert_user_cant_list_user(user)

    def test_list_user_by_organization_student(self):
        """Organization students cannot list users."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.organization,
            role=models.STUDENT,
        )

        self.assert_user_cant_list_user(organization_access.user)

    def test_list_user_by_organization_instructor(self):
        """Organization instructors can list users."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.organization,
            role=models.INSTRUCTOR,
        )

        self.assertGetReturnsOrderedUserList(
            organization_access.user,
            [
                self.user_1,
                self.user_2,
                self.user_3,
                self.user_4,
                organization_access.user,
            ],
        )

    def test_list_user_by_organization_administrator(self):
        """Organization administrators can list users."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.organization,
            role=models.ADMINISTRATOR,
        )

        self.assertGetReturnsOrderedUserList(
            organization_access.user,
            [
                self.user_1,
                self.user_2,
                self.user_3,
                self.user_4,
                organization_access.user,
            ],
        )

    def test_list_user_by_organizations_instructor_and_admin(self):
        """Organization both instructors and administrator can list users."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.organization,
            role=models.INSTRUCTOR,
        )
        factories.OrganizationAccessFactory(
            organization=self.other_organization,
            role=models.ADMINISTRATOR,
            user=organization_access.user,
        )

        self.assertGetReturnsOrderedUserList(
            organization_access.user,
            [
                self.user_1,
                self.user_2,
                self.user_3,
                self.user_4,
                self.user_5,
                organization_access.user,
            ],
        )

    def test_list_user_by_consumer_site_any_role(self):
        """Consumer site roles cannot list users."""
        consumer_site_access = factories.ConsumerSiteAccessFactory()

        self.assert_user_cant_list_user(consumer_site_access.user)

    def test_list_user_by_playlist_any_role(self):
        """Playlist access roles cannot list users."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist__organization=self.organization,
        )

        self.assert_user_cant_list_user(playlist_access.user)

    def test_filters(self):
        """Results are filtered."""
        someone_with_permission = factories.OrganizationAccessFactory(
            organization=self.organization,
            role=models.ADMINISTRATOR,
        ).user

        jwt_token = UserAccessTokenFactory(user=someone_with_permission)

        # First name
        response = self.client.get(
            "/api/users/?first_name=arn",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["count"], 0)

        response = self.client.get(
            "/api/users/?first_name__iexact=arnold",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["count"], 1)
        self.assertEqual(
            response_data["results"][0]["id"],
            str(self.user_1.pk),
        )

        response = self.client.get(
            "/api/users/?first_name__icontains=old",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["count"], 1)
        self.assertEqual(
            response_data["results"][0]["id"],
            str(self.user_1.pk),
        )

        # Last name
        response = self.client.get(
            "/api/users/?last_name__icontains=ill",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["count"], 1)
        self.assertEqual(
            response_data["results"][0]["id"],
            str(self.user_2.pk),
        )

        # Email
        response = self.client.get(
            "/api/users/?email__icontains=VIER",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["count"], 1)
        self.assertEqual(
            response_data["results"][0]["id"],
            str(self.user_4.pk),
        )

        # Full name
        response = self.client.get(
            "/api/users/?full_name__icontains=Ben",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["count"], 1)
        self.assertEqual(
            response_data["results"][0]["id"],
            str(self.user_3.pk),
        )

        # Organization
        factories.OrganizationAccessFactory(
            organization=self.other_organization,
            role=models.ADMINISTRATOR,
            user=someone_with_permission,
        )
        response = self.client.get(
            f"/api/users/?organization_id={str(self.other_organization.pk)}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["count"], 2)
        self.assertEqual(
            response_data["results"][0]["id"],
            str(self.user_5.pk),
        )
        self.assertEqual(
            response_data["results"][1]["id"],
            str(someone_with_permission.pk),
        )

        # Full name or email
        response = self.client.get(
            "/api/users/?fullname_or_email__icontains=VIER",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["count"], 1)
        self.assertEqual(
            response_data["results"][0]["id"],
            str(self.user_4.pk),
        )

        # Exclude from id list
        response = self.client.get(
            "/api/users/?id_not_in="
            f"{self.user_1.pk},{self.user_2.pk},{someone_with_permission.pk}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["count"], 3)
        self.assertListEqual(
            [user["id"] for user in response_data["results"]],
            [
                str(self.user_3.pk),
                str(self.user_4.pk),
                str(self.user_5.pk),
            ],
        )

    def test_orderings(self):
        """Results are sorted like expected."""

        someone_with_permission = factories.OrganizationAccessFactory(
            organization=self.organization,
            role=models.ADMINISTRATOR,
            user__last_name="Z",
            user__email="z@example.com",
        ).user

        jwt_token = UserAccessTokenFactory(user=someone_with_permission)

        # Ordering by last name
        response = self.client.get(
            "/api/users/?ordering=last_name",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["count"], 5)
        self.assertListEqual(
            [user["id"] for user in response_data["results"]],
            [
                str(self.user_4.pk),
                str(self.user_3.pk),
                str(self.user_2.pk),
                str(self.user_1.pk),
                str(someone_with_permission.pk),
            ],
        )

        # Ordering by email
        response = self.client.get(
            "/api/users/?ordering=email",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["count"], 5)
        self.assertListEqual(
            [user["id"] for user in response_data["results"]],
            [
                str(self.user_1.pk),
                str(self.user_3.pk),
                str(self.user_2.pk),
                str(self.user_4.pk),
                str(someone_with_permission.pk),
            ],
        )
