"""Django checks for the account application of project marsha."""

from django.conf import settings
from django.core.checks import Warning as ChecksWarning

from social_edu_federation.defaults import EduPersonAffiliationEnum


def teacher_role_setting_check(*args, **kwargs):  # pylint: disable=unused-argument
    """
    Check that the SOCIAL_AUTH_SAML_FER_TEACHER_ROLES setting defines
    a list with expected values.
    """
    existing_roles = sorted(
        [role.value for role in EduPersonAffiliationEnum.__members__.values()]
    )

    if not all(
        role in existing_roles for role in settings.SOCIAL_AUTH_SAML_FER_TEACHER_ROLES
    ):
        missing_roles = set(settings.SOCIAL_AUTH_SAML_FER_TEACHER_ROLES) - set(
            existing_roles
        )
        return [
            ChecksWarning(
                f"{missing_roles} not available to detect teacher through SAML FER.",
                hint=(
                    "You should consider fixing the `SOCIAL_AUTH_SAML_FER_TEACHER_ROLES`"
                    f" setting to use one of `{existing_roles}` value."
                ),
                obj="marsha.account.social_pipeline.organization.create_organization_from_saml",
                id="marsha.account.social_pipeline.W001",
            )
        ]

    return []
