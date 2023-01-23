"""Module to provide a custom implementation of the DRF spectacular schema generator."""

from drf_spectacular.openapi import AutoSchema
from rest_framework.permissions import AND, NOT, OR


def clean_permission(permission):
    """
    Convert recursively permission classes to strings.

    This allows to convert OR and AND and NOT permission classes to strings
    for the swagger documentation (Markdown).
    """
    if isinstance(permission, OR):
        return (
            f" **(** {clean_permission(permission.op1)}"
            f" **OR** {clean_permission(permission.op2)} **)** "
        )
    if isinstance(permission, AND):
        return (
            f" **(** {clean_permission(permission.op1)}"
            f" **AND** {clean_permission(permission.op2)} **)** "
        )
    if isinstance(permission, NOT):
        return f" **(NOT** {clean_permission(permission.op1)} **)** "
    return permission.__class__.__name__


def extract_permission_docstring(permission):
    """Return the used permission classes and their docstring as a dict."""
    if isinstance(permission, (OR, AND)):
        return extract_permission_docstring(
            permission.op1
        ) | extract_permission_docstring(permission.op2)
    if isinstance(permission, NOT):
        return extract_permission_docstring(permission.op1)

    return {permission.__class__.__name__: permission.__class__.__doc__}


def format_permissions_and_docstring(permissions, docstring_dict):
    """Format permissions and docstring for the swagger documentation (Markdown)."""
    permission_formatted_docstring = "\n- " + "\n- ".join(
        [f"**{perm}** : {docstring}" for perm, docstring in docstring_dict.items()]
    )

    if len(permissions) == 1:
        # Most of (all?) the time we are in this case
        return (
            "## Permissions\n\n"
            f"{permissions[0]}\n"
            "### Permission description\n"
            f"{permission_formatted_docstring}"
        )

    formatted_permissions = "\n- ".join(permissions)
    formatted_permissions = (
        "## Permissions\n\n"
        f"- {formatted_permissions}\n"
        "### Permission description\n"
        f"{permission_formatted_docstring}"
    )
    return formatted_permissions


class MarshaAutoSchema(AutoSchema):
    """Marsha specific AutoSchema to add the permission to the schema description."""

    def get_permission_description(self):
        """Get the permission description."""
        action_or_method = getattr(
            self.view, getattr(self.view, "action", self.method.lower()), None
        )

        if not action_or_method:
            return None, None

        view_permissions = self.view.get_permissions()
        permission_classes = [
            clean_permission(perm) for perm in view_permissions if perm
        ]

        # Extract and format the permissions descriptions
        permission_docstrings = {}
        for perm in view_permissions:
            permission_docstrings.update(extract_permission_docstring(perm))

        return format_permissions_and_docstring(
            permission_classes, permission_docstrings
        )

    def get_description(self):
        """Append the permission description to the schema description."""
        description = super().get_description()

        permissions_description = self.get_permission_description()
        if not permissions_description:
            return description

        return f"{description}\n{permissions_description}"
