"""Tests the `account` application checks."""
from django.core.checks import Warning as ChecksWarning
from django.test import TestCase, override_settings

from marsha.account.checks import teacher_role_setting_check


class CheckTestCase(TestCase):
    """Test case for the `account` application checks."""

    @override_settings(SOCIAL_AUTH_SAML_FER_TEACHER_ROLES=["teacher"])
    def test_teacher_role_setting_properly_defined(self):
        """Asserts the check returns an empty list when the setting is properly defined."""
        self.assertListEqual(teacher_role_setting_check(), [])

    @override_settings(SOCIAL_AUTH_SAML_FER_TEACHER_ROLES=["teacher", "invalid"])
    def test_teacher_role_setting_with_invalid_value(self):
        """Asserts the check returns a warning when the setting is not properly defined."""
        self.assertListEqual(
            teacher_role_setting_check(),
            [
                ChecksWarning(
                    "{'invalid'} not available to detect teacher through SAML FER.",
                    hint=(
                        "You should consider fixing the `SOCIAL_AUTH_SAML_FER_TEACHER_ROLES`"
                        " setting to use one of `['affiliate', 'alum', 'emeritus', 'employee',"
                        " 'faculty', 'library-walk-in', 'member', 'registered-reader',"
                        " 'researcher', 'retired', 'staff', 'student', 'teacher']` value."
                    ),
                    obj=(
                        "marsha.account.social_pipeline.organization"
                        ".create_organization_from_saml"
                    ),
                    id="marsha.account.social_pipeline.W001",
                )
            ],
        )
