"""Tests for the PlaylistAccess list API of the Marsha project."""

from django.test import TestCase

from marsha.core import factories, models
from marsha.core.simple_jwt.factories import UserAccessTokenFactory


class PlaylistAccessListAPITest(TestCase):
    """Test the list API for playlist access objects."""

    maxDiff = None

    def assert_user_cant_list_playlist_access(self, user):
        """Assert that a GET request returns an empty list."""
        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            "/api/playlist-accesses/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            response.json(),
            {"count": 0, "next": None, "previous": None, "results": []},
        )

    def assertGetReturnsOrderedAccessList(self, user, expected_access):
        """Assert that a GET request returns a list of `expected_access`."""
        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            "/api/playlist-accesses/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        response_data = response.json()

        self.assertEqual(
            response_data["count"],
            len(expected_access),
        )
        self.assertEqual(
            response_data["results"],
            [
                {
                    "id": str(access.pk),
                    "playlist": {
                        "id": str(access.playlist.pk),
                        "lti_id": access.playlist.lti_id,
                        "title": access.playlist.title,
                    },
                    "user": {
                        "id": str(access.user.pk),
                        "date_joined": access.user.date_joined.strftime(
                            "%Y-%m-%dT%H:%M:%S.%fZ"
                        ),
                        "email": access.user.email,
                        "full_name": access.user.get_full_name(),
                        "is_staff": False,
                        "is_superuser": False,
                        "organization_accesses": [],
                    },
                    "role": access.role,
                }
                for access in expected_access
            ],
        )

    def test_list_playlist_access_by_anonymous_user(self):
        """Anonymous users cannot list playlist access."""

        response = self.client.get("/api/playlist-accesses/")
        self.assertEqual(response.status_code, 401)

    def test_list_playlist_access_by_random_logged_in_user(self):
        """
        Random logged-in users.

        Cannot list access for playlist they have no role in.
        """
        user = factories.UserFactory()

        self.assert_user_cant_list_playlist_access(user)

    def test_list_playlist_access_by_organization_student(self):
        """Organization students cannot list playlist access."""
        organization_access = factories.OrganizationAccessFactory(
            role=models.STUDENT,
        )

        self.assert_user_cant_list_playlist_access(organization_access.user)

    def test_list_playlist_access_by_organization_instructor(self):
        """Organization instructors cannot list playlist access."""
        organization_access = factories.OrganizationAccessFactory(
            role=models.INSTRUCTOR,
        )

        self.assert_user_cant_list_playlist_access(organization_access.user)

    def test_list_playlist_access_by_organization_administrator(self):
        """Organization administrators can list playlist access."""
        user = factories.UserFactory()
        organization_access = factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR,
            user=user,
        )

        # Populate the database with a playlist access
        admin_access = factories.PlaylistAccessFactory(
            role=models.ADMINISTRATOR,
            playlist__organization=organization_access.organization,
        )
        instructor_access = factories.PlaylistAccessFactory(
            role=models.INSTRUCTOR,
            playlist__organization=organization_access.organization,
        )
        student_access = factories.PlaylistAccessFactory(
            role=models.STUDENT,
            playlist__organization=organization_access.organization,
        )

        # Other organization playlist access
        factories.PlaylistAccessFactory()

        self.assertGetReturnsOrderedAccessList(
            organization_access.user,
            [admin_access, instructor_access, student_access],
        )

    def test_list_playlist_access_by_consumer_site_any_role(self):
        """Consumer site roles cannot list playlist access."""
        consumer_site_access = factories.ConsumerSiteAccessFactory()

        self.assert_user_cant_list_playlist_access(consumer_site_access.user)

    def test_list_playlist_access_by_playlist_student(self):
        """Playlist students cannot list playlist access."""
        playlist_access = factories.PlaylistAccessFactory(
            role=models.STUDENT,
        )

        self.assert_user_cant_list_playlist_access(playlist_access.user)

    def test_list_playlist_access_by_playlist_instructor(self):
        """Playlist instructors cannot list playlist access."""
        playlist_access = factories.PlaylistAccessFactory(
            role=models.INSTRUCTOR,
        )

        # Populate the database with a playlist access
        admin_access = factories.PlaylistAccessFactory(
            role=models.ADMINISTRATOR,
            playlist=playlist_access.playlist,
        )
        instructor_access = factories.PlaylistAccessFactory(
            role=models.INSTRUCTOR,
            playlist=playlist_access.playlist,
        )
        student_access = factories.PlaylistAccessFactory(
            role=models.STUDENT,
            playlist=playlist_access.playlist,
        )

        # Other playlist access
        factories.PlaylistAccessFactory(
            playlist__organization=playlist_access.playlist.organization,
        )

        self.assertGetReturnsOrderedAccessList(
            playlist_access.user,
            [playlist_access, admin_access, instructor_access, student_access],
        )

    def test_list_playlist_access_by_playlist_administrator(self):
        """Playlist administrators can list playlist access."""
        playlist_access = factories.PlaylistAccessFactory(
            role=models.ADMINISTRATOR,
        )

        # Populate the database with a playlist access
        admin_access = factories.PlaylistAccessFactory(
            role=models.ADMINISTRATOR,
            playlist=playlist_access.playlist,
        )
        instructor_access = factories.PlaylistAccessFactory(
            role=models.INSTRUCTOR,
            playlist=playlist_access.playlist,
        )
        student_access = factories.PlaylistAccessFactory(
            role=models.STUDENT,
            playlist=playlist_access.playlist,
        )

        # Other playlist access
        factories.PlaylistAccessFactory(
            playlist__organization=playlist_access.playlist.organization,
        )

        self.assertGetReturnsOrderedAccessList(
            playlist_access.user,
            [playlist_access, admin_access, instructor_access, student_access],
        )

    def test_results_not_duplicated(self):
        """Results are not duplicated when a user has multiple accesses."""
        organization_access = factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR,
        )
        consumer_site_access = factories.ConsumerSiteAccessFactory(
            role=models.ADMINISTRATOR,
            user=organization_access.user,
        )
        playlist_access = factories.PlaylistAccessFactory(
            role=models.ADMINISTRATOR,
            user=organization_access.user,
            playlist__organization=organization_access.organization,
            playlist__consumer_site=consumer_site_access.consumer_site,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        response = self.client.get(
            "/api/playlist-accesses/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()

        self.assertEqual(
            response_data["count"],
            1,
        )

    def test_filters(self):
        """Results are filtered."""
        playlist_access_1 = factories.PlaylistAccessFactory(
            role=models.ADMINISTRATOR,
        )
        factories.PlaylistAccessFactory(
            role=models.ADMINISTRATOR,
            user=playlist_access_1.user,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access_1.user)

        # Without filter
        response = self.client.get(
            "/api/playlist-accesses/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()

        self.assertEqual(
            response_data["count"],
            2,
        )

        # With filter
        response = self.client.get(
            f"/api/playlist-accesses/?playlist_id={playlist_access_1.playlist_id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()

        self.assertEqual(
            response_data["count"],
            1,
        )
        self.assertEqual(
            response_data["results"][0]["id"],
            str(playlist_access_1.id),
        )

    def test_orderings(self):
        """Results are sorted like expected."""
        organization_access = factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR,
        )

        playlist_access_1 = factories.PlaylistAccessFactory(
            playlist__organization=organization_access.organization,
            role=models.ADMINISTRATOR,
            user__last_name="A",
            playlist__title="A",
        )
        playlist_access_2 = factories.PlaylistAccessFactory(
            playlist__organization=organization_access.organization,
            role=models.STUDENT,
            user__last_name="C",
            playlist__title="D",
        )
        playlist_access_3 = factories.PlaylistAccessFactory(
            playlist__organization=organization_access.organization,
            role=models.INSTRUCTOR,
            user__last_name="B",
            playlist__title="C",
        )
        playlist_access_4 = factories.PlaylistAccessFactory(
            playlist__organization=organization_access.organization,
            role=models.ADMINISTRATOR,
            user__last_name="D",
            playlist__title="B",
        )

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        # Without ordering
        response = self.client.get(
            "/api/playlist-accesses/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            [result["id"] for result in response.json()["results"]],
            [
                str(playlist_access_1.id),
                str(playlist_access_2.id),
                str(playlist_access_3.id),
                str(playlist_access_4.id),
            ],
        )

        # With ordering on user last name
        response = self.client.get(
            "/api/playlist-accesses/?ordering=user__last_name",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            [result["id"] for result in response.json()["results"]],
            [
                str(playlist_access_1.id),
                str(playlist_access_3.id),
                str(playlist_access_2.id),
                str(playlist_access_4.id),
            ],
        )

        # With ordering on playlist title
        response = self.client.get(
            "/api/playlist-accesses/?ordering=playlist__title",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            [result["id"] for result in response.json()["results"]],
            [
                str(playlist_access_1.id),
                str(playlist_access_4.id),
                str(playlist_access_3.id),
                str(playlist_access_2.id),
            ],
        )

        # With ordering on role
        response = self.client.get(
            "/api/playlist-accesses/?ordering=role",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        # Same ID may not be on same spot so test role instead
        self.assertEqual(
            [result["role"] for result in response.json()["results"]],
            [
                models.ADMINISTRATOR,
                models.ADMINISTRATOR,
                models.INSTRUCTOR,
                models.STUDENT,
            ],
        )
