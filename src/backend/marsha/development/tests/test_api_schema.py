"""Tests for the Schema endpoint on the API of the Marsha project."""
from django.test import TestCase, override_settings

from rest_framework.permissions import BasePermission

from marsha.core.api.schema import (
    clean_permission,
    extract_permission_docstring,
    format_permissions_and_docstring,
)
from marsha.core.tests.testing_utils import reload_urlconf


@override_settings(DEBUG=True)
class SchemaAPITest(TestCase):
    """Test the API route for the schema."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use DEBUG=true settings in this test suite.
        reload_urlconf()

    def test_api_schema(self):
        """The API has a schema route that answers."""
        response = self.client.get("/api/schema/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get("Content-Type"), "application/vnd.oai.openapi; charset=utf-8"
        )
        self.assertEqual(
            response.get("Content-Disposition"), 'inline; filename="Marsha API.yaml"'
        )


class PermissionA(BasePermission):
    """Permission A."""


class PermissionB(BasePermission):
    """Permission B."""


class PermissionC(BasePermission):
    """Permission C."""


class PermissionForSchemaAPITest(TestCase):
    """Test case dedicated to the permission formatting/display in the Swagger UI."""

    def test_clean_permission(self):
        """Test the `clean_permission` expected behavior."""
        for permission, expected_string in [
            (
                PermissionA & PermissionB,
                " **(** PermissionA **AND** PermissionB **)** ",
            ),
            (
                PermissionA | PermissionB,
                " **(** PermissionA **OR** PermissionB **)** ",
            ),
            (
                ~PermissionA,
                " **(NOT** PermissionA **)** ",
            ),
            (
                PermissionA,
                "PermissionA",
            ),
            (
                (PermissionA & PermissionB) | ~PermissionC,
                (
                    " **(**  **(** PermissionA **AND** PermissionB **)**  "
                    "**OR**  **(NOT** PermissionC **)**  **)** "
                ),
            ),
        ]:
            with self.subTest(permission=permission):
                self.assertEqual(
                    # mimic `get_permissions` by calling permission
                    clean_permission(permission()),
                    expected_string,
                )

    def test_extract_permission_docstring(self):
        """Test the `extract_permission_docstring` expected behavior."""
        for permission, expected_dict in [
            (
                PermissionA & PermissionB,
                {
                    "PermissionA": "Permission A.",
                    "PermissionB": "Permission B.",
                },
            ),
            (
                PermissionA | PermissionB,
                {
                    "PermissionA": "Permission A.",
                    "PermissionB": "Permission B.",
                },
            ),
            (
                ~PermissionA,
                {
                    "PermissionA": "Permission A.",
                },
            ),
            (
                PermissionA,
                {
                    "PermissionA": "Permission A.",
                },
            ),
            (
                (PermissionA & PermissionB) | ~PermissionA,
                {
                    "PermissionA": "Permission A.",
                    "PermissionB": "Permission B.",
                },
            ),
            (
                (PermissionA & PermissionB) | ~PermissionC,
                {
                    "PermissionA": "Permission A.",
                    "PermissionB": "Permission B.",
                    "PermissionC": "Permission C.",
                },
            ),
        ]:
            with self.subTest(permission=permission):
                self.assertEqual(
                    # mimic `get_permissions` by calling permission
                    extract_permission_docstring(permission()),
                    expected_dict,
                )

    def test_format_permissions_and_docstring(self):
        """Test the `format_permissions_and_docstring` expected behavior."""
        self.assertEqual(
            format_permissions_and_docstring(
                ["permission formatted string"],
                {"some": "docstring"},
            ),
            (
                "## Permissions\n\n"
                "permission formatted string\n"
                "### Permission description\n\n"
                "- **some** : docstring"
            ),
        )

        self.assertEqual(
            format_permissions_and_docstring(
                ["permission formatted string", "another permission"],
                {"some": "docstring", "another": "docstring"},
            ),
            (
                "## Permissions\n\n"
                "- permission formatted string\n"
                "- another permission\n"
                "### Permission description\n\n"
                "- **some** : docstring\n"
                "- **another** : docstring"
            ),
        )
