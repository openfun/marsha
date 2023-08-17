"""Tests for the {{cookiecutter.model_plural_lower}} API."""
import json

from django.test import TestCase, override_settings

from marsha.core import factories as core_factories
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    PlaylistLtiTokenFactory,
    StudentLtiTokenFactory,
)
from marsha.core.tests.testing_utils import reload_urlconf

from ..factories import {{cookiecutter.model}}Factory
from ..models import {{cookiecutter.model}}


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings({{cookiecutter.setting_name}}=True)
class {{cookiecutter.model}}APITest(TestCase):
    """Test for the {{cookiecutter.model}} API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use {{cookiecutter.setting_name}}
        reload_urlconf()

    def test_api_{{cookiecutter.model_lower}}_fetch_list_anonymous(self):
        """An anonymous should not be able to fetch a list of {{cookiecutter.model_lower}}."""
        response = self.client.get("/api/{{cookiecutter.model_url_part}}/")
        self.assertEqual(response.status_code, 401)

    def test_api_{{cookiecutter.model_lower}}_fetch_list_student(self):
        """A student should not be able to fetch a list of {{cookiecutter.model_lower}}."""
        {{cookiecutter.model_lower}} = {{cookiecutter.model}}Factory()

        jwt_token = StudentLtiTokenFactory(
            playlist={{cookiecutter.model_lower}}.playlist,
            permissions__can_update=True,
        )

        response = self.client.get(
            "/api/{{cookiecutter.model_url_part}}/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_{{cookiecutter.model_lower}}_fetch_list_instructor(self):
        """An instructor should not be able to fetch a {{cookiecutter.model_lower}} list."""
        {{cookiecutter.model_lower}} = {{cookiecutter.model}}Factory()

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist={{cookiecutter.model_lower}}.playlist)

        response = self.client.get(
            "/api/{{cookiecutter.model_url_part}}/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_{{cookiecutter.model_lower}}_fetch_student(self):
        """A student should be allowed to fetch a {{cookiecutter.model_lower}}."""
        {{cookiecutter.model_lower}} = {{cookiecutter.model}}Factory()

        jwt_token = StudentLtiTokenFactory(playlist={{cookiecutter.model_lower}}.playlist)

        response = self.client.get(
            f"/api/{{cookiecutter.model_url_part}}/{ {{cookiecutter.model_lower}}.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertDictEqual(
            {
                "id": str({{cookiecutter.model_lower}}.id),
                "lti_id": str({{cookiecutter.model_lower}}.lti_id),
                "title": {{cookiecutter.model_lower}}.title,
                "description": {{cookiecutter.model_lower}}.description,
                "playlist": {
                    "id": str({{cookiecutter.model_lower}}.playlist.id),
                    "title": {{cookiecutter.model_lower}}.playlist.title,
                    "lti_id": {{cookiecutter.model_lower}}.playlist.lti_id,
                },
            },
            content,
        )

    def test_api_{{cookiecutter.model_lower}}_fetch_from_other_{{cookiecutter.model_lower}}(self):
        """A student should be allowed to fetch a {{cookiecutter.model_lower}}."""
        {{cookiecutter.model_lower}} = {{cookiecutter.model}}Factory()
        other_{{cookiecutter.model_lower}} = {{cookiecutter.model}}Factory()


        jwt_token = StudentLtiTokenFactory(playlist=other_{{cookiecutter.model_lower}}.playlist)

        response = self.client.get(
            f"/api/{{cookiecutter.model_url_part}}/{ {{cookiecutter.model_lower}}.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_{{cookiecutter.model_lower}}_fetch_instructor(self):
        """An instructor should be able to fetch a {{cookiecutter.model_lower}}."""
        {{cookiecutter.model_lower}} = {{cookiecutter.model}}Factory()

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist={{cookiecutter.model_lower}}.playlist)

        response = self.client.get(
            f"/api/{{cookiecutter.model_url_part}}/{ {{cookiecutter.model_lower}}.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertDictEqual(
            {
                "id": str({{cookiecutter.model_lower}}.id),
                "lti_id": str({{cookiecutter.model_lower}}.lti_id),
                "title": {{cookiecutter.model_lower}}.title,
                "description": {{cookiecutter.model_lower}}.description,
                "playlist": {
                    "id": str({{cookiecutter.model_lower}}.playlist.id),
                    "title": {{cookiecutter.model_lower}}.playlist.title,
                    "lti_id": {{cookiecutter.model_lower}}.playlist.lti_id,
                },
            },
            content,
        )

    def test_api_{{cookiecutter.model_lower}}_create_anonymous(self):
        """An anonymous should not be able to create a {{cookiecutter.model_lower}}."""
        response = self.client.post("/api/{{cookiecutter.model_url_part}}/")
        self.assertEqual(response.status_code, 401)

    def test_api_{{cookiecutter.model_lower}}_create_student(self):
        """A student should not be able to create a {{cookiecutter.model_lower}}."""
        {{cookiecutter.model_lower}} = {{cookiecutter.model}}Factory()

        jwt_token = StudentLtiTokenFactory(
            playlist={{cookiecutter.model_lower}}.playlist,
            permissions__can_update=True,
        )

        response = self.client.post(
            "/api/{{cookiecutter.model_url_part}}/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_{{cookiecutter.model_lower}}_create_student_with_playlist_token(self):
        """A student with a playlist token should not be able to create a {{cookiecutter.model_lower}}."""
        jwt_token = PlaylistLtiTokenFactory(roles=["student"])

        response = self.client.post(
            "/api/{{cookiecutter.model_url_part}}/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual({{cookiecutter.model}}.objects.count(), 0)

    def test_api_{{cookiecutter.model_lower}}_create_instructor(self):
        """An instructor without playlist token should not be able to create a {{cookiecutter.model_lower}}."""
        {{cookiecutter.model_lower}} = {{cookiecutter.model}}Factory()

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist={{cookiecutter.model_lower}}.playlist)

        response = self.client.post(
            "/api/{{cookiecutter.model_url_part}}/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_{{cookiecutter.model_lower}}_create_instructor_with_playlist_token(self):
        """
        Create {{cookiecutter.model_lower}} with playlist token.

        Used in the context of a lti select request (deep linking).
        """
        playlist = core_factories.PlaylistFactory()

        jwt_token = PlaylistLtiTokenFactory(playlist=playlist)

        self.assertEqual({{cookiecutter.model}}.objects.count(), 0)

        response = self.client.post(
            "/api/{{cookiecutter.model_url_part}}/",
            {
                "lti_id": "{{cookiecutter.model_lower}}_one",
                "playlist": str(playlist.id),
                "title": "Some {{cookiecutter.model_lower}}",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual({{cookiecutter.model}}.objects.count(), 1)
        self.assertEqual(response.status_code, 201)
        {{cookiecutter.model_lower}} = {{cookiecutter.model}}.objects.first()
        self.assertEqual(
            response.json(),
            {
                "description": "",
                "id": str({{cookiecutter.model_lower}}.id),
                "lti_id": "{{cookiecutter.model_lower}}_one",
                "playlist": {
                    "id": str(playlist.id),
                    "lti_id": playlist.lti_id,
                    "title": playlist.title,
                },
                "title": "Some {{cookiecutter.model_lower}}",
            },
        )

    def test_api_{{cookiecutter.model_lower}}_update_anonymous(self):
        """An anonymous should not be able to update a {{cookiecutter.model_lower}}."""
        {{cookiecutter.model_lower}} = {{cookiecutter.model}}Factory()
        response = self.client.patch(f"/api/{{cookiecutter.model_url_part}}/{ {{cookiecutter.model_lower}}.id!s}/")
        self.assertEqual(response.status_code, 401)

    def test_api_{{cookiecutter.model_lower}}_update_user_logged_in(self):
        """An logged in user should not be able to update a {{cookiecutter.model_lower}}."""
        user = core_factories.UserFactory(
            first_name="Jane", last_name="Doe", email="jane.doe@example.com"
        )
        {{cookiecutter.model_lower}} = {{cookiecutter.model}}Factory()
        self.client.force_login(user)
        response = self.client.patch(f"/api/{{cookiecutter.model_url_part}}/{ {{cookiecutter.model_lower}}.id!s}/")
        self.assertEqual(response.status_code, 401)

    def test_api_{{cookiecutter.model_lower}}_update_student(self):
        """A student user should not be able to update a {{cookiecutter.model_lower}}."""
        {{cookiecutter.model_lower}} = {{cookiecutter.model}}Factory()

        jwt_token = StudentLtiTokenFactory(playlist={{cookiecutter.model_lower}}.playlist)
        data = {"title": "new title"}

        response = self.client.patch(
            f"/api/{{cookiecutter.model_url_part}}/{ {{cookiecutter.model_lower}}.id!s}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_{{cookiecutter.model_lower}}_update_instructor_read_only(self):
        """An instructor should not be able to update a {{cookiecutter.model_lower}} in read_only."""
        {{cookiecutter.model_lower}} = {{cookiecutter.model}}Factory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist={{cookiecutter.model_lower}}.playlist,
            permissions__can_update=False,
        )
        data = {"title": "new title"}

        response = self.client.patch(
            f"/api/{{cookiecutter.model_url_part}}/{ {{cookiecutter.model_lower}}.id!s}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_{{cookiecutter.model_lower}}_update_instructor(self):
        """An instructor should be able to update a {{cookiecutter.model_lower}}."""
        {{cookiecutter.model_lower}} = {{cookiecutter.model}}Factory()

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist={{cookiecutter.model_lower}}.playlist)
        data = {"title": "new title", "description": "Hello"}

        response = self.client.patch(
            f"/api/{{cookiecutter.model_url_part}}/{ {{cookiecutter.model_lower}}.id!s}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

        {{cookiecutter.model_lower}}.refresh_from_db()
        self.assertEqual("new title", {{cookiecutter.model_lower}}.title)
        self.assertEqual("Hello", {{cookiecutter.model_lower}}.description)

    def test_api_select_instructor_no_{{cookiecutter.model_lower}}s(self):
        """An instructor should be able to fetch a {{cookiecutter.model_lower}} lti select."""
        jwt_token = PlaylistLtiTokenFactory()

        response = self.client.get(
            "/api/{{cookiecutter.model_url_part}}/lti-select/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            {
                "new_url": "http://testserver/lti/{{cookiecutter.model_url_part}}/",
                "{{cookiecutter.model_plural_lower}}": [],
            },
            response.json(),
        )

    def test_api_select_instructor(self):
        """An instructor should be able to fetch a {{cookiecutter.model_lower}} lti select."""
        {{cookiecutter.model_lower}} = {{cookiecutter.model}}Factory()

        jwt_token = PlaylistLtiTokenFactory(playlist={{cookiecutter.model_lower}}.playlist)

        response = self.client.get(
            "/api/{{cookiecutter.model_url_part}}/lti-select/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            {
                "new_url": "http://testserver/lti/{{cookiecutter.model_url_part}}/",
                "{{cookiecutter.model_plural_lower}}": [
                    {
                        "id": str({{cookiecutter.model_lower}}.id),
                        "lti_id": str({{cookiecutter.model_lower}}.lti_id),
                        "lti_url": f"http://testserver/lti/{{cookiecutter.model_url_part}}/{str({{cookiecutter.model_lower}}.id)}",
                        "title": {{cookiecutter.model_lower}}.title,
                        "description": {{cookiecutter.model_lower}}.description,
                        "playlist": {
                            "id": str({{cookiecutter.model_lower}}.playlist_id),
                            "title": {{cookiecutter.model_lower}}.playlist.title,
                            "lti_id": {{cookiecutter.model_lower}}.playlist.lti_id,
                        },
                    }
                ],
            },
            response.json(),
        )
